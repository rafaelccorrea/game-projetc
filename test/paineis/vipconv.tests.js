/* Testes das TELAS das conveniências do VIP (mochila, bloco "Automático" do Equipamento, forja automática). Carregado pelo smoke.js dentro do
   mesmo vm do jogo (não roda sozinho). Cada função devolve um texto curto ou LANÇA erro. O nível de VIP é escrito direto no save (S.sys.vip),
   sem Sys.vip.setLevel, para não disparar prêmios de nível; tudo é devolvido como estava no fim de cada teste.
   No smoke.js o relógio não anda (setTimeout não roda): o laço da forja automática só é exercitado no smoke_all.js (flushT). */
var VIPCONV_TESTS=(function(){
  function withVip(n,fn){ const s0=S.sys&&S.sys.vip, v0=S.vip, p0=S.set&&S.set.vipAuto?JSON.stringify(S.set.vipAuto):null; let out, err=null;
    try{ if(!S.sys) S.sys={}; S.sys.vip={level:n,active:n>=1,points:0}; out=fn(); }catch(e){ err=e; }
    if(s0===undefined) delete S.sys.vip; else S.sys.vip=s0; S.vip=v0; if(p0===null){ if(S.set) delete S.set.vipAuto; } else S.set.vipAuto=JSON.parse(p0);
    XG.auto=false; XG.autoMsg=''; XG.sel=null; XG.tw=null; XG.toast='';
    if(err) throw err; return out; }
  const gear=()=>{ XG.sel=null; XG.tw=null; XG.cf=null; view='gear'; render(); return V_TEST.innerHTML; };
  const bad=h=>{ if(/undefined|NaN|\[object/.test(h)) throw new Error('undefined/NaN no HTML: '+(h.match(/.{50}(undefined|NaN|\[object).{30}/)||[''])[0]); if(/R\$|comprar vip|preço/i.test(h)) throw new Error('texto de preço/comprar VIP na tela'); return h; };
  const click=(x,extra)=>gClick({dataset:Object.assign({x:x},extra||{})});
  const bagRow=()=>Sys.vip.convTable().find(x=>x.id==='bag');
  const need=id=>Sys.vip.conv(S,id).need;
  const T={};

  T['mochila: contador pelo bagMax e chip do próximo bônus']=function(){
    if(typeof bagMax!=='function') throw new Error('bagMax não carregou'); if(!xVipConvOn()) return 'chave convOn desligada: sem chip (comportamento de antes)';
    const vals=bagRow().values, out=[]; let first=-1, last=0; for(let i=0;i<vals.length;i++){ if(first<0&&vals[i]>0) first=i; if(vals[i]>vals[last]) last=i; }
    for(const lv of [0,first,last]) withVip(lv,function(){ const h=bad(gear()), want='Mochila '+S.inv.length+'/'+bagMax();
      if(bagMax()!==BAG_MAX+vals[lv]) throw new Error('bagMax '+bagMax()+' no VIP '+lv);
      if(h.indexOf(want)<0) throw new Error('VIP '+lv+': contador sem "'+want+'"');
      const nx=xBagNext(); let exp=null; for(let i=lv+1;i<vals.length;i++) if(vals[i]>vals[lv]){ exp='VIP '+i+': +'+vals[i]; break; }
      if((nx?nx.text:null)!==exp) throw new Error('VIP '+lv+': chip "'+(nx&&nx.text)+'", esperado "'+exp+'"');
      if(exp){ if(h.indexOf('data-x="bagvip"')<0||h.indexOf(exp)<0) throw new Error('VIP '+lv+': chip fora da tela'); XG.toast=''; click('bagvip'); if(String(XG.toast).indexOf('VIP '+nx.vip)<0||/R\$/.test(XG.toast)) throw new Error('toque no chip não explicou: '+XG.toast); }
      else if(h.indexOf('data-x="bagvip"')>=0) throw new Error('VIP '+lv+': chip sobrando no maior nível');
      out.push('VIP '+lv+': '+want.slice(8)+(exp?' ['+exp+']':' [sem chip]')); });
    return out.join(' · '); };

  T['mochila: loja recusa a compra pelo bagMax']=function(){
    return withVip(0,function(){ const inv0=S.inv, sh0=S.shop, g0=S.gold; let err=null, r='';
      try{ const base=inv0[0]; S.inv=[]; for(let i=0;i<bagMax();i++) S.inv.push(base);
        S.shop=Object.assign({},S.shop,{offers:[{slot:'weapon',r:0,e:0,price:1,sold:false}]}); S.gold=1e6; XH.tab='item'; XH.cf={kind:'item',i:0}; view='shop'; hClick({dataset:{x:'cfyes'}});
        if(S.shop.offers[0].sold||S.gold!==1e6) throw new Error('comprou com a mochila cheia ('+S.inv.length+'/'+bagMax()+')'); r='cheia em '+bagMax()+': recusou';
        S.sys.vip={level:bagRow().values.findIndex(v=>v>0),active:true,points:0}; if(!(S.inv.length<bagMax())) throw new Error('VIP não abriu espaço'); r+='; com VIP o limite vai a '+bagMax();
      }catch(e){ err=e; } S.inv=inv0; S.shop=sh0; S.gold=g0; XH.cf=null; if(err) throw err; return r; }); };

  T['automático: trancado mostra VIP n, explica e não liga']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn: bloco não existe';
    return withVip(0,function(){ const lt=Sys.vip.conv(S,'autoSell').lockText; let h=bad(gear());
      if(h.indexOf('data-x="auto"')<0) throw new Error('entrada Automático escondida para quem não tem VIP'); if(h.indexOf(lt)<0) throw new Error('entrada sem "'+lt+'"');
      click('auto'); h=bad(V_TEST.innerHTML); if(!XG.auto||h.indexOf('role="dialog" aria-label="Automático"')<0) throw new Error('não abriu');
      if(/autoEquip|Equipar o melhor sozinho/.test(h)) throw new Error('interruptor de equipar sozinho na tela (decisão do dono: não é de VIP)');
      for(const k of ['autoSell0','autoSell1']) if(h.indexOf('data-k="'+k+'"')<0) throw new Error('sem o interruptor '+k);
      if(h.indexOf('Desmanchar ao pegar: Básico')<0||h.indexOf('Desmanchar ao pegar: Raro')<0) throw new Error('nomes dos interruptores');
      const fuse=!!VipAuto.state(S).autoFuse.available; if((h.indexOf('data-k="autoFuse"')>=0)!==fuse) throw new Error('Fusão: interruptor '+(fuse?'faltando':'sobrando'));
      if(h.indexOf('itens novos e nunca toca no equipado')<0) throw new Error('sem a linha de ajuda'); if(h.indexOf('Ir à Loja')<0) throw new Error('sem Ir à Loja');
      click('autosw',{k:'autoSell0'}); const p=VipAuto.prefs(S); if(p.autoSell[0]||p.autoSell[1]) throw new Error('ligou sem VIP');
      if(String(XG.autoMsg).indexOf(lt)<0) throw new Error('recusa sem o texto: '+XG.autoMsg); h=bad(V_TEST.innerHTML); if(h.indexOf(esc2(XG.autoMsg))<0) throw new Error('aviso fora da tela');
      if(/aria-checked="true"/.test(h.slice(h.indexOf('aria-label="Automático"')))) throw new Error('interruptor aparece ligado');
      const msg=XG.autoMsg; click('autox'); if(XG.auto) throw new Error('não fechou'); return 'trancado com '+lt+'; aviso "'+msg.slice(0,70)+'"'; }); };

  T['automático: com o nível liga e desliga pelo VipAuto.setPref']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn';
    return withVip(need('autoSell'),function(){ gear(); click('auto'); let h=bad(V_TEST.innerHTML); if(h.indexOf('Trancado')>=0&&!VipAuto.state(S).autoFuse.available) throw new Error('ainda trancado no VIP '+need('autoSell'));
      if(h.indexOf('Ir à Loja')>=0) throw new Error('Ir à Loja sem nada trancado');
      click('autosw',{k:'autoSell0'}); let p=VipAuto.prefs(S); if(!p.autoSell[0]||p.autoSell[1]) throw new Error('Básico não ligou sozinho: '+JSON.stringify(p));
      h=bad(V_TEST.innerHTML); if(!/data-k="autoSell0" role="switch" aria-checked="true"/.test(h)||!/data-k="autoSell1" role="switch" aria-checked="false"/.test(h)) throw new Error('estado dos interruptores no HTML');
      click('autosw',{k:'autoSell1'}); p=VipAuto.prefs(S); if(!p.autoSell[0]||!p.autoSell[1]) throw new Error('Raro não ligou');
      click('autox'); h=bad(gear()); if(h.indexOf('2 ligados')<0) throw new Error('entrada não conta os ligados');
      click('auto'); click('autosw',{k:'autoSell0'}); click('autosw',{k:'autoSell1'}); p=VipAuto.prefs(S); if(p.autoSell[0]||p.autoSell[1]) throw new Error('não desligou');
      click('autosw',{k:'autoEquip'}); if(VipAuto.prefs(S).autoEquip) throw new Error('chave autoEquip aceita pela tela');
      return 'ligou Básico, Raro; contou 2 ligados; desligou'; }); };

  T['automático: Ir à Loja leva à Loja e o bloco fecha']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn';
    /* o setView real do index não roda no DOM falso (app.style.setProperty): troca por um registrador só durante o toque */
    return withVip(0,function(){ gear(); click('auto'); const sv=setView; let got=null, err=null; setView=function(v){ got=v; }; try{ click('autoshop'); }catch(e){ err=e; } setView=sv; if(err) throw err;
      if(got!=='shop') throw new Error('foi para "'+got+'"'); if(XG.auto) throw new Error('bloco ficou aberto'); return 'setView(shop); bloco fechado'; }); };

  /* ---------- forja automática ---------- */
  function forgeEnv(vip,fn){ const L=Sys.level, iu=L&&L.isUnlocked, f0=JSON.stringify(Sys.forge.ensure(S)), g0=S.gold, x0={mode:XF.mode,slot:XF.slot,goal:XF.goal}, v0=view;
    return withVip(vip,function(){ let out, err=null; try{ if(L) L.isUnlocked=function(){ return true; }; fStop(); XF.mode='forge'; XF.slot='weapon'; XF.goal=null; XF.toast=''; view='forge'; S.gold=5e9;
        const o=Sys.forge.ensure(S); o.lv.weapon=0; o.pity.weapon=0; o.stones=5000; out=fn(o); }catch(e){ err=e; }
      fStop(); if(typeof flushT==='function') flushT(); if(L) L.isUnlocked=iu; S.sys.forge=JSON.parse(f0); S.gold=g0; XF.mode=x0.mode; XF.slot=x0.slot; XF.goal=x0.goal; XF.toast=''; view=v0; if(err) throw err; return out; }); }
  const fc=(x,extra)=>fClick({dataset:Object.assign({x:x},extra||{})});
  const runAll=()=>{ if(typeof flushT!=='function') return false; for(let i=0;i<80&&(XF.busy||(XF.auto&&XF.auto.run));i++) flushT(); return true; };

  T['forja automática: trancada mostra VIP n, explica e não forja']=function(){
    const cv=Sys.vip.conv(S,'autoForge'); if(!xVipConvOn()||!cv) return 'sem a conveniência';
    return forgeEnv(0,function(o){ render(); const h=bad(V_TEST.innerHTML), lt=Sys.vip.conv(S,'autoForge').lockText;
      if(h.indexOf('data-x="autogo"')<0) throw new Error('forja automática escondida'); if(h.indexOf(lt)<0) throw new Error('sem "'+lt+'"'); if(h.indexOf('data-x="goal"')>=0) throw new Error('seletor de alvo aparece trancado');
      const t0=o.tries, s0=o.stones; fc('autogo'); runAll(); if(o.tries!==t0||o.stones!==s0||XF.auto) throw new Error('forjou sem VIP');
      /* E3: a explicação abre DENTRO da linha trancada; nenhum aviso flutuante (cobria o rótulo "Arma +0: Sem aura") */
      if(XF.toast) throw new Error('aviso flutuante na forja trancada: '+XF.toast); const h2=bad(V_TEST.innerHTML), m=h2.match(/id="f_locktip"[^>]*>([^<]*)</);
      if(!m||m[1].indexOf(lt)<0||m[1].indexOf('Loja')<0) throw new Error('linha trancada sem a explicação: '+(m&&m[1])); if(h2.indexOf('f-toast')>=0) throw new Error('aviso flutuante no HTML');
      fc('autogo'); if(V_TEST.innerHTML.indexOf('id="f_locktip"')>=0) throw new Error('segundo toque não recolheu'); return 'trancada com '+lt+'; explicação na linha: "'+m[1].slice(0,50)+'"'; }); };

  /* E1 + E2 (QA, 288 px): em tela estreita a FC aparece inteira (Aparência vira só o retrato de 46 px) e a linha do contador não tem texto cortado */
  T['estreito: FC inteira e linha da mochila sem corte']=function(){
    return withVip(0,function(){ const h=bad(gear()), W=V_TEST.clientWidth, slim=W<360, hint=h.indexOf('arraste o item até o espaço')>=0, chip=h.indexOf('data-x="bagvip"')>=0;
      const m=h.match(/data-x="(?:look|goskins)"[^>]*style="width:(\d+)px/); if(!m) throw new Error('botão Aparência não achado'); const bw=+m[1];
      const row=W-24-16-2-6, fcBox=row-bw, need=4+16+Math.ceil(Math.max(xTxtEm('FORÇA DE COMBATE')*9,xTxtEm(fcTxt(heroFC()))*25));   /* borda + respiro + o maior entre o rótulo (9 px) e o valor (25 px); o raio sai quando não cabe (teste "FC inteira") */
      if(slim){ if(bw!==46) throw new Error('Aparência com '+bw+' px em tela de '+W); if(fcBox<need) throw new Error('caixa da FC com '+fcBox+' px, precisa de '+need); if(hint) throw new Error('dica de arrastar na tela estreita (corta)');
        if(/Coleção de skins/.test(h)&&!/display:none;flex-direction:column/.test(h)) throw new Error('texto da skin visível no botão estreito'); }
      else { if(bw<168) throw new Error('largura normal mudou: Aparência com '+bw+' px'); if(chip&&hint) throw new Error('chip e dica na mesma linha (a dica corta)'); }
      if(chip&&h.indexOf('flex-wrap:wrap')<0) throw new Error('linha do contador sem quebra');
      if(!/aria-label="(Aparência|Skin equipada)/.test(h)) throw new Error('botão sem aria-label'); return W+' px: Aparência '+bw+' px, caixa da FC '+fcBox+' px (precisa '+need+'); chip='+chip+', dica='+hint; }); };

  T['forja automática: seletor de alvo respeita mínimo e teto']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ render(); let h=bad(V_TEST.innerHTML); if(h.indexOf('data-x="goal"')<0||h.indexOf('Forjar até +1')<0) throw new Error('sem seletor/botão (alvo inicial +1)');
      fc('goal',{d:'-1'}); if(fGoal('weapon')!==1) throw new Error('alvo abaixo do próximo nível'); const mx=fGoalMax(); for(let i=0;i<30;i++) fc('goal',{d:'1'});
      if(fGoal('weapon')!==mx) throw new Error('alvo '+fGoal('weapon')+' em vez do teto '+mx); h=bad(V_TEST.innerHTML); if(h.indexOf('Forjar até +'+mx)<0) throw new Error('botão sem o alvo novo');
      return 'alvo de +1 a +'+mx+' (teto da era/máximo)'; }); };

  T['forja automática: vai até o alvo, nunca passa, resumo confere']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ const goal=Math.min(5,fGoalMax()); render(); for(let i=1;i<goal;i++) fc('goal',{d:'1'}); if(fGoal('weapon')!==goal) throw new Error('alvo '+fGoal('weapon'));
      const t0=o.tries, s0=o.spent, g0=S.gold; fc('autogo'); const A=XF.auto; if(!A||!A.run||A.tries!==1) throw new Error('não começou: '+JSON.stringify(A));
      let h=bad(V_TEST.innerHTML); if(h.indexOf('data-x="autostop"')<0||h.indexOf('Forjando até +'+goal)<0) throw new Error('sem progresso/Parar');
      const lvMid=o.lv.weapon; fc('forge'); fc('slot',{slot:'armor'}); fc('mode',{m:'level'}); if(o.tries!==t0+1||XF.slot!=='weapon'||XF.mode!=='forge') throw new Error('toque valeu durante a automática');
      if(!runAll()) return 'sem relógio neste teste: 1º passo feito (nível '+lvMid+'), progresso e Parar na tela';
      if(A.run) throw new Error('não terminou'); if(o.lv.weapon!==goal) throw new Error('parou em +'+o.lv.weapon+' (alvo +'+goal+')'); if(A.why!=='goal'||A.to!==goal) throw new Error('motivo '+A.why);
      if(A.tries!==o.tries-t0||A.stones!==o.spent-s0||A.wins!==goal) throw new Error('resumo não bate: '+JSON.stringify(A)+' × '+(o.tries-t0)+' tentativas, '+(o.spent-s0)+' pedras');
      if(Math.abs((g0-S.gold)-A.gold)>0.5) throw new Error('ouro do resumo '+A.gold+' × gasto '+(g0-S.gold));
      h=bad(V_TEST.innerHTML); if(h.indexOf('id="f_autosum"')<0||h.indexOf('Chegou ao alvo')<0||h.indexOf('data-x="autostop"')>=0) throw new Error('resumo fora da tela');
      return '+0 → +'+goal+' em '+A.tries+' tentativas, '+A.wins+' acertos, '+A.stones+' pedras'; }); };

  T['forja automática: Parar interrompe; sem pedra para e avisa']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ const mx=fGoalMax(); if(mx<3) return 'teto baixo demais para o teste'; render(); for(let i=0;i<30;i++) fc('goal',{d:'1'});
      const t0=o.tries; fc('autogo'); fc('autostop'); const A=XF.auto; if(!A||A.run||A.why!=='stop') throw new Error('Parar não parou'); const clock=runAll();
      if(o.tries!==t0+1) throw new Error('tentou de novo depois do Parar: '+(o.tries-t0)); if(clock&&bad(V_TEST.innerHTML).indexOf('Parada por você')<0) throw new Error('resumo do Parar');
      /* pedras para UMA tentativa só: para por falta de pedra com 1 tentativa */
      fStop(); o.stones=Sys.forge.canTry(S,Sys.host,'weapon').stones; const t1=o.tries; fc('autogo'); const B=XF.auto; if(!clock) return 'Parar ok (sem relógio: falta de pedra só no smoke_all)';
      runAll(); if(o.tries!==t1+1||B.why!=='stones'||B.run) throw new Error('sem pedra: '+JSON.stringify(B)); if(bad(V_TEST.innerHTML).indexOf('faltaram pedras')<0) throw new Error('resumo sem o motivo');
      /* zero pedras: nem começa, aviso comum */
      fStop(); o.stones=0; XF.toast=''; fc('autogo'); if(XF.auto||o.tries!==t1+1) throw new Error('começou sem pedra'); if(String(XF.toast).indexOf('Pedras de Forja insuficientes')<0) throw new Error('aviso: '+XF.toast);
      return 'Parar: 1 tentativa; falta de pedra: parou com o motivo; zero pedras: aviso comum'; }); };
  /* ---------- FC INTEIRA em qualquer largura (288 a 430) e para qualquer texto do formatador ----------
     Sem navegador não há medida real: a conta usa a mesma estimativa de largura da tela (xTxtEm, com folga). O que o teste garante é a regra:
     fonte × largura estimada do texto ≤ espaço útil da caixa, sem reticências no número, em todas as larguras e valores. O QA confere no aparelho. */
  const FC_TXT=(function(){ const l=['195 mil','999,9 mil','999,9 mi','999,9 bi','999,9 tri','1000 tri']; try{ for(const s of Sys.stats.DATA.abbr.pt){ const u=String(s||'').trim(); if(u&&l.indexOf('999,9 '+u)<0) l.push('999,9 '+u); } const big=String(Sys.stats.DATA.abbr.pt.slice(-1)[0]).trim(); l.push('1000 '+big); }catch(e){} return l; })();   /* todos os sufixos do formatador (Sys.stats.DATA.abbr.pt) e o "1000 <maior>" que ele devolve no limite */
  const FC_W=[288,320,360,384,390,412,430];
  function withFc(fn){ const f0=fcTxt, w0=V_TEST.clientWidth, s0=XG.sel; let out, err=null; try{ out=fn(function(t){ fcTxt=function(){ return t; }; }); }catch(e){ err=e; } fcTxt=f0; V_TEST.clientWidth=w0; XG.sel=s0; XG.tw=null; if(err) throw err; return out; }
  const num=(h,re)=>{ const m=h.match(re); return m?+m[1]:NaN; };

  T['FC inteira: caixa do Equipamento em 288 a 430 px, valores longos']=function(){
    return withFc(function(setTxt){ const out=[]; let minPx=99;
      for(const W of FC_W){ V_TEST.clientWidth=W; let worst=99;
        for(const t of FC_TXT){ setTxt(t); const h=gear(), box=h.slice(h.indexOf('id="xg_fcbox"'),h.indexOf('data-x="look"')>0?h.indexOf('data-x="look"'):h.indexOf('data-x="goskins"'));
          const px=num(box,/id="xg_s_fc"[^>]*font-size:([\d.]+)px/), lpx=num(box,/id="xg_fclbl"[^>]*font-size:([\d.]+)px/), ls=num(box,/id="xg_fclbl"[^>]*letter-spacing:([\d.]+)px/), apW=num(h,/data-x="(?:look|goskins)"[^>]*style="width:(\d+)px/);
          if(!(px>0)||!(lpx>0)||!(apW>0)) throw new Error(W+' px: caixa da FC não achada'); if(box.indexOf('>'+t+'<')<0) throw new Error(W+' px: número "'+t+'" não está inteiro no HTML');
          if(/id="xg_s_fc"[^>]*text-overflow/.test(box)) throw new Error('reticências no número');
          const icon=box.indexOf('M13 2 4 14h7l-1 8 9-12h-7z')>=0, inner=W-24-18-6-apW-20-(icon?30:0), need=xTxtEm(t)*px, lneed=xTxtEm('FORÇA DE COMBATE')*lpx+ls*16;
          if(need>inner+0.01) throw new Error(W+' px, "'+t+'": precisa de '+need.toFixed(0)+' px e a caixa tem '+inner+' (fonte '+px+')');
          if(lneed>inner+0.01) throw new Error(W+' px: rótulo precisa de '+lneed.toFixed(0)+' px e a caixa tem '+inner); if(lpx<8) throw new Error(W+' px: rótulo com '+lpx+' px (ilegível)');
          if(px<16) throw new Error(W+' px, "'+t+'": fonte do número caiu para '+px+' px'); worst=Math.min(worst,px); }
        minPx=Math.min(minPx,worst); out.push(W+':'+worst); }
      return 'menor fonte do número por largura (base 25) → '+out.join(' · '); }); };

  T['FC inteira: comparação do item (antes → depois, FC agora, no seu nível)']=function(){
    return withFc(function(setTxt){ const it=S.inv.find(x=>S.eq[x.slot]!==x.id); if(!it) return 'sem item solto na mochila'; const out=[];
      for(const W of FC_W){ V_TEST.clientWidth=W; let minF=99, mode='';
        for(const t of FC_TXT){ setTxt(t); XG.sel=it.id; XG.tw=null; XG.cf=null; view='gear'; render(); const h=V_TEST.innerHTML; if(h.indexOf('aria-label="Comparar item"')<0) throw new Error('comparação não abriu');
          const rows=h.match(/data-row="[a-z]+" data-need="\d+"/g)||[]; if(rows.length!==7) throw new Error('linhas da comparação: '+rows.length);
          for(const r of rows){ const need=+r.match(/data-need="(\d+)"/)[1]; if(need>W-28-22) throw new Error(W+' px, "'+t+'", '+r+': passa da linha ('+(W-28-22)+' px)'); }
          const fr=h.match(/data-row="fc"[^>]*>\s*<span[^>]*>[^<]*<\/span>\s*<span style="font-size:([\d.]+)px/); if(!fr) throw new Error('linha da FC não achada'); minF=Math.min(minF,+fr[1]);
          const re=/data-fcbox="(col|row)" style="flex:([\d.]+)[^>]*><span style="font-size:([\d.]+)px[^>]*>([^<]*)<\/span><span class="lil" style="font-size:([\d.]+)px[^>]*>([^<]*)</g; let m, n=0;
          while((m=re.exec(h))){ n++; mode=m[1]; const inner=(W-28-6)*(+m[2])/2.25-22, lw=xTxtEm(m[4])*(+m[3]), vw=xTxtEm(m[6])*(+m[5]); if(m[6]!==t) throw new Error('valor da FC não está inteiro: '+m[6]);
            if(m[1]==='row'?lw+6+vw>inner+0.01:(lw>inner+0.01||vw>inner+0.01)) throw new Error(W+' px, "'+t+'", '+m[4]+': não cabe ('+m[1]+', '+Math.round(lw)+'+'+Math.round(vw)+' em '+Math.round(inner)+')'); if(+m[5]<10) throw new Error(W+' px: valor com '+m[5]+' px'); }
          if(n!==2) throw new Error('caixas "FC agora"/"no seu nível": '+n); }
        out.push(W+': linha '+minF+' px, caixas '+mode); }
      return out.join(' · '); }); };

  T['FC inteira: Derrota (SUA FC, RECOMENDADA, Faltam)']=function(){
    if(typeof resLoseHtml!=='function') return 'sem a tela de resultado';
    return withFc(function(setTxt){ const fc0=RES.fc, rec0=RES.rec; let err=null; const out=[];
      try{ RES.fc=1000; RES.rec=5000; for(const t of FC_TXT){ setTxt(t); const h=resLoseHtml({top:0,f:1},'Teste',false), a=num(h,/id="res_fc" style="font-size:([\d.]+)px/), b=num(h,/id="res_rec" style="font-size:([\d.]+)px/);
          if(!(a>0)||a!==b) throw new Error('fontes: '+a+' / '+b); if(xTxtEm(t)*a>RES_FC_W+0.01||xTxtEm('999,9 mil')*a>RES_FC_W+0.01) throw new Error('"'+t+'" não cabe: '+(xTxtEm(t)*a).toFixed(0)+' em '+RES_FC_W); if(a<18) throw new Error('fonte '+a);
          if(h.indexOf('>'+t+'<')<0||h.indexOf(t+' de FC')<0) throw new Error('texto cortado'); if(/undefined|NaN/.test(h)) throw new Error('undefined/NaN'); out.push(a); } }catch(e){ err=e; }
      RES.fc=fc0; RES.rec=rec0; if(err) throw err; return 'fonte (base 26) por valor: '+out.join(', ')+'; "Faltam" quebra em linhas'; }); };
  /* ---------- CARGA: p_bag na lista do screens.js, desligada; nada na lista sem arquivo no disco (__loadList e __jsFiles vêm do smoke.js) ---------- */
  T['carga: p_bag na lista e desligada; lista só com arquivos que existem']=function(){
    if(typeof __loadList==='undefined') return 'smoke sem a lista de carga'; const miss=__loadList.filter(n=>__jsFiles.indexOf(n+'.js')<0); if(miss.length) throw new Error('na lista e fora do disco: '+miss.join(','));
    if(__loadList.indexOf('p_bag')<0) throw new Error('p_bag fora da lista'); if(__loadList.indexOf('p_bag')!==__loadList.indexOf('p_fuse')+1) throw new Error('p_bag não está junto do p_fuse');
    if(__on0.bag!==false) throw new Error('PANEL_ON.bag nasceu ligada'); if(!Panels.defs.bag) throw new Error('painel bag não registrou'); if(__on0.realm!==true) throw new Error('PANEL_ON.realm não nasceu ligada (decisão do dono: seleção de servidor ligada)');
    if(__loadList.indexOf('p_realm')>=0&&__realmConflict) throw new Error('p_realm na lista com nomes em conflito');
    if(__jsFiles.indexOf('p_realm.js')>=0&&!__realmConflict){ if(__loadList.indexOf('p_realm')<0) throw new Error('p_realm existe, sem conflito, e está fora da lista'); if(!Panels.defs.realm) throw new Error('painel realm não registrou'); }    return __loadList.length+' arquivos, todos no disco; bag desligada; p_realm '+(__loadList.indexOf('p_realm')>=0?'na lista':'fora da lista'+(__jsFiles.indexOf('p_realm.js')>=0?' (existe, mas '+(__realmConflict?'colide: '+__realmConflict:'aguardando')+')':' (arquivo não existe)')); };

  /* ---------- SELEÇÃO DE SERVIDOR LIGADA (PANEL_ON.realm; linha "Servidor" das Configurações) ---------- */
  const cfgAcc=()=>{ XC.dlg=null; XC.page=2; view='cfg'; render(); let h=V_TEST.innerHTML; if(h.indexOf('aria-label="Conta"')<0){ for(let i=0;i<3&&h.indexOf('aria-label="Conta"')<0;i++){ XC.page=i; render(); h=V_TEST.innerHTML; } } return h; };
  /* o DOM falso do teste não tem style.setProperty (o setView do index usa no #app): entra só aqui, para abrir e fechar pela rota real */
  /* o setView real marca a animação de entrada das telas cheias (XG/XS/XH/XP.anim): devolvida no fim para não mudar o 1º desenho dos testes seguintes */
  const animSave=()=>({g:XG.anim,s:XS.anim,h:XH.anim,p:XP.anim}), animBack=a=>{ XG.anim=a.g; XS.anim=a.s; XH.anim=a.h; XP.anim=a.p; };
  const domFix=()=>{ try{ const st=document.getElementById('app').style; if(typeof st.setProperty!=='function') st.setProperty=function(){}; }catch(e){} };
  T['servidor: painel ligado, abre e fecha, sem item no MENU']=function(){ const v0=view, an=animSave(); let err=null, out=''; domFix();
    try{ if(!Panels.defs.realm) throw new Error('painel realm não registrou'); if(!Panels.on('realm')) throw new Error('painel realm desligado');
      if(typeof FB_DROP!=='undefined'&&FB_DROP.some(x=>x&&(x.id==='realm'||/realm/.test(String(x.act||''))))) throw new Error('item de servidor no MENU');
      view='battle'; if(!Panels.open('realm',{})) throw new Error('Panels.open devolveu false'); if(view!=='realm') throw new Error('view='+view+' depois de abrir'); render(); const h=bad0(V_TEST.innerHTML);
      if(h.indexOf('data-x="pick"')<0) throw new Error('lista de servidores vazia'); if(h.indexOf(realmBadge())<0) throw new Error('o servidor atual ('+realmBadge()+') não aparece na lista');
      if(/overflow-x:\s*(auto|scroll)|overflow:\s*(auto|scroll)|scroll-snap|grid-auto-flow:\s*column/.test(h)) throw new Error('rolagem horizontal declarada na tela');
      if(typeof Panels.close!=='function') throw new Error('Panels.close não existe (o p_realm chama no Voltar)'); if(h.indexOf('data-x="back"')<0) throw new Error('tela sem o Voltar');
      Panels.defs.realm.click({dataset:{x:'back'}}); if(view==='realm') throw new Error('o Voltar da tela não fechou');
      Panels.open('realm',{}); Screens.close(); if(view==='realm') throw new Error('não fechou'); out='abre com '+(h.match(/data-x="pick"/g)||[]).length+' servidor(es), selo "'+realmBadge()+'", fecha para '+view; }catch(e){ err=e; }
    view=v0; animBack(an); if(err) throw err; return out; };
  T['servidor: linha nas Configurações com o selo e o botão Trocar servidor']=function(){ const v0=view, rb0=window.realmBadge, on0=PANEL_ON.realm, o0=Panels.open, x0={dlg:XC.dlg,page:XC.page}, an=animSave(); let err=null, out=''; domFix();
    try{ if(typeof rb0!=='function') throw new Error('realmBadge não existe'); const t=rb0(); let h=bad0(cfgAcc());
      if(h.indexOf('data-row="realm"')<0) throw new Error('linha Servidor fora do cartão Conta'); if(h.indexOf('<b>Servidor</b>')<0||h.indexOf(t)<0) throw new Error('linha sem o rótulo ou sem o selo "'+t+'"');
      if(!/data-x="realm"[^>]*>Trocar servidor</.test(h)) throw new Error('botão Trocar servidor ausente');
      const got=[]; Panels.open=function(nm,o){ got.push(nm+':'+(o&&o.from)); return true; }; cClick({dataset:{x:'realm'}}); Panels.open=o0; if(got.join()!=='realm:cfg') throw new Error('o botão abriu: '+got.join());
      view='cfg'; if(!Panels.open('realm',{from:'cfg'})||view!=='realm') throw new Error('não abriu de verdade'); Screens.close(); if(view!=='cfg') throw new Error('o Voltar levou a '+view+', não às Configurações');
      PANEL_ON.realm=false; h=cfgAcc(); if(h.indexOf('data-row="realm"')<0||h.indexOf('data-x="realm"')>=0) throw new Error('painel desligado: esperado o selo sem o botão'); PANEL_ON.realm=on0;
      window.realmBadge=undefined; h=cfgAcc(); if(h.indexOf('data-row="realm"')>=0) throw new Error('sem realmBadge a linha continua na tela'); window.realmBadge=rb0;
      window.realmBadge=function(){ throw new Error('x'); }; h=bad0(cfgAcc()); if(h.indexOf('data-row="realm"')>=0) throw new Error('realmBadge com erro: a linha apareceu'); out='selo "'+t+'", botão abre realm e o Voltar devolve às Configurações; sem realmBadge a linha some';
    }catch(e){ err=e; }
    window.realmBadge=rb0; PANEL_ON.realm=on0; Panels.open=o0; XC.dlg=x0.dlg; XC.page=x0.page; view=v0; animBack(an); if(err) throw err; return out; };

  /* ---------- CONFIGURAÇÕES › CONTA: excluir conta e vincular Google ---------- */
  T['conta: botão Excluir conta chama DeleteAccount.open; some sem a tela e no Modo dono']=function(){ const D0=window.DeleteAccount, x0={dlg:XC.dlg,page:XC.page}, v0=view; let err=null, out='', n=0;
    try{ window.DeleteAccount={open:function(){ n++; return true; }}; let h=bad0(cfgAcc()); if(cOwner()) return 'teste rodando em Modo dono: botão oculto por regra';
      const m=h.match(/<button data-x="delacct"[^>]*>Excluir conta<\/button>/); if(!m) throw new Error('botão Excluir conta ausente'); if(/c-gold|c-red|c-warn/.test(m[0])) throw new Error('botão com cor de ação principal');
      if(h.indexOf('data-x="delacct"')<h.indexOf('data-x="rst"')) throw new Error('o botão não está no fim do cartão da conta');
      cClick({dataset:{x:'delacct'}}); if(n!==1) throw new Error('DeleteAccount.open chamado '+n+' vezes');
      window.DeleteAccount=undefined; h=cfgAcc(); if(h.indexOf('data-x="delacct"')>=0) throw new Error('sem DeleteAccount o botão continua na tela'); cClick({dataset:{x:'delacct'}});
      out='no fim do cartão, discreto, abre a tela; sem DeleteAccount some'; }catch(e){ err=e; }
    window.DeleteAccount=D0; XC.dlg=x0.dlg; XC.page=x0.page; view=v0; if(err) throw err; return out; };
  T['conta: vincular Google com o online ligado; desligado = EM BREVE de antes']=function(){ const O0=window.OnlineBoot, pl0=Sys.net&&Sys.net.player, x0={dlg:XC.dlg,page:XC.page}, v0=view; let err=null, out='';
    const mk=(on,ret)=>{ const o={n:0,cb:null,state:function(){ return {on:on}; },google:function(){ o.n++; return {then:function(ok){ o.cb=ok; if(ret) ok(ret); }}; }}; return o; };
    const back=()=>{ XC.gbusy=false; XC.glinked=false; XC.toast=''; };
    try{ back(); window.OnlineBoot=undefined; let h=bad0(cfgAcc()); if(!/data-row="link"[^>]*data-x="soon"/.test(h)||h.indexOf('EM BREVE')<0||h.indexOf('data-x="glink"')>=0) throw new Error('sem OnlineBoot a linha não é a de antes');
      window.OnlineBoot=mk(false); h=cfgAcc(); if(h.indexOf('data-x="glink"')>=0) throw new Error('online desligado com botão de vincular');
      if(Sys.net) Sys.net.player=function(){ return null; };
      let O=window.OnlineBoot=mk(true); h=bad0(cfgAcc()); if(h.indexOf('data-x="glink"')<0) throw new Error('online ligado sem o botão do Google'); if(/data-row="link"[^>]*data-x="soon"/.test(h)) throw new Error('a linha inteira ainda é "em breve"');
      if(!/data-x="soon"[^>]*><button class="c-link" disabled[^>]*Apple/.test(h)) throw new Error('Apple deixou de ser "em breve"');
      cClick({dataset:{x:'glink'}}); if(O.n!==1||!XC.gbusy) throw new Error('google() não foi chamado'); if(V_TEST.innerHTML.indexOf('Conectando...')<0) throw new Error('sem "Conectando..."'); cClick({dataset:{x:'glink'}}); if(O.n!==1) throw new Error('toque duplo chamou google() de novo');
      O.cb({ok:false,reason:'google_unavailable'}); if(XC.gbusy||XC.toast!=='Disponível no aplicativo') throw new Error('google_unavailable: aviso "'+XC.toast+'"'); if(V_TEST.innerHTML.indexOf('data-x="glink"')<0) throw new Error('depois da recusa o botão sumiu');
      const cases={cancelled:'Vinculação cancelada',offline:'Sem conexão: tente de novo',link_taken:'Essa conta Google já é de outro jogador',qualquer:'Não deu para vincular agora'};
      for(const k in cases){ back(); O=window.OnlineBoot=mk(true,{ok:false,reason:k}); cfgAcc(); cClick({dataset:{x:'glink'}}); if(XC.toast!==cases[k]) throw new Error(k+': aviso "'+XC.toast+'"'); }
      back(); O=window.OnlineBoot=mk(true,{ok:true,action:'linked'}); cfgAcc(); cClick({dataset:{x:'glink'}}); h=V_TEST.innerHTML; if(XC.toast!=='Conta Google vinculada'||h.indexOf('data-glink="on"')<0||h.indexOf('data-x="glink"')>=0) throw new Error('vinculou e a tela não mostra a conta: '+XC.toast);
      back(); if(Sys.net){ Sys.net.player=function(){ return {linked:['google'],email:'jogador@exemplo.com'}; }; h=bad0(cfgAcc()); if(h.indexOf('data-glink="on"')<0||h.indexOf('jogador@exemplo.com')<0) throw new Error('conta já vinculada (Sys.net.player) não aparece'); }
      out='desligado = EM BREVE; ligado = botão, uma chamada por vez, avisos por motivo, conta vinculada na tela; Apple em breve'; }catch(e){ err=e; }
    window.OnlineBoot=O0; if(Sys.net) Sys.net.player=pl0; back(); XC.dlg=x0.dlg; XC.page=x0.page; view=v0; if(err) throw err; return out; };
  /* ---------- ACHADOS DO QA EM TELA ESTREITA ---------- */
  T['estreito: células do cartão de poder cabem (grade sem empurrar) e cartão da Loja quebra a linha do espaço']=function(){ const W=V_TEST.clientWidth, v0=view; let err=null, out='';
    try{ XG.sel=null; XG.tw=null; XG.cf=null; view='gear'; render(); let h=bad0(V_TEST.innerHTML);
      if(h.indexOf('grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:1fr 1fr')<0) throw new Error('a grade dos atributos pode passar da largura (sem minmax(0,1fr))');
      const cells=h.match(/data-st="[a-z]+" data-sin="[0-9.]+"[^>]*>[\s\S]*?<\/div><\/div>/g)||[]; if(cells.length!==6) throw new Error(cells.length+' células de atributo');
      for(const c of cells){ const sin=+c.match(/data-sin="([0-9.]+)"/)[1], sp=c.match(/<span[^>]*font-size:([0-9.]+)px[^>]*>([^<]*)<\/span>/g)||[]; if(sp.length!==2) throw new Error('célula sem rótulo e valor');
        for(const s of sp){ const m=s.match(/font-size:([0-9.]+)px[^>]*>([^<]*)</), px=+m[1], w=xTxtEm(m[2])*px; if(w>sin+0.5) throw new Error('"'+m[2]+'" com '+px+' px passa da célula ('+w.toFixed(1)+' > '+sin+') em '+W+' px'); if(px<6) throw new Error('fonte menor que 6 px: '+m[2]); } }
      const cellW=(Math.min(W,600)-24-18-10)/3, need=cells.map(c=>+c.match(/data-sin="([0-9.]+)"/)[1]).every(s=>s<=cellW); if(!need) throw new Error('largura útil maior que a célula');
      XH.tab='item'; XH.sel=null; XH.cf=null; view='shop'; const g0=PANEL_V2.gate; PANEL_V2.gate=false; render(); PANEL_V2.gate=g0; h=bad0(V_TEST.innerHTML);
      if(h.indexOf('data-x="offer"')>=0){ if(/white-space:nowrap">[^<]* · [^<]*<\/span>\s*<span style="display:flex;flex-direction:column;align-items:center;gap:1px/.test(h)) throw new Error('linha "espaço · era" do cartão ainda sem quebra');
        if(h.indexOf('flex-wrap:wrap;justify-content:center;gap:0 3px;font-size:10px')<0) throw new Error('linha "espaço · era" sem a quebra'); }
      out='6 células dentro da largura em '+W+' px; cartão da Loja quebra "espaço · era"'; }catch(e){ err=e; }
    view=v0; XH.tab='hero'; if(err) throw err; return out; };

  /* ---------- PASSE EM TELA ESTREITA (QA 288 px) e rótulos dos espaços do Equipamento ---------- */
  T['passe: cabeçalho e cartões cabem na largura (estimativa por linha)']=function(){ const W=Math.min(V_TEST.clientWidth,600), v0=view, g0=PANEL_V2.gate, cf0=XP.cf; let err=null, out='';
    try{ PANEL_V2.gate=false; passTab='pass'; XP.cf=false; view='pass'; render(); const h=bad0(V_TEST.innerHTML), hW=W-24-4-92-16, tw=s=>{ const m=s.match(/font-size:([0-9.]+)px[^>]*>([^<]+)</); return m?xTxtEm(m[2])*(+m[1]):0; };
      if(h.indexOf('class="p-hdr"')<0) return 'Passe trancado no save do teste';
      if(/class="p-hdr" style="[^"]*[^-]height:92px/.test(h)) throw new Error('cabeçalho ainda com altura fixa');
      const row=n=>{ const m=h.match(new RegExp('data-phl="'+n+'"[^>]*>([\\s\\S]*?)</div>')); return m?m[1]:null; }, r1=row(1), r2=row(2), r3=row(3), x=h.match(/<span data-phl="4"[^>]*>[^<]*</);
      if(!r1||!r3||!x) throw new Error('linhas do cabeçalho não encontradas');
      const sp=s=>(s.match(/<span[^>]*font-size:[0-9.]+px[^>]*>[^<]+</g)||[]).map(tw), clk=14+3, close=/<button data-x="close" aria-label="Fechar o Passe" style/.test(h)?38:0;
      const nar=!!r2, w1=sp(r1)[0]+(nar?close:6+clk+sp(r1)[1]+close), w3=sp(r3).reduce((a,b)=>a+b,0)+16+(sp(r3).length>1?8:0), w4=tw(x[0]);
      if(w1>hW+0.5) throw new Error('linha do título: '+w1.toFixed(0)+' px em '+hW+' ('+W+' px)');
      if(nar){ const a=sp(r2); if(a[0]>hW||clk+a[1]>hW) throw new Error('linha jogador/prazo não cabe nem quebrada'); }
      if(sp(r3)[0]+16>hW+0.5) throw new Error('selo do nível: '+(sp(r3)[0]+16).toFixed(0)+' px em '+hW);
      if(w4>hW+0.5&&w4>hW*2) throw new Error('texto do XP não cabe em duas linhas');
      if(/data-phl="4"[^>]*white-space:nowrap/.test(h)||/data-phl="4"[^>]*ellipsis/.test(h)) throw new Error('texto do XP sem quebra');
      /* cartões: texto do nome com a palavra mais longa dentro da coluna em tela estreita */
      const txW=(W-24-44-12)/2-16-(W<340?30:46), cards=h.match(/<button class="p-card[\s\S]*?<\/button>/g)||[]; let worst=0, wt='';
      for(const c of cards){ const m=c.match(/<span style="(font-size:[0-9.]+px;font-weight:900;line-height:1\.0?[15][^"]*)">(?:<span[^>]*>)?([^<]+)</); if(!m) continue; const px=+m[1].match(/font-size:([0-9.]+)/)[1];
        if(W<340&&/nowrap|ellipsis/.test(m[1])) throw new Error('nome do prêmio com reticências em tela estreita');
        for(const wd of m[2].split(/\s+/)){ const w=xTxtEm(wd)*px; if(w>worst){ worst=w; wt=wd+' '+px+'px'; } } }
      if(W<340&&worst>txW+0.5) throw new Error('palavra "'+wt+'" com '+worst.toFixed(0)+' px numa coluna de '+txW.toFixed(0));
      out=W+' px: coluna '+hW+'; título '+w1.toFixed(0)+(nar?' (estreito: prazo na linha do jogador)':' (com o prazo)')+'; selo '+(sp(r3)[0]+16).toFixed(0)+'; XP '+w4.toFixed(0)+'; cartão: texto '+txW.toFixed(0)+', maior palavra '+worst.toFixed(0)+' ('+wt+')';
    }catch(e){ err=e; } PANEL_V2.gate=g0; XP.cf=cf0; view=v0; if(err) throw err; return out; };
  T['equipamento: rótulos dos 7 espaços inteiros (altura do bloco e acima dos vizinhos)']=function(){ const v0=view; let err=null, out='';
    try{ XG.sel=null; XG.tw=null; XG.cf=null; view='gear'; render(); const h=bad0(V_TEST.innerHTML), lb=h.match(/<span data-slotlbl="[a-z]+"[^>]*>/g)||[];
      if(lb.length<6) throw new Error(lb.length+' rótulos de espaço'); for(const s of lb) if(!/position:relative;z-index:2;font-size:10px;line-height:11px/.test(s)) throw new Error('rótulo sem z-index/altura: '+s.slice(0,80));
      const d=xFit(680,614), vit=d.real?Math.max(236,Math.min(292,Math.round(0.34*(d.H+56)))):292, step=92/292*vit, block=58+2+11; if(d.real&&block>step) throw new Error('bloco do espaço ('+block+' px) maior que o passo ('+step.toFixed(1)+' px)');
      out=lb.length+' rótulos; bloco '+block+' px, passo entre espaços '+step.toFixed(1)+' px'; }catch(e){ err=e; } view=v0; if(err) throw err; return out; };

  T['eventos: nome do evento uma vez só (banner) e o selo do estado no banner']=function(){ const v0=view; let err=null, out='';
    try{ if(!(window.Panels&&Panels.defs.events&&Panels.on('events'))) return 'painel de eventos desligado'; view='events'; render(); const h=bad0(V_TEST.innerHTML);
      if(h.indexOf('class="pz-ban"')<0) return 'tela de eventos sem banner neste save (sem evento)';
      const nm=(h.match(/class="pz-btitle">([^<]+)</)||[])[1]; if(!nm) throw new Error('banner sem o nome do evento');
      const many=(h.match(/data-x="ev"/g)||[]).length; if(many===1) throw new Error('fileira de eventos desenhada com um evento só');
      const n=h.split('>'+nm+'<').length-1; if(many<2&&n!==1) throw new Error('"'+nm+'" aparece '+n+' vezes no texto da tela');
      const tg=h.match(/data-bst="(on|gr|soon)"[^>]*><span class="pz-tag (on|gr|soon)"[^>]*>(ATIVO|CARÊNCIA|EM BREVE)</); if(!tg) throw new Error('banner sem o selo do estado');
      out='"'+nm+'" '+n+' vez; selo "'+tg[3]+'" no banner; fileira '+(many?'com '+many+' eventos':'não desenhada'); }catch(e){ err=e; } view=v0; if(err) throw err; return out; };

  /* ---------- FOLHA EM GRADE POR CSS (ajudante xSheet do js/screens.js) ---------- */
  T['folha em grade: Montarias desenha 6 × 2 com keyframes por quadro; tira continua tira']=function(){ const v0=view; let err=null, out='';
    try{ const g=xSheetCss(xSheetNorm({frames:12,cols:6,fps:12}),{}), t=xSheetCss(xSheetNorm({frames:12,fps:12}),{}), p=xSheetCss(xSheetNorm({frames:13,cols:7,fps:12}),{once:true});
      if(g.size!=='600% 200%'||!/^xshf6_12 1s step-end infinite$/.test(g.anim)) throw new Error('grade 6 × 2: '+g.size+' / '+g.anim);
      if(t.size!=='1200% 100%'||t.anim!=='xshx 1s steps(12,jump-none) infinite') throw new Error('tira: '+t.size+' / '+t.anim);
      if(p.size!=='700% 200%'||!/^xshf7_13 [0-9.]+s step-end 1 both$/.test(p.anim)) throw new Error('grade incompleta: '+p.size+' / '+p.anim);
      const k=XSH.css||'', a=k.slice(k.indexOf('@keyframes xshf7_13{')), body=a.slice(0,a.indexOf('}}')), n=(body.match(/background-position:/g)||[]).length; if(n!==14) throw new Error('13 quadros: '+n+' passos (esperado 13 + o final)'); if(/background-position:100\.000% 100\.000%/.test(body)) throw new Error('a célula vazia (7ª da 2ª linha) aparece');
      if(!(window.Panels&&Panels.defs.mounts&&Panels.on('mounts'))) return 'ajudante ok; painel de montarias desligado';
      view='mounts'; render(); const h=V_TEST.innerHTML, m=h.match(/kael_[a-z]+_idle_era2_t1\.png\) 0 0\/([0-9% ]+) no-repeat/g)||[];
      if(m.length){ for(const s of m) if(s.indexOf('0 0/600% 200% no-repeat')<0) throw new Error('Montarias desenha a folha como '+s); if(/idle_era2_t1\.png\) 0 0\/1200% 100%/.test(h)) throw new Error('folha da montaria ainda como tira'); }
      out='grade 600% 200% + keyframes; tira igual a antes; incompleta sem célula vazia; Montarias: '+m.length+' folha(s) na tela em grade'; }catch(e){ err=e; } view=v0; if(err) throw err; return out; };

  /* ---------- COMPRAS PELO Sys.buy ---------- */
  function withBuy(ready,fn){ const B=Sys.buy, r0=B.ready, p0=B.purchase, s0=B.simulated, c0=B.cardStatus, l0=B.cardStatusLive, k0=B.cardClaim, calls=[]; XCARD.st=null; XCARD.at=0; XCARD.load=false; XCARD.claim=false;
    B.cardStatusLive=function(){ return {active:false,daysLeft:0,claimedToday:false}; };
    try{ return withBuy0(ready,fn,calls); } finally { B.cardStatusLive=l0; B.cardClaim=k0; XCARD.st=null; XCARD.at=0; XCARD.load=false; XCARD.claim=false; } }
  function withBuy0(ready,fn,calls){ const B=Sys.buy, r0=B.ready, p0=B.purchase, s0=B.simulated, c0=B.cardStatus; let out, err=null, res={ok:true,status:'granted',applied:[{got:[{kind:'gems',n:120}]}]};
    const g0=PANEL_V2.gate, cf0=XP.cf, t0=XH.tab; XBUY.busy=null;
    try{ B.ready=function(){ return ready; }; B.simulated=function(){ return ready; }; B.cardStatus=function(){ return {active:false,daysLeft:0,claimedToday:false,simulated:ready}; };
      B.purchase=function(S0,h,id){ calls.push(id); const r=res; return {then:function(f){ f(r); }}; };
      PANEL_V2.gate=false; out=fn(calls,function(r){ res=r; }); }catch(e){ err=e; }
    B.ready=r0; B.purchase=p0; B.simulated=s0; B.cardStatus=c0; PANEL_V2.gate=g0; XP.cf=cf0; XH.tab=t0; XH.sel=null; XH.cf=null; XBUY.busy=null; if(err) throw err; return out; }
  const shopGem=()=>{ XH.tab='gem'; XH.sel=null; XH.cf=null; view='shop'; render(); return V_TEST.innerHTML; };
  const passHtml=cf=>{ passTab='pass'; XP.cf=!!cf; XP.anim=false; XP.toast=''; view='pass'; render(); return V_TEST.innerHTML; };

  T['compras: ready falso = Loja e Passe idênticos aos de hoje']=function(){
    if(!(Sys.buy&&Sys.buy.ready)) return 'Sys.buy não carregado';
    const a=shopGem(), pa=passHtml(false), pb=passHtml(true);
    return withBuy(false,function(calls){ const b=shopGem(); if(a!==b) throw new Error('a Loja mudou com ready falso'); if(passHtml(false)!==pa||passHtml(true)!==pb) throw new Error('o Passe mudou com ready falso');
      if(/data-x="buy"|data-x="buyprem"|R\$/.test(b+pa+pb)) throw new Error('botão de compra ou preço com a compra desligada'); if((b.match(/data-x="iap"/g)||[]).length!==4||b.indexOf('Pagamento em breve')<0) throw new Error('cartões "Em breve" de sempre');
      hClick({dataset:{x:'buy',id:'gems_60'}}); pClick({dataset:{x:'buyprem'}}); if(calls.length) throw new Error('chamou purchase com ready falso'); return 'idênticos; 4 cartões "Em breve"; nenhum preço; purchase não é chamado'; }); };

  T['compras: ready verdadeiro = Loja com o catálogo e purchase com o id certo']=function(){
    if(!(Sys.buy&&Sys.buy.ready)) return 'Sys.buy não carregado';
    return withBuy(true,function(calls,setRes){ const P=Sys.buy.DATA.products, gp=P.filter(p=>p.kind==='gems'), mc=P.find(p=>p.kind==='monthly_card'); const h=bad0(shopGem());
      for(const p of gp){ if(h.indexOf('data-x="buy" data-id="'+p.id+'"')<0) throw new Error('pacote '+p.id+' fora da tela'); if(h.indexOf(Sys.buy.priceText(p.id))<0||h.indexOf(p.name)<0) throw new Error(p.id+' sem nome/preço do módulo'); }
      if((h.match(/class="x-tile" data-x="buy"/g)||[]).length!==gp.length) throw new Error('quantidade de pacotes'); if(/data-x="iap"|Em breve<|Pagamento em breve/.test(h)) throw new Error('sobrou "Em breve"');
      if(mc&&(h.indexOf('data-card="'+mc.id+'"')<0||h.indexOf(Sys.buy.priceText(mc.id))<0)) throw new Error('Cartão Mensal fora da tela'); if(h.indexOf('compra simulada')<0) throw new Error('sem o aviso de compra simulada');
      for(const p of gp.concat(mc?[mc]:[])){ calls.length=0; XH.toastMsg=''; hClick({dataset:{x:'buy',id:p.id}}); if(calls.join()!==p.id) throw new Error('purchase('+calls.join()+') em vez de '+p.id); }
      const m1=xBuyMsg({ok:true,applied:[{got:[{kind:'gems',n:120}]}]},gp[0]); if(m1.indexOf('120')<0||m1.indexOf(gp[0].name)<0) throw new Error('aviso ok: '+m1);
      const outs=['cancelled','owned','pending','offline','xyz'].map(w=>xBuyMsg({ok:false,reason:w},gp[0])); if(outs[0]!=='Compra cancelada'||outs[4]!=='Compra não concluída'||new Set(outs).size!==5) throw new Error('avisos: '+outs.join(' | '));
      setRes({ok:false,reason:'cancelled'}); calls.length=0; const g0=S.gems; hClick({dataset:{x:'buy',id:gp[0].id}}); if(S.gems!==g0||XBUY.busy) throw new Error('cancelado mexeu no save ou travou');
      calls.length=0; XBUY.busy='x'; hClick({dataset:{x:'buy',id:gp[0].id}}); XBUY.busy=null; if(calls.length) throw new Error('segunda compra com uma em curso');
      return gp.length+' pacotes + '+(mc?mc.name:'sem cartão')+', preços do módulo ('+Sys.buy.priceText(gp[0].id)+' …); purchase com o id de cada um; avisos: '+outs.slice(0,3).join(' / '); }); };

  T['compras: ready verdadeiro = Ativar Premium compra o produto do Passe']=function(){
    if(!(Sys.buy&&Sys.buy.ready)) return 'Sys.buy não carregado'; const pp=Sys.buy.DATA.products.find(p=>p.kind==='pass_premium'); if(!pp) return 'catálogo sem pass_premium';
    return withBuy(true,function(calls,setRes){ const o=Sys.pass.ensure(S), pr0=o.premium; let err=null, out='';
      try{ o.premium=false; const price=Sys.buy.priceText(pp.id); let h=bad0(passHtml(false)); if(h.indexOf('data-x="askprem"')<0||h.indexOf(price)<0) throw new Error('botão Ativar Premium sem o preço do módulo');
        if(h.indexOf('Pagamento em breve')>=0) throw new Error('sobrou "Pagamento em breve"'); pClick({dataset:{x:'askprem'}}); h=bad0(V_TEST.innerHTML); if(h.indexOf('data-x="buyprem"')<0||h.indexOf('Ativar · '+price)<0) throw new Error('popup sem o botão de compra');
        setRes({ok:false,reason:'cancelled'}); pClick({dataset:{x:'buyprem'}}); if(calls.join()!==pp.id) throw new Error('purchase('+calls.join()+')'); if(!XP.cf||XP.toast!=='Compra cancelada') throw new Error('cancelado: popup '+XP.cf+', aviso '+XP.toast);
        setRes({ok:true,status:'granted',applied:[]}); calls.length=0; pClick({dataset:{x:'buyprem'}}); if(calls.join()!==pp.id||XP.cf||XP.toast!=='Passe Premium ativado') throw new Error('ok: popup '+XP.cf+', aviso '+XP.toast);
        out='preço '+price+'; purchase("'+pp.id+'"); cancelado mantém o popup; ok fecha e avisa'; }catch(e){ err=e; }
      o.premium=pr0; XP.toast=''; if(err) throw err; return out; }); };
  T['compras: Cartão Mensal pelo cardStatusLive e cardClaim (espera, resgate, recusas)']=function(){
    if(!(Sys.buy&&Sys.buy.ready)) return 'Sys.buy não carregado'; const mc=Sys.buy.DATA.products.find(p=>p.kind==='monthly_card'); if(!mc) return 'catálogo sem cartão mensal';
    return withBuy(true,function(calls,setRes){ const B=Sys.buy; let stCalls=0, pend=null, claims=0, cpend=null;
      const later=box=>({then:function(f){ box.f=f; }}); const card=h=>{ const i=h.indexOf('data-card="'); return i<0?'':h.slice(i,h.indexOf('</div>',i)); };
      /* 1) resposta ainda não chegou: botão em espera, sem comprar nem resgatar; uma consulta só */
      const b1={}; B.cardStatusLive=function(){ stCalls++; return later(b1); }; let c=card(bad0(shopGem())); if(c.indexOf('data-x="cardwait"')<0||c.indexOf('Conferindo...')<0||/data-x="(buy|cardclaim)"/.test(c)) throw new Error('sem espera na consulta: '+c.slice(-160));
      shopGem(); if(stCalls!==1) throw new Error('consultas em paralelo: '+stCalls); hClick({dataset:{x:'cardwait'}}); if(calls.length) throw new Error('toque na espera comprou');
      /* 2) chega "ativo, 12 dias, não resgatado" → redesenha sozinho com Resgatar */
      b1.f({active:true,daysLeft:12,claimedToday:false}); c=card(bad0(V_TEST.innerHTML)); if(c.indexOf('Ativo: 12 dias restantes')<0||c.indexOf('data-x="cardclaim"')<0||c.indexOf('Resgatar +'+mc.daily)<0) throw new Error('ativo: '+c.slice(-200));
      /* 3) resgate pendente: "Resgatando...", segundo toque não chama de novo; ok → "Resgatado hoje" e o aviso */
      const b2={}; B.cardClaim=function(){ claims++; return later(b2); }; B.cardStatusLive=function(){ stCalls++; return {active:true,daysLeft:12,claimedToday:true}; };
      hClick({dataset:{x:'cardclaim'}}); c=card(V_TEST.innerHTML); if(c.indexOf('Resgatando...')<0||c.indexOf('data-x="cardclaim"')>=0) throw new Error('sem espera no resgate'); hClick({dataset:{x:'cardclaim'}}); if(claims!==1) throw new Error('toque duplo resgatou '+claims+'x');
      b2.f({ok:true,gems:mc.daily}); c=card(bad0(V_TEST.innerHTML)); if(c.indexOf('Resgatado hoje')<0||XCARD.claim) throw new Error('depois do resgate: '+c.slice(-160));
      hClick({dataset:{x:'cardclaim'}}); if(claims!==1) throw new Error('resgatou de novo no mesmo dia');
      /* 4) recusas: claimed, no_card (vira compra), soon */
      const refuse=(st,reason)=>{ XCARD.st=null; XCARD.at=0; B.cardStatusLive=function(){ return st; }; B.cardClaim=function(){ claims++; if(reason==='claimed') st.claimedToday=true;   /* o servidor já tinha o resgate de hoje: a consulta seguinte diz isso */ return {ok:false,reason:reason}; }; shopGem(); hClick({dataset:{x:'cardclaim'}}); return card(V_TEST.innerHTML); };
      c=refuse({active:true,daysLeft:3,claimedToday:false},'claimed'); if(c.indexOf('Resgatado hoje')<0) throw new Error('recusa claimed não marcou');
      B.cardStatusLive=function(){ return {active:false,daysLeft:0,claimedToday:false}; }; XCARD.st={active:true,daysLeft:1,claimedToday:false}; XCARD.at=Date.now(); B.cardClaim=function(){ return {ok:false,reason:'no_card'}; }; shopGem(); hClick({dataset:{x:'cardclaim'}}); c=card(V_TEST.innerHTML);
      if(c.indexOf('data-x="buy" data-id="'+mc.id+'"')<0||c.indexOf('1 dia restante')>=0) throw new Error('no_card não voltou à compra: '+c.slice(-160));
      /* 5) consulta falha → "Tentar de novo" (não oferece compra); tentar de novo consulta outra vez; sem cardStatusLive usa cardStatus */
      XCARD.st=null; XCARD.at=0; let n5=0; B.cardStatusLive=function(){ n5++; return {then:function(f,g){ g(new Error('x')); }}; }; c=card(bad0(shopGem())); if(c.indexOf('data-x="cardretry"')<0||/data-x="buy"/.test(c)) throw new Error('falha na consulta: '+c.slice(-160));
      shopGem(); if(n5!==1) throw new Error('consulta repetida sozinha depois do erro'); B.cardStatusLive=function(){ n5++; return {active:true,daysLeft:1,claimedToday:true}; }; hClick({dataset:{x:'cardretry'}}); c=card(V_TEST.innerHTML); if(n5!==2||c.indexOf('Ativo: 1 dia restante')<0||c.indexOf('Resgatado hoje')<0) throw new Error('tentar de novo: '+c.slice(-160));
      XCARD.st=null; XCARD.at=0; B.cardStatusLive=undefined; B.cardStatus=function(){ return {active:true,daysLeft:7,claimedToday:false}; }; c=card(shopGem()); if(c.indexOf('Ativo: 7 dias restantes')<0) throw new Error('reserva cardStatus');
      return 'espera na consulta e no resgate; sem toque duplo; ok marca "Resgatado hoje"; claimed/no_card/falha tratados; reserva sem cardStatusLive'; }); };

  /* ---------- CONFIGURAÇÕES: código de progresso × servidor (achado A2 do QA) ---------- */
  T['cópia de segurança: código só entra no servidor em que foi exportado']=function(){
    if(typeof cParse!=='function') return 'p_cfg não carregado';
    const R0=window.Realm, ns0=window.__noSave, k0=localStorage.getItem(SAVE_KEY), href0=location.href, x0={dlg:XC.dlg,imp:XC.imp,err:XC.err,src:XC.src}, v0=view, r0=S.realm; let err=null, out='';
    const at=id=>{ window.Realm={id:function(){ return id; }}; };
    const mk=o=>{ const b=cB64e(JSON.stringify(o)); return C_PRE+b+'.'+cSum(b); };
    try{ view='cfg'; at('s1'); S.realm='s1'; const code=cExport(); if(!code) throw new Error('exportar falhou'); const r=cParse(code); if(!r.ok) throw new Error('mesmo servidor recusado: '+r.msg);
      if(r.save.realm!=='s1') throw new Error('o código exportado não leva o S.realm: '+r.save.realm);
      const want='Este código é do servidor S1 · Nova Era. Troque de servidor para usar.';
      at('s2'); const r2=cParse(code); if(r2.ok||r2.msg!==want) throw new Error('S1 → S2: '+JSON.stringify(r2).slice(0,120));
      localStorage.setItem(SAVE_KEY,'ANTES'); XC.dlg='imp'; XC.imp=code; document.getElementById('c_imp').value=code; cClick({dataset:{x:'impgo'}}); if(XC.err!==want||XC.src||XC.dlg!=='imp') throw new Error('tela: err="'+XC.err+'" dlg='+XC.dlg);
      XC.src=r.save; XC.dlg='impok'; window.__noSave=false; if(cImportDo()!==false) throw new Error('cImportDo gravou código de outro servidor'); if(localStorage.getItem(SAVE_KEY)!=='ANTES'||window.__noSave) throw new Error('a chave do save mudou na recusa'); if(XC.err!==want) throw new Error('recusa sem aviso');
      const old=JSON.parse(JSON.stringify(S)); delete old.realm; const oc=mk(old); if(cParse(oc).ok) throw new Error('código sem realm aceito no S2'); at('s1'); const ro=cParse(oc); if(!ro.ok) throw new Error('código sem realm recusado no S1: '+ro.msg);
      const s3=JSON.parse(JSON.stringify(S)); s3.realm='s3'; const m3=cParse(mk(s3)); if(m3.ok||m3.msg.indexOf('S3')<0) throw new Error('S3 → S1: '+m3.msg);
      at('s2'); S.realm='s2'; const c2=cExport(), q2=cParse(c2); if(!q2.ok||q2.save.realm!=='s2') throw new Error('S2 → S2 recusado');
      at('s1'); S.realm='s1'; XC.src=r.save; XC.dlg='impok'; window.__noSave=false; if(cImportDo()!==true) throw new Error('mesmo servidor: não importou'); if(localStorage.getItem(SAVE_KEY)!==JSON.stringify(r.save)) throw new Error('save gravado diferente do código');
      out='S1→S1 e S2→S2 importam; S1→S2 e S3→S1 recusam com o aviso e a chave fica igual; sem realm: entra no S1, recusado no S2';
    }catch(e){ err=e; }
    window.Realm=R0; window.__noSave=ns0; S.realm=r0; if(k0===null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY,k0); try{ location.href=href0; }catch(e){} XC.dlg=x0.dlg; XC.imp=x0.imp; XC.err=x0.err; XC.src=x0.src; view=v0; try{ document.getElementById('c_imp').value=''; }catch(e){}
    if(err) throw err; return out; };
  function bad0(h){ if(/undefined|NaN|\[object/.test(h)) throw new Error('undefined/NaN no HTML: '+(h.match(/.{50}(undefined|NaN|\[object).{30}/)||[''])[0]); return h; }
  return T; })();
