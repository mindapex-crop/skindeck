import http from 'node:http';

const port = 9343;

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

function evaluateOnPage(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('10s 超时'));
    }, 10000);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
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

async function main() {
  const targets = await fetchJSON(`http://127.0.0.1:${port}/json`);
  const pages = targets.filter(t => t.type === 'page');
  console.log(`找到 ${pages.length} 个 page:`);
  pages.forEach((p, i) => {
    console.log(`  [${i}] ${p.title} - ${p.url.slice(0, 100)}`);
  });
  console.log('');
  
  // 遍历所有 page
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    console.log(`=== Page [${i}]: ${p.title} ===`);
    try {
      const wsUrl = p.webSocketDebuggerUrl;
      
      const detectScript = `
      (function () {
        const result = {};
        result.title = document.title;
        
        // 检查最底层背景层
        const bgLayer = document.querySelector('div[class*="glass-10l6tqk"][class*="glass-13vifvy"]');
        if (bgLayer) {
          const s = getComputedStyle(bgLayer);
          result.bgLayer = {
            bgImage: s.backgroundImage.slice(0, 80),
            bgColor: s.backgroundColor,
            bgSize: s.backgroundSize,
          };
        } else {
          result.bgLayer = null;
        }
        
        // 检查侧边栏
        const sidebar = document.querySelector('.glass-sidebar-docked');
        if (sidebar) {
          const s = getComputedStyle(sidebar);
          result.sidebar = {
            bgColor: s.backgroundColor,
          };
        }
        
        // 检查主内容区
        const mainContent = document.querySelector('div[class*="glass-5yr21d"]');
        if (mainContent) {
          const s = getComputedStyle(mainContent);
          result.mainContent = {
            bgColor: s.backgroundColor,
          };
        }
        
        // 检查文字颜色是否可读 (随机找几个文字元素)
        const textEls = [];
        document.querySelectorAll('span, p, div, button, a').forEach(el => {
          if (el.textContent && el.textContent.trim().length > 5 && el.offsetWidth > 50 && el.offsetHeight > 10) {
            const s = getComputedStyle(el);
            if (s.color && s.color !== 'rgba(0, 0, 0, 0)') {
              textEls.push({
                text: el.textContent.trim().slice(0, 30),
                color: s.color,
                bg: s.backgroundColor,
                tag: el.tagName,
              });
            }
          }
        });
        result.textSamples = textEls.slice(0, 8);
        
        return result;
      })();
      `;
      
      const result = await evaluateOnPage(wsUrl, detectScript);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('  Error:', e.message);
    }
    console.log('');
  }
}

main().catch(e => console.error(e));
