// _cdp_test.js - 用 Edge 远程调试接口跑 CDP,捕获页面 console error
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCENE = process.argv[2] || 'planetary-arch';
const URL = `http://localhost:8765/?scene=${SCENE}&v=0.6.3&noai=1`;
const PORT = 9233;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'edge_'));
const errLog = path.join(udd, 'err.log');

console.log(`[Test] ${SCENE} -> ${URL}`);

// 1. 启 Edge
const edgeArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--user-data-dir=${udd}`,
  `--remote-debugging-port=${PORT}`,
  '--enable-logging=stderr',
  URL
];

const edge = spawn(EDGE, edgeArgs, { stdio: ['ignore', 'ignore', fs.openSync(errLog, 'w')] });

// 2. 拿页面 WebSocket URL
function getPage() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          const target = pages.find((p) => p.type === 'page' && p.url.includes('localhost:8765'));
          if (target) resolve(target);
          else reject(new Error('no page: ' + data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => req.destroy(new Error('timeout')));
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  // 等待 Edge 启动
  await sleep(3500);

  let target;
  for (let i = 0; i < 5; i++) {
    try {
      target = await getPage();
      break;
    } catch (e) {
      await sleep(1000);
    }
  }
  if (!target) {
    console.log('[ERR] no target page');
    edge.kill();
    fs.rmSync(udd, { recursive: true, force: true });
    process.exit(2);
  }
  console.log('[Page]', target.url);

  // 3. WebSocket 连 CDP
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleMsgs = [];
  const exceptions = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
      setTimeout(() => {
        if (pending.has(mid)) {
          pending.delete(mid);
          reject(new Error('timeout: ' + method));
        }
      }, 8000);
    });
  }

  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) p.reject(new Error(JSON.stringify(m.error)));
      else p.resolve(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = (m.params.args || []).map((a) => a.value || a.description || '').join(' ');
      consoleMsgs.push({ level: m.params.type, text });
    } else if (m.method === 'Runtime.exceptionThrown') {
      const ex = m.params.exceptionDetails;
      exceptions.push(ex.text + ' :: ' + (ex.exception?.description || ex.exception?.value || ''));
    } else if (m.method === 'Log.entryAdded') {
      const e = m.params.entry;
      if (e.level === 'error' || e.level === 'warning') {
        consoleMsgs.push({ level: e.level, text: e.text });
      }
    }
  });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Network.enable');

  // 捕获网络错误
  const networkFails = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Network.responseReceived') {
      const r = m.params.response;
      if (r.status >= 400) networkFails.push(`${r.status} ${r.url}`);
    }
  });

  // 4. 等几秒加载 + 渲染
  await sleep(6000);

  // 5. 拿 canvas 信息
  let info = null;
  try {
    const r = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        canvas: !!document.querySelector('canvas'),
        canvasW: document.querySelector('canvas')?.width || 0,
        canvasH: document.querySelector('canvas')?.height || 0,
        sceneLoaded: !!document.querySelector('.mathw-lesson'),
        sceneTitle: document.querySelector('.mathw-lesson-headline')?.textContent || '',
        errBox: document.getElementById('mathw-err')?.textContent || '',
        version: window.MATHW_V
      })`,
      returnByValue: true
    });
    info = JSON.parse(r.result.value);
  } catch (e) {
    console.log('[ERR] eval failed:', e.message);
  }

  // 6. 报告
  console.log('\n--- INFO ---');
  console.log(JSON.stringify(info, null, 2));
  console.log('\n--- CONSOLE ---');
  consoleMsgs.forEach((m) => console.log(`[${m.level}] ${m.text}`));
  console.log('\n--- EXCEPTIONS ---');
  exceptions.forEach((e) => console.log(e));

  // 7. 退出
  ws.close();
  edge.kill();
  await sleep(500);
  fs.rmSync(udd, { recursive: true, force: true });

  // 判定
  const errs = [...consoleMsgs.filter(m => m.level === 'error'), ...exceptions];
  if (info?.canvas && errs.length === 0) {
    console.log(`\n[OK] ${SCENE}`);
    process.exit(0);
  } else {
    console.log(`\n[FAIL] ${SCENE}  canvas=${info?.canvas}  errs=${errs.length}`);
    process.exit(1);
  }
})().catch((e) => {
  console.log('[FATAL]', e.message);
  try { edge.kill(); } catch (_) {}
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch (_) {}
  process.exit(2);
});
