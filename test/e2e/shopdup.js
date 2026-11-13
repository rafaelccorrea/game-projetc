'use strict';
/* LOJA DO DIA SEM ITEM REPETIDO (QA no S24). Sem navegador: node test/e2e/shopdup.js
   Monta o estoque do dia em 7 eras × 40 dias de mentira e confere: 6 ofertas; nenhuma repete espaço + raridade + era de outra do mesmo dia (o sorteio tenta de novo até 8 vezes);
   o estoque do mesmo dia e era é sempre o MESMO (gerador do dia). Sai com código 1 se falhar. */
const boot = require('./sandbox');
(async () => {
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const r = ev(`(function(){ const out={days:0,dups:0,bad:[],same:true,n:[]}; const D0=Date; let fake=0; globalThis.Date=class extends D0{ constructor(...a){ if(a.length) super(...a); else super(fake); } static now(){ return fake; } };   /* o dia do jogo (todayKey) lê new Date(): o teste anda o calendário */
    for(let era=0;era<7;era++) for(let d=1;d<=40;d++){ const key='dia '+d+' era '+era; fake=new D0(2030,0,d,12).getTime(); S.eraMax=era; S.shop=null; ensureShop(); const a=JSON.stringify(S.shop.offers.map(o=>o.slot+'|'+o.r+'|'+o.e));
      const ks=S.shop.offers.map(o=>o.slot+'|'+o.r+'|'+o.e), u=new Set(ks); out.days++; out.n.push(ks.length); if(u.size!==ks.length){ out.dups++; if(out.bad.length<3) out.bad.push(key+': '+ks.join(' ')); }
      S.shop=null; ensureShop(); if(JSON.stringify(S.shop.offers.map(o=>o.slot+'|'+o.r+'|'+o.e))!==a) out.same=false; }
    globalThis.Date=D0; S.shop=null; return out; })()`);
  const ok = r.days === 280 && r.dups === 0 && r.same && r.n.every(x => x === 6);
  console.log(ok ? 'LOJA DO DIA OK: ' + r.days + ' estoques (7 eras × 40 dias), 6 ofertas cada, nenhuma repetida, estoque do dia estável' : 'FALHA loja do dia: ' + JSON.stringify(r).slice(0, 600));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
