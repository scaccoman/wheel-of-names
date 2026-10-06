export const IconSprite = (): JSX.Element => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <symbol id="i-sound" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </symbol>
    <symbol id="i-mute" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </symbol>
    <symbol id="i-moon" viewBox="0 0 24 24">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </symbol>
    <symbol id="i-sun" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </symbol>
    <symbol id="i-link" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </symbol>
    <symbol id="i-x" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </symbol>
    <symbol id="i-plus" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </symbol>
    <symbol id="i-shuffle" viewBox="0 0 24 24">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </symbol>
    <symbol id="i-paste" viewBox="0 0 24 24">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M8 12h8M8 16h5" />
    </symbol>
    <symbol id="i-trash" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </symbol>
    <symbol id="i-spin" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </symbol>
    <symbol id="i-skip" viewBox="0 0 24 24">
      <path d="m5 4 10 8-10 8z" />
      <path d="M19 5v14" />
    </symbol>
    <symbol id="i-copy" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </symbol>
    <symbol id="i-dice" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </symbol>
    <symbol id="i-pause" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </symbol>
  </svg>
)

export const Icon = ({ name }: { name: string }): JSX.Element => (
  <svg className="i" aria-hidden="true">
    <use href={`#i-${name}`} />
  </svg>
)

export const BrandMark = (): JSX.Element => (
  <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" fill="#FF9B85" />
    <path d="M16 16 16 1A15 15 0 0 1 29 8.5z" fill="#FFD45C" />
    <path d="M16 16 29 8.5A15 15 0 0 1 29 23.5z" fill="#6FD3C6" />
    <path d="M16 16 29 23.5A15 15 0 0 1 16 31z" fill="#B9A6FF" />
    <path d="M16 16 16 31A15 15 0 0 1 3 23.5z" fill="#8EC5FF" />
    <circle cx="16" cy="16" r="4" fill="#18181D" />
  </svg>
)
