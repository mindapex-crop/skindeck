import http from 'node:http';

export interface CdpTarget {
  id: string;
  type: string;
  url: string;
  title: string;
  webSocketDebuggerUrl: string;
  description?: string;
}

export async function listPages(port: number, host = '127.0.0.1'): Promise<CdpTarget[]> {
  const targets = await fetchJson(`http://${host}:${port}/json`);
  if (!Array.isArray(targets)) {
    throw new Error('CDP /json 返回格式异常');
  }
  return targets.filter((t: any) => t.type === 'page') as CdpTarget[];
}

export async function getVersion(port: number, host = '127.0.0.1'): Promise<any> {
  return fetchJson(`http://${host}:${port}/json/version`);
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

export interface EvaluateOptions {
  returnByValue?: boolean;
  timeoutMs?: number;
}

export async function evaluate(
  wsUrl: string,
  expression: string,
  opts: EvaluateOptions = {},
): Promise<any> {
  const { returnByValue = true, timeoutMs = 10000 } = opts;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('CDP evaluate 超时'));
    }, timeoutMs);

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue },
        }),
      );
    });

    ws.addEventListener('message', (ev) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse((ev as MessageEvent).data);
        if (msg.id === 1) {
          if (msg.result?.exceptionDetails) {
            reject(new Error('JS 异常: ' + JSON.stringify(msg.result.exceptionDetails)));
            return;
          }
          resolve(msg.result?.result?.value);
        }
      } catch (e) {
        reject(new Error('CDP 消息解析失败: ' + (e as Error).message));
      }
    });

    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket 错误: ' + (e as Event).type));
    });
  });
}
