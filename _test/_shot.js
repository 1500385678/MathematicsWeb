// _shot.js - CDP 等动画稳定后截屏
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCENE = process.argv[2] || 'planetary-orbits';
const OUT = process.argv[3] || '_shot.png';
const URL = `http://localhost:8765/?scene=${SCENE}&v=0.6.3&noai=1`;
const PORT = 9234;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'edge_shot_'));
const errLog = path.join(udd, 'err.log');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--user-data-dir=${udd}`,
  `--remote-debugging-port=${PORT}`,
  '--window-size=1600,1000',
  '--enable-unsafe-swiftshader',
  URL
];

const edge = spawn(EDGE, args, { stdio: ['ignore', 'ignore', fs.openSync(errLog, 'w')] });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function getPage() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const ps = JSON.parse(d);
        const t = ps.find(p => p.type === 'page' && p.url.includes('localhost:8765'));
        if (t) resolve(t); else reject(new Error('no page'));
      });
    });
    req.on('error', reject);
  });
}

(async () => {
  await sleep(4000);
  let target;
  for (let i = 0; i < 5; i++) {
    try { target = await getPage(); break; } catch (e) { await sleep(1000); }
  }
  if (!target) { console.log('no target'); edge.kill(); process.exit(2); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
      setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); reject(new Error('timeout')); } }, 8000);
    });
  }

  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');

  // 等场景加载 + 动画稳定(8s,够 rAF 跑几百帧)
  await sleep(8000);

  // 强制 trigger WebGL flush:跑一帧 + requestAnimationFrame
  await send('Runtime.evaluate', {
    expression: `new Promise(r => {
      const start = performance.now();
      const loop = () => {
        if (performance.now() - start > 1500) r(true);
        else requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  // 截图
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  const size = fs.statSync(OUT).size;
  console.log(`[OK] ${SCENE} -> ${OUT}  (${size} bytes)`);

  ws.close();
  edge.kill();
  await sleep(500);
  fs.rmSync(udd, { recursive: true, force: true });
  process.exit(0);
})().catch(e => {
  console.log('[ERR]', e.message);
  try { edge.kill(); } catch (_) {}
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
});
