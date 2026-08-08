import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetsDir = path.resolve(__dirname, '..', 'presets');

const newPresets = [
  {
    id: 'preset-lavender-dream',
    name: '薰衣草之梦',
    tagline: '紫色薰衣草田中的宁静时光，思绪随风飘散。',
    statusText: 'LAVENDER MODE ONLINE',
    quote: 'DREAM BIG',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.6, focusY: 0.5, safeArea: 'left', taskMode: 'ambient' },
    colors: {
      background: '#f3e5f5',
      panel: 'rgba(243, 229, 245, 0.85)',
      panelAlt: 'rgba(225, 190, 231, 0.75)',
      accent: '#9c27b0',
      accentAlt: '#ba68c8',
      secondary: '#7b1fa2',
      highlight: '#e040fb',
      text: '#4a148c',
      muted: '#9575cd',
      line: 'rgba(156, 39, 176, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #e1bee7 0%, #f3e5f5 50%, #ce93d8 100%)',
  },
  {
    id: 'preset-coffee-shop',
    name: '咖啡馆',
    tagline: '温暖的咖啡香与柔和的灯光，享受专注的午后。',
    statusText: 'COFFEE MODE ONLINE',
    quote: 'STAY BREWED',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.4, focusY: 0.45, safeArea: 'right', taskMode: 'focus' },
    colors: {
      background: '#2d1f14',
      panel: 'rgba(45, 31, 20, 0.9)',
      panelAlt: 'rgba(62, 39, 35, 0.8)',
      accent: '#d4a574',
      accentAlt: '#c68642',
      secondary: '#8b6914',
      highlight: '#ffb74d',
      text: '#efe0d0',
      muted: '#a1887f',
      line: 'rgba(212, 165, 116, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #1a0f0a 0%, #2d1f14 50%, #3d2817 100%)',
  },
  {
    id: 'preset-northern-lights',
    name: '极光之夜',
    tagline: '北极天空下的绚丽极光，神秘而壮丽。',
    statusText: 'AURORA MODE ONLINE',
    quote: 'CHASE THE LIGHT',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.3, safeArea: 'bottom', taskMode: 'ambient' },
    colors: {
      background: '#0a1929',
      panel: 'rgba(10, 25, 41, 0.9)',
      panelAlt: 'rgba(15, 40, 60, 0.8)',
      accent: '#00e676',
      accentAlt: '#69f0ae',
      secondary: '#00bcd4',
      highlight: '#e040fb',
      text: '#e0f7fa',
      muted: '#607d8b',
      line: 'rgba(0, 230, 118, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0a1929 0%, #0d2137 30%, #1a237e 70%, #0d47a1 100%)',
  },
  {
    id: 'preset-peach-sunset',
    name: '蜜桃晚霞',
    tagline: '温暖的桃色晚霞，为一天画上温柔的句点。',
    statusText: 'PEACH MODE ONLINE',
    quote: 'END THE DAY RIGHT',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.55, focusY: 0.65, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#fff3e0',
      panel: 'rgba(255, 243, 224, 0.85)',
      panelAlt: 'rgba(255, 224, 178, 0.75)',
      accent: '#ff8a65',
      accentAlt: '#ffab91',
      secondary: '#f4511e',
      highlight: '#ffd54f',
      text: '#bf360c',
      muted: '#ff8a65',
      line: 'rgba(255, 138, 101, .25)',
    },
    bgGradient: 'linear-gradient(180deg, #ffe0b2 0%, #fff3e0 40%, #ffccbc 100%)',
  },
  {
    id: 'preset-mint-fresh',
    name: '薄荷清新',
    tagline: '清爽的薄荷绿，给大脑带来一阵清凉。',
    statusText: 'MINT MODE ONLINE',
    quote: 'FRESH START',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.65, focusY: 0.4, safeArea: 'left', taskMode: 'focus' },
    colors: {
      background: '#e0f2f1',
      panel: 'rgba(224, 242, 241, 0.85)',
      panelAlt: 'rgba(178, 223, 219, 0.75)',
      accent: '#26a69a',
      accentAlt: '#4db6ac',
      secondary: '#00897b',
      highlight: '#64ffda',
      text: '#004d40',
      muted: '#80cbc4',
      line: 'rgba(38, 166, 154, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #b2dfdb 0%, #e0f2f1 50%, #80cbc4 100%)',
  },
  {
    id: 'preset-rose-gold',
    name: '玫瑰金',
    tagline: '优雅的玫瑰金色调，奢华而温暖。',
    statusText: 'ROSE GOLD MODE ONLINE',
    quote: 'STAY ELEGANT',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.5, focusY: 0.45, safeArea: 'left', taskMode: 'ambient' },
    colors: {
      background: '#fce4ec',
      panel: 'rgba(252, 228, 236, 0.85)',
      panelAlt: 'rgba(248, 187, 208, 0.75)',
      accent: '#c2185b',
      accentAlt: '#ec407a',
      secondary: '#ad1457',
      highlight: '#ffb300',
      text: '#880e4f',
      muted: '#f48fb1',
      line: 'rgba(194, 24, 91, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #f8bbd0 0%, #fce4ec 50%, #f48fb1 100%)',
  },
  {
    id: 'preset-deep-ocean',
    name: '深海幽蓝',
    tagline: '深邃的海洋底部，宁静而神秘。',
    statusText: 'ABYSS MODE ONLINE',
    quote: 'DIVE DEEP',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.4, focusY: 0.6, safeArea: 'right', taskMode: 'focus' },
    colors: {
      background: '#0d1b2a',
      panel: 'rgba(13, 27, 42, 0.9)',
      panelAlt: 'rgba(27, 50, 82, 0.8)',
      accent: '#00b4d8',
      accentAlt: '#0096c7',
      secondary: '#023e8a',
      highlight: '#48cae4',
      text: '#caf0f8',
      muted: '#48cae4',
      line: 'rgba(0, 180, 216, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 40%, #0d1b2a 100%)',
  },
  {
    id: 'preset-autumn-leaves',
    name: '秋叶纷飞',
    tagline: '金黄与橙红交织，秋日的温暖与诗意。',
    statusText: 'AUTUMN MODE ONLINE',
    quote: 'FALL FOR CODE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.6, focusY: 0.35, safeArea: 'right', taskMode: 'ambient' },
    colors: {
      background: '#1a0f00',
      panel: 'rgba(26, 15, 0, 0.9)',
      panelAlt: 'rgba(51, 26, 0, 0.8)',
      accent: '#ff6f00',
      accentAlt: '#ff8f00',
      secondary: '#e65100',
      highlight: '#ffc107',
      text: '#fff3e0',
      muted: '#ffb74d',
      line: 'rgba(255, 111, 0, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #1a0f00 0%, #3e2723 50%, #1a0f00 100%)',
  },
  {
    id: 'preset-candy-land',
    name: '糖果乐园',
    tagline: '五彩斑斓的糖果世界，甜蜜而梦幻。',
    statusText: 'CANDY MODE ONLINE',
    quote: 'SWEET CODE',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.5, focusY: 0.5, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#fce4ec',
      panel: 'rgba(252, 228, 236, 0.85)',
      panelAlt: 'rgba(255, 236, 179, 0.75)',
      accent: '#ff80ab',
      accentAlt: '#ea80fc',
      secondary: '#f06292',
      highlight: '#ffeb3b',
      text: '#880e4f',
      muted: '#f48fb1',
      line: 'rgba(255, 128, 171, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #f8bbd0 0%, #fff9c4 25%, #b3e5fc 50%, #f8bbd0 75%, #fff9c4 100%)',
  },
  {
    id: 'preset-starry-night',
    name: '星夜物语',
    tagline: '繁星点点的夜空下，代码如流星划过。',
    statusText: 'STARRY MODE ONLINE',
    quote: 'REACH FOR THE STARS',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.3, safeArea: 'bottom', taskMode: 'ambient' },
    colors: {
      background: '#0d0d1a',
      panel: 'rgba(13, 13, 26, 0.9)',
      panelAlt: 'rgba(26, 26, 51, 0.8)',
      accent: '#7c4dff',
      accentAlt: '#b388ff',
      secondary: '#651fff',
      highlight: '#00e5ff',
      text: '#e8eaf6',
      muted: '#9575cd',
      line: 'rgba(124, 77, 255, .3)',
    },
    bgGradient: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d1a 50%, #0a0a14 100%)',
  },
  {
    id: 'preset-lemon-tart',
    name: '柠檬挞',
    tagline: '明亮的柠檬黄，清新酸爽让人精神一振。',
    statusText: 'LEMON MODE ONLINE',
    quote: 'WHEN LIFE GIVES YOU LEMONS',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.55, focusY: 0.5, safeArea: 'left', taskMode: 'focus' },
    colors: {
      background: '#fffde7',
      panel: 'rgba(255, 253, 231, 0.85)',
      panelAlt: 'rgba(255, 249, 196, 0.75)',
      accent: '#f9a825',
      accentAlt: '#fbc02d',
      secondary: '#f57f17',
      highlight: '#ffeb3b',
      text: '#e65100',
      muted: '#ffb300',
      line: 'rgba(249, 168, 37, .25)',
    },
    bgGradient: 'linear-gradient(135deg, #fff9c4 0%, #fffde7 50%, #fff59d 100%)',
  },
  {
    id: 'preset-vampire-night',
    name: '暗夜血族',
    tagline: '深红与漆黑交织，神秘的哥特之夜。',
    statusText: 'VAMPIRE MODE ONLINE',
    quote: 'BLOOD CODE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.35, focusY: 0.5, safeArea: 'right', taskMode: 'immersive' },
    colors: {
      background: '#0a0000',
      panel: 'rgba(20, 0, 0, 0.9)',
      panelAlt: 'rgba(40, 10, 10, 0.8)',
      accent: '#d32f2f',
      accentAlt: '#f44336',
      secondary: '#b71c1c',
      highlight: '#ff5252',
      text: '#ffebee',
      muted: '#ef9a9a',
      line: 'rgba(211, 47, 47, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0a0000 0%, #1a0505 50%, #0d0000 100%)',
  },
  {
    id: 'preset-tropical-paradise',
    name: '热带天堂',
    tagline: '碧海蓝天与棕榈树，仿佛置身度假小岛。',
    statusText: 'TROPICAL MODE ONLINE',
    quote: 'CODE ON VACATION',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.6, focusY: 0.6, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#e0f7fa',
      panel: 'rgba(224, 247, 250, 0.85)',
      panelAlt: 'rgba(178, 235, 242, 0.75)',
      accent: '#00acc1',
      accentAlt: '#26c6da',
      secondary: '#00838f',
      highlight: '#ffeb3b',
      text: '#006064',
      muted: '#4dd0e1',
      line: 'rgba(0, 172, 193, .25)',
    },
    bgGradient: 'linear-gradient(180deg, #4fc3f7 0%, #81d4fa 30%, #b2ebf2 60%, #e0f7fa 100%)',
  },
  {
    id: 'preset-monochrome-classic',
    name: '经典黑白',
    tagline: '极简的黑白灰调，永恒的优雅。',
    statusText: 'MONO MODE ONLINE',
    quote: 'LESS IS MORE',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.5, safeArea: 'left', taskMode: 'focus' },
    colors: {
      background: '#121212',
      panel: 'rgba(30, 30, 30, 0.9)',
      panelAlt: 'rgba(50, 50, 50, 0.8)',
      accent: '#ffffff',
      accentAlt: '#e0e0e0',
      secondary: '#bdbdbd',
      highlight: '#9e9e9e',
      text: '#f5f5f5',
      muted: '#9e9e9e',
      line: 'rgba(255, 255, 255, .15)',
    },
    bgGradient: 'linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #1a1a1a 100%)',
  },
  {
    id: 'preset-watercolor-rainbow',
    name: '水彩彩虹',
    tagline: '柔和的水彩画风，彩虹般的心情。',
    statusText: 'WATERCOLOR MODE ONLINE',
    quote: 'PAINT YOUR CODE',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.5, focusY: 0.5, safeArea: 'top', taskMode: 'ambient' },
    colors: {
      background: '#f3e5f5',
      panel: 'rgba(252, 228, 236, 0.7)',
      panelAlt: 'rgba(227, 242, 253, 0.7)',
      accent: '#ab47bc',
      accentAlt: '#42a5f5',
      secondary: '#66bb6a',
      highlight: '#ffa726',
      text: '#4a148c',
      muted: '#9575cd',
      line: 'rgba(171, 71, 188, .2)',
    },
    bgGradient: 'linear-gradient(135deg, #f8bbd0 0%, #e1bee7 20%, #bbdefb 40%, #b2dfdb 60%, #fff9c4 80%, #ffccbc 100%)',
  },
  {
    id: 'preset-emerald-isle',
    name: '翡翠之岛',
    tagline: '翠绿的翡翠色，清新而充满生机。',
    statusText: 'EMERALD MODE ONLINE',
    quote: 'GO GREEN',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.4, focusY: 0.45, safeArea: 'right', taskMode: 'focus' },
    colors: {
      background: '#001a1a',
      panel: 'rgba(0, 26, 26, 0.9)',
      panelAlt: 'rgba(0, 40, 40, 0.8)',
      accent: '#00bfa5',
      accentAlt: '#1de9b6',
      secondary: '#00897b',
      highlight: '#69f0ae',
      text: '#e0f2f1',
      muted: '#80cbc4',
      line: 'rgba(0, 191, 165, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #001a1a 0%, #003333 50%, #001a1a 100%)',
  },
  {
    id: 'preset-cotton-candy',
    name: '棉花糖',
    tagline: '蓬松的棉花糖色，甜美的梦幻感。',
    statusText: 'CANDYFLOSS MODE ONLINE',
    quote: 'SWEET DREAMS',
    image: 'background.svg',
    appearance: 'light',
    art: { focusX: 0.5, focusY: 0.4, safeArea: 'bottom', taskMode: 'ambient' },
    colors: {
      background: '#fce4ec',
      panel: 'rgba(252, 228, 236, 0.8)',
      panelAlt: 'rgba(227, 242, 253, 0.75)',
      accent: '#f48fb1',
      accentAlt: '#64b5f6',
      secondary: '#ec407a',
      highlight: '#ba68c8',
      text: '#880e4f',
      muted: '#f8bbd0',
      line: 'rgba(244, 143, 177, .2)',
    },
    bgGradient: 'linear-gradient(180deg, #fce4ec 0%, #e3f2fd 50%, #f3e5f5 100%)',
  },
  {
    id: 'preset-royal-blue',
    name: '皇家蓝',
    tagline: '深邃高贵的皇家蓝色调，庄严肃穆。',
    statusText: 'ROYAL MODE ONLINE',
    quote: 'CODE LIKE ROYALTY',
    image: 'background.svg',
    appearance: 'dark',
    art: { focusX: 0.5, focusY: 0.4, safeArea: 'right', taskMode: 'immersive' },
    colors: {
      background: '#0a0f1f',
      panel: 'rgba(13, 25, 60, 0.9)',
      panelAlt: 'rgba(20, 40, 90, 0.8)',
      accent: '#2962ff',
      accentAlt: '#448aff',
      secondary: '#1a237e',
      highlight: '#ffd700',
      text: '#e8eaf6',
      muted: '#7986cb',
      line: 'rgba(41, 98, 255, .3)',
    },
    bgGradient: 'linear-gradient(180deg, #0a0f1f 0%, #0d1b3e 30%, #0a0f1f 100%)',
  },
];

function generateBgSvg(preset) {
  const isDark = preset.appearance === 'dark';
  const accent = preset.colors.accent;
  const accentAlt = preset.colors.accentAlt;
  const secondary = preset.colors.secondary;
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
  console.log('\n生成更多皮肤预设...\n');

  let count = 0;
  for (const preset of newPresets) {
    try {
      await fs.access(path.join(presetsDir, preset.id));
      console.log(`  - ${preset.name} (已存在)`);
    } catch {
      await generatePreset(preset);
      count++;
    }
  }

  console.log(`\n完成！新增 ${count} 款皮肤预设\n`);
}

main().catch(console.error);
