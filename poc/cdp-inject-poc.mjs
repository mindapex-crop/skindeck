// PoC: 连接 CDP WebSocket, 向所有 page 类型的 renderer 注入 console.log
//
// 用法: node cdp-inject-poc.mjs <port>
//
// 依赖: Node >= 22 (内置全局 WebSocket). 不依赖任何 npm 包.
//
// 行为:
//   1. GET http://127.0.0.1:<port>/json 拿所有 target
//   2. 过滤 type === 'page' 的 target (排除 service_worker / background_page 等)
//   3. 对每个 page 调 Runtime.evaluate 执行 console.log('hello from skins')
//   4. 同时把当前 URL 打印出来, 用于确认 renderer 的 URL scheme (后续做主题适配时需要)

const port = Number(process.argv[2]);
if (!port) {
  console.error('用法: node cdp-inject-poc.mjs <port>');
  process.exit(1);
}

import http from 'node:http';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON 解析失败: ${e.message}\n原始: ${body.slice(0, 200)}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function injectOnce(wsUrl, label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`${label}: 5s 超时`));
    }, 5000);

    ws.addEventListener('open', () => {
      console.log(`  [${label}] 连接已建立, 发送 Runtime.evaluate...`);
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (function () {
                console.log('hello from skins');
                // 在 body 顶部插一个红色横幅, 视觉确认注入成功
                if (!document.getElementById('skins-poc-banner')) {
                  const b = document.createElement('div');
                  b.id = 'skins-poc-banner';
                  b.textContent = 'skins PoC injected ✓';
                  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;' +
                    'background:#0a0;color:#fff;font:14px monospace;padding:6px 12px;' +
                    'pointer-events:none;text-align:center;opacity:0.9';
                  document.documentElement.appendChild(b);
                }
                return { url: location.href, title: document.title };
              })();
            `,
            returnByValue: true,
          },
        }),
      );
    });

    ws.addEventListener('message', (ev) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(ev.data);
        if (msg.id === 1) {
          const result = msg.result?.result?.value;
          console.log(`  [${label}] 注入成功:`, JSON.stringify(result));
          ws.close();
          resolve(result);
        }
      } catch (e) {
        console.error(`  [${label}] 消息解析失败:`, e.message, ev.data?.slice(0, 200));
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error(`${label}: WebSocket 错误 ${e.message || ''}`));
    });
  });
}

(async () => {
  console.log(`==> 拉取 target 列表 http://127.0.0.1:${port}/json`);
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);

  const pages = targets.filter((t) => t.type === 'page');
  const others = targets.filter((t) => t.type !== 'page');

  console.log(`==> 共 ${targets.length} 个 target: ${pages.length} page, ${others.length} 其他`);
  console.log('    其他 target 类型:', others.map((t) => t.type).join(', ') || '(无)');

  if (pages.length === 0) {
    console.error('!! 没有 page 类型 target, 无法注入');
    process.exit(1);
  }

  console.log();
  console.log('==> Page targets URL scheme (后续做主题适配的关键信息):');
  for (const p of pages) {
    console.log(`    - ${p.url}`);
  }
  console.log();

  console.log('==> 逐个注入...');
  let ok = 0;
  for (const p of pages) {
    try {
      await injectOnce(p.webSocketDebuggerUrl, p.url.slice(0, 60));
      ok++;
    } catch (e) {
      console.error(`  注入失败: ${e.message}`);
    }
  }

  console.log();
  console.log(`==> 完成: ${ok}/${pages.length} 个 page 注入成功`);
  process.exit(ok > 0 ? 0 : 1);
})();
