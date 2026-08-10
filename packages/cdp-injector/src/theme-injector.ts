import type { Theme, TargetType, InjectResult, RestoreResult } from '@skins/shared';
import { buildArtRuntimeScript } from './art-runtime.js';

export interface InjectOptions {
  opacity?: number;
  customImageUrl?: string;
  backgroundMode?: 'cover' | 'repeat' | 'contain';
  /** Optional UI font-family CSS stack to override the target app's font. */
  fontFamily?: string;
  /**
   * 借鉴 Codex-Dream-Skin 的 analyzeArt：注入运行时脚本，加载背景图并分析
   * 出 焦点 / 安全区 / 主题色，自动贴合并以图片强调色为 UI 配色。
   * 开启后 CSS 通过 var(--skins-art-*) 消费分析结果（无分析时回退 theme.json）。
   */
  autoFit?: boolean;
}

const STYLE_ID = 'skins-theme-style';
const HTML_CLASS = 'skins-theme-applied';
const ACTIVE_ATTR = 'data-skins-active-theme';
const TARGET_ATTR = 'data-skins-target';

export const DETECT_SCRIPT = `
(function () {
  if (document.querySelector('#root > .teams-container')) return 'workbuddy';
  if (document.querySelector('.monaco-workbench')) return 'vscode-fork';
  return 'generic';
})();
`;

