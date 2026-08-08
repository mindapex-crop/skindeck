export type IconName =
  | 'app'
  | 'target'
  | 'skin'
  | 'opacity'
  | 'background'
  | 'image'
  | 'reset'
  | 'pet'
  | 'show'
  | 'hide'
  | 'position'
  | 'language'
  | 'current'
  | 'folder'
  | 'update'
  | 'version'
  | 'quit'
  | 'play'
  | 'feed'
  | 'pet-stroke'
  | 'heart'
  | 'fox';

export const SVG_ICONS: Record<IconName, string> = {
  app: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1L10.5 6L16 6.5L11.5 10L13 15.5L8 12.5L3 15.5L4.5 10L0 6.5L5.5 6L8 1Z" fill="currentColor"/></svg>',
  target: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></svg>',
  skin: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.24-.27-.39-.63-.39-1.02 0-.83.67-1.5 1.5-1.5H11c2.21 0 4-1.79 4-4 0-3.87-3.13-7-7-7Z" fill="currentColor"/></svg>',
  opacity: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  background: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="6" r="1.5" fill="currentColor"/><path d="M1.5 12.5l4-4 3 3 2.5-2.5 3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="5.5" cy="6" r="1.5" fill="currentColor"/><path d="M1.5 12.5l4-4 3 3 2.5-2.5 3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 8a5 5 0 11-1.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11.5 2.5V5H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pet: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4.5" cy="5" r="2" fill="currentColor"/><circle cx="11.5" cy="5" r="2" fill="currentColor"/><circle cx="3" cy="10" r="1.5" fill="currentColor"/><circle cx="13" cy="10" r="1.5" fill="currentColor"/><ellipse cx="8" cy="9" rx="4" ry="3.5" fill="currentColor"/></svg>',
  show: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  hide: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 3C4.5 3 1.5 5.5 1 8c.3 1.5 1.5 3 3.2 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11.8 4.2C13.5 5 14.7 6.5 15 8c-.5 2.5-3.5 5-7 5-.7 0-1.4-.1-2-.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  position: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15s5-4.5 5-9a5 5 0 00-10 0c0 4.5 5 9 5 9Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  language: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h12" stroke="currentColor" stroke-width="1.5"/><path d="M8 2c1.5 2 2 4 2 6s-.5 4-2 6c-1.5-2-2-4-2-6s.5-4 2-6Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  current: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  folder: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 4.5a2 2 0 012-2h2.5l1.5 1.5H13a1 1 0 011 1v6a2 2 0 01-2 2H3.5a2 2 0 01-2-2v-6.5Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  update: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v3m0 0L6 3m2 2l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 6.5a5 5 0 11-7.5-4.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  version: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="4" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 7h11" stroke="currentColor" stroke-width="1.5"/><path d="M5 4V2.5M11 4V2.5M5 13.5V12M11 13.5V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  quit: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2h2.5A1.5 1.5 0 0114 3.5v9A1.5 1.5 0 0112.5 14H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6 8h6m0 0L10 6m2 2l-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 5.5l5 2.5-5 2.5v-5Z" fill="currentColor"/></svg>',
  feed: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8h8M8 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/></svg>',
  'pet-stroke': '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10.5c-2 0-3.5-1-3.5-2.5S6 5.5 8 5.5s3.5 1 3.5 2.5S10 10.5 8 10.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M5 5c0-1.5 1.5-2.5 3-2.5M11 5c0-1.5-1.5-2.5-3-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 13.5s-5-3.5-5-7.5a3.5 3.5 0 016-2 3.5 3.5 0 016 2c0 4-5 7.5-5 7.5h-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  fox: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 5l2-3 2 3Z" fill="currentColor"/><path d="M10 5l2-3 2 3Z" fill="currentColor"/><ellipse cx="8" cy="9" rx="6" ry="5" fill="currentColor"/><ellipse cx="8" cy="10.5" rx="4" ry="3" fill="#fff" opacity="0.8"/><circle cx="5.5" cy="8.5" r="1" fill="#1F2937"/><circle cx="10.5" cy="8.5" r="1" fill="#1F2937"/><ellipse cx="8" cy="10.5" rx="0.9" ry="0.6" fill="#1F2937"/></svg>',
};

export function getIconSvg(name: IconName, size = 16, color = 'currentColor'): string {
  const svg = SVG_ICONS[name] || SVG_ICONS.app;
  return svg
    .replace(/viewBox="0 0 16 16"/, `viewBox="0 0 16 16" width="${size}" height="${size}"`)
    .replace(/currentColor/g, color);
}

export function iconToDataUrl(name: IconName, size = 16, color = '#000000'): string {
  const svg = getIconSvg(name, size, color);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
