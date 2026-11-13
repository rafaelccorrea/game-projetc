# Varredura estática de responsividade

Gerado por `node test/resp/estatico.mjs` em 2026-11-13T13:58:55.961Z. Heurística por regex sobre `index.html` e `js/**` (menos `js/sys`, lógica pura). **Pode haver falso positivo**: confira o trecho antes de corrigir. Cada linha: `arquivo:linha` · regra · trecho · correção sugerida.

## Totais

| regra | achados |
|---|---|
| largura-fixa | 19 |
| nowrap-sem-reticencias | 153 |
| letra-pequena | 136 |
| alvo-pequeno | 22 |
| absoluta-sem-safe-area | 1 |
| overflow-x | 0 |
| **total** | **331** |

## Por arquivo (mais achados primeiro)

| arquivo | achados | dono |
|---|---|---|
| js/screens.js | 65 | distribuir |
| js/screens2.js | 39 | distribuir |
| js/p_forge.js | 22 | distribuir |
| js/p_arena.js | 21 | distribuir |
| js/p_events.js | 21 | distribuir |
| js/fullbattle.js | 16 | distribuir |
| js/p_pets.js | 14 | distribuir |
| js/p_map.js | 13 | distribuir |
| js/p_tower.js | 11 | QA (eu corrijo) |
| js/p_auction.js | 10 | distribuir |
| js/p_offer.js | 10 | distribuir |
| js/p_rank.js | 9 | QA (eu corrijo) |
| js/p_tourney.js | 9 | distribuir |
| js/p_fuse.js | 8 | distribuir |
| js/p_mounts.js | 7 | distribuir |
| js/p_bag.js | 6 | distribuir |
| js/p_guide.js | 6 | distribuir |
| js/p_intro.js | 6 | distribuir |
| index.html | 6 | distribuir |
| js/p_realm.js | 5 | distribuir |
| js/p_pass.js | 4 | distribuir |
| js/evhud.js | 3 | distribuir |
| js/p_cfg.js | 3 | distribuir |
| js/p_profile.js | 3 | QA (eu corrijo) |
| js/p_chat.js | 2 | distribuir |
| js/p_inst.js | 2 | distribuir |
| js/p_missions.js | 2 | distribuir |
| js/p_vip.js | 2 | QA (eu corrijo) |
| js/artprev.js | 1 | distribuir |
| js/cloudchoice.js | 1 | distribuir |
| js/intro.js | 1 | distribuir |
| js/loading.js | 1 | distribuir |
| js/p_era.js | 1 | distribuir |
| js/p_mail.js | 1 | distribuir |

## Telas do QA (eu corrijo)

### js/p_tower.js (11)

- `js/p_tower.js:24` · **largura-fixa** · `on:absolute;left:0;top:0;width:390px;transition:transform .9s cubic-bezier(.5,0,.3,1)}` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_tower.js:57` · **largura-fixa** · `te;left:0;top:${top}px;width:390px;height:110px">` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_tower.js:63` · **letra-pequena** · `}</span><span style="font-size:10px;font-weight:900;color:${plate[3]}">${boss?'CHEFE':'andar'}<` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tower.js:72` · **largura-fixa** · `lute;left:0;top:${top}px;width:390px;height:110px"><div aria-hidden="true" style="position:abso` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_tower.js:90` · **alvo-pequeno** · `span style="width:40px;height:30px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2` → alvo de toque ≥ 40×40 px (hoje altura 30 px): aumentar altura ou padding invisível
- `js/p_tower.js:97` · **nowrap-sem-reticencias** · `'#9ff0a8':'#ffe07a'};white-space:nowrap">${g?'+'+g:''}${egg?(g?' + ovo':'ovo'):''}</span>${done` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_tower.js:97` · **letra-pequena** · `}</span><span style="font-size:10px;font-weight:900;color:${done?'#9ff0a8':'#ffe07a'};white-spa` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tower.js:101` · **letra-pequena** · `/span><span style="font-size:10px;font-weight:800;color:#c9b9a2">só a derrota gasta</span></spa` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tower.js:111` · **nowrap-sem-reticencias** · `15px;color:#ffe07a;white-space:nowrap">Melhor: ${best}</span><span aria-hidden="true" style="co` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_tower.js:111` · **alvo-pequeno** · ` style="width:30px;height:30px;object-fit:contain"><span style="flex:1;min-width:0;display:flex` → alvo de toque ≥ 40×40 px (hoje altura 30 px): aumentar altura ou padding invisível
- `js/p_tower.js:126` · **nowrap-sem-reticencias** · `-shadow:0 2px 0 #000;white-space:nowrap">${win?'Andar '+r.floor+' vencido!':'Derrota'}</span><s` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_rank.js (9)

- `js/p_rank.js:66` · **letra-pequena** · `px;top:2px;z-index:3;font-size:10.5px;font-weight:900;color:#ffe07a;text-align:center;backgroun` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_rank.js:70` · **letra-pequena** · `ng:2px"><span style="font-size:10px;font-weight:900;color:${r.from===1?'#ffc94a':'#c9b9a2'}">To` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_rank.js:70` · **letra-pequena** · `}</span><span style="font-size:9px;font-weight:800;color:#c9b9a2;text-align:center;overflow:hid` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_rank.js:71` · **letra-pequena** · `'')}</div><span style="font-size:10px;font-weight:800;color:#ffd27a;text-align:center">Os prêmi` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_rank.js:77` · **nowrap-sem-reticencias** · `e:15px;color:#ffe07a;white-space:nowrap">${rkEsc(R_TABS[XRK.tab].fmt(r.value))}</span></div>'; ` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_rank.js:93` · **nowrap-sem-reticencias** · `15px;color:#ffe07a;white-space:nowrap">${ck.head}<span id="pr_sec">${ck.sec}</span></span></spa` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_rank.js:93` · **letra-pequena** · `-end"><span style="font-size:10px;font-weight:800;color:#c9b9a2">Fecha em</span><span style="fo` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_rank.js:96` · **nowrap-sem-reticencias** · `e:16px;color:#ffe07a;white-space:nowrap">${D.own==null?'—':rkEsc(T.fmt(D.own))}</span></button>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_rank.js:96` · **alvo-pequeno** · `flex:none;width:38px;height:38px;border-radius:50%;overflow:hidden;position:relative;background` → alvo de toque ≥ 40×40 px (hoje altura 38 px): aumentar altura ou padding invisível

### js/p_profile.js (3)

- `js/p_profile.js:52` · **nowrap-sem-reticencias** · `ize:16px;color:#ffe07a;white-space:nowrap">${v}</span></span>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_profile.js:52` · **letra-pequena** · `-width:0"><span style="font-size:10px;font-weight:800;color:#c9b9a2">${l}</span><span style="fo` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_profile.js:69` · **nowrap-sem-reticencias** · `-size:18px;color:#ffe07a;white-space:nowrap">${pr2Esc(v)}</span></div>${pct!=null?'<span role="` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_vip.js (2)

- `js/p_vip.js:111` · **letra-pequena** · `d068;color:#0d2410;font-size:9px;font-weight:900">NOVO</span>':''}</span></div>'; }).join('');` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_vip.js:127` · **nowrap-sem-reticencias** · `:1;color:#2a1403;white-space:nowrap">${title}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