export function buildThemeCss(theme: Theme, imgUrl: string, target: TargetType, options: InjectOptions = {}): string {
  const fx = theme.art?.focusX ?? 0.5;
  const fy = theme.art?.focusY ?? 0.5;
  const posX = `${(fx * 100).toFixed(2)}%`;
  const posY = `${(fy * 100).toFixed(2)}%`;

  const finalImgUrl = options.customImageUrl || imgUrl;
  const opacityFactor = options.opacity ?? 1;
  const bgMode = options.backgroundMode ?? 'cover';
  const autoFit = options.autoFit ?? false;

  // 焦点定位：autoFit 时由运行时分析覆盖，否则固定用 theme.json 焦点
  const focusVarX = autoFit ? `var(--skins-art-focus-x, ${posX})` : posX;
  const focusVarY = autoFit ? `var(--skins-art-focus-y, ${posY})` : posY;

  let bgSize = 'cover';
  let bgRepeat = 'no-repeat';
  let bgPosition = `${focusVarX} ${focusVarY}`;

  if (bgMode === 'repeat') {
    bgSize = 'auto';
    bgRepeat = 'repeat';
    bgPosition = 'top left';
  } else if (bgMode === 'contain') {
    bgSize = 'contain';
    bgRepeat = 'no-repeat';
    bgPosition = 'center center';
  }

  function adjustAlpha(rgbaStr: string, factor: number): string {
    const m = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return rgbaStr;
    const r = m[1], g = m[2], b = m[3], a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    const newAlpha = Math.max(0, Math.min(1, a * factor));
    return `rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(3)})`;
  }

  const colors = theme.colors || {};
  const accent = colors.accent || '#007acc';
  // autoFit 时强调色跟随图片（自动配色），否则用 theme.json 写死值
  const accentVar = autoFit ? `var(--skins-art-accent, ${accent})` : accent;
  const accentAlt = colors.accentAlt || accent;
  const secondary = colors.secondary || '#456';
  const highlight = colors.highlight || accent;
  const panelBg = adjustAlpha(colors.panel || 'rgba(255,255,255,0.55)', opacityFactor);
  const panelBgDark = adjustAlpha(colors.panelAlt || 'rgba(20,20,20,0.55)', opacityFactor);
  const textLight = colors.text || '#333';
  const textDark = colors.muted || '#aaa';
  const lineVar = colors.line || 'rgba(255,255,255,0.18)';

  const common = `
/* 覆盖 VS Code 兼容层的关键颜色变量（复用 codex-dream-skin 的 text/muted/line 映射） */
html.${HTML_CLASS} {
  /* 按钮 / 链接 / 强调 */
  --vscode-button-background: ${accentVar} !important;
  --vscode-button-hoverBackground: ${accentAlt} !important;
  --vscode-button-foreground: ${textLight} !important;
  --vscode-button-secondaryBackground: ${secondary} !important;
  --vscode-button-secondaryForeground: ${textLight} !important;
  --vscode-textLink-foreground: ${accentVar} !important;
  --vscode-textLink-activeForeground: ${accentAlt} !important;
  --vscode-focusBorder: ${accentVar} !important;
  --vscode-list-activeSelectionBackground: ${secondary} !important;
  --vscode-list-activeSelectionForeground: ${textLight} !important;
  --vscode-list-hoverBackground: ${highlight}33 !important;
  --vscode-list-focusBackground: ${secondary}55 !important;

  /* 文字色跟随主题（text → 前景，muted → 次要文字） */
  --vscode-foreground: ${textLight} !important;
  --vscode-editor-foreground: ${textLight} !important;
  --vscode-sideBar-foreground: ${textLight} !important;
  --vscode-titleBar-activeForeground: ${textLight} !important;
  --vscode-statusBar-foreground: ${textLight} !important;
  --vscode-icon-foreground: ${textLight} !important;
  --vscode-descriptionForeground: ${textDark} !important;
  --vscode-editorLineNumber-foreground: ${textDark} !important;
  --vscode-tab-inactiveForeground: ${textDark} !important;

  /* 边框 / 分割线跟随主题（line） */
  --vscode-panel-border: ${lineVar} !important;
  --vscode-input-border: ${lineVar} !important;
  --vscode-dropdown-border: ${lineVar} !important;
  --vscode-tab-border: ${lineVar} !important;
  --vscode-editor-lineHighlightBorder: ${lineVar} !important;
  --vscode-editorIndentGuide-background: ${lineVar} !important;
}
`;

  let body = '';
  if (target === 'workbuddy') {
    body = `
/* ===== skins theme: ${theme.id} (workbuddy) ===== */
html.${HTML_CLASS} body { background: transparent !important; }

html.${HTML_CLASS} #root > .teams-container {
  background-image: url('${finalImgUrl}') !important;
  background-size: ${bgSize} !important;
  background-position: ${bgPosition} !important;
  background-attachment: fixed !important;
  background-repeat: ${bgRepeat} !important;
  background-color: transparent !important;
  position: relative;
}

/* WorkBuddy 真实的内容面板类名是 main-content--chat / _gridViewItem_* 等哈希类名，
   旧规则只认 conversation-sidebar / teams-content-wrapper / grid_，会漏掉它们，
   导致这些不透明面板盖住背景图。这里用前缀匹配把它们全部透掉，让背景图露出来。 */
html.${HTML_CLASS} #root > .teams-container [class*="grid_"],
html.${HTML_CLASS} #root > .teams-container [class*="gridView_"],
html.${HTML_CLASS} #root > .teams-container [class*="gridViewItem_"],
html.${HTML_CLASS} #root > .teams-container [class*="main-content"],
html.${HTML_CLASS} #root > .teams-container [class*="cb-markdown"] {
  background-color: transparent !important;
  background: transparent !important;
}

html.${HTML_CLASS} #root > .teams-container::before {
  content: "";
  position: absolute;
  inset: 0;
  /* 方向性深色渐变蒙版：给聊天区文字压暗、提升对比，背景图仍清晰可见（codex 式）。
     注意：这里只压暗、不加 backdrop-filter，避免把背景图整体糊掉。 */
  background: linear-gradient(115deg, rgba(8,12,20,0.52) 0%, rgba(8,12,20,0.30) 55%, rgba(8,12,20,0.46) 100%);
  z-index: 0;
  pointer-events: none;
}

html.${HTML_CLASS} #root > .teams-container > * {
  position: relative;
  z-index: 1;
}

/* ===== 磨砂玻璃面板：侧边栏 / 顶栏 / 输入框（深色玻璃，背景从背后透出 = 铺平） =====
   模糊只作用在面板“背后的背景”上（磨砂感、透出背景），文字本身依旧清晰。 */
html.${HTML_CLASS} #root > .teams-container .conversation-list,
html.${HTML_CLASS} #root > .teams-container .workbuddy-topbar,
html.${HTML_CLASS} #root > .teams-container [class*="mainArea"] {
  background-color: rgba(14, 18, 28, 0.55) !important;
  background: rgba(14, 18, 28, 0.55) !important;
  backdrop-filter: blur(18px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(150%) !important;
}
/* 旧类名兜底 */
html.${HTML_CLASS} #root > .teams-container .conversation-sidebar,
html.${HTML_CLASS} #root > .teams-container .teams-content-wrapper {
  background-color: rgba(14, 18, 28, 0.55) !important;
  background: rgba(14, 18, 28, 0.55) !important;
  backdrop-filter: blur(18px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(150%) !important;
}
/* 玻璃面板细分隔线，用 accent 协调（自动取色跟随壁纸） */
html.${HTML_CLASS} #root > .teams-container .conversation-list {
  border-right: 1px solid color-mix(in srgb, ${accentVar} 35%, transparent) !important;
}
html.${HTML_CLASS} #root > .teams-container .workbuddy-topbar {
  border-bottom: 1px solid color-mix(in srgb, ${accentVar} 35%, transparent) !important;
}
html.${HTML_CLASS} #root > .teams-container [class*="mainArea"] {
  border-top: 1px solid color-mix(in srgb, ${accentVar} 35%, transparent) !important;
}

html.${HTML_CLASS} #root > .teams-container .conversation-sidebar,
html.${HTML_CLASS} #root > .teams-container .teams-content-wrapper {
  background: transparent !important;
}

/* 文字 / 边框：深色玻璃下用浅色文字保证可读；accent 跟随壁纸自动取色 */
html.${HTML_CLASS} #root > .teams-container {
  --vscode-foreground: #eef1f6 !important;
  --vscode-editor-foreground: #eef1f6 !important;
  --vscode-sideBar-foreground: #eef1f6 !important;
  --vscode-titleBar-activeForeground: #eef1f6 !important;
  --vscode-statusBar-foreground: #eef1f6 !important;
  --vscode-icon-foreground: #eef1f6 !important;
  --vscode-descriptionForeground: #9aa4b2 !important;
  --vscode-editorLineNumber-foreground: #9aa4b2 !important;
  --vscode-textLink-foreground: ${accentVar} !important;
  --vscode-focusBorder: ${accentVar} !important;
  --vscode-button-foreground: #eef1f6 !important;
  --vscode-button-secondaryForeground: #eef1f6 !important;
}
html.${HTML_CLASS} #root > .teams-container,
html.${HTML_CLASS} #root > .teams-container p,
html.${HTML_CLASS} #root > .teams-container span:not([class*="codicon"]),
html.${HTML_CLASS} #root > .teams-container div:not([class*="codicon"]),
html.${HTML_CLASS} #root > .teams-container label,
html.${HTML_CLASS} #root > .teams-container li,
html.${HTML_CLASS} #root > .teams-container h1,
html.${HTML_CLASS} #root > .teams-container h2,
html.${HTML_CLASS} #root > .teams-container h3,
html.${HTML_CLASS} #root > .teams-container h4 {
  color: #eef1f6 !important;
}
html.${HTML_CLASS} #root > .teams-container input,
html.${HTML_CLASS} #root > .teams-container textarea,
html.${HTML_CLASS} #root > .teams-container select,
html.${HTML_CLASS} #root > .teams-container button {
  color: #eef1f6 !important;
  border-color: color-mix(in srgb, ${accentVar} 45%, transparent) !important;
}
html.${HTML_CLASS} #root > .teams-container a {
  color: ${accentVar} !important;
}
`;
  } else if (target === 'vscode-fork') {
    body = `
/* ===== skins theme: ${theme.id} (vscode-fork) ===== */
html.${HTML_CLASS} body { background: transparent !important; }

html.${HTML_CLASS} .monaco-workbench .part.background {
  background-image: url('${finalImgUrl}') !important;
  background-size: ${bgSize} !important;
  background-position: ${bgPosition} !important;
  background-attachment: fixed !important;
  background-repeat: ${bgRepeat} !important;
}

html.${HTML_CLASS} .monaco-workbench::before {
  content: "";
  position: absolute;
  inset: 0;
  background: ${panelBg};
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
  pointer-events: none;
}

html.${HTML_CLASS} .monaco-workbench > .part {
  position: relative;
  z-index: 1;
  background-color: ${panelBg} !important;
}

html.${HTML_CLASS} .monaco-workbench .part.editor,
html.${HTML_CLASS} .monaco-workbench .part.editor .content,
html.${HTML_CLASS} .monaco-workbench .part.editor .monaco-editor-background {
  background-color: ${panelBg} !important;
}

html.${HTML_CLASS} .monaco-workbench .part.activitybar,
html.${HTML_CLASS} .monaco-workbench .part.sidebar,
html.${HTML_CLASS} .monaco-workbench .part.auxiliarybar,
html.${HTML_CLASS} .monaco-workbench .part.panel,
html.${HTML_CLASS} .monaco-workbench .part.statusbar {
  background-color: ${panelBg} !important;
}

html.${HTML_CLASS} body.vscode-dark .monaco-workbench::before,
html.${HTML_CLASS} body.dark .monaco-workbench::before {
  background: ${panelBgDark};
}
html.${HTML_CLASS} body.vscode-dark .monaco-workbench > .part,
html.${HTML_CLASS} body.dark .monaco-workbench > .part {
  background-color: ${panelBgDark} !important;
}

/* ===== Cursor Agents (Glass UI) 特殊适配 ===== */
html.${HTML_CLASS} div[class*="glass-10l6tqk"][class*="glass-13vifvy"] {
  background-image: url('${finalImgUrl}') !important;
  background-size: ${bgSize} !important;
  background-position: ${bgPosition} !important;
  background-attachment: fixed !important;
  background-repeat: ${bgRepeat} !important;
  background-color: transparent !important;
}

html.${HTML_CLASS} .glass-sidebar-docked {
  background-color: ${panelBg} !important;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
}

html.${HTML_CLASS} div[class*="glass-5yr21d"] {
  background-color: ${panelBg} !important;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
}

html.${HTML_CLASS} body.cursor-dark .glass-sidebar-docked,
html.${HTML_CLASS} body.vs-dark .glass-sidebar-docked,
html.${HTML_CLASS} body.dark .glass-sidebar-docked {
  background-color: ${panelBgDark} !important;
}
html.${HTML_CLASS} body.cursor-dark div[class*="glass-5yr21d"],
html.${HTML_CLASS} body.vs-dark div[class*="glass-5yr21d"],
html.${HTML_CLASS} body.dark div[class*="glass-5yr21d"] {
  background-color: ${panelBgDark} !important;
}
`;
  } else {
    body = `
/* ===== skins theme: ${theme.id} (generic) ===== */
html.${HTML_CLASS} body {
  background-image: url('${finalImgUrl}') !important;
  background-size: ${bgSize} !important;
  background-position: ${bgPosition} !important;
  background-attachment: fixed !important;
  background-repeat: ${bgRepeat} !important;
}
`;
  }

  let fontCss = '';
  if (options.fontFamily) {
    const font = options.fontFamily;
    // Override UI font across the target app. Icon fonts (codicon) are
    // explicitly excluded/reset so editor & workbench glyphs keep rendering.
    fontCss = `
/* ===== skins font override: ${theme.id} ===== */
html.${HTML_CLASS} body,
html.${HTML_CLASS} #root > .teams-container,
html.${HTML_CLASS} #root > .teams-container *:not([class*="codicon"]),
html.${HTML_CLASS} .monaco-workbench .part,
html.${HTML_CLASS} .monaco-workbench .part *:not([class*="codicon"]),
html.${HTML_CLASS} .monaco-workbench .monaco-editor .view-lines {
  font-family: ${font} !important;
}
html.${HTML_CLASS} .codicon,
html.${HTML_CLASS} [class*="codicon"] {
  font-family: 'codicon' !important;
}
`;
  }

  return (body + '\n' + common + '\n' + fontCss).trim();
}

