import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const rpcPattern = /https:\/\/(ethereum-rpc\.publicnode\.com|eth\.drpc\.org)\/?$/;
const rpcBody = (wei: bigint) => JSON.stringify([{ jsonrpc: '2.0', id: 2, result: '0x' + wei.toString(16) }, { jsonrpc: '2.0', id: 1, result: '0x1' }]);

async function mockBalance(page: Page, wei: bigint) {
  await page.route(rpcPattern, route => route.fulfill({ contentType: 'application/json', body: rpcBody(wei) }));
}

test('production assets, metadata and first-screen action work at a static subpath', async ({ page, request }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', req => failures.push(req.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page).toHaveTitle('Etherpeek — Ethereum balance checker');
  await expect(page.getByRole('heading', { name: 'Big balance energy.' })).toBeVisible();
  const action = await page.getByRole('button', { name: 'Check balance', exact: true }).boundingBox();
  expect(action!.y + action!.height).toBeLessThan(844);
  for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', /.+/);
  }
  for (const selector of ['link[rel="icon"]', 'meta[property="og:image"]']) {
    const url = await page.locator(selector).getAttribute(selector.startsWith('link') ? 'href' : 'content');
    const response = await request.get(new URL(url!, page.url()).toString());
    expect(response.ok()).toBeTruthy();
  }
  await page.evaluate(() => document.fonts.ready);
  expect(failures).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('16px "DM Sans Variable"'))).toBeTruthy();
});

test('empty and malformed submissions are recoverable and focus the labeled field', async ({ page }) => {
  let calls = 0;
  await page.route(rpcPattern, route => { calls++; return route.abort(); });
  await page.goto('./');
  await page.getByRole('button', { name: 'Check balance', exact: true }).click();
  await expect(page.getByLabel('Wallet address')).toBeFocused();
  await expect(page.getByLabel('Wallet address')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#wallet-error')).toContainText('Paste an Ethereum wallet address');
  await page.getByLabel('Wallet address').fill('vitalik.eth');
  await page.getByLabel('Wallet address').press('Enter');
  await expect(page.locator('#wallet-error')).toContainText('ENS names aren’t supported');
  expect(calls).toBe(0);
});

test('keyboard lookup, exact precision, clipboard, explorer and refresh', async ({ page, context }) => {
  let calls = 0;
  await page.route(rpcPattern, route => {
    calls++;
    return route.fulfill({ contentType: 'application/json', body: rpcBody(calls === 1 ? 1_234_567_890_123_456_789n : 2n * 10n ** 18n) });
  });
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to balance checker' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Wallet address')).toBeFocused();
  await page.getByLabel('Wallet address').fill(`  ${address}  `);
  await page.keyboard.press('Enter');
  await expect(page.locator('.balance-number')).toHaveText('1.2345ETH');
  await expect(page.locator('.wallet-address')).toHaveText(address);
  await expect(page.locator('.explorer-link')).toHaveAttribute('href', `https://etherscan.io/address/${address}`);
  await page.getByText('View exact balance', { exact: false }).click();
  await expect(page.locator('.exact-number')).toHaveText('1.234567890123456789 ETH');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy exact balance' }).click();
  await expect(page.locator('.copy-feedback')).toHaveText('Exact balance copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('1.234567890123456789');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.locator('.balance-number')).toHaveText('2.0000ETH');
  expect(calls).toBe(2);
});

test('example, loading, cancel and stale responses', async ({ page }) => {
  let release: (() => void) | undefined;
  await page.route(rpcPattern, async route => {
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ contentType: 'application/json', body: rpcBody(42n * 10n ** 18n) }).catch(() => {});
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Try a public wallet' }).click();
  await expect(page.getByLabel('Wallet address')).toHaveValue(address);
  await expect(page.getByRole('button', { name: 'Checking balance' })).toBeDisabled();
  await expect(page.locator('.balance-panel')).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByRole('button', { name: 'Cancel lookup and clear address' }).click();
  release!();
  await expect(page.getByLabel('Wallet address')).toBeFocused();
  await expect(page.getByLabel('Wallet address')).toHaveValue('');
  await expect(page.locator('.balance-number')).toHaveText('—ETH');
  await expect(page.getByRole('button', { name: 'Check balance', exact: true })).toBeEnabled();
  await mockBalance(page, 3n * 10n ** 18n);
  await page.getByRole('button', { name: 'Try a public wallet' }).click();
  await expect(page.locator('.balance-number')).toHaveText('3.0000ETH');
});

