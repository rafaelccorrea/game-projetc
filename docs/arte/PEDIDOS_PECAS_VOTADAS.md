# Pedidos das peças das telas votadas (Arte, 14/11)

Aguardam o "sim" do dono (~18). Todos de imagem usam `nano_banana_pro`, 2k; o vídeo usa `seedance_2_0`, `mode fast`, `generate_audio false`.

## 1. Ajudante do Acampamento (~2), 1:1
- **Referências:** o mock B do Acampamento; a ref de ícones `79bfaae4`.
- **Prompt:** "ONE friendly hooded camp helper character, a clearly ADULT man in his 40s with a short beard and kind eyes, practical modest work clothes and a leather apron, holding a pickaxe, full body, side 3/4 view facing right, on a flat pure green (#00FF00) background, same bright painted chibi style as the reference; NOT a child, adult proportions; no text, no green in the character."

## 2. Ladrão: vídeo correndo (~4), 1:1, 4 s
- **Início = fim:** `C:\Users\rafae\AppData\Local\Temp\tools\camp\thief_guide_1024.png`.
- **Prompt:** "2D game creature animation, fixed camera, flat pure green background. The soot goblin from the start image runs in place to the right in a fast comical waddle, hugging its sack of glowing orange-red embers, a couple of embers bounce out and fall; seamless loop returning exactly to the first frame; same design and size the whole time, the whole body always inside the frame; no camera move, no zoom, no motion blur, embers are glowing coals, never gold coins."

## 3. Ladrão: mock do resultado (~2), 9:16, estilo A (fim de tarde)
- **Referências:** o mock A do Ladrão (job `3d04df85`); `thief_guide_1024.png`.
- **Prompt:** "A centered result popup over the dimmed chase screen at golden-hour, same painted chibi style: title 'Ladrão alcançado!', the little soot goblin from image 2 sitting dizzy with stars circling its head next to its empty sack, a big glowing '+24 Brasas' with an ember (glowing coal) icon, a small line 'Entradas hoje: 1/2', two buttons 'Repetir' (main, golden) and 'Sair'. No gold coins, no prices."

## 4. Dupla: ícones das 18 frases (~4), 2 imagens 1:1, estilo A (escuro)
- **Referências:** o mock A da Dupla; a ref `79bfaae4`.
- **Cabeçalho das duas:** "Game UI emoji-style icons, a 3x3 grid of NINE separate round icons on a flat pure green (#00FF00) background with wide green gaps, same painted chibi style and dark rich palette as the reference, each a single clear symbol readable at 48 px, no text, no faces of real people, no green in the icons:"
- **Imagem A:**
  1. waving hand (Oi, dupla!);
  2. rising sun (Bom dia!);
  3. crescent moon with stars (Boa noite!);
  4. game controller (Bora jogar?);
  5. target with arrow (Vamos fechar a meta);
  6. hourglass almost empty (Falta pouco);
  7. checkered flag with check (Meta fechada);
  8. crown on a fallen helmet (Derrubei um chefe);
  9. glowing portal (Era nova).
- **Imagem B:**
  1. crossed swords in an arena ring (Arena);
  2. anvil with spark (Forja);
  3. party popper with confetti (Parabéns);
  4. two hands high-five (Valeu);
  5. star medal (Você manda bem);
  6. small clock with arrow (Já volto);
  7. door with a moon (Até amanhã);
  8. 'GG' trophy cup, symbol only, no letters;
  9. thumbs up (Combinado).
- **Ids, na ordem do `js/sys/duo.js`:** oi, bom_dia, boa_noite, bora, meta, quase, fechou, chefe, era / arena, forja, parabens, valeu, voce_manda, ja_volto, amanha, gg, joinha.
- **Destino:** `assets/icons/duo/<id>.png`.

## 5. VIP/Passe B: peças (~4)
- **Pégaso âncora (~2), 1:1.**
  - **Referências:** o mock B do Passe; `79bfaae4`.
  - **Prompt:** "ONE white winged pegasus with golden armor and blue gems, the season reward mount, standing proudly on a round golden rune pedestal, side 3/4 view facing right, on a flat pure green (#00FF00) background, bright painted chibi style; no text, no green in the subject."
- **Ícones da trilha (~2), 1:1.**
  - **Prompt:** "A 3x3 grid of NINE separate reward item icons on a flat pure green background with wide gaps, bright painted chibi style: (1) blue upgrade stones; (2) pet food bowl; (3) glowing purple essence vial; (4) mount fragment (a winged horseshoe shard); (5) small pile of diamonds; (6) glowing ember coal (Brasa); (7) a season portrait frame (rounded square, gold); (8) an OPEN milestone chest showing its contents on top (never closed); (9) XP scroll with a star. No gold coins, no closed chests, no text, no green in the icons."