export function buildInjectScript(
  css: string,
  themeId: string,
  target: TargetType,
  autoFit = false,
  artImgUrl?: string,
): string {
  const cssJson = JSON.stringify(css);
  const idJson = JSON.stringify(themeId);
  const targetJson = JSON.stringify(target);
  const artScript = autoFit && artImgUrl
    ? buildArtRuntimeScript({ imageUrl: artImgUrl })
    : '';

  return `
(function () {
  const css = ${cssJson};
  const themeId = ${idJson};
  const target = ${targetJson};
  const STYLE_ID = '${STYLE_ID}';
  const HTML_CLASS = '${HTML_CLASS}';

  let detected = 'generic';
  if (document.querySelector('#root > .teams-container')) detected = 'workbuddy';
  else if (document.querySelector('.monaco-workbench')) detected = 'vscode-fork';

  const old = document.getElementById(STYLE_ID);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  document.documentElement.classList.add(HTML_CLASS);
  document.documentElement.setAttribute('${TARGET_ATTR}', target);
  document.documentElement.setAttribute('${ACTIVE_ATTR}', themeId);

  if (!window.__skinsThemeObserver__) {
    const obs = new MutationObserver(() => {});
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.__skinsThemeObserver__ = obs;
  }

  ${artScript}

  // 自修复：若皮肤样式被页面(未整页重载)移除，自动补回，避免“掉皮肤”。
  (function selfHeal(){
    if (window.__skinsSelfHeal__) return;
    window.__skinsSelfHeal__ = true;
    const cssStr = css, themeIdStr = themeId, targetStr = target;
    function reinjectIfMissing(){
      const s = document.getElementById(STYLE_ID);
      if (s && s.textContent && s.textContent.length > 100) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = cssStr;
      (document.head || document.documentElement).appendChild(style);
      document.documentElement.classList.add(HTML_CLASS);
      document.documentElement.setAttribute('${TARGET_ATTR}', targetStr);
      document.documentElement.setAttribute('${ACTIVE_ATTR}', themeIdStr);
    }
    setInterval(reinjectIfMissing, 2000);
    const headEl = document.head || document.documentElement;
    new MutationObserver(reinjectIfMissing).observe(headEl, { childList: true });
  })();

  let bgEl = document.body;
  if (target === 'workbuddy') bgEl = document.querySelector('#root > .teams-container') || document.body;
  else if (target === 'vscode-fork') bgEl = document.querySelector('.monaco-workbench .part.background') || document.body;

  return {
    themeId,
    target,
    detected,
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
    styleInjected: !!document.getElementById(STYLE_ID),
    bgEl: bgEl.tagName + (bgEl.id ? '#' + bgEl.id : '') + (bgEl.className ? '.' + String(bgEl.className).split(' ')[0] : ''),
    bgImage: getComputedStyle(bgEl).backgroundImage.slice(0, 100),
    bgColor: getComputedStyle(bgEl).backgroundColor,
  };
})();
`;
}

