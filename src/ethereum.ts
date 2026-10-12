export const EXAMPLE_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
export const RPC_ENDPOINTS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.drpc.org',
] as const;
const WEI_PER_ETH = 10n ** 18n;

export type BalanceResult = { address: string; wei: bigint; checkedAt: Date };

export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function exactEth(wei: bigint): string {
  const whole = wei / WEI_PER_ETH;
  const fraction = (wei % WEI_PER_ETH).toString().padStart(18, '0').replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''}`;
}

// The large display truncates, never rounds up. Full precision stays available.
export function displayEth(wei: bigint): string {
  if (wei === 0n) return '0.0000';
  if (wei < 10n ** 14n) return '< 0.0001';
  const whole = wei / WEI_PER_ETH;
  if (whole >= 1_000_000n) {
    const scale = whole >= 1_000_000_000n ? 1_000_000_000n : 1_000_000n;
    const suffix = scale === 1_000_000_000n ? 'B' : 'M';
    return `${whole / scale}.${((whole % scale) * 100n / scale).toString().padStart(2, '0')}${suffix}`;
  }
  const fraction = (wei % WEI_PER_ETH).toString().padStart(18, '0').slice(0, 4);
  return `${whole.toLocaleString('en-US')}.${fraction}`;
}

export function walletSeed(address: string): number {
  return [...address.toLowerCase()].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 0);
}

export async function fetchBalance(address: string, signal?: AbortSignal): Promise<BalanceResult> {
  if (!isAddress(address)) throw new Error('Enter a 42-character Ethereum address starting with 0x.');
  for (const endpoint of RPC_ENDPOINTS) {
    if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => controller.abort(), 9_000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
          { jsonrpc: '2.0', id: 2, method: 'eth_getBalance', params: [address, 'latest'] },
        ]),
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw new Error('Provider unavailable');
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error('Unexpected provider response');
      const chain = payload.find((item) => item?.id === 1);
      const balance = payload.find((item) => item?.id === 2);
      if (chain?.error || chain?.result !== '0x1' || balance?.error ||
          typeof balance?.result !== 'string' || !/^0x[0-9a-fA-F]{1,64}$/.test(balance.result)) {
        throw new Error('Unable to verify an Ethereum balance');
      }
      return { address, wei: BigInt(balance.result), checkedAt: new Date() };
    } catch {
      if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
      // A second public provider recovers from rate limits and temporary outages.
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
  throw new Error('Couldn’t reach Ethereum. Check your connection and try again.');
}
