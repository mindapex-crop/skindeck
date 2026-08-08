import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetsDir = path.resolve(__dirname, 'presets');

const presets = [
  {
    id: 'preset-sakura-garden',
    name: '樱花庭园',
    tagline: '粉色花瓣轻舞，温柔的春日工作时光。',
    statusText: 'SAKURA MODE ONLINE',
    quote: 'SPRING IS IN THE AIR',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.72, focusY: 0.48, safeArea: 'left', taskMode: 'ambient' },
    colors: {
      background: '#fff5f7',
      panel: 'rgba(255, 240, 245, 0.85)',
      panelAlt: 'rgba(255, 228, 235, 0.75)',
      accent: '#e88ea5',
      accentAlt: '#f4a6b8',
      secondary: '#c76b85',
      highlight: '#ff8fab',
      text: '#5a3a44',
      muted: '#9a7a85',
      line: 'rgba(232, 142, 165, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #ffe5ec 0%, #fff5f7 50%, #ffd6e0 100%)',
  },
  {
    id: 'preset-neon-cyberpunk',
    name: '霓虹赛博',
    tagline: '霓虹闪烁的未来都市，代码如电流般奔涌。',
    statusText: 'CYBER MODE ONLINE',
    quote: 'CODE THE FUTURE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.3, focusY: 0.55, safeArea: 'right', taskMode: 'ambient' },
    colors: {
      background: '#0a0a1a',
      panel: 'rgba(20, 20, 45, 0.9)',
      panelAlt: 'rgba(30, 25, 60, 0.8)',
      accent: '#00f0ff',
      accentAlt: '#ff00ff',
      secondary: '#7b2ff7',
      highlight: '#00ff88',
      text: '#e0e0ff',
      muted: '#8080a0',
      line: 'rgba(0, 240, 255, .3)',
    },
    bgGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
  },
  {
    id: 'preset-ocean-breeze',
    name: '海风轻语',
    tagline: '湛蓝海面与咸咸的风，让思路随波涛舒展。',
    statusText: 'OCEAN MODE ONLINE',
    quote: 'RIDE THE WAVE',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.65, focusY: 0.6, safeArea: 'left', taskMode: 'ambient' },
    colors: {
      background: '#e0f4fa',
      panel: 'rgba(224, 244, 250, 0.85)',
      panelAlt: 'rgba(200, 235, 245, 0.75)',
      accent: '#2a9db8',
      accentAlt: '#4fb8d4',
      secondary: '#1e7a92',
      highlight: '#00bcd4',
      text: '#1a4a5a',
      muted: '#5a8a9a',
      line: 'rgba(42, 157, 184, .25)',
    },
    bgGradient: 'linear-gradient(180deg, #b8e4f0 0%, #e0f4fa 50%, #c8ebf5 100%)',
  },
  {
    id: 'preset-forest-dawn',
    name: '森林晨光',
    tagline: '薄雾森林中的第一缕阳光，清新而宁静。',
    statusText: 'FOREST MODE ONLINE',
    quote: 'GROW WITH NATURE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.35, focusY: 0.4, safeArea: 'right', taskMode: 'ambient' },
    colors: {
      background: '#0d1a12',
      panel: 'rgba(20, 40, 30, 0.9)',
      panelAlt: 'rgba(30, 55, 40, 0.8)',
      accent: '#7cb342',
      accentAlt: '#aed581',
      secondary: '#33691e',
      highlight: '#8bc34a',
      text: '#dcedc8',
      muted: '#8aa88a',
      line: 'rgba(124, 179, 66, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0d1a12 0%, #1a2e1a 50%, #0f2015 100%)',
  },
  {
    id: 'preset-sunset-desert',
    name: '沙漠落日',
    tagline: '金色沙丘与橘色晚霞，温暖而辽阔。',
    statusText: 'SUNSET MODE ONLINE',
    quote: 'CHASE THE HORIZON',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.72, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#1a0f08',
      panel: 'rgba(50, 30, 20, 0.9)',
      panelAlt: 'rgba(70, 40, 25, 0.8)',
      accent: '#ff8a50',
      accentAlt: '#ffb080',
      secondary: '#c65d2b',
      highlight: '#ff6f00',
      text: '#ffe0c0',
      muted: '#b88a6a',
      line: 'rgba(255, 138, 80, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #4a1a1a 0%, #c65d2b 35%, #ff8a50 60%, #ffd080 85%, #3a2010 100%)',
  },
  {
    id: 'preset-midnight-study',
    name: '午夜书房',
    tagline: '暖黄台灯下的静谧书房，适合深夜深度工作。',
    statusText: 'STUDY MODE ONLINE',
    quote: 'STAY CURIOUS',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.2, focusY: 0.3, safeArea: 'right', taskMode: 'focused' },
    colors: {
      background: '#1a1410',
      panel: 'rgba(40, 30, 22, 0.95)',
      panelAlt: 'rgba(55, 42, 32, 0.9)',
      accent: '#d4a373',
      accentAlt: '#e9c46a',
      secondary: '#8b6914',
      highlight: '#f4a261',
      text: '#fef3c7',
      muted: '#a89070',
      line: 'rgba(212, 163, 115, .25)',
    },
    bgGradient: 'radial-gradient(circle at 20% 20%, #4a3828 0%, #1a1410 50%, #0d0a08 100%)',
  },
  {
    id: 'preset-cotton-candy',
    name: '棉花糖云朵',
    tagline: '蓬松柔软的云朵与糖霜般的甜意。',
    statusText: 'CANDY MODE ONLINE',
    quote: 'SWEET IDEAS AHEAD',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.55, focusY: 0.35, safeArea: 'bottom', taskMode: 'ambient' },
    colors: {
      background: '#f0e6ff',
      panel: 'rgba(240, 230, 255, 0.9)',
      panelAlt: 'rgba(230, 215, 250, 0.85)',
      accent: '#b088f9',
      accentAlt: '#d4a5ff',
      secondary: '#7c4dff',
      highlight: '#e1bee7',
      text: '#4a2c6b',
      muted: '#8a6ba8',
      line: 'rgba(176, 136, 249, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #ffd1dc 0%, #e0c3fc 40%, #c9e8ff 100%)',
  },
  {
    id: 'preset-obsidian-glass',
    name: '黑曜石玻璃',
    tagline: '极简深邃的玻璃拟态，专业而克制。',
    statusText: 'OBSIDIAN MODE ONLINE',
    quote: 'LESS IS MORE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.8, focusY: 0.2, safeArea: 'left', taskMode: 'focused' },
    colors: {
      background: '#0a0a0c',
      panel: 'rgba(25, 25, 30, 0.85)',
      panelAlt: 'rgba(35, 35, 42, 0.75)',
      accent: '#94a3b8',
      accentAlt: '#cbd5e1',
      secondary: '#475569',
      highlight: '#64748b',
      text: '#e2e8f0',
      muted: '#64748b',
      line: 'rgba(148, 163, 184, .2)',
    },
    bgGradient: 'linear-gradient(135deg, #0a0a0c 0%, #1e1e2a 50%, #0a0a0c 100%)',
  },
  {
    id: 'preset-arctic-frost',
    name: '极地冰霜',
    tagline: '冰蓝色调的极寒之地，清冷而锐利。',
    statusText: 'ARCTIC MODE ONLINE',
    quote: 'COOL UNDER PRESSURE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.4, focusY: 0.5, safeArea: 'right', taskMode: 'ambient' },
    colors: {
      background: '#08141c',
      panel: 'rgba(15, 30, 45, 0.9)',
      panelAlt: 'rgba(25, 45, 65, 0.8)',
      accent: '#7dd3fc',
      accentAlt: '#bae6fd',
      secondary: '#0284c7',
      highlight: '#38bdf8',
      text: '#e0f2fe',
      muted: '#7ba3c0',
      line: 'rgba(125, 211, 252, .3)',
    },
    bgGradient: 'linear-gradient(160deg, #0c1f2e 0%, #1e3a5f 40%, #0a1622 100%)',
  },
  {
    id: 'preset-matcha-tea',
    name: '抹茶禅意',
    tagline: '温润的抹茶绿，一杯茶的宁静时光。',
    statusText: 'MATCHA MODE ONLINE',
    quote: 'FIND YOUR ZEN',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.6, focusY: 0.4, safeArea: 'left', taskMode: 'ambient' },
    colors: {
      background: '#f0f4e8',
      panel: 'rgba(240, 244, 232, 0.9)',
      panelAlt: 'rgba(220, 230, 200, 0.85)',
      accent: '#88a86b',
      accentAlt: '#a8c48a',
      secondary: '#556b2f',
      highlight: '#9ccc65',
      text: '#3a4a2a',
      muted: '#7a8a6a',
      line: 'rgba(136, 168, 107, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #dce8c8 0%, #f0f4e8 50%, #e8eec8 100%)',
  },
];

