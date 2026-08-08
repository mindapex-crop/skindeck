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
        params: { expression, returnByValue: true, awaitPromise },
      }));
    });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        clearTimeout(timeout);
        ws.close();
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result.result.value);
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket 错误'));
    });
  });
}

async function main() {
  const port = 9344;
  const targets = await getTargets(port);
  console.log(`找到 ${targets.length} 个 page:`);
  targets.forEach((t, i) => console.log(`  [${i}] ${t.title} - ${t.type}`));

  const page = targets.find(t => t.type === 'page');
  if (!page) { console.error('没有 page'); return; }

  console.log('\n=== 1. 页面基本状态 ===');
  const info = await cdpEval(page.webSocketDebuggerUrl, `
    (function() {
      return {
        readyState: document.readyState,
        url: location.href,
        containerExists: !!document.getElementById('pet-container'),
        stageExists: !!document.getElementById('pet-stage'),
        petCount: document.querySelectorAll('.pet').length,
        imgCount: document.querySelectorAll('img').length,
        winSize: [window.innerWidth, window.innerHeight],
        bodyHTML: document.body.innerHTML.length,
      };
    })()
  `);
  console.log(JSON.stringify(info, null, 2));

  console.log('\n=== 2. petAPI 是否可用 ===');
  const apiInfo = await cdpEval(page.webSocketDebuggerUrl, `
    (function() {
      return {
        hasPetAPI: typeof window.petAPI !== 'undefined',
        apiKeys: typeof window.petAPI !== 'undefined' ? Object.keys(window.petAPI) : [],
      };
    })()
  `);
  console.log(JSON.stringify(apiInfo, null, 2));

  console.log('\n=== 3. 获取当前宠物 ===');
  const petInfo = await cdpEval(page.webSocketDebuggerUrl, `
    (async function() {
      try {
        if (!window.petAPI) return { error: 'no petAPI' };
        const pet = await window.petAPI.getCurrentPet();
        return pet ? { name: pet.config.name, imgUrl: pet.imgUrl?.slice(0, 80), renderType: pet.config.renderType } : { noPet: true };
      } catch(e) { return { error: e.message }; }
    })()
  `, true);
  console.log(JSON.stringify(petInfo, null, 2));

  console.log('\n=== 4. 图片列表 ===');
  const imgs = await cdpEval(page.webSocketDebuggerUrl, `
    (function() {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src.slice(0, 80),
        complete: img.complete,
        nw: img.naturalWidth,
        nh: img.naturalHeight,
        visible: img.offsetWidth > 0 && img.offsetHeight > 0,
        display: getComputedStyle(img).display,
      }));
    })()
  `);
  console.log(JSON.stringify(imgs, null, 2));

  console.log('\n=== 5. 控制台错误 ===');
  // 先 Runtime.enable 再等一下收集
  const logs = [];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
  
  const logPromise = new Promise(resolve => {
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown' || msg.method === 'Log.entryAdded') {
        logs.push(msg);
      }
    });
    setTimeout(() => { ws.close(); resolve(); }, 1500);
  });
  await logPromise;
  
  console.log(`收集到 ${logs.length} 条日志:`);
  logs.slice(0, 15).forEach((l, i) => {
    if (l.method === 'Runtime.exceptionThrown') {
      console.log(`  [异常] ${l.params.exceptionDetails?.text || ''}`);
    } else if (l.method === 'Log.entryAdded') {
      console.log(`  [${l.params.entry?.level}] ${l.params.entry?.text?.slice(0, 150) || ''}`);
    } else {
      const args = l.params?.args?.map(a => a.value || a.description).join(' ');
      console.log(`  [${l.params?.type}] ${args?.slice(0, 150) || ''}`);
    }
  });

  console.log('\n=== 6. 容器尺寸和宠物元素 ===');
  const petElInfo = await cdpEval(page.webSocketDebuggerUrl, `
    (function() {
      const pet = document.querySelector('.pet');
      const stage = document.getElementById('pet-stage');
      const container = document.getElementById('pet-container');
      return {
        container: container ? { w: container.offsetWidth, h: container.offsetHeight, display: getComputedStyle(container).display } : null,
        stage: stage ? { w: stage.offsetWidth, h: stage.offsetHeight, display: getComputedStyle(stage).display } : null,
        pet: pet ? { w: pet.offsetWidth, h: pet.offsetHeight, display: getComputedStyle(pet).display, visibility: getComputedStyle(pet).visibility, opacity: getComputedStyle(pet).opacity } : null,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      };
    })()
  `);
  console.log(JSON.stringify(petElInfo, null, 2));
}

main().catch(console.error);