test('provider fallback, total failure and retry never show a made-up zero', async ({ page }) => {
  let requests = 0;
  await page.route(rpcPattern, route => { requests++; return route.fulfill({ status: 503, body: '' }); });
  await page.goto('./');
  await page.getByRole('button', { name: 'Try a public wallet' }).click();
  await expect(page.locator('.network-error')).toContainText('Check your connection and try again');
  expect(requests).toBe(2);
  await expect(page.locator('.balance-number')).toHaveText('—ETH');
  await mockBalance(page, 0n);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.balance-number')).toHaveText('0.0000ETH');
  await expect(page.locator('.balance-caption')).toHaveText('A clean slate. Zero ETH at this address.');
  await expect(page.locator('.network-error')).toHaveCount(0);
});

test('fallback provider can complete a lookup after the first fails', async ({ page }) => {
  const requests: string[] = [];
  await page.route(rpcPattern, route => {
    requests.push(route.request().url());
    return route.request().url().includes('publicnode')
      ? route.fulfill({ status: 429, body: '' })
      : route.fulfill({ contentType: 'application/json', body: rpcBody(9n * 10n ** 18n) });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Try a public wallet' }).click();
  await expect(page.locator('.balance-number')).toHaveText('9.0000ETH');
  expect(requests).toHaveLength(2);
});

test('a tiny nonzero balance stays visibly nonzero and exact balance can be selected when clipboard is blocked', async ({ page }) => {
  await mockBalance(page, 1n);
  await page.goto('./');
  await page.getByRole('button', { name: 'Try a public wallet' }).click();
  await expect(page.locator('.balance-number')).toHaveText('< 0.0001ETH');
  await page.getByText('View exact balance', { exact: false }).click();
  await expect(page.locator('.exact-number')).toHaveText('0.000000000000000001 ETH');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.getByRole('button', { name: 'Copy exact balance' }).click();
  await expect(page.locator('.copy-feedback')).toContainText('copy it manually');
});

test('etherling responds to keyboard activation with static feedback under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const nudge = page.getByRole('button', { name: 'Give it a nudge' });
  await nudge.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.companion-copy [role="status"]')).toHaveText('Well, hello there.');
  expect(await page.locator('.etherling-body').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.keyboard.press('Space');
  await expect(page.locator('.companion-copy [role="status"]')).toHaveText('You have excellent taste.');
  await page.getByText('How it works', { exact: false }).click();
  await expect(page.locator('.about-content')).toBeVisible();
});

for (const width of [320, 390, 560, 736, 900, 1440]) {
  test(`layout fits at ${width}px in empty and large-balance states`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockBalance(page, 999_999n * 10n ** 18n + 1n);
    await page.goto('./');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const input = await page.getByLabel('Wallet address').boundingBox();
    const action = await page.getByRole('button', { name: 'Check balance', exact: true }).boundingBox();
    expect(input!.width).toBeGreaterThan(140);
    expect(action!.y + action!.height).toBeLessThan(900);
    await page.getByRole('button', { name: 'Try a public wallet' }).click();
    await expect(page.locator('.balance-number')).toHaveText('999,999.0000ETH');
    await page.getByText('View exact balance', { exact: false }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  });
}

test('200% text enlargement keeps the form and exact balance reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBalance(page, 1_234_567n * 10n ** 18n + 1n);
  await page.goto('./');
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await page.getByLabel('Wallet address').fill(address);
  await page.getByRole('button', { name: 'Check balance', exact: true }).click();
  await expect(page.locator('.balance-number')).toHaveText('1.23METH');
  await page.getByText('View exact balance', { exact: false }).click();
  await expect(page.locator('.exact-number')).toHaveText('1234567.000000000000000001 ETH');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('automated accessibility checks cover initial, validation-error and result states', async ({ page }) => {
  await mockBalance(page, 1_234_567_890_123_456_789n);
  await page.goto('./');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Check balance', exact: true }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.getByLabel('Wallet address').fill(address);
  await page.getByLabel('Wallet address').press('Enter');
  await expect(page.locator('.balance-number')).toHaveText('1.2345ETH');
  await page.getByText('View exact balance', { exact: false }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
});
