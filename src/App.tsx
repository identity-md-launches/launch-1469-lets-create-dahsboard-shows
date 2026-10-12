import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { displayEth, exactEth, EXAMPLE_ADDRESS, fetchBalance, isAddress } from './ethereum';
import type { BalanceResult } from './ethereum';
import { EthereumMark, Icon } from './Icon';
import { Etherling } from './Etherling';

export function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [pendingAddress, setPendingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  useEffect(() => () => activeRequest.current?.abort(), []);

  async function lookup(raw: string) {
    const address = raw.trim();
    if (!isAddress(address)) {
      setFieldError(address ? 'Use a 42-character address starting with 0x. ENS names aren’t supported yet.' : 'Paste an Ethereum wallet address to take a peek.');
      inputRef.current?.focus();
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const current = ++sequence.current;
    setInput(address);
    setFieldError('');
    setNetworkError('');
    setCopyMessage('');
    setResult(null);
    setPendingAddress(address);
    setLoading(true);
    setAnnouncement('Checking the ETH balance on Ethereum mainnet.');
    try {
      const balance = await fetchBalance(address, controller.signal);
      if (current !== sequence.current) return;
      setResult(balance);
      setAnnouncement(`Balance found: ${exactEth(balance.wei)} ETH.`);
    } catch (error) {
      if (controller.signal.aborted || current !== sequence.current) return;
      const message = error instanceof Error ? error.message : 'Couldn’t load this balance. Try again.';
      setNetworkError(message);
      setAnnouncement(message);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }

  function reset() {
    ++sequence.current;
    activeRequest.current?.abort();
    setLoading(false);
    setInput('');
    setResult(null);
    setPendingAddress('');
    setFieldError('');
    setNetworkError('');
    setCopyMessage('');
    setAnnouncement('Lookup cleared. Enter another wallet address.');
    inputRef.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loading) void lookup(input);
  }

  async function copyBalance() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(exactEth(result.wei));
      setCopyMessage('Exact balance copied.');
    } catch {
      setCopyMessage('Select the exact balance below to copy it manually.');
    }
  }

  const display = result ? displayEth(result.wei) : '—';

  return <div className="page-shell">
    <a className="skip-link" href="#main">Skip to balance checker</a>
    <header className="site-header">
      <a className="wordmark" href="./" aria-label="Etherpeek home"><span className="brand-mark"><EthereumMark /></span>etherpeek<span className="brand-period">.</span></a>
      <div className="network-badge"><span className="status-dot" />Ethereum <span className="network-long">mainnet</span></div>
    </header>

    <main id="main">
      <section className="intro" aria-labelledby="page-title">
        <div><h1 id="page-title">Big balance energy<span>.</span></h1><p>A tiny window into any Ethereum wallet.</p></div>
        <span className="intro-aside"><Icon name="shield" /> No connection needed.</span>
      </section>

      <form className="lookup-form" onSubmit={submit} noValidate>
        <label htmlFor="wallet">Wallet address</label>
        <div className={`input-row ${fieldError ? 'has-error' : ''}`}>
          <div className="input-wrap"><EthereumMark className="input-eth" /><input ref={inputRef} id="wallet" name="wallet" type="text" inputMode="text" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="0x… paste a wallet address" value={input} onChange={(event) => { setInput(event.target.value); if (fieldError) setFieldError(''); }} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? 'wallet-error' : 'wallet-hint'} />{(input || loading || result) && <button type="button" className="icon-button clear-button" onClick={reset} aria-label={loading ? 'Cancel lookup and clear address' : 'Clear lookup'}><Icon name="close" /></button>}</div>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? <><span className="loading-dot" />Checking balance</> : <>Check balance <Icon name="arrow" /></>}</button>
        </div>
        {fieldError ? <p className="field-error" id="wallet-error">{fieldError}</p> : <div className="form-hint" id="wallet-hint"><span>Any public address. Just a peek.</span><button type="button" className="text-button example-button" onClick={() => void lookup(EXAMPLE_ADDRESS)} disabled={loading}>Try a public wallet <Icon name="arrow" /></button></div>}
      </form>

      <section className="dashboard" aria-label="Wallet balance dashboard">
        <div className="balance-panel" aria-busy={loading}>
          <div className="balance-heading"><h2>ETH balance</h2><span className="asset-badge"><EthereumMark />Ethereum</span></div>
          <div className={`balance-content ${!result ? 'is-empty' : ''}`}>
            <div className={`balance-number ${display.length > 9 ? 'is-long' : ''}`}><span aria-label={result ? `${exactEth(result.wei)} ether` : 'No balance loaded'}>{display}</span><span className="balance-unit" aria-hidden="true">ETH</span></div>
            <p className="balance-caption">{loading ? 'Taking a peek at the blockchain…' : networkError ? 'This peek will have to wait.' : result ? (result.wei === 0n ? 'A clean slate. Zero ETH at this address.' : 'A little clarity feels good.') : 'Your balance, minus the noise.'}</p>
            {!result && !loading && !networkError && <p className="empty-instruction">Enter an address above to see what’s here.</p>}
            {loading && <div className="lookup-progress" aria-hidden="true"><span /><span /><span /></div>}
            {networkError && <div className="network-error"><p>{networkError}</p><button type="button" className="secondary-button" onClick={() => void lookup(pendingAddress)}><Icon name="refresh" />Try again</button></div>}
            {result && <div className="wallet-result"><span className="result-label">Wallet</span><bdi className="wallet-address">{result.address}</bdi></div>}
          </div>
          <div className="balance-bottom">
            <span className="balance-note"><span className={`status-dot ${result ? '' : 'is-neutral'}`} />{loading ? 'Reading Ethereum mainnet' : result ? `Checked at ${result.checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Native ETH on mainnet'}</span>
            {result ? <button type="button" className="text-button" onClick={() => void lookup(result.address)}><Icon name="refresh" />Refresh</button> : <span className="read-only">Read-only, always <Icon name="shield" /></span>}
          </div>
        </div>
        <Etherling address={result?.address} />
      </section>

      {result && <section className="result-details" aria-label="Balance details"><details key={result.address + result.checkedAt.toISOString()}><summary>View exact balance <span aria-hidden="true">+</span></summary><div className="exact-content"><p className="exact-number">{exactEth(result.wei)} ETH</p><p className="exact-explainer">The big number is shortened for readability. This is the full balance returned by Ethereum.</p><button type="button" className="secondary-button" onClick={() => void copyBalance()}><Icon name={copyMessage === 'Exact balance copied.' ? 'check' : 'copy'} />Copy exact balance</button><p className="copy-feedback" role="status">{copyMessage}</p></div></details><a className="explorer-link" href={`https://etherscan.io/address/${result.address}`} target="_blank" rel="noreferrer">View on Etherscan <Icon name="external" /><span className="sr-only"> (opens in a new tab)</span></a></section>}

      <div className="under-card"><p><Icon name="shield" />Your keys stay yours. We only look.</p><span className="under-card-note">Less dashboard. More breathing room.</span></div>
      <div className="sr-only" role="status" aria-atomic="true">{announcement}</div>
    </main>

    <footer className="site-footer"><span>Made for the curious<span className="footer-star" aria-hidden="true"> ✳</span></span><details className="about"><summary>How it works <span aria-hidden="true">+</span></summary><div className="about-content"><p>Paste a public Ethereum address to check its native ETH balance on mainnet. Tokens, staked ETH, and other networks aren’t included.</p><p>Each lookup is a snapshot. Select Refresh to check again. No sign-in, wallet connection, transactions, or saved search history.</p><p>The address is sent to a public RPC provider to retrieve its balance. PublicNode is tried first, then dRPC if needed. Your etherling’s colors come from the address, just for fun.</p><a href="https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getbalance" target="_blank" rel="noreferrer">About Ethereum balance lookups <Icon name="external" /><span className="sr-only"> (opens in a new tab)</span></a></div></details><span className="footer-signoff">A small tool for a big network.</span></footer>
  </div>;
}
