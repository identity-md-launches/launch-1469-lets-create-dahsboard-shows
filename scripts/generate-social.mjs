import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const font = await readFile(new URL(import.meta.resolve('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2')));
const art = await readFile(new URL('./social-etherling.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
    @font-face{font-family:DM;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:100 1000}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f8f9f5;color:#272e24;font-family:DM,sans-serif;display:flex;padding:60px 70px;gap:30px}
    .copy{flex:1;padding-top:6px}.brand{font-size:32px;font-weight:750;letter-spacing:-1.8px;display:flex;align-items:center;gap:12px}
    .mark{width:38px;height:42px;display:grid;place-items:center;background:#dfff98;border-radius:12px;transform:rotate(-7deg);font-size:32px}
    h1{font-size:84px;line-height:1.05;letter-spacing:-5px;font-weight:550;margin:62px 0 24px}
    p{font-size:24px;color:#626b5c;margin:0;line-height:1.5}.note{display:inline-block;margin-top:32px;font-size:17px;background:#dfff98;border-radius:12px;padding:14px 22px;font-weight:600}
    .art{width:405px;align-self:center;border-radius:32px;background:#eff4df;padding:12px 0 24px;text-align:center}.art svg{width:405px;height:349px;display:block}.art p{font-size:18px;color:#272e24;font-weight:500}
  </style></head><body><div class="copy"><div class="brand"><span class="mark">♦</span>etherpeek.</div><h1>Big balance<br>energy.</h1><p>A tiny window into any Ethereum wallet.</p><span class="note">Paste an address. Take a peek. →</span></div><div class="art">${art}<p>A little ETH. A little personality.</p></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/og-image.png' });
  console.log('Generated public/og-image.png (1200 × 630).');
} finally { await browser.close(); }
