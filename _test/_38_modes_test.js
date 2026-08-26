// _test/_38_modes_test.js — 4 模式切换 + 截屏(全过 38 验证)
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const URL = 'http://localhost:8765/?scene=power-of-point&v=0.6.3&noai=1';
const PORT = 9234;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.resolve(__dirname, '../Output/38_power-of-point-modes.png');

const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'edge38_'));
const errLog = path.join(udd, 'err.log');
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--user-data-dir=${udd}`, `--remote-debugging-port=${PORT}`,
  '--enable-logging=stderr',
  '--window-size=1400,900',
  URL
], { stdio: ['ignore', 'ignore', fs.openSync(errLog, 'w')] });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getPage() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try {
          const pages = JSON.parse(d);
          const t = pages.find(p => p.type === 'page' && p.url.includes('localhost:8765'));
          t ? resolve(t) : reject(new Error('no page'));
        } catch (e) { reject(e); }
      });
    }).on('error', reject).setTimeout(2000, function () { this.destroy(new Error('timeout')); });
  });
}

(async () => {
  await sleep(3500);
  let target;
  for (let i = 0; i < 5; i++) { try { target = await getPage(); break; } catch (_) { await sleep(1000); } }
  if (!target) { console.log('NO TARGET'); edge.kill(); process.exit(2); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id; pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
      setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); reject(new Error('timeout')); } }, 10000);
    });
  }
  await new Promise(r => ws.addEventListener('open', r));
  await send('Runtime.enable');
  await send('Page.enable');

  // 等场景加载
  await sleep(3500);

  const results = [];
  for (const mode of ['tangent', 'secant', 'chord', 'scan']) {
    // 切模式
    await send('Runtime.evaluate', {
      expression: `(function(){
        const sel = document.querySelector('[data-mode]');
        if (!sel) return 'NO_SELECT';
        sel.value = '${mode}';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return 'OK';
      })()`,
      returnByValue: true
    });
    await sleep(800);
    // 读 mode + formula
    const r = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        mode: document.querySelector('[data-mode]')?.value,
        formulaText: document.querySelector('.mathw-lesson-formula')?.textContent || '',
        lessonHeadline: document.querySelector('.mathw-lesson-headline')?.textContent || '',
        lessonTextLen: document.querySelector('.mathw-lesson-text')?.textContent?.length || 0,
        canvasW: document.querySelector('canvas')?.width,
        canvasH: document.querySelector('canvas')?.height,
      })`,
      returnByValue: true
    });
    results.push({ mode, info: JSON.parse(r.result.value) });
  }

  // 切回 tangent 截屏
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sel = document.querySelector('[data-mode]');
      sel.value = 'tangent';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })() && null`,
    returnByValue: true
  });
  await sleep(800);

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(ss.data, 'base64'));
  console.log(`Screenshot: ${OUT} (${fs.statSync(OUT).size} bytes)`);

  console.log('\n--- 4 MODES ---');
  results.forEach(r => console.log(`[${r.mode.padEnd(8)}] ${JSON.stringify(r.info)}`));

  const allOK = results.every(r => r.info.mode === r.mode && r.info.formulaText.length > 10 && r.info.lessonTextLen > 100);
  console.log(`\n[${allOK ? 'OK' : 'FAIL'}] 4 modes all pass = ${allOK}`);

  ws.close();
  edge.kill();
  await sleep(500);
  fs.rmSync(udd, { recursive: true, force: true });
  process.exit(allOK ? 0 : 1);
})().catch(e => { console.log('FATAL', e.message); try { edge.kill(); } catch (_) {} process.exit(2); });
