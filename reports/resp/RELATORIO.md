# Auditoria de responsividade e leitura

> **PARCIAL — NÃO É A AUDITORIA COMPLETA.** Este arquivo é só o teste do script: 4 telas (batalha, configurações, VIP, derrota) em 360×780, com as regras de "botão pequeno"/"fora da tela" ainda sem o ajuste final. O lote completo (5 tamanhos × todas as telas) foi parado pelo Claude Code por memória crítica e aguarda liberação (um tamanho por lote: 360×780, 320, 390, 412, 768).

Gerado em 2026-11-13T13:31:25.961Z · origem http://127.0.0.4:8080 · tamanhos 360×780

Critérios: rolagem lateral · texto cortado (scrollWidth > clientWidth, reticências) · letra < 11 px · botão < 40×40 px · elemento fora da tela ou sob a barra de status/inferior · sobreposição (>30% do menor) · contraste < 3:1 (só onde o fundo é cor sólida). Telas "em edição" (mapa/era/Códex, eras 7-8) não são defeito.

## Resumo por tela

| tela | situação | por tamanho |
|---|---|---|
| batalha | OK (avisos) | 360: 0 graves/19 avisos |
| tela_cfg | OK (avisos) | 360: 0 graves/3 avisos |
| tela_vip | COM DEFEITO | 360: 7 graves/4 avisos |
| derrota | COM DEFEITO | 360: 2 graves/3 avisos |

## Defeitos (tela · tamanho · o que · print)

- batalha · 360 · barra-de-status: span#fb_ring "Nv. 1" — topo a 9px (área do entalhe) · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span#fb_lv "Nv. 1" — 35x17 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: button#fb_goldp "999 bi+" — 100x35 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: button#fb_gemp "999000000050+" — 151x35 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: button#fb_mus — 35x35 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: i — 3x5 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span.fb-mgrid — 20x20 · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span.fb-lb "Menu" — 10.5px · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span "1/5" — 10.0px · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span.fb-novo "NOVO!" — 9.5px · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span.fb-novo "NOVO!" — 42x14 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: img — 30x28 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span — 24x4 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span#fb_chp — 24x4 · reports/resp/batalha_360.png
- batalha · 360 · botao-pequeno: span#fb_bc "3" — 18x18 · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span#fbl_chest "Baú cheio" — 10.5px · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span#fbl_offer "23h 59min" — 10.5px · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span.fb-lb "Básico" — 10.5px · reports/resp/batalha_360.png
- batalha · 360 · letra-pequena: span#fb_s2n "Sísmico" — 10.5px · reports/resp/batalha_360.png
- tela_cfg · 360 · botao-pequeno: span.c-knob — 24x24 · reports/resp/tela_cfg_360.png
- tela_cfg · 360 · barra-de-status: button#fb_x "Voltar" — topo a 6px (área do entalhe) · reports/resp/tela_cfg_360.png
- tela_cfg · 360 · botao-pequeno: polyline — 5x10 · reports/resp/tela_cfg_360.png
- tela_vip · 360 · **fora-da-tela**: div.pv-rays — left -60 right 258 (largura 360) · reports/resp/tela_vip_360.png
- tela_vip · 360 · letra-pequena: span "x1 (x2 no nível 15)" — 10.0px · reports/resp/tela_vip_360.png
- tela_vip · 360 · letra-pequena: span.pv-new "NOVO" — 9.0px · reports/resp/tela_vip_360.png
- tela_vip · 360 · barra-de-status: button#fb_x "Voltar" — topo a 6px (área do entalhe) · reports/resp/tela_vip_360.png
- tela_vip · 360 · botao-pequeno: polyline — 5x10 · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span "Ouro e XP" — cobre button.pv-gold "Ir à LojaCada compra soma po" (100%) · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span "—" — cobre button.pv-gold "Ir à LojaCada compra soma po" (100%) · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span "+10%NOVO" — cobre button.pv-gold "Ir à LojaCada compra soma po" (100%) · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span.pv-new "NOVO" — cobre button.pv-gold "Ir à LojaCada compra soma po" (100%) · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span "Entradas de instância/dia po" — cobre button.pv-gold "Ir à LojaCada compra soma po" (36%) · reports/resp/tela_vip_360.png
- tela_vip · 360 · **sobreposicao**: span "+1NOVO" — cobre button.pv-gold "Ir à LojaCada compra soma po" (36%) · reports/resp/tela_vip_360.png
- derrota · 360 · **fora-da-tela**: div.q-orbs — left -38 right 3 (largura 360) · reports/resp/derrota_360.png
- derrota · 360 · botao-pequeno: polyline — 5x4 · reports/resp/derrota_360.png
- derrota · 360 · botao-pequeno: span.lil "Modo farm" — 173x22 · reports/resp/derrota_360.png
- derrota · 360 · botao-pequeno: span "Continua farmando automático" — 173x10 · reports/resp/derrota_360.png
- derrota · 360 · **sobreposicao**: div#toast "Forja: deixe seus itens mais" — cobre span "RECOMENDADA" (33%) · reports/resp/derrota_360.png
