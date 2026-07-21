// probe-teams-container.mjs - 探测 WorkBuddy renderer 里 .teams-container / #root / body 的真实结构
//
// 用法: node probe-teams-container.mjs <port>
// 例:   node probe-teams-container.mjs 9342

import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) {
  console.error('用法: node probe-teams-container.mjs <port>');
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

  // 1. body / html 基本结构
  out.html = {
    class: document.documentElement.className,
    activeTheme: document.documentElement.getAttribute('data-skins-active-theme'),
    children: Array.from(document.documentElement.children).map(c => c.tagName),
  };
  out.body = {
    class: document.body.className,
    bg: getComputedStyle(document.body).backgroundColor,
    bgImage: getComputedStyle(document.body).backgroundImage,
    childrenTop: Array.from(document.body.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      class: (c.className || '').slice(0, 200),
    })),
  };

  // 2. #root 结构 (WorkBuddy 用 React, 通常是 #root)
  const root = document.getElementById('root');
  out.root = root ? {
    tag: root.tagName,
    id: root.id,
    class: root.className,
    computedBg: getComputedStyle(root).backgroundColor,
    computedBgImage: getComputedStyle(root).backgroundImage,
    position: getComputedStyle(root).position,
    zIndex: getComputedStyle(root).zIndex,
    childrenTop: Array.from(root.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      class: (c.className || '').slice(0, 200),
      rect: c.getBoundingClientRect ? (() => {
        const r = c.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })() : null,
    })),
  } : null;

  // 3. .teams-container 的真实样式 (apply-theme.mjs 的关键选择器)
  const tc = document.querySelector('.teams-container');
  out.teamsContainer = tc ? {
    found: true,
    tag: tc.tagName,
    class: tc.className,
    parentTag: tc.parentElement?.tagName,
    parentId: tc.parentElement?.id,
    parentClass: tc.parentElement?.className,
    computed: {
      bg: getComputedStyle(tc).backgroundColor,
      bgImage: getComputedStyle(tc).backgroundImage,
      position: getComputedStyle(tc).position,
      width: getComputedStyle(tc).width,
      height: getComputedStyle(tc).height,
      top: getComputedStyle(tc).top,
      left: getComputedStyle(tc).left,
      overflow: getComputedStyle(tc).overflow,
      zIndex: getComputedStyle(tc).zIndex,
      backdropFilter: getComputedStyle(tc).backdropFilter,
      webkitBackdropFilter: getComputedStyle(tc).webkitBackdropFilter,
    },
    rect: (() => {
      const r = tc.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })(),
    childrenTop: Array.from(tc.children).slice(0, 8).map(c => ({
      tag: c.tagName,
      id: c.id,
      class: (c.className || '').slice(0, 120),
    })),
  } : { found: false };

  // 4. 找所有看起来像 "最外层全屏容器" 的元素 (定位+全屏)
  const all = document.querySelectorAll('body *');
  const fullscreenCandidates = [];
  for (let i = 0; i < Math.min(all.length, 5000); i++) {
    const el = all[i];
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9) {
      fullscreenCandidates.push({
        tag: el.tagName,
        id: el.id,
        class: (el.className || '').slice(0, 100),
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage.slice(0, 80),
        position: cs.position,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
      if (fullscreenCandidates.length >= 20) break;
    }
  }
  out.fullscreenCandidates = fullscreenCandidates;

  // 5. body 直接子元素的样式 (看谁遮住了 body 背景)
  out.bodyChildrenStyles = Array.from(document.body.children).slice(0, 10).map(c => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    return {
      tag: c.tagName,
      id: c.id,
      class: (c.className || '').slice(0, 100),
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 80),
      position: cs.position,
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });

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
