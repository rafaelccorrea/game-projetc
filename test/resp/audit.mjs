// AUDITORIA DE RESPONSIVIDADE E LEITURA (QA). Uso: node test/resp/audit.mjs [--sizes=320x640,360x780] [--only=vip,cfg] [--origin=http://127.0.0.4:8080]
// Abre TODAS as telas (painéis, telas de entrada, modais) em 5 tamanhos e salva reports/resp/<tela>_<largura>.png + reports/resp/resultado.json.
// Depois: node test/resp/relatorio.mjs gera reports/resp/RELATORIO.md.
// SEGURANÇA (incidente 12/11): porta de CDP PRÓPRIA (47000-48999), conferida livre; alvo conferido como Chrome headless; nunca 9222/9333.
// Só toca origem de teste local com ?debug=1&fresh=1 (fresh bloqueia save e online: não cria conta nem grava no servidor). Perfil do Chrome é temporário.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const SIZES = arg('sizes', '320x640,360x780,384x832,412x915,768x1024').split(',').map(s => s.split('x').map(Number));
const ONLY = arg('only', '') ? arg('only', '').split(',') : null;
const ORIGIN = arg('origin', 'http://127.0.0.4:8080');
if (!/^http:\/\/(localhost|127\.0\.0\.\d+):\d+$/.test(ORIGIN)) { console.log('origem não é local de teste: abortado'); process.exit(3); }
const OUT = path.resolve('reports/resp'); fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PORT = 47000 + Math.floor(Math.random() * 1999);
if (PORT === 9222 || PORT === 9333) process.exit(3);
if (await fetch('http://127.0.0.1:' + PORT + '/json/version').then(() => true, () => false)) { console.log('porta ' + PORT + ' em uso: abortado'); process.exit(3); }
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'resp-prof-'));
const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, '--window-size=800,1100', 'about:blank'], { stdio: 'ignore' });
const bye = c => { try { ch.kill(); } catch (e) {} try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} process.exit(c); };
let ws, id = 0; const pend = {};
for (let i = 0; i < 120 && !ws; i++) { try {
  const v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json();
  if (!/^(Headless)?Chrome[/]/.test(v.Browser || '') || /android|webview|eonbound/i.test(JSON.stringify(v))) { console.log('alvo não é o Chrome headless desta sessão: abortado'); bye(3); }
  const l = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); const p = l.find(x => x.type === 'page' && x.url === 'about:blank');
  if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch (e) {} if (!ws) await sleep(250); }
if (!ws) { console.log('Chrome próprio não respondeu: abortado'); bye(3); }
await new Promise(r => ws.onopen = r);
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
const send = (method, params = {}, to = 15000) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend[i]) { delete pend[i]; r({ timeout: true }); } }, to); });
setTimeout(() => { console.log('WATCHDOG 25 min'); bye(2); }, 25 * 60 * 1000);
const ev = async (expr, to) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, to); if (r.timeout) return { __err: 'timeout' }; return r.result?.exceptionDetails ? { __err: String(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text).slice(0, 200) } : r.result?.result?.value; };

