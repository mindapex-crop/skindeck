import type { Theme, TargetType, InjectResult, RestoreResult } from '@skins/shared';

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

export function buildThemeCss(theme: Theme, imgUrl: string, target: TargetType): string {
  const fx = theme.art?.focusX ?? 0.5;
  const fy = theme.art?.focusY ?? 0.5;
  const posX = `${(fx * 100).toFixed(2)}%`;
  const posY = `${(fy * 100).toFixed(2)}%`;

  const colors = theme.colors || {};
  const accent = colors.accent || '#007acc';
  const accentAlt = colors.accentAlt || accent;
  const secondary = colors.secondary || '#456';
  const highlight = colors.highlight || accent;
  const panelBg = colors.panel || 'rgba(255,255,255,0.55)';
  const panelBgDark = colors.panelAlt || 'rgba(20,20,20,0.55)';
  const textLight = colors.text || '#333';
  const textDark = colors.muted || '#aaa';

  const common = `
/* 覆盖 VS Code 兼容层的关键颜色变量 */
html.${HTML_CLASS} {
  --vscode-button-background: ${accent} !important;
  --vscode-button-hoverBackground: ${accentAlt} !important;
  --vscode-textLink-foreground: ${accent} !important;
  --vscode-focusBorder: ${accent} !important;
  --vscode-list-activeSelectionBackground: ${secondary} !important;
  --vscode-list-hoverBackground: ${highlight}33 !important;
}

/* 顶部主题标识横幅 */
html.${HTML_CLASS} body::before {
  content: "${theme.name} · skins";
  position: fixed;
  top: 6px;
  right: 12px;
  z-index: 2147483646;
  font: 11px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${textLight};
  background: ${accent}cc;
  padding: 4px 8px;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0.85;
  letter-spacing: 0.02em;
}
html.${HTML_CLASS} body.cb-dark::before,
html.${HTML_CLASS} body.vscode-dark::before,
html.${HTML_CLASS} body.dark::before {
  color: ${textDark};
  background: ${accent}99;
}
`;

  let body = '';
  if (target === 'workbuddy') {
    body = `
/* ===== skins theme: ${theme.id} (workbuddy) ===== */
html.${HTML_CLASS} body { background: transparent !important; }

html.${HTML_CLASS} #root > .teams-container {
  background-image: url('${imgUrl}') !important;
  background-size: cover !important;
  background-position: ${posX} ${posY} !important;
  background-attachment: fixed !important;
  background-repeat: no-repeat !important;
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
`;
  } else if (target === 'vscode-fork') {
    body = `
/* ===== skins theme: ${theme.id} (vscode-fork) ===== */
html.${HTML_CLASS} body { background: transparent !important; }

html.${HTML_CLASS} .monaco-workbench .part.background {
  background-image: url('${imgUrl}') !important;
  background-size: cover !important;
  background-position: ${posX} ${posY} !important;
  background-attachment: fixed !important;
  background-repeat: no-repeat !important;
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
`;
  } else {
    body = `
/* ===== skins theme: ${theme.id} (generic) ===== */
html.${HTML_CLASS} body {
  background-image: url('${imgUrl}') !important;
  background-size: cover !important;
  background-position: ${posX} ${posY} !important;
  background-attachment: fixed !important;
  background-repeat: no-repeat !important;
}
`;
  }

  return (body + '\n' + common).trim();
}

export function buildInjectScript(css: string, themeId: string, target: TargetType): string {
  const cssJson = JSON.stringify(css);
  const idJson = JSON.stringify(themeId);
  const targetJson = JSON.stringify(target);

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
  } as ${JSON.stringify({} as InjectResult)};
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
  } as ${JSON.stringify({} as RestoreResult)};
})();
`;
