// _test_fallback.js - 验证 WebGL 降级卡片是否正确显示
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCENE = process.argv[2] || 'crystal-lattice';
const FORCE = process.argv[3] || '1';
const URL = `http://localhost:8765/?scene=${SCENE}&v=0.6.35&noai=1&forcewebglfail=${FORCE}`;
const PORT = 9235;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'edge_'));
const errLog = path.join(udd, 'err.log');

console.log(`[TestFallback] scene=${SCENE} force=${FORCE} -> ${URL}`);

const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--user-data-dir=${udd}`,
  `--remote-debugging-port=${PORT}`,
  '--enable-logging=stderr',
  URL,
], { stdio: ['ignore', 'ignore', fs.openSync(errLog, 'w')] });

function getPage() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          const t = pages.find((p) => p.type === 'page' && p.url.includes('localhost:8765'));
          if (t) resolve(t);
          else reject(new Error('no page'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('timeout')));
  });
}

async function main() {
  // 等待 Edge 启动 + 页面加载
  await new Promise((r) => setTimeout(r, 6000));

  const page = await getPage();
  const wsUrl = page.webSocketDebuggerUrl;
  console.log(`  page ready: ${page.url}`);

  // 用内置 WebSocket 跟 CDP 通信(Node 22+ 内置)
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const myId = ++id;
    const handler = (msg) => {
      const m = JSON.parse(msg.data);
      if (m.id === myId) {
        ws.removeEventListener('message', handler);
        if (m.error) reject(new Error(m.error.message));
        else resolve(m.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });

  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  // 1. 验证 .mathw-webgl-fallback 元素存在
  const expr1 = `document.querySelector('.mathw-webgl-fallback') ? 'FOUND:' + document.querySelector('.mathw-webgl-fallback h2')?.textContent : 'NOT_FOUND'`;
  const r1 = await send('Runtime.evaluate', { expression: expr1 });
  console.log(`  fallback card: ${r1.result.value}`);

  // 2. 验证 canvasHost 不为空
  const expr2 = `document.querySelector('.mathw-canvas-host')?.children.length || 0`;
  const r2 = await send('Runtime.evaluate', { expression: expr2 });
  console.log(`  canvas children: ${r2.result.value}`);

  // 3. 验证 getLesson 上下文(AI 面板 setActiveScene 调过)
  const expr3 = `document.querySelector('.mathw-webgl-fallback-lesson pre')?.textContent?.length || 0`;
  const r3 = await send('Runtime.evaluate', { expression: expr3 });
  console.log(`  lesson chars: ${r3.result.value}`);

  // 4. 验证公式(若有)
  const expr4 = `document.querySelector('.mathw-webgl-fallback-formula pre')?.textContent?.length || 0`;
  const r4 = await send('Runtime.evaluate', { expression: expr4 });
  console.log(`  formula chars: ${r4.result.value}`);

  // 5. 验证降级卡片完整 DOM(html 截断 220)
  const expr5 = `document.querySelector('.mathw-webgl-fallback')?.innerHTML?.substring(0, 200) || 'EMPTY'`;
  const r5 = await send('Runtime.evaluate', { expression: expr5 });
  console.log(`  dom: ${r5.result.value}`);

  // 5b. 验证降级卡片 CSS 位置和可见性
  const expr5b = `(() => { const e = document.querySelector('.mathw-webgl-fallback'); if (!e) return 'NO_EL'; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return JSON.stringify({rect: {x:r.x,y:r.y,w:r.width,h:r.height}, display: s.display, visibility: s.visibility, opacity: s.opacity, zIndex: s.zIndex, bg: s.backgroundColor}); })()`;
  const r5b = await send('Runtime.evaluate', { expression: expr5b });
  console.log(`  css: ${r5b.result.value}`);

  // 5c. 验证 canvasHost
  const expr5c = `(() => { const e = document.querySelector('.mathw-canvas-host'); if (!e) return 'NO_HOST'; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return JSON.stringify({rect: {x:r.x,y:r.y,w:r.width,h:r.height}, display: s.display, overflow: s.overflow, zIndex: s.zIndex}); })()`;
  const r5c = await send('Runtime.evaluate', { expression: expr5c });
  console.log(`  host: ${r5c.result.value}`);

  // 6. 截图
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot && shot.data) {
    const out = path.join('Output', `fallback-${SCENE}.png`);
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(`  shot: ${out} (${Buffer.byteLength(shot.data, 'base64')} bytes)`);
  }

  // 7. console error
  const errs = [];
  if (fs.existsSync(errLog)) {
    fs.readFileSync(errLog, 'utf8').split(/\r?\n/).forEach((l) => {
      if (l.match(/CONSOLE.*error|Uncaught|TypeError|ReferenceError|SyntaxError/)) {
        errs.push(l.substring(0, 220));
      }
    });
  }
  console.log(`  consoleErrors: ${errs.length}`);
  errs.slice(0, 5).forEach((e) => console.log(`    ${e}`));

  ws.close();
  edge.kill();
  process.exit(errs.length === 0 && r1.result.value.startsWith('FOUND:') ? 0 : 1);
}

main().catch((e) => { console.error('FAIL:', e.message); edge.kill(); process.exit(2); });