/* VERIFICAÇÕES NA PÁGINA (devolve lista de defeitos {tipo, el, detalhe}) */
const CHECK = `(function(){
  const W=innerWidth,H=innerHeight,out=[]; const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
  const nm=e=>{let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(e.className&&typeof e.className==='string')s+='.'+e.className.trim().split(/\\s+/)[0];const t=(e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,28);return s+(t?' "'+t+'"':'');};
  const add=(tipo,e,d)=>{ if(out.length<400) out.push({tipo,el:nm(e),detalhe:d}); };
  const ex=e=>{let p=e;while(p&&p!==document.body){const t=(p.textContent||'').trim();if(/^(v0\\.\\d+\\.\\d+ era|MODO DONO)/.test(t)&&t.length<140)return true;p=p.parentElement;}return false;};
  const all=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE','CANVAS','BR','PATH','SVG','LINE','CIRCLE','RECT','G','POLYLINE','POLYGON','ELLIPSE','USE','DEFS','LINEARGRADIENT','STOP','IMG'].includes(e.tagName.toUpperCase())&&vis(e)&&!ex(e));
  const own=e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>0);
  const clipAnc=e=>{let p=e.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowX))return 'scroll';if(/(hidden|clip)/.test(s.overflowX)&&p.getBoundingClientRect().width<=W+1&&e.getBoundingClientRect().right>p.getBoundingClientRect().right+1)return 'clip';p=p.parentElement;}return null;};
  const de=document.documentElement; if(de.scrollWidth>W+1) add('rolagem-lateral',document.body,'scrollWidth '+de.scrollWidth+' > '+W);
  for(const e of all){ const r=e.getBoundingClientRect(),s=getComputedStyle(e),t=own(e);
    if(t){ const fs=parseFloat(s.fontSize); if(fs<11) add('letra-pequena',e,fs.toFixed(1)+'px');
      if(e.scrollWidth>e.clientWidth+1&&/(hidden|clip)/.test(s.overflowX)&&!/(auto|scroll)/.test(s.overflowX)) add('texto-cortado',e,'scrollWidth '+e.scrollWidth+' > clientWidth '+e.clientWidth+(s.textOverflow==='ellipsis'?' (reticências)':''));
      if(e.scrollHeight>e.clientHeight+2&&/(hidden|clip)/.test(s.overflowY)&&e.clientHeight>0) add('texto-cortado-v',e,'scrollHeight '+e.scrollHeight+' > clientHeight '+e.clientHeight);
      /* contraste */ let bg=null,p=e;while(p){const c=getComputedStyle(p).backgroundColor;const m=c.match(/[\\d.]+/g);if(m&&(m.length<4||+m[3]>0.9)){bg=m.map(Number);break;}if(getComputedStyle(p).backgroundImage!=='none'){bg='img';break;}p=p.parentElement;}
      if(bg&&bg!=='img'){const fc=(s.color.match(/[\\d.]+/g)||[]).map(Number);const L=c=>{const f=c.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2];};const a=L(fc),b=L(bg),ra=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); if(ra<3&&(fc[3]===undefined||fc[3]>0.5)) add('contraste-baixo',e,ra.toFixed(2)+':1'); } }
    const pc=e.parentElement?getComputedStyle(e.parentElement).cursor:'';
    const clk=e.matches('button,a,[role=button],input,select,label[for]')||(s.cursor==='pointer'&&pc!=='pointer')||typeof e.onclick==='function';
    if(clk&&e.children.length<12&&(r.width<40||r.height<40)&&!(e.parentElement&&e.parentElement.closest('button,a,[role=button]'))&&s.pointerEvents!=='none') add('botao-pequeno',e,Math.round(r.width)+'x'+Math.round(r.height));
    const vr=(()=>{let L=r.left,T=r.top,R=r.right,B=r.bottom,p=e.parentElement;while(p&&p!==document.documentElement){const ps=getComputedStyle(p);if(ps.overflowX!=='visible'||ps.overflowY!=='visible'){const q=p.getBoundingClientRect();if(ps.overflowX!=='visible'){L=Math.max(L,q.left);R=Math.min(R,q.right);}if(ps.overflowY!=='visible'){T=Math.max(T,q.top);B=Math.min(B,q.bottom);}}p=p.parentElement;}return {left:L,right:R,top:T,bottom:B};})();
    const ca=clipAnc(e); if(ca!=='scroll'&&vr.right-vr.left>1&&vr.bottom-vr.top>1&&(vr.right>W+1||vr.left<-1)&&s.pointerEvents!=='none') add('fora-da-tela',e,'left '+Math.round(vr.left)+' right '+Math.round(vr.right)+' (largura '+W+')');
    if(clk&&r.top<10&&r.top>-1&&r.height<60) add('barra-de-status',e,'topo a '+Math.round(r.top)+'px (área do entalhe)');
    if(clk&&r.bottom>H-6&&r.bottom<=H+1&&r.height<80) add('barra-inferior',e,'base a '+Math.round(H-r.bottom)+'px do fim (gesto/entalhe)'); }
  /* sobreposição: folhas com texto ou botões */
  const leaves=all.filter(e=>(own(e)||e.matches('button,a,[role=button]'))&&e.getBoundingClientRect().width>6).slice(0,350);
  for(let i=0;i<leaves.length;i++)for(let j=i+1;j<leaves.length;j++){const a=leaves[i],b=leaves[j];if(a.contains(b)||b.contains(a))continue;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();const ox=Math.min(x.right,y.right)-Math.max(x.left,y.left),oy=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);if(ox>4&&oy>4){const ar=Math.min(x.width*x.height,y.width*y.height);if(ox*oy>0.3*ar){const za=getComputedStyle(a).position,zb=getComputedStyle(b).position;if(za==='static'&&zb==='static')add('sobreposicao',a,'cobre '+nm(b)+' ('+Math.round(100*ox*oy/ar)+'% do menor)');else add('sobreposicao',a,'cobre '+nm(b)+' ('+Math.round(100*ox*oy/ar)+'%)');}}}
  return out; })()`;

const results = []; let nshots = 0;
async function setSize(w, h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true }); }
async function boot(w, h) {
  await setSize(w, h);
  await send('Page.navigate', { url: ORIGIN + '/index.html?debug=1&fresh=1&nc=resp' }); await sleep(2500);
  await ev("try{localStorage.setItem('eon_owner_mode','1')}catch(e){}; 1"); await send('Page.navigate', { url: ORIGIN + '/index.html?debug=1&fresh=1&nc=resp2' }); await sleep(9000);
  await tap(w / 2, h - 45); await sleep(3000);
  const st = await ev("typeof PIntro!=='undefined'?(PIntro.id||'sem-id'):'sem PIntro'"); return st; }
