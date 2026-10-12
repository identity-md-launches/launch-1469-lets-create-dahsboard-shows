import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayEth, exactEth, EXAMPLE_ADDRESS, fetchBalance, isAddress, walletSeed } from '../src/ethereum.ts';

const success = (wei = '0x112210f47de98115') => new Response(JSON.stringify([
  { jsonrpc: '2.0', id: 2, result: wei },
  { jsonrpc: '2.0', id: 1, result: '0x1' },
]));

test('validates 20-byte addresses, including mixed case, without accepting ENS or extra characters', () => {
  assert.equal(isAddress(EXAMPLE_ADDRESS), true);
  assert.equal(isAddress(EXAMPLE_ADDRESS.toLowerCase()), true);
  for (const value of ['', 'vitalik.eth', '0x123', EXAMPLE_ADDRESS + '0', EXAMPLE_ADDRESS.replace('d8', 'zz'), ` ${EXAMPLE_ADDRESS}`]) {
    assert.equal(isAddress(value), false, value);
  }
});

test('keeps all 18 decimal places without floating-point loss', () => {
  assert.equal(exactEth(1n), '0.000000000000000001');
  assert.equal(exactEth(1_234_567_890_123_456_789n), '1.234567890123456789');
  assert.equal(exactEth(10n ** 18n), '1');
  assert.equal(exactEth(0n), '0');
  assert.equal(exactEth(123_456_789n * 10n ** 18n + 1n), '123456789.000000000000000001');
});

test('does not round tiny balances to zero or round larger balances up', () => {
  assert.equal(displayEth(0n), '0.0000');
  assert.equal(displayEth(1n), '< 0.0001');
  assert.equal(displayEth(10n ** 14n), '0.0001');
  assert.equal(displayEth(1_234_599_999_999_999_999n), '1.2345');
  assert.equal(displayEth(999_999n * 10n ** 18n), '999,999.0000');
  assert.equal(displayEth(1_234_567n * 10n ** 18n), '1.23M');
  assert.equal(displayEth(1_234_567_890n * 10n ** 18n), '1.23B');
});

test('the same address always gets the same etherling, regardless of letter case', () => {
  assert.equal(walletSeed(EXAMPLE_ADDRESS), walletSeed(EXAMPLE_ADDRESS.toLowerCase()));
});

test('reads unordered batch replies and requests the latest mainnet balance without credentials', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    const requests = JSON.parse(String(options.body));
    assert.deepEqual(requests.map((r: { method: string }) => r.method), ['eth_chainId', 'eth_getBalance']);
    assert.deepEqual(requests[1].params, [EXAMPLE_ADDRESS, 'latest']);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    return success();
  });
  const result = await fetchBalance(EXAMPLE_ADDRESS);
  assert.equal(result.wei, 1_234_567_890_123_456_789n);
  assert.equal(result.address, EXAMPLE_ADDRESS);
  assert.ok(result.checkedAt instanceof Date);
  assert.equal(mock.mock.calls.length, 1);
});

test('falls back after HTTP rate limiting', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1 ? new Response('', { status: 429 }) : success('0x0'));
  assert.equal((await fetchBalance(EXAMPLE_ADDRESS)).wei, 0n);
  assert.equal(calls, 2);
});

test('rejects another chain, malformed responses, RPC errors, and out-of-range balances', async (t) => {
  for (const payload of [
    [{ id: 1, result: '0x89' }, { id: 2, result: '0x1' }],
    [{ id: 1, result: '0x1' }, { id: 2, result: 'not a number' }],
    [{ id: 1, result: '0x1' }, { id: 2, error: { code: -32000 } }],
    [{ id: 1, result: '0x1' }, { id: 2, result: '0x' + 'f'.repeat(65) }],
    { result: '0x1' },
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(payload)));
    await assert.rejects(fetchBalance(EXAMPLE_ADDRESS), /Check your connection and try again/);
    assert.equal(mock.mock.calls.length, 2);
    mock.mock.restore();
  }
});

test('rejects invalid addresses before making any network request', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => success());
  await assert.rejects(fetchBalance('not a wallet'), /42-character/);
  assert.equal(mock.mock.calls.length, 0);
});

test('cancellation stops the in-flight lookup without trying the fallback', async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }));
  const pending = fetchBalance(EXAMPLE_ADDRESS, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(mock.mock.calls.length, 1);
});

test('a pre-cancelled lookup never reaches the network', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => success());
  await assert.rejects(fetchBalance(EXAMPLE_ADDRESS, AbortSignal.abort()), { name: 'AbortError' });
  assert.equal(mock.mock.calls.length, 0);
});

test('a timed-out provider is aborted and the fallback recovers', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', (_url: string, options: RequestInit) => {
    if (++calls === 2) return Promise.resolve(success('0x1'));
    return new Promise((_resolve, reject) => options.signal!.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError'))));
  });
  const pending = fetchBalance(EXAMPLE_ADDRESS);
  t.mock.timers.tick(9_000);
  assert.equal((await pending).wei, 1n);
  assert.equal(calls, 2);
});
