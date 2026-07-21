// restore-theme.mjs - 移除 apply-theme.mjs 注入的主题, 恢复 renderer 原状
//
// 用法: node restore-theme.mjs <port>
// 例:   node restore-theme.mjs 9342
//
// 移除:
//   1. <style id="skins-theme-style">
//   2. html 上的 skins-theme-applied class
//   3. html 上的 data-skins-active-theme 属性
//   4. window.__skinsThemeObserver__ (disconnect + delete)
//   5. body::before 横幅 (随 html class 移除自动消失)
//
// 幂等: 没注入过也安全, 会返回 wasInjected: false

import http from 'node:http';

const port = Number(process.argv[2]);

if (!port) {
  console.error('用法: node restore-theme.mjs <port>');
  console.error('例:   node restore-theme.mjs 9342');
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

const restoreScript = `
(function () {
  const STYLE_ID = 'skins-theme-style';
  const HTML_CLASS = 'skins-theme-applied';
  const ACTIVE_ATTR = 'data-skins-active-theme';
  const TARGET_ATTR = 'data-skins-target';

  const before = {
    hadStyle: !!document.getElementById(STYLE_ID),
    hadHtmlClass: document.documentElement.classList.contains(HTML_CLASS),
    hadActiveAttr: document.documentElement.hasAttribute(ACTIVE_ATTR),
    hadTargetAttr: document.documentElement.hasAttribute(TARGET_ATTR),
    hadObserver: !!window.__skinsThemeObserver__,
    bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 80),
  };

  // 1. 移除 style
  const old = document.getElementById(STYLE_ID);
  if (old) old.remove();

  // 2. 移除 html class
  document.documentElement.classList.remove(HTML_CLASS);

  // 3. 移除 data-skins-active-theme / data-skins-target 属性
  document.documentElement.removeAttribute(ACTIVE_ATTR);
  document.documentElement.removeAttribute(TARGET_ATTR);

  // 4. 断开 observer
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
  console.error(`==> 连接 CDP http://127.0.0.1:${port}/json`);
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);
  const pages = targets.filter((t) => t.type === 'page');
  if (pages.length === 0) {
    console.error('!! 没有 page target');
    process.exit(1);
  }
  console.error(`==> 找到 ${pages.length} 个 page, 恢复全部`);

  for (const p of pages) {
    try {
      const result = await evaluateOnPage(p.webSocketDebuggerUrl, restoreScript);
      console.log(`[${p.url.slice(0, 60)}]`, JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`  恢复失败 [${p.url}]: ${e.message}`);
    }
  }

  console.error(`==> 完成. 主题已移除, renderer 恢复原状.`);
})();
