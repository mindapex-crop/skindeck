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
  const bgMode = options.backgroundMode ?? 'repeat';
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

html.${HTML_CLASS} #root > .teams-container [class*="grid_"],
html.${HTML_CLASS} #root > .teams-container [class*="gridView_"],
html.${HTML_CLASS} #root > .teams-container [class*="gridViewItem_"] {
  background-color: transparent !important;
  background: transparent !important;
}

html.${HTML_CLASS} #root > .teams-container::before {
  content: "";
  position: absolute;
  inset: 0;
  background: ${panelBg};
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
  pointer-events: none;
}

html.${HTML_CLASS} #root > .teams-container > * {
  position: relative;
  z-index: 1;
}

html.${HTML_CLASS} body.cb-dark #root > .teams-container::before,
html.${HTML_CLASS} body.vscode-dark #root > .teams-container::before,
html.${HTML_CLASS} body.dark #root > .teams-container::before {
  background: ${panelBgDark};
}

html.${HTML_CLASS} #root > .teams-container .conversation-sidebar,
html.${HTML_CLASS} #root > .teams-container .teams-content-wrapper {
  background: transparent !important;
}

/* 文字 / 边框跟随主题（保守：仅作用于容器文本与表单，不动布局） */
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
  color: ${textLight} !important;
}
html.${HTML_CLASS} #root > .teams-container input,
html.${HTML_CLASS} #root > .teams-container textarea,
html.${HTML_CLASS} #root > .teams-container select,
html.${HTML_CLASS} #root > .teams-container button {
  color: ${textLight} !important;
  border-color: ${lineVar} !important;
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
