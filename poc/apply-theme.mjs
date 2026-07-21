// apply-theme.mjs - 把预设主题注入到目标 Electron renderer
//
// 用法: node apply-theme.mjs <port> <theme-dir>
// 例:   node apply-theme.mjs 9342 /Users/yason/local/skins/presets/preset-gothic-void-crusade
//
// 行为:
//   1. 读 <theme-dir>/theme.json 拿契约 (appearance/art.focusX/focusY/safeArea/colors)
//   2. 用 file:// URL 引用 <theme-dir>/<image> (Electron 同源 file:// renderer 可加载)
//   3. 通过 CDP Runtime.evaluate 注入:
//      - 在 <html> 上加 skins-theme-applied class
//      - 注入 <style id="skins-theme"> 到 <head>
//      - DOM 自动探测: .teams-container (WorkBuddy) / .monaco-workbench (Cursor/VS Code) / #root (其他)
//      - CSS: 目标容器背景图 + 半透明遮罩 + 配色变量覆盖
//      - MutationObserver 监听 body class 变化 (light/dark 切换)
//   4. 幂等: 重复跑会先移除旧的 <style id="skins-theme"> 再注入新的

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const port = Number(process.argv[2]);
const themeDir = process.argv[3];

if (!port || !themeDir) {
  console.error('用法: node apply-theme.mjs <port> <theme-dir>');
  console.error('例:   node apply-theme.mjs 9342 /Users/yason/local/skins/presets/preset-gothic-void-crusade');
  process.exit(1);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve(JSON.parse(body)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function loadTheme(dir) {
  const themePath = path.join(dir, 'theme.json');
  const raw = await fs.readFile(themePath, 'utf8');
  const theme = JSON.parse(raw);
  // 校验最小契约
  const required = ['id', 'name', 'image'];
  for (const k of required) {
    if (!theme[k]) throw new Error(`theme.json 缺少字段: ${k}`);
  }
  // 图片必须在本目录内 (防止路径穿越)
  const imgAbs = path.resolve(dir, theme.image);
  const dirAbs = path.resolve(dir);
  if (!imgAbs.startsWith(dirAbs + path.sep)) {
    throw new Error(`image 字段必须指向 theme-dir 内的文件, 实际: ${theme.image}`);
  }
  // 检查图片存在
  try {
    await fs.access(imgAbs);
  } catch {
    throw new Error(`图片不存在: ${imgAbs}`);
  }
  return { theme, imgAbs };
}

function buildCss(theme, imgUrl, target) {
  const fx = theme.art?.focusX ?? 0.5;
  const fy = theme.art?.focusY ?? 0.5;
  // background-position 用百分比: 0% = 左/上, 100% = 右/下
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

  // 公共: 顶部横幅 + VS Code 兼容变量覆盖 (WorkBuddy/Cursor 都吃 vscode-* 变量)
  const common = `
/* 覆盖 VS Code 兼容层的关键颜色变量, 让原生控件拾取主题配色 */
html.skins-theme-applied {
  --vscode-button-background: ${accent} !important;
  --vscode-button-hoverBackground: ${accentAlt} !important;
  --vscode-textLink-foreground: ${accent} !important;
  --vscode-focusBorder: ${accent} !important;
  --vscode-list-activeSelectionBackground: ${secondary} !important;
  --vscode-list-hoverBackground: ${highlight}33 !important;
}

/* 顶部低调的主题标识横幅 */
html.skins-theme-applied body::before {
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
html.skins-theme-applied body.cb-dark::before,
html.skins-theme-applied body.vscode-dark::before,
html.skins-theme-applied body.dark::before {
  color: ${textDark};
  background: ${accent}99;
}
`;

  let body = '';
  if (target === 'workbuddy') {
    // WorkBuddy DOM 结构 (实测 v5.2.6):
    //   body > #root > .teams-container.is-mac > ._grid_* > ._gridView_* > ._gridViewItem_*
    //                                                                        └─ .conversation-sidebar / .teams-content-wrapper (稳定 class, 透明)
    //                                                                        └─ 内部各种 panel/card (有自己的底色)
    //
    // 关键: ._gridViewItem_* 是 CSS Modules 哈希类, 有不透明 background-color, 完全挡住了 .teams-container 的背景图.
    // 用 [class*="gridViewItem"] 属性选择器稳定匹配 (本地名 gridViewItem 不变, 哈希后缀会变).
    // 同理 ._grid_* / ._gridView_* 也是哈希布局容器, 背景必须透明.
    //
    // body 有 70+ 个 :rXX: React Portal 容器 (Radix UI), 但 height: 0 不挡.
    body = `
/* ===== skins theme: ${theme.id} (target=workbuddy) ===== */

/* 1. body 透明 */
html.skins-theme-applied body {
  background: transparent !important;
}

/* 2. 背景图设到 .teams-container (最外层全屏容器) */
html.skins-theme-applied #root > .teams-container {
  background-image: url('${imgUrl}') !important;
  background-size: cover !important;
  background-position: ${posX} ${posY} !important;
  background-attachment: fixed !important;
  background-repeat: no-repeat !important;
  background-color: transparent !important;
  position: relative;
}

/* 3. 让哈希布局容器 (grid / gridView / gridViewItem) 背景透明, 露出 .teams-container 的背景图 */
html.skins-theme-applied #root > .teams-container [class*="grid_"],
html.skins-theme-applied #root > .teams-container [class*="gridView_"],
html.skins-theme-applied #root > .teams-container [class*="gridViewItem_"] {
  background-color: transparent !important;
  background: transparent !important;
}

/* 4. 半透明遮罩 + 模糊, 让 UI 文字可读 */
html.skins-theme-applied #root > .teams-container::before {
  content: "";
  position: absolute;
  inset: 0;
  background: ${panelBg};
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
  pointer-events: none;
}

/* 5. .teams-container 直接子元素浮到遮罩之上 */
html.skins-theme-applied #root > .teams-container > * {
  position: relative;
  z-index: 1;
}

/* 6. dark 模式遮罩 */
html.skins-theme-applied body.cb-dark #root > .teams-container::before,
html.skins-theme-applied body.vscode-dark #root > .teams-container::before,
html.skins-theme-applied body.dark #root > .teams-container::before {
  background: ${panelBgDark};
}

/* 7. 让 conversation-sidebar / teams-content-wrapper 等稳定容器也透明 (它们本身透明, 但保险起见) */
html.skins-theme-applied #root > .teams-container .conversation-sidebar,
html.skins-theme-applied #root > .teams-container .teams-content-wrapper {
  background: transparent !important;
}
`;
  } else if (target === 'vscode-fork') {
    // Cursor / VS Code / Windsurf 等 VS Code fork 的 DOM:
    //   body > .monaco-workbench > .part.background / .part.activitybar / .part.sidebar / .part.editor / .part.statusbar / .part.panel
    // .part.background 默认是纯色背景层, 把它换成背景图.
    // .monaco-workbench 整体加半透明遮罩, 各 .part 保留自己的底色 (会半透叠加).
    body = `
/* ===== skins theme: ${theme.id} (target=vscode-fork) ===== */

/* body 透明 */
html.skins-theme-applied body {
  background: transparent !important;
}

/* .part.background 是 VS Code 的官方背景层, 直接换成主题图 */
html.skins-theme-applied .monaco-workbench .part.background {
  background-image: url('${imgUrl}') !important;
  background-size: cover !important;
  background-position: ${posX} ${posY} !important;
  background-attachment: fixed !important;
  background-repeat: no-repeat !important;
}

/* .monaco-workbench 整体加半透明遮罩, 让背景图在 panel 空隙可见 */
html.skins-theme-applied .monaco-workbench::before {
  content: "";
  position: absolute;
  inset: 0;
  background: ${panelBg};
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  z-index: 0;
  pointer-events: none;
}

/* 各 .part 浮到遮罩之上, 并保留各自的半透明底色 */
html.skins-theme-applied .monaco-workbench > .part {
  position: relative;
  z-index: 1;
  background-color: ${panelBg} !important;
}

/* 编辑器区域更透一些, 让背景图更明显 */
html.skins-theme-applied .monaco-workbench .part.editor,
html.skins-theme-applied .monaco-workbench .part.editor .content,
html.skins-theme-applied .monaco-workbench .part.editor .monaco-editor-background {
  background-color: ${panelBg} !important;
}

/* 侧边栏 / 活动栏 / 状态栏 / 面板 */
html.skins-theme-applied .monaco-workbench .part.activitybar,
html.skins-theme-applied .monaco-workbench .part.sidebar,
html.skins-theme-applied .monaco-workbench .part.auxiliarybar,
html.skins-theme-applied .monaco-workbench .part.panel,
html.skins-theme-applied .monaco-workbench .part.statusbar {
  background-color: ${panelBg} !important;
}

/* dark 模式遮罩 */
html.skins-theme-applied body.vscode-dark .monaco-workbench::before,
html.skins-theme-applied body.dark .monaco-workbench::before {
  background: ${panelBgDark};
}
html.skins-theme-applied body.vscode-dark .monaco-workbench > .part,
html.skins-theme-applied body.dark .monaco-workbench > .part {
  background-color: ${panelBgDark} !important;
}
`;
  } else {
    // 通用兜底: 把背景图设到 body 上 (适用 Claude Desktop 等未探测过的 renderer)
    body = `
/* ===== skins theme: ${theme.id} (target=generic) ===== */
html.skins-theme-applied body {
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

// 在 renderer 里跑的 DOM 探测, 返回 target 类型
const DETECT_SCRIPT = `
(function () {
  if (document.querySelector('#root > .teams-container')) return 'workbuddy';
  if (document.querySelector('.monaco-workbench')) return 'vscode-fork';
  return 'generic';
})();
`;

// 在 renderer 里跑的注入函数. 接收 css + themeId, 幂等地注入.
function buildInjectScript(css, themeId, target) {
  // 把 CSS 转义成 JS 字符串安全的形式
  const cssJson = JSON.stringify(css);
  const idJson = JSON.stringify(themeId);
  const targetJson = JSON.stringify(target);
  return `
(function () {
  const css = ${cssJson};
  const themeId = ${idJson};
  const target = ${targetJson};
  const STYLE_ID = 'skins-theme-style';
  const HTML_CLASS = 'skins-theme-applied';

  // 0. 再探测一次确认 target 一致 (不一致说明页面切换了, 但仍然注入, 只是记录差异)
  let detected = 'generic';
  if (document.querySelector('#root > .teams-container')) detected = 'workbuddy';
  else if (document.querySelector('.monaco-workbench')) detected = 'vscode-fork';

  // 1. 移除旧 style (幂等)
  const old = document.getElementById(STYLE_ID);
  if (old) old.remove();

  // 2. 注入新 style
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  // 3. 在 html 上加 class + target 标记
  document.documentElement.classList.add(HTML_CLASS);
  document.documentElement.setAttribute('data-skins-target', target);
  document.documentElement.setAttribute('data-skins-active-theme', themeId);

  // 4. 监听 body class 变化 (light/dark 切换)
  if (!window.__skinsThemeObserver__) {
    const obs = new MutationObserver(() => {
      // CSS 选择器会自动响应 body class 变化, 这里占位
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.__skinsThemeObserver__ = obs;
  }

  // 5. 返回关键样式快照, 便于诊断
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

function evaluateOnPage(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('10s 超时'));
    }, 10000);

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true },
        }),
      );
    });

    ws.addEventListener('message', (ev) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(ev.data);
        if (msg.id === 1) {
          if (msg.result?.exceptionDetails) {
            reject(new Error('JS 异常: ' + JSON.stringify(msg.result.exceptionDetails)));
            return;
          }
          resolve(msg.result?.result?.value);
        }
      } catch (e) {
        reject(new Error('消息解析失败: ' + e.message));
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket 错误 ' + (e.message || '')));
    });
  });
}

