// probe-deep.mjs - 深度探测 WorkBuddy DOM 结构, 找稳定选择器和面板层级
//
// 用法: node probe-deep.mjs <port>
// 例:   node probe-deep.mjs 9342

import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) {
  console.error('用法: node probe-deep.mjs <port>');
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

const probe = `
(function () {
  const out = {};

  // 1. 列所有带 data-* 属性的元素 (稳定选择器的最佳候选)
  const dataEls = [];
  function walk(el, depth) {
    if (depth > 8) return;
    const attrs = Array.from(el.attributes || []);
    const dataAttrs = attrs.filter(a => a.name.startsWith('data-'));
    if (dataAttrs.length > 0) {
      dataEls.push({
        depth,
        tag: el.tagName,
        id: el.id,
        class: (el.className || '').toString().slice(0, 80),
        dataAttrs: dataAttrs.map(a => a.name + '=' + a.value.slice(0, 40)),
        bg: getComputedStyle(el).backgroundColor,
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      });
    }
    for (let i = 0; i < el.children.length && i < 20; i++) {
      walk(el.children[i], depth + 1);
    }
  }
  if (document.querySelector('#root > .teams-container')) {
    walk(document.querySelector('#root > .teams-container'), 0);
  }
  out.dataElements = dataEls.slice(0, 60);

  // 2. 找所有有 role 属性的元素
  const roleEls = [];
  document.querySelectorAll('[role]').forEach(el => {
    roleEls.push({
      tag: el.tagName,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-roledescription') || '',
      class: (el.className || '').toString().slice(0, 60),
      bg: getComputedStyle(el).backgroundColor,
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    });
  });
  out.roleElements = roleEls.slice(0, 30);

  // 3. 从 .teams-container 往下 5 层的完整树 (每层最多 10 子节点)
  function tree(el, depth) {
    if (depth > 5) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const children = [];
    for (let i = 0; i < el.children.length && i < 10; i++) {
      const child = tree(el.children[i], depth + 1);
      if (child) children.push(child);
    }
    return {
      tag: el.tagName,
      id: el.id || '',
      class: (el.className || '').toString().slice(0, 60),
      bg: cs.backgroundColor,
      position: cs.position,
      w: Math.round(r.width),
      h: Math.round(r.height),
      children,
    };
  }
  const tc = document.querySelector('#root > .teams-container');
  out.teamsContainerTree = tc ? tree(tc, 0) : null;

  // 4. 测一下哪些元素设了背景图 (看 apply-theme 到底注入到哪了)
  const bgImageEls = [];
  const all = document.querySelectorAll('body *');
  for (let i = 0; i < Math.min(all.length, 3000); i++) {
    const el = all[i];
    const bi = getComputedStyle(el).backgroundImage;
    if (bi && bi !== 'none') {
      bgImageEls.push({
        tag: el.tagName,
        id: el.id,
        class: (el.className || '').toString().slice(0, 60),
        bgImage: bi.slice(0, 100),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      });
      if (bgImageEls.length >= 15) break;
    }
  }
  out.elementsWithBgImage = bgImageEls;

  return out;
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

  for (const p of pages) {
    const result = await evaluateOnPage(p.webSocketDebuggerUrl, probe);
    console.log(JSON.stringify(result, null, 2));
  }
})();