export const RESTORE_SCRIPT = `
(function () {
  const STYLE_ID = '${STYLE_ID}';
  const HTML_CLASS = '${HTML_CLASS}';
  const ACTIVE_ATTR = '${ACTIVE_ATTR}';
  const TARGET_ATTR = '${TARGET_ATTR}';

  const before = {
    hadStyle: !!document.getElementById(STYLE_ID),
    hadHtmlClass: document.documentElement.classList.contains(HTML_CLASS),
    hadActiveAttr: document.documentElement.hasAttribute(ACTIVE_ATTR),
    hadTargetAttr: document.documentElement.hasAttribute(TARGET_ATTR),
    hadObserver: !!window.__skinsThemeObserver__,
    bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 80),
  };

  const old = document.getElementById(STYLE_ID);
  if (old) old.remove();

  document.documentElement.classList.remove(HTML_CLASS);
  document.documentElement.removeAttribute(ACTIVE_ATTR);
  document.documentElement.removeAttribute(TARGET_ATTR);

  if (window.__skinsThemeObserver__) {
    try { window.__skinsThemeObserver__.disconnect(); } catch (_) {}
    delete window.__skinsThemeObserver__;
  }

  const after = {
    hadStyle: !!document.getElementById(STYLE_ID),
    hadHtmlClass: document.documentElement.classList.contains(HTML_CLASS),
    bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 80),
  };

  return {
    wasInjected: before.hadStyle || before.hadHtmlClass || before.hadActiveAttr,
    before,
    after,
  };
})();
`;

export const CHECK_SCRIPT = `
(function () {
  const s = document.getElementById('skins-theme-style');
  return !!(s && s.textContent && s.textContent.length > 100);
})();
`;
