// Servidor de DESENVOLVIMENTO do Eonbound, com RECARGA AO VIVO para o celular (pedido do dono: "ver as atualizações em tempo real, como o hot reload").
// Uso: node tools/dev-server.js [pasta] [porta]          (padrão: a pasta do jogo e a porta 8080)
//
// - Serve os arquivos do jogo como o servidor simples de sempre.
// - Vigia js/, assets/, index.html, sw.js e arquivos .css. Quando um muda, avisa as páginas ligadas (Server-Sent Events em /__dev/live).
// - A página SÓ recebe o script de recarga quando vem do app de desenvolvimento (User-Agent com "EonboundDev", posto pelo capacitor.config da
//   variante dev) ou quando a URL traz ?live=1. Navegadores comuns (os testes do QA) recebem o index.html intacto e NÃO recarregam sozinhos.
// - O script é injetado na RESPOSTA: nenhum arquivo do jogo muda, então a versão da loja nunca leva recarga ao vivo.
// - O save fica no armazenamento da página (localStorage) e sobrevive à recarga. Antes de recarregar a página chama save() se existir.
// - Para quem recebe a recarga, o sw.js responde 404: o service worker não registra e não guarda arquivo velho.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..')), port = +(process.argv[3] || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.woff2': 'font/woff2' };
const LIVE_PATH = '/__dev/live';
const clients = new Set();
const isLive = (req, u) => /EonboundDev/i.test(req.headers['user-agent'] || '') || u.searchParams.get('live') === '1';

/* script que a página dev recebe: liga no SSE; "reload" recarrega (guardando o save antes), "css" troca só as folhas de estilo; se o servidor cair, tenta de novo */
const CLIENT = `<script>(function(){ if(window.__eonLive) return; window.__eonLive=true;
  var pill=null; function note(t){ try{ if(!pill){ pill=document.createElement('div'); pill.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:99999;pointer-events:none;padding:4px 10px;border-radius:10px;background:rgba(0,0,0,.72);color:#ffe07a;font:800 11px system-ui,sans-serif'; document.body.appendChild(pill); } pill.textContent=t; pill.style.display='block'; clearTimeout(pill._t); pill._t=setTimeout(function(){ pill.style.display='none'; },1600); }catch(e){} }
  function reload(){ try{ if(typeof save==='function') save(); }catch(e){} try{ var t=document.getElementById('title'); if(typeof S!=='undefined'&&S&&S.name&&(!t||t.style.display==='none')) sessionStorage.setItem('eonLiveReload','1'); }catch(e){} note('Atualizando...'); setTimeout(function(){ location.reload(); },120); }
  function css(){ try{ var l=document.querySelectorAll('link[rel="stylesheet"]'), n=0; for(var i=0;i<l.length;i++){ var h=l[i].getAttribute('href')||''; if(/^https?:/.test(h)&&h.indexOf(location.host)<0) continue; l[i].setAttribute('href',h.replace(/([?&])_live=\\d+/,'').replace(/[?&]$/,'')+(h.indexOf('?')>=0?'&':'?')+'_live='+Date.now()); n++; } if(!n) reload(); else note('Estilo atualizado'); }catch(e){ reload(); } }
  function go(){ var es; try{ es=new EventSource('${LIVE_PATH}'); }catch(e){ return; }
    es.addEventListener('reload',reload); es.addEventListener('css',css); es.addEventListener('hello',function(){ note('Recarga ao vivo ligada'); });
    es.onerror=function(){ try{ es.close(); }catch(e){} setTimeout(go,2000); }; }
  go(); })();</script>`;

