// tiny-probe.mjs - 极简探测: 只查 head 里的 style + body::before + tc 子元素
import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) { console.error('用法: node tiny-probe.mjs <port>'); process.exit(1); }

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

const probe = `
(function () {
  const out = {};

  // 1. head 里的 style 标签
  out.styles = [];
  const allStyles = document.querySelectorAll('style');
  for (let i = 0; i < allStyles.length; i++) {
    const s = allStyles[i];
    out.styles.push({
      id: s.id,
      len: s.textContent.length,
      first100: s.textContent.slice(0, 100),
    });
  }

  // 2. body::before
  const bb = getComputedStyle(document.body, '::before');
  out.bodyBefore = {
    content: bb.content,
    bg: bb.backgroundColor,
    pos: bb.position,
    top: bb.top,
    right: bb.right,
    z: bb.zIndex,
    display: bb.display,
  };

  // 3. html class, body class
  out.htmlClass = document.documentElement.className;
  out.bodyClass = document.body.className;
  out.dataSkinsActive = document.documentElement.getAttribute('data-skins-active-theme');
  out.dataSkinsTarget = document.documentElement.getAttribute('data-skins-target');

  // 4. .teams-container 子元素 (只一层, 不递归)
  const tc = document.querySelector('#root > .teams-container');
  if (tc) {
    out.tcChildren = [];
    for (let i = 0; i < tc.children.length; i++) {
      const c = tc.children[i];
      out.tcChildren.push({
        tag: c.tagName,
        class: (c.className || '').toString().slice(0, 80),
        bg: getComputedStyle(c).backgroundColor,
        w: Math.round(c.getBoundingClientRect().width),
        h: Math.round(c.getBoundingClientRect().height),
      });
    }
  } else {
    out.tcChildren = null;
  }

  return out;
})();
`;

function evaluateOnPage(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => { ws.close(); reject(new Error('10s 超时')); }, 10000);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
    });
    ws.addEventListener('message', (ev) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(ev.data);
        if (msg.id === 1) {
          if (msg.result?.exceptionDetails) reject(new Error('JS 异常: ' + JSON.stringify(msg.result.exceptionDetails)));
          else resolve(msg.result?.result?.value);
        }
      } catch (e) { reject(new Error('解析失败: ' + e.message)); }
    });
    ws.addEventListener('error', (e) => { clearTimeout(timeout); reject(new Error('WS 错误 ' + e.message)); });
  });
}

(async () => {
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);
  const pages = targets.filter(t => t.type === 'page');
  for (const p of pages) {
    const r = await evaluateOnPage(p.webSocketDebuggerUrl, probe);
    console.log(JSON.stringify(r, null, 2));
  }
})();
