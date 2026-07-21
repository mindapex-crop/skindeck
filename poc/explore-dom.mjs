// 探索 Electron renderer 的 DOM 结构、CSS 变量、布局信息
// 用于为主题适配（背景图注入点、safeArea 推断、dark/light 切换）收集资料
//
// 用法: node explore-dom.mjs <port>
//
// 输出 JSON, 字段:
//   - meta: url / title / viewport / colorScheme
//   - rootAttrs: documentElement 的 class/data-*/style
//   - cssVars: :root 上 -- 开头的 CSS 变量
//   - bodyTree: body 下前 4 层主要容器 (带 tag/id/class/role/dimensions)
//   - bodyStyle: body 的关键 computed style
//   - themeClasses: 文档里出现的疑似主题切换 class (theme/dark/light/mode 关键字)

import http from 'node:http';

const port = Number(process.argv[2]);
if (!port) {
  console.error('用法: node explore-dom.mjs <port>');
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

// 在 renderer 里跑的探针函数. 必须自包含, 不能引用外部变量.
// 序列化时把循环引用 / DOM 节点裁剪成简单对象.
const PROBE = `
(function () {
  const SAFE_LIMIT = 200; // 每层最多取前 N 个子节点, 避免爆炸

  function dims(el) {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }

  function classify(el) {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: el.className && el.className.toString ? el.className.toString().slice(0, 200) : null,
      role: el.getAttribute('role') || null,
      ariaLabel: el.getAttribute('aria-label') || null,
      dataAttrs: Object.fromEntries(
        Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value.slice(0, 80)])
      ),
      dims: dims(el),
      position: cs.position,
      display: cs.display,
      zIndex: cs.zIndex === 'auto' ? null : cs.zIndex,
      bg: cs.backgroundColor,
      bgImage: (cs.backgroundImage && cs.backgroundImage !== 'none') ? cs.backgroundImage.slice(0, 120) : null,
      overflow: cs.overflow,
    };
  }

  function walk(el, depth, maxDepth) {
    if (depth > maxDepth) return null;
    const node = classify(el);
    const kids = Array.from(el.children).slice(0, SAFE_LIMIT);
    if (kids.length > 0 && depth < maxDepth) {
      node.children = kids.map(k => walk(k, depth + 1, maxDepth)).filter(Boolean);
    }
    node.childCount = el.children.length;
    return node;
  }

  // 1. meta
  const meta = {
    url: location.href,
    title: document.title,
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    colorScheme: getComputedStyle(document.documentElement).colorScheme || null,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };

  // 2. rootAttrs
  const rootEl = document.documentElement;
  const rootAttrs = {
    tag: rootEl.tagName.toLowerCase(),
    class: rootEl.className || null,
    dataAttrs: Object.fromEntries(
      Array.from(rootEl.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])
    ),
  };

  // 3. cssVars : 在 :root 上声明的 -- 变量
  //    遍历 document.styleSheets 找 :root / html 规则
  const cssVars = {};
  try {
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; } // cross-origin
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.style && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
          for (let i = 0; i < rule.style.length; i++) {
            const name = rule.style[i];
            if (name.startsWith('--')) {
              cssVars[name] = rule.style.getPropertyValue(name).trim().slice(0, 80);
            }
          }
        }
      }
    }
  } catch (e) {
    cssVars.__error = e.message;
  }

  // 4. computed :root CSS vars (有些是 JS 动态设的, 不在样式表里)
  const computedVars = {};
  const rootCs = getComputedStyle(rootEl);
  // 没法枚举 computed 上的自定义属性, 只能拿已知前缀的. 这里启发式抓常用前缀.
  // 用 :root 上找到的变量名, 再去 computed 拿实际值, 看是否被覆盖.
  for (const name of Object.keys(cssVars)) {
    if (name === '__error') continue;
    const v = rootCs.getPropertyValue(name).trim();
    if (v && v !== cssVars[name]) computedVars[name] = v.slice(0, 80);
  }

  // 5. bodyTree: body 下前 4 层 (depth 1=body, 2,3,4)
  const bodyTree = walk(document.body, 1, 4);

  // 6. bodyStyle 关键 computed style
  const bodyCs = getComputedStyle(document.body);
  const bodyStyle = {
    bg: bodyCs.backgroundColor,
    bgImage: (bodyCs.backgroundImage && bodyCs.backgroundImage !== 'none') ? bodyCs.backgroundImage.slice(0, 120) : null,
    bgSize: bodyCs.backgroundSize,
    bgPosition: bodyCs.backgroundPosition,
    color: bodyCs.color,
    fontSize: bodyCs.fontSize,
    fontFamily: bodyCs.fontFamily.slice(0, 120),
    overflow: bodyCs.overflow,
    position: bodyCs.position,
  };

  // 7. themeClasses: 在 body 及其前 3 层子节点里, 找 class 含 theme/dark/light/mode 的
  const themeHits = [];
  function hunt(el, depth, path) {
    if (depth > 3) return;
    const cls = el.className && el.className.toString ? el.className.toString() : '';
    if (/(^|\\s)(theme|dark|light|mode|appearance|color-scheme)([-\\w]*)/i.test(cls)) {
      themeHits.push({ path, class: cls.slice(0, 150), tag: el.tagName.toLowerCase(), id: el.id || null });
    }
    Array.from(el.children).slice(0, 30).forEach((k, i) => hunt(k, depth + 1, path + '>' + k.tagName.toLowerCase() + (k.id ? '#' + k.id : '') + '[' + i + ']'));
  }
  hunt(document.body, 0, 'body');

  return { meta, rootAttrs, cssVars, computedVars, bodyTree, bodyStyle, themeHits };
})();
`;

function probe(wsUrl) {
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
          params: { expression: PROBE, returnByValue: true, awaitPromise: false },
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
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);
  const pages = targets.filter((t) => t.type === 'page');
  if (pages.length === 0) {
    console.error('没有 page target');
    process.exit(1);
  }
  console.error(`==> 找到 ${pages.length} 个 page, 探索第一个: ${pages[0].url}`);

  const result = await probe(pages[0].webSocketDebuggerUrl);
  console.log(JSON.stringify(result, null, 2));
})();
