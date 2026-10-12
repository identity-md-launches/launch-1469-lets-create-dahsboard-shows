import { useEffect, useRef, useState } from 'react';
import { walletSeed } from './ethereum';
import { Icon } from './Icon';

const palettes = [
  ['#ae9aea', '#7d64c5', '#c9b8fa', '#65509c'],
  ['#86b9a5', '#508d75', '#b4dac6', '#396e5b'],
  ['#e4a687', '#bb765d', '#f4cbb2', '#9a5c4b'],
  ['#90b6df', '#628abe', '#bdd6f3', '#4b6b9d'],
];
const greetings = ['Well, hello there.', 'You have excellent taste.', 'Just here for the good vibes.', 'A little sparkle for your day.'];

export function Etherling({ address }: { address?: string }) {
  const seed = address ? walletSeed(address) : 0;
  const colors = palettes[seed % palettes.length];
  const [nudges, setNudges] = useState(0);
  const [dancing, setDancing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setNudges(0); setDancing(false); clearTimeout(timer.current); }, [address]);

  function nudge() {
    setNudges((n) => n + 1);
    setDancing(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDancing(false), 650);
  }

  return <aside className="etherling-panel" aria-label="Your etherling companion">
    <span className="companion-label"><Icon name="spark" /> A little extra character</span>
    <div className={`etherling-scene ${dancing ? 'is-dancing' : ''}`}>
      <svg className="etherling-art" viewBox="0 0 320 275" role="img" aria-label="A friendly, smiling Ethereum crystal with little arms and feet">
        <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#a5af8c" opacity=".35" /></pattern></defs>
        <rect width="320" height="275" fill="url(#dots)" />
        <ellipse cx="161" cy="245" rx="63" ry="9" fill="#54643c" opacity=".11" />
        <g className="etherling-body">
          <path d="M109 153c-22-4-27-16-29-28m132 28c21-4 28-15 30-28" fill="none" stroke="#414936" strokeWidth="5" strokeLinecap="round" />
          <path d="m80 125-7-6m7 6 1-10m160 10 7-6m-7 6-1-10" fill="none" stroke="#414936" strokeWidth="4" strokeLinecap="round" />
          <path d="m147 211-9 25h-12m49-25 9 25h12" fill="none" stroke="#414936" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m160 36 65 113-65 39-65-39Z" fill={colors[0]} stroke={colors[3]} strokeWidth="2" strokeLinejoin="round" />
          <path d="m160 36 65 113-65-28Z" fill={colors[2]} />
          <path d="M160 36v85l-65 28Z" fill={colors[0]} />
          <path d="m95 149 65-28v67Z" fill={colors[1]} />
          <path d="m225 149-65-28v67Z" fill={colors[0]} />
          <path d="m95 161 65 70 65-70-65 38Z" fill={colors[1]} stroke={colors[3]} strokeWidth="2" strokeLinejoin="round" />
          <path d="M160 199v31l65-69Z" fill={colors[0]} />
          <g className="etherling-face">
            {nudges % 3 === 2 ? <path d="m132 119 10-3-8-5m43 0-8 5 10 3" fill="none" stroke="#292533" strokeWidth="4" strokeLinecap="round" /> : <><ellipse cx="136" cy="116" rx="5" ry="8" fill="#292533" /><ellipse cx="178" cy="116" rx="5" ry="8" fill="#292533" /><circle cx="138" cy="113" r="1.5" fill="white" /><circle cx="180" cy="113" r="1.5" fill="white" /></>}
            <path d="M149 131q9 10 18 0" fill="none" stroke="#292533" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="126" cy="131" rx="8" ry="4" fill="#e7bbd5" /><ellipse cx="187" cy="131" rx="8" ry="4" fill="#e7bbd5" />
          </g>
          {nudges > 0 && <path d="M257 66c-7-10-17 0 0 11 17-11 7-21 0-11Z" fill={colors[1]} />}
        </g>
        <path d="m67 72 3-9 3 9 9 3-9 3-3 9-3-9-9-3Zm187 104 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" fill="#69734f" />
        <circle cx="253" cy="104" r="3" fill="#a2af83" />
        <circle cx="75" cy="192" r="3" fill="#a2af83" />
      </svg>
    </div>
    <div className="companion-copy">
      <h2>{address ? 'One wallet. One etherling.' : 'Meet your etherling.'}</h2>
      <p role="status">{nudges ? greetings[(nudges - 1) % greetings.length] : 'Every address has a little personality.'}</p>
      <button type="button" className="nudge-button" onClick={nudge}>Give it a nudge <span aria-hidden="true">↗</span></button>
    </div>
  </aside>;
}
