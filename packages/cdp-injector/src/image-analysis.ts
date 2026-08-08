/**
 * image-analysis.ts
 * ---------------------------------------------------------------------------
 * 借鉴 github.com/Fei-Away/Codex-Dream-Skin 的 analyzeArt()：把背景图缩到
 * 96px 小画布、逐像素分析，自动算出：
 *   - 主题强调色 accentRgb（色相分 24 bin 取权重最大者）
 *   - 焦点 focusX/focusY（显著性加权：亮度差 + 饱和度 + 边缘）
 *   - 安全区 safeArea（左右两侧"信息量"低的一侧留给原生 UI）
 *   - 任务模式 taskMode（按宽高比，这里给默认 ambient）
 *
 * 这是"换图即自动贴合 + 自动配色"的核心。analyzePixels 是纯函数（不依赖
 * DOM），既可在浏览器 canvas 里调用，也方便 Node 单测。
 * ---------------------------------------------------------------------------
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type SafeArea = 'left' | 'right' | 'top' | 'bottom';
export type TaskMode = 'ambient' | 'focus' | 'immersive';

export interface ArtAnalysis {
  accentRgb: RGB;
  focusX: number; // 0..1
  focusY: number; // 0..1
  safeArea: SafeArea;
  taskMode: TaskMode;
  avgLuminance: number; // 0..255
}

/**
 * 纯算法：从已取样的像素数组（RGBA，长度 = width*height*4）分析出贴合参数。
 * @param data    Uint8ClampedArray 或 number[]，RGBA 排布
 * @param width   缩略图宽
 * @param height  缩略图高
 */
export function analyzePixels(
  data: Uint8ClampedArray | number[],
  width: number,
  height: number,
): ArtAnalysis {
  const len = data.length;
  if (width <= 0 || height <= 0 || len < 4) {
    return {
      accentRgb: { r: 120, g: 160, b: 200 },
      focusX: 0.72,
      focusY: 0.5,
      safeArea: 'left',
      taskMode: 'ambient',
      avgLuminance: 128,
    };
  }

  // 24 个色相桶，累计权重与 RGB 和，用于提取主题强调色
  const hueBins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));

  // 第一遍：亮度均值
  let lumSum = 0;
  let lumCount = 0;
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumCount++;
  }
  const lumMean = lumCount > 0 ? lumSum / lumCount : 128;

  // 第二遍：信息量(安全区) + 显著性(焦点) + 色相(主题色)
  let leftInfo = 0, rightInfo = 0, leftCount = 0, rightCount = 0;
  let fx = 0, fy = 0, fW = 0;

  for (let i = 0; i < len; i += 4) {
    const idx = i / 4;
    const px = idx % width;
    const py = Math.floor(idx / width);
    const x = px / width;
    const y = py / height;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;

    // 信息量：亮度差 + 饱和度（粗略代理"内容密度"）
    const info = Math.abs(lum - lumMean) * 0.58 + sat * 0.42;
    if (x < 0.5) { leftInfo += info; leftCount++; }
    else { rightInfo += info; rightCount++; }

    // 显著性权重 -> 焦点加权平均
    const sal = 0.01 + Math.abs(lum - lumMean) * 0.48 + sat * 0.34 + (sat > 0.5 ? 0.28 : 0);
    fx += x * sal;
    fy += y * sal;
    fW += sal;

    // 高饱和像素才计入色相桶
    if (sat > 0.25) {
      const h = rgbHue(r, g, b);
      const bin = Math.min(23, Math.floor(h / 15));
      const o = hueBins[bin];
      o.w += 1 + sat;
      o.r += r;
      o.g += g;
      o.b += b;
    }
  }

  // 焦点
  const focusX = fW > 0 ? fx / fW : 0.5;
  const focusY = fW > 0 ? fy / fW : 0.5;

  // 安全区：信息量低的一侧留给 UI
  const li = leftInfo / Math.max(1, leftCount);
  const ri = rightInfo / Math.max(1, rightCount);
  let safeArea: SafeArea = 'left';
  if (ri < li * 0.86) safeArea = 'right';
  else if (li < ri * 0.86) safeArea = 'left';
  else safeArea = 'left'; // 默认左侧留 UI（与提示词右侧构图约定一致）

  // 安全侧强制把焦点推到主体侧，保证窄窗优先保住主体
  const finalFocusX = safeArea === 'left' ? Math.max(focusX, 0.64) : Math.min(focusX, 0.36);

  // 主题色：权重最大的色相桶
  let best = 0;
  let bestW = -1;
  for (let k = 0; k < 24; k++) {
    if (hueBins[k].w > bestW) { bestW = hueBins[k].w; best = k; }
  }
  const bin = hueBins[best];
  const accentRgb: RGB = bin.w > 0
    ? { r: Math.round(bin.r / bin.w), g: Math.round(bin.g / bin.w), b: Math.round(bin.b / bin.w) }
    : { r: 120, g: 160, b: 200 };

  return {
    accentRgb,
    focusX: finalFocusX,
    focusY,
    safeArea,
    taskMode: 'ambient',
    avgLuminance: lumMean,
  };
}

function rgbHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

/* ------------------------------------------------------------------ *
 * 自适应调色板（借鉴 makeAdaptivePalette）：从图片主题色推导整套和谐配色，
 * 让"换一张图，UI 配色自动跟着图走"。返回本项目 Theme.colors 可直接消费的值。
 * ------------------------------------------------------------------ */

export interface AdaptivePalette {
  background: string;
  panel: string;
  panelAlt: string;
  accent: string;
  accentAlt: string;
  secondary: string;
  text: string;
  muted: string;
  line: string;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const toHex = (v: number) => clamp255(v).toString(16).padStart(2, '0');

export function makeAdaptivePalette(
  accent: RGB,
  appearance: 'light' | 'dark' = 'dark',
): AdaptivePalette {
  const { r, g, b } = accent;
  const accentHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  if (appearance === 'dark') {
    return {
      background: `rgb(${clamp255(r * 0.06)}, ${clamp255(g * 0.06)}, ${clamp255(b * 0.06)})`,
      panel: `rgba(${clamp255(r * 0.12 + 10)}, ${clamp255(g * 0.12 + 10)}, ${clamp255(b * 0.12 + 14)}, 0.72)`,
      panelAlt: 'rgba(12,12,16,0.72)',
      accent: accentHex,
      accentAlt: `#${toHex(Math.min(255, r + 30))}${toHex(Math.min(255, g + 30))}${toHex(Math.min(255, b + 30))}`,
      secondary: `#${toHex(r * 0.6)}${toHex(g * 0.6)}${toHex(b * 0.6)}`,
      text: `rgb(${clamp255(r + 170)}, ${clamp255(g + 170)}, ${clamp255(b + 170)})`,
      muted: `rgba(${clamp255(r * 0.7 + 90)}, ${clamp255(g * 0.7 + 90)}, ${clamp255(b * 0.7 + 100)}, 0.9)`,
      line: `rgba(${r}, ${g}, ${b}, 0.28)`,
    };
  }

  return {
    background: `rgb(${clamp255(r * 0.92 + 235)}, ${clamp255(g * 0.92 + 235)}, ${clamp255(b * 0.92 + 235)})`,
    panel: 'rgba(255,255,255,0.62)',
    panelAlt: 'rgba(20,20,20,0.55)',
    accent: accentHex,
    accentAlt: `#${toHex(Math.max(0, r - 30))}${toHex(Math.max(0, g - 30))}${toHex(Math.max(0, b - 30))}`,
    secondary: `#${toHex(r * 0.6 + 100)}${toHex(g * 0.6 + 100)}${toHex(b * 0.6 + 100)}`,
    text: `rgb(${clamp255(r - 120)}, ${clamp255(g - 120)}, ${clamp255(b - 120)})`,
    muted: `rgba(${clamp255(r * 0.5 + 90)}, ${clamp255(g * 0.5 + 90)}, ${clamp255(b * 0.5 + 100)}, 0.9)`,
    line: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
}
