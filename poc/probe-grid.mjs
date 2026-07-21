// probe-grid.mjs - 探测 ._grid_* 内部的 panel 结构
import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) { console.error('用法: node probe-grid.mjs <port>'); process.exit(1); }

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

  // 往 .teams-container 下探 4 层, 每层记录有背景色的元素
  const tc = document.querySelector('#root > .teams-container');
  if (!tc) { out.error = 'no .teams-container'; return out; }

  function walk(el, depth, path) {
    if (depth > 4) return [];
    const results = [];
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const r = el.getBoundingClientRect();
    const isOpaque = bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' &&
      !(bg.startsWith('rgba') && parseFloat(bg.split(',')[3]) <= 0.1);
    if (isOpaque && r.width > 100 && r.height > 100) {
      results.push({
        depth,
        path,
        tag: el.tagName,
        class: (el.className || '').toString().slice(0, 80),
        bg,
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
      });
    }
    for (let i = 0; i < el.children.length && i < 15; i++) {
      results.push(...walk(el.children[i], depth + 1, path + ' > ' + (el.children[i].className || '').toString().split(' ')[0].slice(0, 30)));
    }
    return results;
  }

  out.opaquePanels = walk(tc, 0, '.teams-container').slice(0, 30);

  // 找带 role 或 data-testid 的元素 (稳定选择器候选)
  const stable = [];
  tc.querySelectorAll('[role], [data-testid], [data-component], [data-page]').forEach(el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    stable.push({
      role: el.getAttribute('role'),
      testid: el.getAttribute('data-testid'),
      component: el.getAttribute('data-component'),
      page: el.getAttribute('data-page'),
      class: (el.className || '').toString().slice(0, 60),
      bg: cs.backgroundColor,
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  });
  out.stableSelectors = stable.slice(0, 20);

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