**Total ≈ 18.**

## Atualização: lista do Engenheiro (peças que as telas refeitas ainda desenham em CSS)
Agrupado em poucas imagens, com o recorte de graça. O orçamento total substitui o "~18" acima.

| # | Peças (destino) | Imagem | ~créd. |
|---|---|---|---|
| V1 | VIP: vip_aba 520x90 + vip_cartao 720x620 (estilo B claro) | 1 imagem com os 2 painéis vazios sobre verde | 2 |
| V2 | VIP: vip_medalha, vip_medalha_on + 6 ícones de benefício (velocidade, ATQ/vida, XP, chave, offline, engrenagem) + 1 reserva | 1 grade 3×3 | 2 |
| P1 | Passe: passe_faixa 640x80, passe_pedestal 520x160, passe_faixa_gratis e _premium 360x160 | 1 grade 2×2 | 2 |
| P2 | Passe: pégaso âncora + 9 ícones da trilha (item 5 acima) | 2 imagens | 4 |
| D1 | Dupla: duo_retrato_eu e duo_retrato_par 264x306 (aro dourado; o Kael e a parceira) | 1 imagem com 2 retratos | 2 |
| D2 | Dupla: duo_madeira 780x640 + duo_placa_codigo 660x150 (estilo A escuro) | 1 imagem | 2 |
| D3 | Dupla: 18 ícones das frases (item 4 acima) | 2 grades 3×3 | 4 |
| D4 | 4 ícones das missões da semana + ícones do Menu duo, camp, mentors + 2 reservas | 1 grade 3×3 | 2 |
| A1 | Acampamento: Ajudante ADULTO (item 1) | 1 imagem | 2 |
| A2 | Acampamento: as 3 tendas SEM placa (opcional) | 1 grade 2×2 (+1 reserva) | 2 |
| L1 | Ladrão: run (item 2: vídeo + folha de 8 quadros, 512x352, pés 307, para a direita) | vídeo | 4 |
| L2 | Ladrão: hurt (vídeo início = fim: o goblin leva um golpe, cambaleia e larga brasas, volta à pose) | vídeo | 4 |
| L3 | Ladrão: mock do resultado (item 3) | 1 imagem | 2 |
| M1 | Mentores: 9 retratos m0..m8 depois do voto da tela | 1 grade 3×3 (+1 refação) | 2-4 |
| T1 | Títulos novos sem ícone (lista do Engenheiro, depois) | 1 grade | 2 |
| **Total** | | | **~38-42** (sem A2: ~36-40) |

## BLOCO 1: DUPLA (estilo A escuro) — teto do lote 38
Referências de todas: 1) docs/proto/v2/a/mocks/du_a.jpg (mock votado); 2) a ref de ícones 79bfaae4. nano_banana_pro, 2k.
**D1, retratos (1:1, ~2):** "TWO separate round-top portrait cards side by side on a flat pure green (#00FF00) background with a wide green gap, matching the dark rich style and gold trim of image 1: each card is a tall rounded portrait frame with a thick GOLDEN rim and a dark inner background; LEFT card: the hero boy (brown messy hair, red scarf, brown leather armor), bust, smiling, facing slightly right; RIGHT card: a partner hero girl of the same age (long red-brown ponytail, brown leather tunic, red scarf, modest), bust, smiling, facing slightly left. Both children, fully clothed. No text, no green inside the cards."
**D2, madeira e placa (1:1, ~2):** "TWO separate UI panels on a flat pure green background, stacked with a wide green gap, in the dark rich wooden style of image 1: TOP a large empty dark wooden board panel with carved gold corners and a subtle inner frame (wide, about 6:5); BOTTOM a long empty dark wooden name plate with gold bolts (about 4:1). Both completely EMPTY (no text), clean edges, no green in the panels."
**D3, 18 ícones das frases (2 imagens 1:1, ~4):** o item 4 acima, exatamente.
**D4, missões + Menu (1:1, ~2):** "A 3x3 grid of NINE separate round game icons on a flat pure green background with wide gaps, same painted chibi style and dark palette as the references, no text, no green in the icons: (1) two crossed swords with a heart (missão: lutar juntos); (2) a chest with a star (missão: abrir baús); (3) a footprint path (missão: avançar fases); (4) a hammer and anvil (missão: forjar); (5) MENU 'Dupla': two small hero silhouettes back to back with a golden link; (6) MENU 'Acampamento': a small striped tent with a campfire; (7) MENU 'Mentores': an open book with a feather quill and a small star; (8) spare: a handshake; (9) spare: a golden heart badge."
Ids: D4 → assets/icons/duo/m_fight, m_chest, m_path, m_forge; assets/icons/menu/duo, camp, mentors.
**Total do bloco: ~10.**
