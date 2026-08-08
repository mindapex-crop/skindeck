// 把桌面 codex-dream-skin-pack 的 30 个主题转换成我们的 preset 格式并安装到 presets/。
// 用法: node scripts/install-pack-skins.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACK_DIR = '/Users/yason/Desktop/codex-dream-skin-pack/themes';
const OUT_DIR = path.join(ROOT, 'presets');
const NAMES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/pack-skin-names.i18n.json'), 'utf8'));

function regionCodeOf(packRegion = '') {
  if (packRegion.includes('中国')) return 'cn';
  if (packRegion.includes('日韩')) return 'jp-kr';
  if (packRegion.includes('欧美')) return 'eu';
  if (packRegion.includes('东南亚')) return 'sea';
  if (packRegion.includes('中东')) return 'me';
  return 'cn';
}

function deriveColors(c = {}) {
  const accent = c.accent || '#007acc';
  const panel = c.panel || 'rgba(255,255,255,0.55)';
  return {
    background: c.background || '#1a1a18',
    panel,
    panelAlt: c.panelAlt || 'rgba(20,20,20,0.55)',
    accent,
    accentAlt: c.accentAlt || accent,
    secondary: c.secondary || accent,
    highlight: c.highlight || accent,
    text: c.text || '#e0e0f0',
    muted: c.muted || '#8080a0',
    line: c.line || 'rgba(100,100,200,.3)',
  };
}

const dirs = fs.readdirSync(PACK_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

let ok = 0;
for (const slug of dirs) {
  const src = path.join(PACK_DIR, slug);
  const raw = JSON.parse(fs.readFileSync(path.join(src, 'theme.json'), 'utf8'));
  const imgSrc = path.join(src, 'background.png');
  if (!fs.existsSync(imgSrc)) {
    console.warn(`跳过 ${slug}: 缺少 background.png`);
    continue;
  }

  const appearance = raw.appearance === 'light' ? 'light' : 'dark';
  const region = regionCodeOf(raw.region);
  const tr = NAMES[slug] || {};

  const names = {
    'zh-CN': raw.name,
    'zh-TW': tr['zh-TW'] || raw.name,
    'en-US': raw.nameEn,
    'ja-JP': tr['ja-JP'] || raw.nameEn,
    'ko-KR': tr['ko-KR'] || raw.nameEn,
    'es-ES': tr['es-ES'] || raw.nameEn,
    'pt-BR': tr['pt-BR'] || raw.nameEn,
    'ar-SA': tr['ar-SA'] || raw.nameEn,
    'fr-FR': tr['fr-FR'] || raw.nameEn,
    'de-DE': tr['de-DE'] || raw.nameEn,
  };

  const theme = {
    schemaVersion: 1,
    id: `preset-${slug}`,
    name: raw.name,
    nameEn: raw.nameEn,
    names,
    image: 'background.png',
    appearance,
    region,
    art: {
      focusX: raw.art?.focusX ?? 0.72,
      focusY: raw.art?.focusY ?? 0.45,
      safeArea: raw.art?.safeArea ?? 'left',
      taskMode: raw.art?.taskMode ?? 'ambient',
      autoFit: false,
    },
    colors: deriveColors(raw.colors),
  };

  const out = path.join(OUT_DIR, `preset-${slug}`);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(imgSrc, path.join(out, 'background.png'));
  fs.writeFileSync(path.join(out, 'theme.json'), JSON.stringify(theme, null, 2) + '\n', 'utf8');
  ok++;
  console.log(`✓ preset-${slug}  [${region}/${appearance}] ${raw.name} / ${raw.nameEn}`);
}

console.log(`\n完成：安装 ${ok} 个主题到 ${OUT_DIR}`);
