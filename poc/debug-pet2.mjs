import http from 'node:http';

function getTargets(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function cdpEval(wsUrl, expression, awaitPromise = false) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('10s 超时'));
    }, 10000);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { 
          expression, 
          returnByValue: true, 
          awaitPromise,
          includeCommandLineAPI: true,
        },
      }));
    });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        clearTimeout(timeout);
        ws.close();
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });

    ws.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error('WebSocket 错误'));
    });
  });
}

async function main() {
  const port = 9344;
  const targets = await getTargets(port);
  const page = targets.find(t => t.type === 'page');
  if (!page) return;

  // 1. 检查 uncaught exception 详情
  console.log('=== 异常详情 ===');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  
  const exceptions = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params);
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  exceptions.forEach((e, i) => {
    console.log(`[${i}]`, e.exceptionDetails?.text);
    console.log('    ', e.exceptionDetails?.exception?.description?.slice(0, 300));
    if (e.exceptionDetails?.stackTrace?.callFrames) {
      e.exceptionDetails.stackTrace.callFrames.slice(0, 5).forEach((f) => {
        console.log(`      at ${f.functionName || '?'} (${f.url.split('/').pop()}:${f.lineNumber}:${f.columnNumber})`);
      });
    }
  });

  // 2. 尝试手动调用 switchPet 看看错误
  console.log('\n=== 手动调用 switchPet ===');
  try {
    const result = await cdpEval(page.webSocketDebuggerUrl, `
      (async function() {
        try {
          const pet = await window.petAPI.getCurrentPet();
          window.__lastPet = pet;
          
          // 检查 image-pet 模块是否可访问
          return {
            petName: pet?.config?.name,
            imgUrl: pet?.imgUrl?.slice(0, 80),
            stageExists: !!document.getElementById('pet-stage'),
            container: document.getElementById('pet-container') ? 'yes' : 'no',
          };
        } catch(e) {
          return { error: e.message, stack: e.stack?.slice(0, 300) };
        }
      })()
    `, true);
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.log('CDP 错误:', e.message);
  }

  // 3. 看看 main.js 有没有执行
  console.log('\n=== 渲染器脚本加载情况 ===');
  const scriptInfo = await cdpEval(page.webSocketDebuggerUrl, `
    (function() {
      const scripts = document.querySelectorAll('script');
      return Array.from(scripts).map(s => ({
        src: s.src?.slice(0, 80) || 'inline',
        type: s.type,
      }));
    })()
  `);
  console.log(JSON.stringify(scriptInfo, null, 2));

  // 4. 看网络请求
  console.log('\n=== 检查图片加载 (手动创建 img) ===');
  const testImg = await cdpEval(page.webSocketDebuggerUrl, `
    (async function() {
      const pet = await window.petAPI.getCurrentPet();
      if (!pet) return { noPet: true };
      
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ ok: true, w: img.naturalWidth, h: img.naturalHeight, src: pet.imgUrl.slice(0, 80) });
        img.onerror = (e) => resolve({ error: 'load failed', src: pet.imgUrl.slice(0, 80) });
        img.src = pet.imgUrl;
      });
    })()
  `, true);
  console.log(JSON.stringify(testImg, null, 2));

  ws.close();
}

main().catch(console.error);
