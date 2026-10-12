# Etherpeek

A minimal Ethereum balance checker with a little personality. Paste a public
wallet address, see its native ETH balance in large type, and meet its etherling.
The companion’s colors are derived from the address; its nudge button changes its
expression and greeting.

The finished static site is included in **[dist/](dist/)**. Its source uses React,
TypeScript, and Vite. No backend, wallet connection, API key, or environment file
is required.

## Install and run

Use Node.js **24 or later** and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Dependencies are locked in
`package-lock.json`; generated dependency and cache folders are ignored at every
nesting level. `dist/` is intentionally included in the submission.

## Rebuild and preview

```sh
npm run typecheck
npm run build
npm run preview
```

The build replaces `dist/`. The preview serves that production build. To verify
the export at a subpath:

```sh
node scripts/preview.mjs
```

Then open `http://127.0.0.1:4175/preview/`. Stop the server with Ctrl+C.

## Check

```sh
npm test
npx playwright install chromium
npm run build
npm run test:browser
```

The unit tests cover exact wei arithmetic, address validation, malformed RPC
replies, chain verification, fallback, cancellation, and timeouts. The browser
suite starts and stops its own production preview at `/preview/`. It checks the
form, keyboard flow, precision, copy fallback, refresh, errors, cancellation,
mobile layouts, text enlargement, local assets, and axe accessibility scans.
Browser tests use controlled RPC responses; a separate live check is recorded in
the validation report. On a Linux machine without Chromium’s system libraries,
install the dependencies listed by Playwright before running browser tests.

Actual worker results on 2026-10-12:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed; TypeScript emitted no errors |
| `npm run build` | Passed; complete static export generated |
| `npm test` | 11 passed |
| `npm run test:browser` | 16 passed in 9.5 seconds |
| axe, initial / invalid input / result | No violations in the selected WCAG A/AA rules |
| Live public balance lookup | Passed in the browser; both public providers returned mainnet data |
| Manual production review | Screenshots at 320, 390, 736, and 1440px; keyboard focus, forced colors, and 200% text enlargement inspected |

The worker installed dependencies and built an identical source copy at
`/tmp/etherpeek-build`, using `/tmp/etherpeek-npm-cache` and
`PLAYWRIGHT_BROWSERS_PATH=/tmp/etherpeek-browsers`. Commands used
`npm run <script> --prefix /tmp/etherpeek-build`; the completed export was copied
back to `dist/` and inspected there. No dependency directory is part of delivery.

See **[the complete validation report](artifacts/validation.md)** for findings,
fixes, measured contrast, evidence, and unperformed checks. The report is worker
evidence, not independent certification.

## Publish the included export

Upload the **contents of `dist/`**, including `assets/`, `licenses/`, the favicon,
and the social image, to a static HTTP(S) host or a directory-based IPFS upload.
Serve `index.html` for that directory and keep the asset names and structure.
There are no application routes or server rewrite requirements. Vite uses
`base: './'`, so runtime assets work at a gateway or other directory subpath.
Use a trailing slash when opening the directory.

The assignment publisher can serve the included export directly; it does not
need npm or a build step. No hosting or publishing command was run by the worker.
The site needs network access only when looking up a balance or following an
external link. Serve it over HTTPS for clipboard support; a visible manual-copy
fallback is provided if clipboard access is unavailable.

`og:image` points to the bundled `./og-image.png`. No public deployment origin
was supplied. Some social platforms require an absolute image URL; after choosing
a permanent host, set that URL in `index.html` and rebuild if your platform needs
it. Third-party social unfurls were not tested.

## Behavior and limits

- Accepts a 42-character `0x` Ethereum address; trims surrounding whitespace.
  Validation checks address syntax, not EIP-55 checksums. ENS names are not resolved.
- Reads **native ETH on Ethereum mainnet**, excluding tokens, staked ETH, and
  balances on other chains. A result is a snapshot; use Refresh for another lookup.
- Uses integer arithmetic for all balance formatting. The large value truncates
  to four decimals, displays `< 0.0001` for smaller nonzero amounts, and uses M/B
  for very large values. “View exact balance” exposes all significant decimals.
- Sends the address to PublicNode, with dRPC as a fallback. Each provider has a
  nine-second timeout. Both requests verify chain ID 1; failed lookups show an
  error and retry action, never a synthetic zero.
- Does not connect wallets, sign messages, send transactions, save searches,
  set cookies, or run analytics. Public RPC providers still receive the request
  and its network metadata. Service availability, CORS, and rate limits are
  outside this static site’s control.
- “Try a public wallet” looks up the public address labeled
  [vitalik.eth on Etherscan](https://etherscan.io/address/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045).
  This is a real lookup, not a cached or simulated balance.

The read method follows the
[Ethereum JSON-RPC documentation](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getbalance).
Provider endpoints live in `src/ethereum.ts`; changes must retain browser CORS
support, mainnet validation, and credential-free access. PublicNode lists its
networks on [its official site](https://www.publicnode.com/).

## Design and assets

[DESIGN.md](DESIGN.md) documents the implemented tokens, typography, components,
and responsive behavior. The local SVG illustration and favicon were created for
this project. DM Sans is bundled locally, with its license under
`public/licenses/`; React runtime notices are included there too.

The social image is included as a PNG. To regenerate it after changing the card
source or illustration:

```sh
node scripts/generate-social.mjs
npm run build
```

This generator uses the installed Playwright Chromium, the local font, and
`scripts/social-etherling.svg`; it does not fetch assets.

The design review used the pinned Better Interface guide by Jakub Krehel,
[commit 267330e1](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface)
(MIT). Design documentation follows the pinned Impeccable method by Paul Bakaus,
[commit 9d715cc4](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md)
(Apache-2.0; copyright 2025 Paul Bakaus). Their supplied license notices are
preserved in [artifacts/guide-licenses.txt](artifacts/guide-licenses.txt).