for (const preset of presets) {
  const dir = path.join(presetsDir, preset.id);
  await fs.mkdir(dir, { recursive: true });

  const theme = {
    schemaVersion: 1,
    id: preset.id,
    name: preset.name,
    brandSubtitle: 'DREAM SKIN',
    tagline: preset.tagline,
    projectPrefix: '选择项目 · ',
    projectLabel: '◉  选择项目',
    statusText: preset.statusText,
    quote: preset.quote,
    image: preset.image,
    appearance: preset.appearance,
    art: preset.art,
    colors: preset.colors,
    promoTitle: 'Dream Skin',
    promoSub: preset.name,
    promoUrl: '',
  };

  await fs.writeFile(
    path.join(dir, 'theme.json'),
    JSON.stringify(theme, null, 2) + '\n'
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <style>
      .title { font-family: -apple-system, sans-serif; font-size: 64px; font-weight: 300; fill: ${preset.colors.text}; opacity: 0.85; letter-spacing: 8px; }
      .subtitle { font-family: -apple-system, sans-serif; font-size: 28px; font-weight: 300; fill: ${preset.colors.muted}; opacity: 0.7; letter-spacing: 4px; }
      .accent-shape { fill: ${preset.colors.accent}; opacity: 0.12; }
      .accent-shape-2 { fill: ${preset.colors.accentAlt}; opacity: 0.08; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="${preset.colors.background}"/>
  <circle class="accent-shape" cx="1500" cy="250" r="400"/>
  <circle class="accent-shape-2" cx="300" cy="800" r="500"/>
  <circle class="accent-shape" cx="1700" cy="900" r="250"/>
  <text x="960" y="480" text-anchor="middle" class="title">${preset.name}</text>
  <text x="960" y="560" text-anchor="middle" class="subtitle">${preset.tagline}</text>
</svg>`;
  await fs.writeFile(path.join(dir, 'background.svg'), svg);
}

console.log(`生成了 ${presets.length} 款预设皮肤`);
