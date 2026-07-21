// quick-probe.mjs - 快速探测: 有哪些 style, 绿条从哪来, .teams-container 的子层级谁是不透明的
import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) { console.error('用法: node quick-probe.mjs <port>'); process.exit(1); }

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

  // 1. head 里所有 style 标签的 id 和前 80 字符
  out.styles = Array.from(document.querySelectorAll('head style')).map(s => ({
    id: s.id,
    textLen: s.textContent.length,
    preview: s.textContent.slice(0, 120),
  }));

  // 2. body::before 内容 (看绿条是不是这个)
  const bodyBefore = getComputedStyle(document.body, '::before');
  out.bodyBefore = {
    content: bodyBefore.content,
    background: bodyBefore.backgroundColor,
    top: bodyBefore.top,
    position: bodyBefore.position,
  };

  // 3. .teams-container 直接子元素
  const tc = document.querySelector('#root > .teams-container');
  if (tc) {
    out.tcChildren = Array.from(tc.children).map((c, i) => {
      const cs = getComputedStyle(c);
      const r = c.getBoundingClientRect();
      return {
        idx: i,
        tag: c.tagName,
        class: (c.className || '').toString().slice(0, 60),
        bg: cs.backgroundColor,
        opacity: cs.opacity,
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    // 第一层子元素的第一层子元素 (孙辈)
    out.tcGrandChildren = Array.from(tc.children).map((child, ci) => ({
      parentIdx: ci,
      parentClass: (child.className || '').toString().slice(0, 40),
      children: Array.from(child.children).slice(0, 6).map((gc, gi) => {
        const cs = getComputedStyle(gc);
        const r = gc.getBoundingClientRect();
        return {
          idx: gi,
          tag: gc.tagName,
          class: (gc.className || '').toString().slice(0, 60),
          bg: cs.backgroundColor,
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      }),
    }));
  }

  // 4. 找所有全屏且背景不透明的元素 (谁挡住了背景图)
  const opaque = [];
  function isOpaque(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;
    // 检查 alpha 值
    const m = color.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const parts = m[1].split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 4 && parts[3] <= 0.1) return false;
    }
    return true;
  }
  const all = document.querySelectorAll('body *');
  for (let i = 0; i < Math.min(all.length, 2000); i++) {
    const el = all[i];
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.8 && isOpaque(cs.backgroundColor)) {
      opaque.push({
        tag: el.tagName,
        id: el.id,
        class: (el.className || '').toString().slice(0, 80),
        bg: cs.backgroundColor,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
      if (opaque.length >= 15) break;
    }
  }
  out.opaqueFullscreen = opaque;

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