function resolveFile(urlPath) {
  let rel; try { rel = decodeURIComponent(urlPath); } catch (e) { return null; }
  const full = path.normalize(path.join(root, rel));
  if (full !== root && !full.startsWith(root + path.sep)) return null;      // sem sair da pasta
  const tries = [full, full + '.html', path.join(full, 'index.html')];
  for (const f of tries) { try { if (fs.statSync(f).isFile()) return f; } catch (e) {} }
  return null;
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === LIVE_PATH) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
    res.write('retry: 2000\nevent: hello\ndata: 1\n\n'); clients.add(res);
    const off = () => { clients.delete(res); }; req.on('close', off); res.on('error', off); return;
  }
  if (u.pathname === '/__dev/ping') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); return res.end('eonbound-dev ' + clients.size); }   // o tools/dev-celular.cmd usa para saber se este servidor já está no ar
  const live = isLive(req, u);
  if (live && u.pathname === '/sw.js') { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end('sem service worker no modo de desenvolvimento'); }
  const file = resolveFile(u.pathname);
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  const ext = path.extname(file).toLowerCase();
  const head = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': live ? 'no-store' : 'no-cache', 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' };
  if (live && ext === '.html') {      // página do app dev: injeta o script de recarga na resposta (o arquivo em disco não muda)
    let html; try { html = fs.readFileSync(file, 'utf8'); } catch (e) { res.writeHead(500); return res.end('erro'); }
    const i = html.lastIndexOf('</body>'); html = i >= 0 ? html.slice(0, i) + CLIENT + html.slice(i) : html + CLIENT;
    const buf = Buffer.from(html, 'utf8'); delete head['Accept-Ranges'];
    res.writeHead(200, { ...head, 'Content-Length': buf.length }); return res.end(req.method === 'HEAD' ? undefined : buf);
  }
  const st = fs.statSync(file);
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    const start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, 'Content-Length': st.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(port, '0.0.0.0', () => console.log('Eonbound DEV em http://localhost:' + port + ' servindo ' + root + ' (recarga ao vivo para o app dev e para ?live=1)'));

/* VIGIA DOS ARQUIVOS: só o que o jogo carrega. Várias gravações seguidas (um commit, um salvar do editor) viram UM aviso (espera QUIET_MS de silêncio).
   Só .css mudou = troca de estilo sem recarregar; qualquer outra coisa = recarga. Arquivo temporário de editor (~, .tmp, .swp) é ignorado. */
const WATCH = ['js', 'assets', 'css'], FILES = new Set(['index.html', 'sw.js']);
const QUIET_MS = 4000;   /* pedido do dono (recarregava a cada arquivo): só recarrega depois de 4 s sem nenhuma gravação */
let timer = null, onlyCss = true, count = 0;
function changed(rel) {
  rel = String(rel || '').replace(/\\/g, '/'); if (!rel || /(~|\.tmp|\.swp|\.crdownload|\.lock)$/i.test(rel) || /(^|\/)\./.test(rel)) return;
  if (!/\.css$/i.test(rel)) onlyCss = false; count++;
  clearTimeout(timer); timer = setTimeout(() => {
    const ev = onlyCss ? 'css' : 'reload', n = count; onlyCss = true; count = 0;
    if (clients.size) console.log(new Date().toLocaleTimeString() + '  ' + n + ' arquivo(s) mudaram: ' + (ev === 'css' ? 'estilo trocado' : 'recarregando') + ' em ' + clients.size + ' tela(s)');
    for (const c of clients) { try { c.write('event: ' + ev + '\ndata: ' + Date.now() + '\n\n'); } catch (e) { clients.delete(c); } }
  }, QUIET_MS);
}
for (const d of WATCH) { const dir = path.join(root, d); try { if (fs.statSync(dir).isDirectory()) fs.watch(dir, { recursive: true }, (t, f) => changed(d + '/' + (f || ''))); } catch (e) {} }
try { fs.watch(root, (t, f) => { if (f && (FILES.has(String(f)) || /\.css$/i.test(String(f)))) changed(String(f)); }); } catch (e) {}
setInterval(() => { for (const c of clients) { try { c.write(': ping\n\n'); } catch (e) { clients.delete(c); } } }, 20000);   // mantém a ligação viva pelo adb reverse
