// Runner headless do QA (porta propria 47000-48999, perfil temporario, uma aba, nunca 9222/9333).
// Uso: node test/resp/headless.mjs --script=arquivo.js [--pre=arquivo.js: roda antes da pagina carregar] [--origin=http://127.0.0.5:8080] [--size=360x780] [--shot=reports/qa/nome.png]
// O script e avaliado na pagina (await permitido); o valor devolvido vai para o console. Tenta ?debug=1&fresh=1 (sem save, sem conta online).
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const ORIGIN = arg('origin', 'http://127.0.0.5:8080'); const [W, H] = arg('size', '360x780').split('x').map(Number);
if (!/^http:\/\/(localhost|127\.0\.0\.\d+):\d+$/.test(ORIGIN)) { console.log('origem nao e local: abortado'); process.exit(3); }
const SCRIPT = arg('script', ''); const SHOT = arg('shot', ''); const QS = arg('qs', '?debug=1&fresh=1');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PORT = 47000 + Math.floor(Math.random() * 1999);
if (await fetch('http://127.0.0.1:' + PORT + '/json/version').then(() => true, () => false)) { console.log('porta em uso'); process.exit(3); }
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-prof-'));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore' });
const bye = c => { try { ch.kill(); } catch (e) {} setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} process.exit(c); }, 500); };
setTimeout(() => { console.log('WATCHDOG 8 min'); bye(2); }, 8 * 60 * 1000);
let ws, id = 0; const pend = {};
for (let i = 0; i < 80 && !ws; i++) { try {
  const v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json();
  if (!/^(Headless)?Chrome[/]/.test(v.Browser || '')) { console.log('alvo nao e meu Chrome'); bye(3); }
  const l = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); const p = l.find(x => x.type === 'page');
  if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) {} if (!ws) await sleep(250); }
if (!ws) { console.log('Chrome proprio nao respondeu'); bye(3); }
await new Promise(r => ws.onopen = r);
const SHOTDIR = path.dirname(SHOT || 'reports/qa/x.png'); let shotQ = Promise.resolve();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
  if (d.method === 'Runtime.bindingCalled' && d.params.name === 'qaShot') shotQ = shotQ.then(async () => { const s = await send('Page.captureScreenshot', { format: 'png' }); if (s.result) { fs.mkdirSync(SHOTDIR, { recursive: true }); const f = path.join(SHOTDIR, d.params.payload.replace(/[^\w.-]/g, '_') + '.png'); fs.writeFileSync(f, Buffer.from(s.result.data, 'base64')); console.log('print: ' + f); } }); };
const send = (method, params = {}, to = 30000) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend[i]) { delete pend[i]; r({ timeout: true }); } }, to); });
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: true });
await send('Page.enable'); const PRE = arg('pre', ''); if (PRE) await send('Page.addScriptToEvaluateOnNewDocument', { source: fs.readFileSync(PRE, 'utf8') }); await send('Runtime.enable'); await send('Runtime.addBinding', { name: 'qaShot' }); await send('Page.navigate', { url: ORIGIN + '/index.html' + QS }); await sleep(6000);
if (SCRIPT) { const r = await send('Runtime.evaluate', { expression: fs.readFileSync(SCRIPT, 'utf8'), returnByValue: true, awaitPromise: true }, 240000);
  console.log(JSON.stringify(r.result?.exceptionDetails ? { erro: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text } : r.result?.result?.value ?? r, null, 1).slice(0, 4000)); }
if (SHOT) { const s = await send('Page.captureScreenshot', { format: 'png' }); if (s.result) { fs.mkdirSync(path.dirname(SHOT), { recursive: true }); fs.writeFileSync(SHOT, Buffer.from(s.result.data, 'base64')); console.log('print: ' + SHOT); } }
await shotQ; bye(0);