(async () => {
  console.error(`==> 加载主题: ${themeDir}`);
  const { theme, imgAbs } = await loadTheme(themeDir);
  console.error(`    id: ${theme.id}`);
  console.error(`    name: ${theme.name}`);
  console.error(`    image: ${theme.image} (${(await fs.stat(imgAbs)).size} bytes)`);
  console.error(`    appearance: ${theme.appearance}, focus: (${theme.art?.focusX}, ${theme.art?.focusY})`);

  const imgUrl = pathToFileURL(imgAbs).href;
  console.error(`    image URL: ${imgUrl}`);

  console.error(`==> 连接 CDP http://127.0.0.1:${port}/json`);
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);
  const pages = targets.filter((t) => t.type === 'page');
  if (pages.length === 0) {
    console.error('!! 没有 page target');
    process.exit(1);
  }
  console.error(`==> 找到 ${pages.length} 个 page`);

  for (const p of pages) {
    try {
      // 1. 先探测 target (workbuddy / vscode-fork / generic)
      const detected = await evaluateOnPage(p.webSocketDebuggerUrl, DETECT_SCRIPT);
      console.error(`==> [${p.url.slice(0, 60)}] 探测 target = ${detected}`);

      // 2. 根据 target 生成 CSS
      const css = buildCss(theme, imgUrl, detected);
      const inject = buildInjectScript(css, theme.id, detected);

      // 3. 注入
      const result = await evaluateOnPage(p.webSocketDebuggerUrl, inject);
      console.log(`[${p.url.slice(0, 60)}]`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`  注入失败 [${p.url}]: ${e.message}`);
    }
  }

  console.error(`==> 完成. 主题 "${theme.name}" 已注入.`);
})();