async function tap(x, y) { for (const t of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', clickCount: 1 }); }
async function shot(name, w) { const r = await send('Page.captureScreenshot', { format: 'png' }, 20000); if (r.result?.data) { fs.writeFileSync(path.join(OUT, name + '_' + w + '.png'), Buffer.from(r.result.data, 'base64')); nshots++; return true; } return false; }
async function audit(name, w, h, open, close) {
  const o = await ev(open, 12000); if (o && o.__err) { results.push({ tela: name, w, h, erro: 'não abriu: ' + o.__err, defeitos: [] }); console.log(' ', name, w, 'NÃO ABRIU', o.__err); return; }
  await sleep(1400); const defs = await ev(CHECK, 20000); const ok = await shot(name, w);
  results.push({ tela: name, w, h, print: ok ? 'reports/resp/' + name + '_' + w + '.png' : null, defeitos: Array.isArray(defs) ? defs : [{ tipo: 'verificacao', el: '-', detalhe: JSON.stringify(defs) }] });
  console.log(' ', name, w, Array.isArray(defs) ? defs.length + ' achados' : 'erro verificação'); if (close) await ev(close, 8000); await sleep(300); }

console.log('porta CDP', PORT, 'origem', ORIGIN, 'tamanhos', SIZES.map(s => s.join('x')).join(' '));
for (const [w, h] of SIZES) {
  console.log('== tamanho', w + 'x' + h); const st = await boot(w, h); console.log('boot:', JSON.stringify(st));
  /* lista dinâmica de telas do jogo */
  const lst = await ev("JSON.stringify({scr:Object.keys(Screens.reg||{}),pan:Object.keys(Panels.defs||{}),pi:(typeof PI_SCREENS!=='undefined'?Object.keys(PI_SCREENS):[])})");
  let L = { scr: [], pan: [], pi: [] }; try { L = JSON.parse(lst); } catch (e) { console.log('lista falhou', JSON.stringify(lst)); }
  /* 1) telas de entrada (PIntro) — antes de entrar no jogo */
  for (const pid of L.pi) { if (ONLY && !ONLY.includes('pi_' + pid)) continue;
    await audit('pi_' + pid, w, h, "PIntro.show(" + JSON.stringify(pid) + ", {}) ? 'ok' : 'não existe'", null); }
  await ev("try{PIntro.finish&&PIntro.finish()}catch(e){}; 1"); await sleep(3500);
  await ev("window.__noSave=true; try{S.tut=99; if(window.Guide&&Guide.skip)Guide.skip();}catch(e){}; try{[...document.querySelectorAll('button,div')].filter(function(x){return /^Pular$/.test((x.textContent||'').trim())}).forEach(function(x){x.click()})}catch(e){}; (function(){try{var b=[...document.querySelectorAll('button,a,div')].find(function(x){return /^Coletar/.test((x.textContent||'').trim())&&x.children.length<4});if(b)b.click()}catch(e){}})(); 1"); await sleep(800);
  const closeAll = "(function(){try{Screens.close&&Screens.close()}catch(e){};try{Panels.close&&Panels.close()}catch(e){};try{setView('battle')}catch(e){}; return 1})()";
  await audit('batalha', w, h, "setView('battle'), 'ok'", null);
  /* 2) telas (Screens) e painéis (Panels) */
  const done = new Set();
  for (const s of L.scr) { if (ONLY && !ONLY.includes(s)) continue; done.add(s); await audit('tela_' + s, w, h, "Screens.open(" + JSON.stringify(s) + "), 'ok'", closeAll); }
  for (const p of L.pan) { if (done.has(p) || (ONLY && !ONLY.includes(p))) continue; if (['era', 'intro', 'guidehud'].includes(p)) continue; await audit('painel_' + p, w, h, "Panels.open(" + JSON.stringify(p) + "), 'ok'", closeAll); }
  /* 3) casos especiais */
  const sp = [
    ['gear_equipamento', "setView('gear'), 'ok'"],
    ['loja', "Screens.open('shop'), 'ok'"],
    ['passe', "Screens.open('pass'), 'ok'"],
    ['troca_de_era', "Panels.open('era',{from:0,to:1,boss:'Rex',gems:50,essence:1,onDone:function(){}}), 'ok'"],
    ['derrota', "setView('battle'), dbgResult('lose'), 'ok'"],
    ['vitoria', "setView('battle'), dbgResult('win'), 'ok'"],
  ];
  for (const [n, o] of sp) { if (ONLY && !ONLY.includes(n)) continue; await audit(n, w, h, o, closeAll); }
  await send('Page.navigate', { url: 'about:blank' }); await sleep(500);
}
fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify({ gerado: new Date().toISOString(), origem: ORIGIN, tamanhos: SIZES, resultados: results }, null, 1));
console.log('FIM: ' + results.length + ' telas×tamanhos, ' + nshots + ' prints, ' + results.reduce((a, r) => a + r.defeitos.length, 0) + ' achados');
bye(0);
