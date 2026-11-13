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
  return T; })();
