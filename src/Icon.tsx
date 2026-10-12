export type IconName = 'arrow' | 'external' | 'refresh' | 'shield' | 'spark' | 'close' | 'copy' | 'check';

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    external: <><path d="M8 5H5v14h14v-3M12 5h7v7M19 5 9 15" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6a8 8 0 0 1 13.5 5M4.4 13a8 8 0 0 0 13.5 5" /></>,
    shield: <><path d="m12 3 8 3v5c0 5-8 10-8 10S4 16 4 11V6Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" /></>,
    spark: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M15 8V4H4v11h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export function EthereumMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 36" aria-hidden="true" focusable="false"><path d="m12 0 12 19-12 7L0 19Z" fill="currentColor" /><path d="m0 22 12 14 12-14-12 7Z" fill="currentColor" /><path d="M12 0v26L0 19Z" fill="white" fillOpacity=".25" /></svg>;
}
