import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetsDir = path.resolve(__dirname, '..', 'presets');

const extraPresets = [
  {
    id: 'preset-sunset-gold',
    name: '落日金辉',
    tagline: '金色夕阳洒满天际，温暖而壮丽。',
    statusText: 'SUNSET MODE ONLINE',
    quote: 'GOLDEN HOUR',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.6, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#1a0d00',
      panel: 'rgba(26, 13, 0, 0.9)',
      panelAlt: 'rgba(51, 26, 0, 0.8)',
      accent: '#ff9800',
      accentAlt: '#ffb74d',
      secondary: '#e65100',
      highlight: '#ffeb3b',
      text: '#fff3e0',
      muted: '#ffb74d',
      line: 'rgba(255, 152, 0, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0d0d1a 0%, #1a0d00 30%, #3e1f00 60%, #1a0d00 100%)',
  },
];

function generateBgSvg(preset) {
  const isDark = preset.appearance === 'dark';
  const accent = preset.colors.accent;
  const accentAlt = preset.colors.accentAlt;
  const highlight = preset.colors.highlight;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${preset.colors.background};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${preset.colors.panel};stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow1" cx="20%" cy="30%" r="40%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:${isDark ? 0.15 : 0.1}" />
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0" />
    </radialGradient>
    <radialGradient id="glow2" cx="80%" cy="70%" r="35%">
      <stop offset="0%" style="stop-color:${accentAlt};stop-opacity:${isDark ? 0.12 : 0.08}" />
      <stop offset="100%" style="stop-color:${accentAlt};stop-opacity:0" />
    </radialGradient>
    <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${highlight};stop-opacity:${isDark ? 0.05 : 0.03}" />
      <stop offset="100%" style="stop-color:${highlight};stop-opacity:0" />
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#glow1)"/>
  <rect width="1920" height="1080" fill="url(#glow2)"/>
  <rect width="1920" height="1080" fill="url(#glow3)"/>
</svg>`;
}

async function generatePreset(preset) {
  const dir = path.join(presetsDir, preset.id);
  await fs.mkdir(dir, { recursive: true });

  const themeJson = {
    schemaVersion: 1,
    id: preset.id,
    name: preset.name,
    image: preset.image,
    appearance: preset.appearance,
    art: preset.art,
    colors: preset.colors,
    tagline: preset.tagline,
    statusText: preset.statusText,
    quote: preset.quote,
  };

  await fs.writeFile(path.join(dir, 'theme.json'), JSON.stringify(themeJson, null, 2));
  await fs.writeFile(path.join(dir, 'background.svg'), generateBgSvg(preset));

  console.log(`  ✓ ${preset.name}`);
}

async function main() {
  console.log('\n补充皮肤预设...\n');

  let count = 0;
  for (const preset of extraPresets) {
    try {
      await fs.access(path.join(presetsDir, preset.id));
      console.log(`  - ${preset.name} (已存在)`);
    } catch {
      await generatePreset(preset);
      count++;
    }
  }

  console.log(`\n完成！新增 ${count} 款皮肤\n`);
}

main().catch(console.error);