## Demais arquivos (PO distribui)

### js/screens.js (65)

- `js/screens.js:94` · **largura-fixa** · `on:absolute;left:0;top:0;width:390px;transform-origin:0 0;overflow:hidden;background:#16110d;fo` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens.js:195` · **letra-pequena** · `id #6b5843;color:#e8dccb;font-size:8px;font-weight:900;text-align:center;line-height:1.2;paddin` → subir para 11–12 px (hoje 8 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:236` · **absoluta-sem-safe-area** · `.x-ghost{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;border-ra` → somar env(safe-area-inset-top|bottom) (padding-top:max(8px,env(safe-area-inset-top)))
- `js/screens.js:243` · **nowrap-sem-reticencias** · `cgain 1.5s ease-out both;white-space:nowrap;z-index:1}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:302` · **nowrap-sem-reticencias** · `ight:800;color:#c9b9a2;white-space:nowrap">${sub}</span>':''}</span>${b(1,pg<pages-1,nextLb||'P` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:324` · **largura-fixa** · `:absolute;left:50%;top:0;width:390px;height:${h}px;margin-left:-195px';` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens.js:463` · **letra-pequena** · `22)}<span style="font-size:9px;font-weight:900;line-height:1.05">Nível ${Sys.stats.DATA.wing.mi` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:464` · **nowrap-sem-reticencias** · ` #000,0 0 4px #000;white-space:nowrap">Asa</span></div>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:464` · **letra-pequena** · `relative;z-index:2;font-size:10px;line-height:11px;font-weight:900;color:#e8dccb;text-shadow:0 ` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:471` · **letra-pequena** · `gba(0,0,0,.72);font-size:10px;font-weight:900;color:${it?'#fff':'#c9b9a2'};line-height:16px">${` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:474` · **nowrap-sem-reticencias** · ` #000,0 0 4px #000;white-space:nowrap">${nm}</span></div>'; }).join(''); /* rótulo do espaço:` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:474` · **letra-pequena** · `relative;z-index:2;font-size:10px;line-height:11px;font-weight:900;color:#f6ecdf;text-shadow:0 ` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:484` · **nowrap-sem-reticencias** · `:800;color:#c9b9a2;white-space:nowrap">${GL[k]}</span><span class="lil" id="xg_s_${k}" style="f` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:484` · **nowrap-sem-reticencias** · `Px(vL,sIn,14,8)}px;white-space:nowrap">${v0}</span></div></div>'; }).join('');` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:495` · **letra-pequena** · `:rgba(0,0,0,.72);font-size:9px;font-weight:900;color:${c};line-height:15px">Nv.${it.lvl}</span>` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:498` · **nowrap-sem-reticencias** · `op:-6px;right:-4px;white-space:nowrap;line-height:1.1;padding:2px 5px;border-radius:7px;backgro` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:498` · **letra-pequena** · `#16110d;color:#fff;font-size:10px;font-weight:900;letter-spacing:.5px;pointer-events:none">NOVO` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:519` · **largura-fixa** · `;left:50%;bottom:0;width:390px;height:292px;margin-left:-195px;pointer-events:none':X390(292)}"` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens.js:524` · **nowrap-sem-reticencias** · `gba(95,208,104,.6);white-space:nowrap">FC +${fcTxt(gain)}</span></div>':''}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:530` · **nowrap-sem-reticencias** · `cing:${fcLs}px;white-space:nowrap">${fcLbl}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:531` · **nowrap-sem-reticencias** · `origin:0 50%;white-space:nowrap">${gFmt('fc',shown.fc)}</span></div></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:536` · **nowrap-sem-reticencias** · `olor:#c9b9a2;white-space:nowrap">Coleção de skins +${p1(SD.collection)}</span></span>${lookOn&&` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:543` · **letra-pequena** · `yle="flex:none;font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">Mochila ${S.inv` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:543` · **letra-pequena** · `;color:#ffc94a;font-size:9.5px;font-weight:900;white-space:nowrap">${SVG_LOCK(10,'#ffc94a')}${e` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:543` · **letra-pequena** · `:1;min-width:0;font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidden;` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:543` · **alvo-pequeno** · `center;gap:3px;height:18px;padding:0 6px;border-radius:9px;border:1px solid #8a7458;background:` → alvo de toque ≥ 40×40 px (hoje altura 18 px): aumentar altura ou padding invisível
- `js/screens.js:545` · **alvo-pequeno** · `:-4px;width:10px;height:10px;border-radius:50%;background:#ff4d3d;border:2px solid #16110d"></s` → alvo de toque ≥ 40×40 px (hoje altura 10 px): aumentar altura ou padding invisível
- `js/screens.js:546` · **alvo-pequeno** · `:-4px;width:10px;height:10px;border-radius:50%;background:#ff4d3d;border:2px solid #16110d"></s` → alvo de toque ≥ 40×40 px (hoje altura 10 px): aumentar altura ou padding invisível
- `js/screens.js:547` · **nowrap-sem-reticencias** · `ap:5px;flex:none;white-space:nowrap">${SVG_UP(16)}Equipar melhor</button>'` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:555` · **nowrap-sem-reticencias** · `;font-weight:900;white-space:nowrap">${SVG_LOCK(12,'#ffc94a')}${esc2(autoLock)}</span>'` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:556` · **nowrap-sem-reticencias** · `8a':'#c9b9a2'};white-space:nowrap">${autoOn?autoOn+(autoOn===1?' ligado':' ligados'):'desligado` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:561` · **alvo-pequeno** · `le="min-width:24px;height:24px;padding:0 6px;border-radius:12px;background:#2a1403;color:#ffe07` → alvo de toque ≥ 40×40 px (hoje altura 24 px): aumentar altura ou padding invisível
- `js/screens.js:580` · **nowrap-sem-reticencias** · `${lbW}px;flex:none;white-space:nowrap">${GL[k]}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:581` · **nowrap-sem-reticencias** · `-weight:900;flex:1;white-space:nowrap"><span id="xg_d_${k}">${gFmt(k,shown[k])}</span> <span st` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:582` · **nowrap-sem-reticencias** · `;font-size:${f2}px;white-space:nowrap;color:${up?'#5fd068':dn?'#ff5a4e':'#c9b9a2'}">${up?SVG_UP` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:586` · **nowrap-sem-reticencias** · `weight:800;color:${lc};white-space:nowrap">${lb}</span><span class="lil" style="font-size:${xFi` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:586` · **nowrap-sem-reticencias** · `11-6,fcCol?14:15,8)}px;white-space:nowrap${vc?';color:'+vc:''}">${val}</span></div>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:589` · **letra-pequena** · `<span style="font-size:9px;font-weight:900;color:${tagC};letter-spacing:1px">${tag}</span` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:591` · **nowrap-sem-reticencias** · `b;line-height:1.15;white-space:nowrap">${t}</span>').join(''):''}</div>'; };` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:591` · **letra-pequena** · `p(t=>'<span style="font-size:10px;font-weight:800;color:#e8dccb;line-height:1.15;white-space:no` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:619` · **nowrap-sem-reticencias** · `px;font-weight:900;white-space:nowrap">` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:619` · **alvo-pequeno** · `ta-x="equp" style="height:36px;border-radius:12px;border:2px solid ${plan.ok||S.gems>=plan.gems` → alvo de toque ≥ 40×40 px (hoje altura 36 px): aumentar altura ou padding invisível
- `js/screens.js:630` · **letra-pequena** · `<span style="font-size:10px;font-weight:800;color:#c9b9a2">Devolve 50% do ouro investido</s` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:631` · **letra-pequena** · `:Nunito,sans-serif;font-size:10px;font-weight:800;color:#b8f0bd">toque para tirar</span></butto` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:640` · **largura-fixa** · `mar melhoria" style="width:330px;border-radius:18px;border:3px solid #ffc94a;background:#241b14` → usar max-width:100% / min(330px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens.js:671` · **nowrap-sem-reticencias** · `px;font-weight:900;white-space:nowrap">${SVG_LOCK(14,'#ffc94a')}${esc2(r.lockText)}</span>'` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:681` · **nowrap-sem-reticencias** · `x;font-size:15px;white-space:nowrap">Ir à Loja</button></div>':''}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:744` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:${RC[i]};opacity:.75">${RN(i)}</span><spa` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:755` · **letra-pequena** · `pan><span style="font-size:9px;font-weight:900">FALTAM</span></div>` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:783` · **nowrap-sem-reticencias** · `;font-weight:900;white-space:nowrap">${brinde} de brinde</span>':''}</button>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:793` · **nowrap-sem-reticencias** · `:11}px;font-weight:900;white-space:nowrap;box-shadow:0 0 10px ${c};z-index:2">${tag}</span>':''` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:802` · **letra-pequena** · `<span style="font-size:9px;font-weight:900;color:${c}">${k.dism?'Desmontado':RN(k.r)}</sp` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:810` · **nowrap-sem-reticencias** · `px;font-weight:800;white-space:nowrap"></div><div id="xs_btn" style="position:relative"></div><` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:901` · **letra-pequena** · `1a;color:#c9b9a2;font-size:10px;font-weight:900;line-height:1.05;text-align:center;display:flex` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:918` · **nowrap-sem-reticencias** · `<span style="white-space:nowrap">':''}${XH.featDay?'Termina em':'Troca em'}${nw?'</span>':''} <` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:918` · **nowrap-sem-reticencias** · `e:${nw?'16px;white-space:nowrap':'18px'}">${midnightLeft()}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:944` · **nowrap-sem-reticencias** · `nt-size:15px;white-space:nowrap">${esc2(xBuyPrice(mCard.id))}</button>'}</div>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:949` · **nowrap-sem-reticencias** · `:0 3px 0 #8a4f0c;white-space:nowrap">${esc2(xBuyPrice(p.id))}</span></button>'; }).join('')` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens.js:973` · **letra-pequena** · `center;gap:0 3px;font-size:10px;font-weight:800;line-height:1.1;color:#c9b9a2;text-align:center` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens.js:974` · **nowrap-sem-reticencias** · `line-height:1.15;white-space:nowrap">${t}</span>').join('')}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- … mais 5 neste arquivo

### js/screens2.js (39)

- `js/screens2.js:119` · **largura-fixa** · `on:absolute;left:0;top:0;width:390px;transform-origin:0 0}` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens2.js:247` · **nowrap-sem-reticencias** · `weight:900;color:#f6ecdf;white-space:nowrap">${ex.map(x=>'<span style="display:flex;align-items` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:317` · **nowrap-sem-reticencias** · `:900;color:#8fe596;white-space:nowrap">Resgatado</span>':'<span style="display:flex;align-items` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:317` · **nowrap-sem-reticencias** · `or:#c9b9a2${pNar?';white-space:nowrap':''}">No nível ${lv}</span>':'';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:317` · **letra-pequena** · `pNar?'<span style="font-size:10px;font-weight:900;color:#8fe596;white-space:nowrap">Resgatado</` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:324` · **letra-pequena** · `?'<span style="font-size:9px;font-weight:900;color:${fi.rc};line-height:1.05;overflow-wrap:anyw` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:329` · **letra-pequena** · `?'<span style="font-size:9px;font-weight:900;color:${pi.rc};line-height:1.05;overflow-wrap:anyw` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:334` · **letra-pequena** · `pan><span style="font-size:9px;font-weight:800;color:#c9b9a2;text-align:center">diamantes, moed` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:335` · **letra-pequena** · `ext-align:center;font-size:9px;font-weight:900;color:#c9b9a2">NÍVEL DO PASSE</span>` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:336` · **letra-pequena** · `pan><span style="font-size:9px;font-weight:800;color:#d9c8ff;text-align:center">Raro, Épico e L` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:350` · **letra-pequena** · `n><span style="font-size:10px;font-weight:900;color:#2a1250">${premP?esc2(xBuyPrice(premP.id)):` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:399` · **nowrap-sem-reticencias** · `ight:900;color:#e8dccb;white-space:nowrap">${Y_CLOCK}${hDays}</span>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:400` · **alvo-pequeno** · `="flex:none;width:32px;height:32px;margin:-4px -2px -4px 4px;border-radius:10px;border:2px soli` → alvo de toque ≥ 40×40 px (hoje altura 32 px): aumentar altura ou padding invisível
- `js/screens2.js:406` · **nowrap-sem-reticencias** · `olor:#e6d4ff;white-space:nowrap;letter-spacing:.2px">Prêmio Nv. ${big.lv}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:406` · **letra-pequena** · `<span style="font-size:9px;font-weight:900;color:#e6d4ff;white-space:nowrap;letter-spacing:.2px` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:411` · **nowrap-sem-reticencias** · `line-height:1.05;white-space:nowrap">${hTitle}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:413` · **nowrap-sem-reticencias** · `00;color:#c9b9a2;white-space:nowrap">${hPl}</span>${hClock}</div>':''}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:414` · **nowrap-sem-reticencias** · `ize:${hChipPx}px;white-space:nowrap">${hChip}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:415` · **nowrap-sem-reticencias** · `;color:#c9b9a2;white-space:nowrap">${hPl}</span>'}</div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:420` · **alvo-pequeno** · `0px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ff5a4e;color:#fff;fo` → alvo de toque ≥ 40×40 px (hoje altura 18 px): aumentar altura ou padding invisível
- `js/screens2.js:423` · **largura-fixa** · `ar Premium" style="width:330px;max-width:100%;border-radius:18px;border:3px solid #8a4dff;backg` → usar max-width:100% / min(330px,100%) ou % (a tela mais estreita é 288 px)
- `js/screens2.js:431` · **nowrap-sem-reticencias** · `px;padding:0 8px;white-space:nowrap">Ativar · ${esc2(xBuyPrice(premP.id))}</button>':''}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:497` · **nowrap-sem-reticencias** · `;color:#c9b9a2;white-space:nowrap">+${f1c(lv*t.per)}${un} <span style="color:#5fd068">${full?'·` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:503` · **letra-pequena** · `pan><span style="font-size:10px;font-weight:800;color:#c9b9a2">Pedras de prática</span></div><s` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:527` · **nowrap-sem-reticencias** · `;color:#e8dccb;white-space:nowrap">${prog}</span></span>'}</button>'; }).join('')` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:527` · **letra-pequena** · `n><span style="font-size:10px;font-weight:900;color:#e8dccb;white-space:nowrap">${prog}</span><` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:533` · **letra-pequena** · `15"><span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:1px">EM DESTAQUE ·` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/screens2.js:534` · **nowrap-sem-reticencias** · `00;color:#5fd068;white-space:nowrap">${feat?esc2(T.bonusText(feat,T.DATA.featuredMult)):''}</sp` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:534` · **nowrap-sem-reticencias** · `00;color:#c9b9a2;white-space:nowrap">${Object.keys(o.unlocked).length}/${T.DATA.titles.length} ` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:633` · **nowrap-sem-reticencias** · `4}px;color:#ffe07a;white-space:nowrap">${g}</span><span style="font-size:12px;font-weight:800;c` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:633` · **nowrap-sem-reticencias** · `:800;color:#c9b9a2;white-space:nowrap">Moedas de ouro</span></span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:639` · **nowrap-sem-reticencias** · `4}px;color:#9be89f;white-space:nowrap">${x}</span><span style="font-size:12px;font-weight:800;c` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:640` · **nowrap-sem-reticencias** · `px;font-weight:900;white-space:nowrap"><span>${esc2(c.lv)}${c.up?' <span style="color:#ffe07a">` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:642` · **nowrap-sem-reticencias** · `e:12px;font-weight:900;white-space:nowrap">${x.ic}<span>${x.r!=null?xRarName(x.r,x.tx):esc2(x.t` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:648` · **nowrap-sem-reticencias** · `letter-spacing:1px;white-space:nowrap">ITEM · ${esc2(RN(c.r).toUpperCase())}${c.more>0?' · MAIS` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:677` · **nowrap-sem-reticencias** · ` rgba(255,90,78,.55);white-space:nowrap">O chefe foi mais forte</h1>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:681` · **nowrap-sem-reticencias** · `t-size:${fcPx}px;white-space:nowrap;color:#f6ecdf">${fcTxt(rec)}</span></span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:703` · **nowrap-sem-reticencias** · `xt-shadow:0 2px 0 #000;white-space:nowrap">${ERAS[e].n} ${e+1}-${inEra}</span><span style="font` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/screens2.js:703` · **nowrap-sem-reticencias** · `ight:900;color:#ffb3a8;white-space:nowrap;text-shadow:0 1px 2px #000">${lord?'SENHOR DA ERA':'C` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_forge.js (22)

- `js/p_forge.js:155` · **nowrap-sem-reticencias** · `weight:900;padding:0;white-space:nowrap">${m[1]}</button>'; }).join('')` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:157` · **nowrap-sem-reticencias** · `weight:900;padding:0;white-space:nowrap">Fusão</button>':'');` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:173` · **nowrap-sem-reticencias** · `dow:0 1px 2px #000;white-space:nowrap">${esc2(SLOT[sl].n)}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:174` · **letra-pequena** · `le="max-width:96px;font-size:10px;font-weight:800;color:${xRarT(it)};text-shadow:0 1px 2px #000` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_forge.js:208` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:#c9b9a2;text-shadow:0 1px 2px #000;letter-s` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_forge.js:210` · **nowrap-sem-reticencias** · `;color:#f6ecdf;white-space:nowrap">${esc2(auraLabel)}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:220` · **nowrap-sem-reticencias** · `line-height:1.05;white-space:nowrap">Nível ${fWingLv()}</span></span></button>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:220` · **letra-pequena** · `18)}<span style="font-size:9px;font-weight:900;line-height:1.05;white-space:nowrap">Nível ${fWi` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_forge.js:232` · **nowrap-sem-reticencias** · `:900;color:#c9b9a2;white-space:nowrap">` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:260` · **nowrap-sem-reticencias** · `ont-weight:900;white-space:nowrap">${SVG_LOCK(14,'#ffc94a')}${esc2(cv.lockText)}</span></button` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:270` · **nowrap-sem-reticencias** · `;color:#c9b9a2;white-space:nowrap">${esc2(fStatName(sl))} do espaço</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:271` · **nowrap-sem-reticencias** · `ont-weight:900;white-space:nowrap">+${fPct(FD.bonus[n])}% <span style="color:#c9b9a2">→</span> ` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:274` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:.5px">CHANCE</span>` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_forge.js:287` · **nowrap-sem-reticencias** · `4e':'#f6ecdf'};white-space:nowrap">${F_HAMMER(18)}${stop?'—':n0(c.stones)+' / '+kf(stones)}</sp` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:288` · **nowrap-sem-reticencias** · `4e':'#c9b9a2'};white-space:nowrap">${COIN_I(14)}${stop?'—':kf(c.gold)}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:304` · **nowrap-sem-reticencias** · `dow:0 2px 0 #000;white-space:nowrap">Nv. ${L}</span>${F_ARROW}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:305` · **nowrap-sem-reticencias** · `dow:0 2px 0 #000;white-space:nowrap">${isMax?'Máx':'Nv. '+(L+1)}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:307` · **nowrap-sem-reticencias** · `;color:#c9b9a2;white-space:nowrap">${esc2(fStatName(sl))} do item</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:308` · **nowrap-sem-reticencias** · `ont-weight:900;white-space:nowrap">${fMul(L)} <span style="color:#c9b9a2">→</span> <span style=` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:310` · **nowrap-sem-reticencias** · `e="color:#ffc94a;white-space:nowrap">${L} / ${ML}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:319` · **nowrap-sem-reticencias** · `4e':'#f6ecdf'};white-space:nowrap">${COIN_I(22)}${blocked?'—':kf(cu.gold)}</span></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_forge.js:328` · **nowrap-sem-reticencias** · `00;color:#c9b9a2;white-space:nowrap">Pedras de Forja</span></div></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_arena.js (21)

- `js/p_arena.js:43` · **nowrap-sem-reticencias** · `e:10px;font-weight:900;white-space:nowrap"><svg width="10" height="10" viewBox="0 0 24 24" fill` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:43` · **letra-pequena** · ` #6b5843;color:#c9b9a2;font-size:10px;font-weight:900;white-space:nowrap"><svg width="10" heigh` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:72` · **letra-pequena** · `ht:1.1"><span style="font-size:10px;font-weight:800;color:${L.c3}">Fecha em</span><span id="pa_` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:82` · **letra-pequena** · `/span><span style="font-size:10px;color:#c9b9a2;font-family:inherit;font-weight:800">pts</span>` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:83` · **letra-pequena** · `right:8px;top:-7px;font-size:9px;font-weight:900;color:#2a1403;background:#ffc94a;border-radius` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:85` · **letra-pequena** · `pan style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Cópias d` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:90` · **letra-pequena** · `ont-family:inherit;font-size:10px;font-weight:900;color:#2a1403;background:#ffc94a;border-radiu` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:95` · **letra-pequena** · `pan style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Fragment` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:105` · **letra-pequena** · `pan style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Prévia c` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:201` · **nowrap-sem-reticencias** · `weight:800;color:#ffd25e;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:201` · **letra-pequena** · `.pv-pf{font-size:10px;font-weight:800;color:#ffd25e;white-space:nowrap}` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:208` · **letra-pequena** · `0;right:0;top:0;bottom:0;font-size:8px;font-weight:900;display:grid;place-items:center;text-sha` → subir para 11–12 px (hoje 8 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:215` · **letra-pequena** · `.pv-tm{font-size:10px;font-weight:900;color:#9aa6d6;font-variant-numeric:tabu` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:216` · **nowrap-sem-reticencias** · `0,255,.28);color:#9aa6d6;white-space:nowrap;max-width:calc(100% - 20px);overflow:hidden}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:216` · **letra-pequena** · `anslateX(-50%);z-index:5;font-size:10px;font-weight:900;padding:3px 10px;border-radius:10px;bac` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:227` · **nowrap-sem-reticencias** · `text-transform:uppercase;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:227` · **letra-pequena** · `info small{display:block;font-size:9px;color:#9aa6d6;font-weight:900;letter-spacing:.8px;text-t` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:228` · **nowrap-sem-reticencias** · `ant-numeric:tabular-nums;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:246` · **letra-pequena** · `.pv-rwt{margin:12px 0 0;font-size:10px;font-weight:900;letter-spacing:.6px;text-transform:uppe` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_arena.js:250` · **nowrap-sem-reticencias** · `eight:400;font-size:18px;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_arena.js:251` · **letra-pequena** · `.pv-rw small{font-size:10px;color:#9aa6d6;font-weight:800}` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)

### js/p_events.js (21)

- `js/p_events.js:71` · **nowrap-sem-reticencias** · `:0 6px;border-radius:6px;white-space:nowrap;color:#fff}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:71` · **letra-pequena** · `tag{display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-r` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:108` · **letra-pequena** · `family:Nunito,sans-serif;font-size:9px;font-weight:900;line-height:14px;vertical-align:2px}` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:123` · **nowrap-sem-reticencias** · `ght:900;line-height:14px;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:123` · **letra-pequena** · `nd:#ffc94a;color:#2a1403;font-size:9.5px;font-weight:900;line-height:14px;white-space:nowrap}` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:141` · **nowrap-sem-reticencias** · `ight:900;line-height:1.1;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:151` · **letra-pequena** · `px 8px;border-radius:7px;font-size:10px;font-weight:900;letter-spacing:.8px;line-height:16px;co` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:160` · **letra-pequena** · `ition:relative;z-index:1;font-size:9.5px;font-weight:900;letter-spacing:.6px;color:var(--rc);te` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:176` · **letra-pequena** · `.pz-lim{font-size:10.5px;font-weight:800;color:#c9b9a2}` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:223` · **nowrap-sem-reticencias** · `e-height:15px;color:#fff;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:223` · **letra-pequena** · `rder:1px solid var(--rc);font-size:10.5px;font-weight:900;line-height:15px;color:#fff;white-spa` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:231` · **nowrap-sem-reticencias** · ` 1px 0 #000,0 0 3px #000;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:237` · **nowrap-sem-reticencias** · `sans-serif;line-height:1;white-space:nowrap;z-index:5;animation:pzbdp 1.4s ease-out both;pointe` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:350` · **nowrap-sem-reticencias** · `00;color:#e8dccb;white-space:nowrap">${lbl}</span><span class="pz-lil" style="font-size:16px;co` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:350` · **nowrap-sem-reticencias** · `ric:tabular-nums;white-space:nowrap">${clk}</span></span></span></div></div>'; }` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:350` · **letra-pequena** · `:0"><span style="font-size:10px;font-weight:800;color:#e8dccb;white-space:nowrap">${lbl}</span>` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:378` · **nowrap-sem-reticencias** · `ight:900;color:#ffe07a;white-space:nowrap">Relógio do Festival</span><span style="flex:1"></spa` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_events.js:396` · **letra-pequena** · `ht:1.1"><span style="font-size:10.5px;font-weight:900;color:${B.c};letter-spacing:1px;text-shad` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:412` · **letra-pequena** · `ht:1.1"><span style="font-size:10.5px;font-weight:900;color:${B.c};letter-spacing:1px;text-shad` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:481` · **letra-pequena** · `width:0"><small style="font-size:10.5px;font-weight:800;color:#e8dccb;white-space:nowrap;overfl` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_events.js:481` · **letra-pequena** · `width:0"><small style="font-size:10.5px;font-weight:800;color:#e8dccb;white-space:nowrap">Ganho` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)

### js/fullbattle.js (16)

- `js/fullbattle.js:22` · **largura-fixa** · `on:absolute;left:0;top:0;width:390px;transform-origin:0 0}` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/fullbattle.js:72` · **nowrap-sem-reticencias** · `px 2px #000,0 0 5px #000;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/fullbattle.js:72` · **letra-pequena** · `.fb-lb{font-size:10.5px;line-height:12px;font-weight:900;color:#fff;text-shad` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/fullbattle.js:75` · **nowrap-sem-reticencias** · `ght:15px;font-weight:900;white-space:nowrap;border:1px solid #2a1403;animation:fbbdg 1s ease-in` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/fullbattle.js:75` · **letra-pequena** · `a,#f2a826);color:#2a1403;font-size:9.5px;line-height:15px;font-weight:900;white-space:nowrap;bo` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/fullbattle.js:76` · **nowrap-sem-reticencias** · `ght:14px;font-weight:900;white-space:nowrap;border:1px solid #2a1403}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/fullbattle.js:76` · **letra-pequena** · `nd:#ffc94a;color:#2a1403;font-size:8.5px;line-height:14px;font-weight:900;white-space:nowrap;bo` → subir para 11–12 px (hoje 8.5 px) ou usar clamp(11px,3vw,13px)
- `js/fullbattle.js:202` · **alvo-pequeno** · `"" style="width:34px;height:32px;object-fit:contain">' : '<img class="fb-ico" src="assets/icons` → alvo de toque ≥ 40×40 px (hoje altura 32 px): aumentar altura ou padding invisível
- `js/fullbattle.js:212` · **nowrap-sem-reticencias** · `x;line-height:18px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.5)">Nv. 1</span></span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/fullbattle.js:213` · **nowrap-sem-reticencias** · `eight:900;color:#fff;white-space:nowrap;box-sizing:border-box">FC 0</span></button>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/fullbattle.js:215` · **alvo-pequeno** · `"" style="width:24px;height:24px;object-fit:contain"><span id="fb_gold" style="font-size:13.5px` → alvo de toque ≥ 40×40 px (hoje altura 24 px): aumentar altura ou padding invisível
- `js/fullbattle.js:216` · **alvo-pequeno** · `"" style="width:22px;height:22px;object-fit:contain"><span id="fb_gems" style="font-size:13.5px` → alvo de toque ≥ 40×40 px (hoje altura 22 px): aumentar altura ou padding invisível
- `js/fullbattle.js:223` · **alvo-pequeno** · `"" style="width:30px;height:30px;object-fit:contain">Desafiar</button></div>` → alvo de toque ≥ 40×40 px (hoje altura 30 px): aumentar altura ou padding invisível
- `js/fullbattle.js:242` · **letra-pequena** · `:#f6ecdf;color:#2a1403;font-size:10.5px;line-height:12px;font-weight:900;text-align:center;box-` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/fullbattle.js:325` · **letra-pequena** · `h += '<span style="font-size:10px;font-weight:900;color:#ffd0c8;margin-left:2px">${S.farm ? 'FA` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/fullbattle.js:333` · **alvo-pequeno** · `top:1px;width:14px;height:14px;border-radius:50%;background:#1a110b;display:flex;align-items:ce` → alvo de toque ≥ 40×40 px (hoje altura 14 px): aumentar altura ou padding invisível

### js/p_pets.js (14)

- `js/p_pets.js:371` · **nowrap-sem-reticencias** · `;color:#ffe07a;white-space:nowrap">${owned?'Nv '+n0(lv)+'/'+n0(MAXL):'Nv —'}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_pets.js:378` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;line-height:1">${esc2(n)}</span></button>'; }).join` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:386` · **letra-pequena** · `ght:1.25"><span style="font-size:10px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${l` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:416` · **nowrap-sem-reticencias** · `seline;gap:4px;white-space:nowrap"><span class="lil" style="font-size:17px;color:${k.c}">${ptPc` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_pets.js:416` · **letra-pequena** · `n><span style="font-size:10px;font-weight:900;color:#c9b9a2">máx ${ptPct(k.max)}</span></span>` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:430` · **letra-pequena** · `n><span style="font-size:10px;font-weight:900;color:#c9b9a2;line-height:1">${i===0?'ao chocar':` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:431` · **nowrap-sem-reticencias** · `03':'#c9b9a2'};white-space:nowrap">${reached?(i===stg?'atual':'feito'):can?'pronto!':owned?'fal` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_pets.js:431` · **letra-pequena** · `der-radius:6px;font-size:10px;font-weight:900;background:${reached?'#1f3a22':can?'#ffc94a':'#16` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:442` · **letra-pequena** · `ght:0;bottom:2px;font-size:10px;font-weight:900;line-height:1.1;text-align:center;color:${po?'#` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:449` · **letra-pequena** · `order-radius:7px;font-size:10px;font-weight:900;color:#16110d">O MAIS RARO</span>` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:452` · **letra-pequena** · `15"><span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidde` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:452` · **letra-pequena** · `pan><span style="font-size:10px;font-weight:900;color:#e6d8ff;white-space:nowrap;overflow:hidde` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:501` · **letra-pequena** · `r-radius:7px;font-size:10px;font-weight:900;color:#16110d;background:${PT_RC[pr]}">${esc2(ptRN(` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pets.js:502` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:#c9b9a2;line-height:1.1;text-align:center">${` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)

### js/p_map.js (13)

- `js/p_map.js:110` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:${st==='won'?'#7be08a':st==='cur'?'#ffe07` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:114` · **largura-fixa** · `e="position:relative;width:390px;height:${MW_H}px;background:linear-gradient(180deg,#0e1830 0%,` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_map.js:120` · **largura-fixa** · `px;top:${MW.SKY}px;width:600px;height:${Math.round(2752*MW.S)}px;background:url(assets/map/worl` → usar max-width:100% / min(600px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_map.js:135` · **letra-pequena** · `])}</span><span style="font-size:10px;font-weight:900;color:#e8dccb">${b>=P.DATA.perEra?'Fechad` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:146` · **letra-pequena** · `:1.1"><span style="font-size:10px;font-weight:900;color:#c9b9a2">CHEFE · FASE ${P.DATA.chefe}</` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:147` · **letra-pequena** · `<span style="font-size:10px;font-weight:900;color:#ffc94a;margin-top:4px">SENHOR DA ERA · F` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:178` · **letra-pequena** · `s:none"><span style="font-size:10px;font-weight:900;color:#ffc94a;text-shadow:0 1px 0 #000">Sen` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:181` · **letra-pequena** · `/span><span style="font-size:10px;font-weight:900;display:flex;align-items:center;gap:2px">${op` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:197` · **letra-pequena** · `t:1.15"><span style="font-size:10px;font-weight:900;color:#c9b9a2">FC recomendada</span><span s` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:200` · **letra-pequena** · `{on?'':'<span style="font-size:10px;font-weight:800;color:#a89a88;text-align:center">A jornada ` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:203` · **letra-pequena** · `1.05"><span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:1px">ERA ${e} · ` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_map.js:208` · **largura-fixa** · `e="position:relative;width:390px;height:${ME_H+150}px;padding-top:120px;box-sizing:content-box"` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_map.js:209` · **largura-fixa** · `e;left:0;top:120px;width:390px;height:${ME_H}px">` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)

### js/p_auction.js (10)

- `js/p_auction.js:65` · **letra-pequena** · `nter;gap:1px;padding:2px;font-size:10.5px;font-weight:900;line-height:1;box-sizing:border-box}` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_auction.js:71` · **letra-pequena** · `spacing:0}.au-nar .au-ex{font-size:9px} /* tela abaixo de 340 px: os selos (raridade, EXEMPLO` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_auction.js:86` · **nowrap-sem-reticencias** · `radius:6px;color:#16110d;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_auction.js:86` · **letra-pequena** · `-rp{display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-r` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_auction.js:87` · **nowrap-sem-reticencias** · `,10,7,.75);color:#cfe7ff;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_auction.js:87` · **letra-pequena** · `-ex{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.5px;line-height:14px;p` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_auction.js:90` · **nowrap-sem-reticencias** · `pacing:1px;line-height:1;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_auction.js:99` · **nowrap-sem-reticencias** · `:0 6px;border-radius:6px;white-space:nowrap;display:inline-block;background:#4a3a2b;color:#fff}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_auction.js:107` · **nowrap-sem-reticencias** · `au-sum b{font-weight:900;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_auction.js:229` · **nowrap-sem-reticencias** · `e:15px;color:#c9b9a2;white-space:nowrap">—</span>${right||''}</span></div>'; }` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_offer.js (10)

- `js/p_offer.js:190` · **largura-fixa** · `="left:50%;top:50%;width:360px;height:360px;margin:-200px 0 0 -110px"></div>` → usar max-width:100% / min(360px,100%) ou % (a tela mais estreita é 288 px)
- `js/p_offer.js:203` · **nowrap-sem-reticencias** · `;color:#ffe07a;white-space:nowrap;line-height:12px">${W.stars}<svg width="9" height="9" viewBox` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:203` · **letra-pequena** · `?'<span style="font-size:9.5px;font-weight:900;color:#ffe07a;white-space:nowrap;line-height:12p` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_offer.js:211` · **nowrap-sem-reticencias** · `e:11px;font-weight:900;white-space:nowrap">${esc2(txt)}</span>':'';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:216` · **nowrap-sem-reticencias** · `:18px;color:#fff;white-space:nowrap">${esc2(big)}</b><span style="font-size:11px;font-weight:90` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:231` · **nowrap-sem-reticencias** · `olor:#d9b3ff;white-space:nowrap">Montaria</span></div></div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:231` · **letra-pequena** · `<span style="font-size:10.5px;font-weight:900;color:#d9b3ff;white-space:nowrap">Montaria</span>` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_offer.js:242` · **nowrap-sem-reticencias** · `px;line-height:1;white-space:nowrap">${price}</span>':''}</div>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:253` · **nowrap-sem-reticencias** · `line-height:20px;white-space:nowrap">PRIMEIRA COMPRA · SÓ UMA VEZ</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_offer.js:254` · **nowrap-sem-reticencias** · `;line-height:1.1;white-space:nowrap;filter:drop-shadow(0 2px 0 #2a1403)">Oferta do Guardião</sp` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_tourney.js (9)

- `js/p_tourney.js:57` · **letra-pequena** · `family:Nunito,sans-serif;font-size:10px;font-weight:900;line-height:16px;padding:0 3px}` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:124` · **letra-pequena** · `display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-radiu` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:126` · **nowrap-sem-reticencias** · `numeric:tabular-nums;white-space:nowrap">${tEsc(Z.left)}</span></span>':''}</div>'; }` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_tourney.js:126` · **letra-pequena** · `x:none"><span style="font-size:10px;font-weight:800;color:#c9b9a2">${tEsc(Z.ph)}</span><span st` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:141` · **letra-pequena** · `}</span><span style="font-size:10px;font-weight:900;color:${mine?'#ffd84a':'#e8dccb'};white-spa` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:141` · **letra-pequena** · `op:1px"><span style="font-size:9.5px;font-weight:900;padding:0 5px;border-radius:5px;background` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:141` · **letra-pequena** · `A</span><span style="font-size:10.5px;font-weight:900;color:#ffcfb8">${tEsc(war)}</span></span>` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:160` · **letra-pequena** · `')} <span style="font-size:10px">(teto ${cap.gold}/${cap.xp}/${cap.drop})</span></span></span><` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_tourney.js:184` · **nowrap-sem-reticencias** · `00;color:#c9b9a2;white-space:nowrap"><img src="assets/ui/coin.png" alt="" style="width:14px;hei` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_fuse.js (8)

- `js/p_fuse.js:103` · **nowrap-sem-reticencias** · `ght:900;line-height:14px;white-space:nowrap">Equipado</span>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_fuse.js:103` · **letra-pequena** · `nd:#5fd068;color:#0d2410;font-size:9px;font-weight:900;line-height:14px;white-space:nowrap">Equ` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_fuse.js:109` · **nowrap-sem-reticencias** · `ight:900;padding:0;white-space:nowrap">${m[1]}</button>'; }).join('')+'</div>'; }` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_fuse.js:125` · **nowrap-sem-reticencias** · `:800;color:#c9b9a2;white-space:nowrap">${esc2(uFamName(it)||SLOT[g.slot].n)} · ${esc2(uEraName(` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_fuse.js:125` · **letra-pequena** · `<span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(uFam` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_fuse.js:142` · **letra-pequena** · `/span><span style="font-size:10px;font-weight:900;color:#c9b9a2;margin-top:5px">${n0(uQp(it))}<` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_fuse.js:142` · **letra-pequena** · `/span><span style="font-size:10px;font-weight:800;color:#8a7458">Nv.${it.lvl||1}</span></button` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_fuse.js:162` · **nowrap-sem-reticencias** · `4e':'#f6ecdf'};white-space:nowrap">${COIN_I(22)}${P.gold!=null?kf(P.gold):'—'}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_mounts.js (7)

- `js/p_mounts.js:112` · **letra-pequena** · `.mt-box small{font-size:10px;font-weight:800;color:#c9b9a2;line-height:1.1}` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_mounts.js:222` · **nowrap-sem-reticencias** · `;color:#ffe07a;white-space:nowrap">${owned?'Nv. '+n0(lvl):'não obtida'}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_mounts.js:240` · **nowrap-sem-reticencias** · `00"><span style="white-space:nowrap">Nível ${n0(lvl)} / ${n0(cap)}</span><span style="color:#c9` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_mounts.js:255` · **letra-pequena** · `<span style="font-size:9.5px;font-weight:900;color:#c9b9a2;text-align:center">${esc2(mtAuraTx` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_mounts.js:261` · **nowrap-sem-reticencias** · `"color:#ffe07a;white-space:nowrap">${!owned?n0(have)+(have===1?' guardado':' guardados'):full?'` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_mounts.js:272` · **nowrap-sem-reticencias** · `:900"><span style="white-space:nowrap">Coleção ${n0(nOwn)}/${n0(infs.length)}</span><span style` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_mounts.js:278` · **letra-pequena** · `center;gap:2px;font-size:9.5px;font-weight:900;line-height:1.1;text-align:center;color:${tc.c}"` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)

### js/p_bag.js (6)

- `js/p_bag.js:57` · **letra-pequena** · `c94a;color:#ffe07a;font-size:10px;font-weight:900;line-height:15px">+${o.plus}</span>':''}` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_bag.js:58` · **nowrap-sem-reticencias** · `0;line-height:14px;white-space:nowrap">Equipado</span>':''}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_bag.js:58` · **letra-pequena** · `d068;color:#0d2410;font-size:9px;font-weight:900;line-height:14px;white-space:nowrap">Equipado<` → subir para 11–12 px (hoje 9 px) ou usar clamp(11px,3vw,13px)
- `js/p_bag.js:61` · **letra-pequena** · `{o.sub?'<span style="font-size:10px;font-weight:800;color:#c9b9a2;text-align:center;line-height` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_bag.js:73` · **nowrap-sem-reticencias** · `e:12px;font-weight:900;white-space:nowrap">${bEsc(label)}</button>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_bag.js:161` · **nowrap-sem-reticencias** · `13px;font-weight:900;white-space:nowrap">${nm}</button>'; }).join('')}</div>';` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_guide.js (6)

- `js/p_guide.js:24` · **letra-pequena** · `round:#3a8a38;color:#fff;font-size:10px;font-weight:900;line-height:16px;text-align:center;padd` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_guide.js:50` · **nowrap-sem-reticencias** · `ight:900;color:#ffe07a;white-space:nowrap;overflow:hidden">${guEsc(done?'Resgatar':sub)}</span>` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_guide.js:50` · **nowrap-sem-reticencias** · `ight:900;color:#e8dccb;white-space:nowrap">${guEsc(cnt)}</span></span>'}<img src="${img}" alt="` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_guide.js:50` · **letra-pequena** · `play:block;width:100px;font-size:10.5px;font-weight:900;color:#ffe07a;white-space:nowrap;overfl` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_guide.js:50` · **letra-pequena** · `an></span><span style="font-size:10.5px;font-weight:900;color:#e8dccb;white-space:nowrap">${guE` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_guide.js:50` · **alvo-pequeno** · `t="" style="width:16px;height:16px;object-fit:contain;flex:none"></span></span><svg class="pgd-` → alvo de toque ≥ 40×40 px (hoje altura 16 px): aumentar altura ou padding invisível

### js/p_intro.js (6)

- `js/p_intro.js:178` · **nowrap-sem-reticencias** · `t:900;font-size:13px;white-space:nowrap;flex:none">'+esc(this.realmBadge())+'</span>'` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_intro.js:179` · **nowrap-sem-reticencias** · ` Nunito,sans-serif;white-space:nowrap">Trocar servidor</button>':'');` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_intro.js:179` · **alvo-pequeno** · `i-realmbtn" style="min-height:36px;padding:6px 10px;border-radius:12px;border:1px solid #6b5338` → alvo de toque ≥ 40×40 px (hoje altura 36 px): aumentar altura ou padding invisível
- `js/p_intro.js:279` · **nowrap-sem-reticencias** · `#c9b9a2;margin-right:4px;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_intro.js:280` · **nowrap-sem-reticencias** · `#pin .pi-BemVindo .num{white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_intro.js:286` · **nowrap-sem-reticencias** · `ito,system-ui,sans-serif;white-space:nowrap;animation:pi_t .25s ease-out both}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### index.html (6)

- `index.html:85` · **letra-pequena** · `lute;top:-2px;right:-9px;font-size:8px}` → subir para 11–12 px (hoje 8 px) ou usar clamp(11px,3vw,13px)
- `index.html:128` · **largura-fixa** · `@media (min-width:600px) and (min-height:500px){` → usar max-width:100% / min(600px,100%) ou % (a tela mais estreita é 288 px)
- `index.html:148` · **nowrap-sem-reticencias** · `:6px 10px;font-size:14px;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `index.html:194` · **nowrap-sem-reticencias** · `-size:18px;color:#ffc94a;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `index.html:250` · **letra-pequena** · `round:#ff4d3d;color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `index.html:563` · **nowrap-sem-reticencias** · `system-ui,sans-serif;white-space:nowrap";` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_realm.js (5)

- `js/p_realm.js:50` · **nowrap-sem-reticencias** · `e:10px;font-weight:900;white-space:nowrap">${b[0]}</span>').join('')` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_realm.js:50` · **letra-pequena** · `:${b[1]};color:${b[2]};font-size:10px;font-weight:900;white-space:nowrap">${b[0]}</span>').join` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_realm.js:51` · **nowrap-sem-reticencias** · `10px;font-weight:900;white-space:nowrap">Atual</span>':'');` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_realm.js:51` · **letra-pequena** · `ffc94a;color:#ffc94a;font-size:10px;font-weight:900;white-space:nowrap">Atual</span>':'');` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_realm.js:56` · **letra-pequena** · `edAt?'<span style="font-size:10px;font-weight:800;color:#8a7458">Aberto em ${rEsc(dateText(r.op` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)

### js/p_pass.js (4)

- `js/p_pass.js:44` · **letra-pequena** · `m.season?'<span style="font-size:10px;font-weight:800;color:#c9b9a2">Item da temporada</span>':` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pass.js:45` · **letra-pequena** · `ada</span><span style="font-size:10px;font-weight:800;color:#c9b9a2">só visual</span>');` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_pass.js:49` · **alvo-pequeno** · ` class="pw-btn" style="min-height:34px;font-size:13px;padding:0 10px">Resgatar</button>':'<span` → alvo de toque ≥ 40×40 px (hoje altura 34 px): aumentar altura ou padding invisível
- `js/p_pass.js:65` · **alvo-pequeno** · `x;min-width:20px;height:20px;border-radius:10px;background:#ff5a4e;color:#fff;font-size:12px;fo` → alvo de toque ≥ 40×40 px (hoje altura 20 px): aumentar altura ou padding invisível

### js/evhud.js (3)

- `js/evhud.js:60` · **letra-pequena** · `#fb_evn{font-size:10.5px;line-height:12px} /* nome inteiro, alinhado à direi` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/evhud.js:61` · **letra-pequena** · `#fb_evp{font-size:10.5px;line-height:12px;color:#ffe07a}#fb_evp:empty{display:` → subir para 11–12 px (hoje 10.5 px) ou usar clamp(11px,3vw,13px)
- `js/evhud.js:68` · **nowrap-sem-reticencias** · `weight:900;color:#ffc94a;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_cfg.js (3)

- `js/p_cfg.js:209` · **nowrap-sem-reticencias** · `ing:.5px;line-height:1.2;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_cfg.js:209` · **letra-pequena** · `ito,system-ui,sans-serif;font-size:9.5px;font-weight:900;letter-spacing:.5px;line-height:1.2;wh` → subir para 11–12 px (hoje 9.5 px) ou usar clamp(11px,3vw,13px)
- `js/p_cfg.js:410` · **nowrap-sem-reticencias** · `;color:#9be89f;white-space:nowrap">${cI(C_IC.chk,14,'currentColor',3)}Salvo automaticamente</sp` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_chat.js (2)

- `js/p_chat.js:17` · **nowrap-sem-reticencias** · `ize:14px;font-weight:900;white-space:nowrap}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)
- `js/p_chat.js:33` · **letra-pequena** · `n style="color:#9c8d7a;font-size:10px">${cEsc(m.time)}</span></span><span style="font-size:15px` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)

### js/p_inst.js (2)

- `js/p_inst.js:71` · **alvo-pequeno** · `span style="width:40px;height:30px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2` → alvo de toque ≥ 40×40 px (hoje altura 30 px): aumentar altura ou padding invisível
- `js/p_inst.js:75` · **nowrap-sem-reticencias** · `clamp(15px,5vw,20px);white-space:nowrap;color:#f6ecdf;flex:1">Entradas hoje: ${st.total}/${st.t` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_missions.js (2)

- `js/p_missions.js:60` · **letra-pequena** · `}</span><span style="font-size:10px">${m.claimed?'Feito':ready?'Resgatar':'Bloqueado'}</span></` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
- `js/p_missions.js:73` · **alvo-pequeno** · `op:-6px;min-width:20px;height:20px;border-radius:10px;background:#ff5a4e;color:#fff;font-size:1` → alvo de toque ≥ 40×40 px (hoje altura 20 px): aumentar altura ou padding invisível

### js/artprev.js (1)

- `js/artprev.js:324` · **nowrap-sem-reticencias** · `f;letter-spacing:.05em;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/cloudchoice.js (1)

- `js/cloudchoice.js:44` · **nowrap-sem-reticencias** · `11px;font-weight:900;white-space:nowrap">Recomendado</span>':''}` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/intro.js (1)

- `js/intro.js:18` · **largura-fixa** · `on:absolute;left:0;top:0;width:390px;transform-origin:0 0;overflow:hidden;background:#16110d}` → usar max-width:100% / min(390px,100%) ou % (a tela mais estreita é 288 px)

### js/loading.js (1)

- `js/loading.js:212` · **nowrap-sem-reticencias** · ` bt + 'flex:0 0 auto;white-space:nowrap;border:2px solid #7a4a12;background:#ffc94a;color:#3a22` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_era.js (1)

- `js/p_era.js:112` · **nowrap-sem-reticencias** · `ed(0)}px;color:#ffc94a;white-space:nowrap">ERA ${t+1} · ${peEsc(et?et.n.toUpperCase():'')}</spa` → juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)

### js/p_mail.js (1)

- `js/p_mail.js:52` · **letra-pequena** · `art}${x.q>1?'<b style="font-size:10px;color:#ffe07a">${maQ(x.q)}</b>':''}</span>'; }` → subir para 11–12 px (hoje 10 px) ou usar clamp(11px,3vw,13px)
