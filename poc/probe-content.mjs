// probe-content.mjs - 探测 gridViewItem 内部稳定 class
import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) { console.error('用法: node probe-content.mjs <port>'); process.exit(1); }

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
  const tc = document.querySelector('#root > .teams-container');
  if (!tc) return { error: 'no tc' };

  // 拿左右两个 gridViewItem
  const items = tc.querySelectorAll('[class*="gridViewItem"]');
  out.gridViewItemCount = items.length;
  out.gridViewItems = [];
  for (let i = 0; i < Math.min(items.length, 4); i++) {
    const item = items[i];
    const cs = getComputedStyle(item);
    const r = item.getBoundingClientRect();

    // 找里面所有稳定 class (不含下划线/哈希的, 或含特定关键词的)
    const stableClasses = new Set();
    function collect(el) {
      const cls = (el.className || '').toString();
      if (cls) {
        cls.split(/\\s+/).forEach(c => {
          // 稳定 class: 不含下划线/数字混合的哈希模式
          if (c && !c.match(/_[a-z0-9]+_\\d+$/)) {
            stableClasses.add(c);
          }
        });
      }
      for (let j = 0; j < el.children.length && j < 10; j++) {
        collect(el.children[j]);
      }
    }
    collect(item);

    // 直接子元素
    const directChildren = [];
    for (let j = 0; j < item.children.length; j++) {
      const c = item.children[j];
      const ccs = getComputedStyle(c);
      const cr = c.getBoundingClientRect();
      directChildren.push({
        tag: c.tagName,
        class: (c.className || '').toString().slice(0, 80),
        bg: ccs.backgroundColor,
        w: Math.round(cr.width),
        h: Math.round(cr.height),
      });
    }

    out.gridViewItems.push({
      idx: i,
      bg: cs.backgroundColor,
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
      left: Math.round(r.left),
      directChildren,
      stableClasses: Array.from(stableClasses).slice(0, 30),
    });
  }

  // 全网关稳定 class 搜索 (不含数字后缀的)
  const allStable = new Set();
  const all = tc.querySelectorAll('[class]');
  for (let i = 0; i < Math.min(all.length, 500); i++) {
    const cls = (all[i].className || '').toString();
    cls.split(/\\s+/).forEach(c => {
      if (c && !c.match(/_[a-z0-9]+_\\d+$/) && c.length > 2 && c.length < 40) {
        allStable.add(c);
      }
    });
  }
  out.allStableClasses = Array.from(allStable).sort().slice(0, 80);

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
