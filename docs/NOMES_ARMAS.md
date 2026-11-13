# Nomes das 45 armas: renomear pela família (decisão do dono, 14/11/2026)

Regra do dono: o nome tem de bater com a FAMÍLIA da arma, que é o que a arte mostra, nas 9 eras. Esta é a PROPOSTA para o PO mostrar ao dono **antes de aplicar**.

**Antes de ir ao dono, a Arte confere a coluna "a arte mostra"**: o que cada imagem desenha (`assets/weapons/era<N>_{t0,raro,t1,mitico,t2}.png`).

**Onde se aplica depois do OK:**
- eras 0 a 6: `index.html` `ERAS[e].w` (Engenheiro);
- eras 7 e 8: `js/sys/eras.js` `w` (Sistemas).

**Padrão:** família + material/época crescendo com a raridade (Básico → Lendário), curto, sem nome próprio de outra arma.
✓ = o nome atual já bate e fica.

| Era · família | Raridade | Nome atual | Proposto | A arte mostra (Arte confere) |
|---|---|---|---|---|
| 0 · Clava | Básico | Graveto Afiado | **Clava de Madeira** | clava |
| | Raro | Clava de Pedra | Clava de Pedra ✓ | clava |
| | Épico | Lança de Sílex | **Clava de Sílex** | clava |
| | Mítico | Machado de Osso | **Clava de Osso** | clava |
| | Lendário | Presa de Mamute | **Clava de Presa de Mamute** | clava |
| 1 · Gládio | Básico | Lança de Bronze | **Gládio de Bronze** | gládio |
| | Raro | Gládio | **Gládio de Ferro** | gládio |
| | Épico | Falcata de Ferro | **Gládio de Legionário** | gládio |
| | Mítico | Xifos Espartano | **Gládio Espartano** | gládio |
| | Lendário | Lâmina de Aquiles | **Gládio de Aquiles** | gládio |
| 2 · Espada | Básico | Espada Enferrujada | Espada Enferrujada ✓ | espada |
| | Raro | Espada de Aço | Espada de Aço ✓ | espada |
| | Épico | Lâmina Rúnica | **Espada Rúnica** | espada |
| | Mítico | Espada do Dragão | Espada do Dragão ✓ | espada |
| | Lendário | Excalibur | Excalibur ✓ | espada |
| 3 · Pistola de pederneira | Básico | Pistola de Pederneira | Pistola de Pederneira ✓ | pistola |
| | Raro | Mosquete | **Pistola de Duelo** | ? (mosquete = arma longa) |
| | Épico | Arcabuz Raro | **Pistola de Corsário** | ? |
| | Mítico | Bacamarte Real | **Pistola Real** | ? |
| | Lendário | Canhão de Mão Dourado | **Pistola Dourada do Almirante** | ? |
| 4 · Revólver | Básico | Revólver a Vapor | Revólver a Vapor ✓ | revólver |
| | Raro | Rifle de Repetição | **Revólver de Latão** | ? |
| | Épico | Carabina Steampunk | **Revólver Steampunk** | ? |
| | Mítico | Metralhadora Gatling | **Revólver Rotativo** | ? |
| | Lendário | Canhão de Tesla | **Revólver de Tesla** | ? |
| 5 · Fuzil | Básico | Pistola 9mm | **Fuzil Leve** | ? (pistola?) |
| | Raro | Fuzil de Assalto | Fuzil de Assalto ✓ | fuzil |
| | Épico | Fuzil de Precisão | Fuzil de Precisão ✓ | fuzil |
| | Mítico | Minigun | **Fuzil Pesado** | ? |
| | Lendário | Railgun Protótipo | **Fuzil Railgun** | ? |
| 6 · Plasma | Básico (atira) | Blaster Básico | **Blaster de Plasma** | arma de fogo |
| | Raro (atira) | Espada de Plasma | **Pistola de Íons** | arma de fogo (o jogo atira) |
| | Épico (lâmina) | Rifle de Íons | **Lâmina de Plasma** | lâmina (o jogo corta) |
| | Mítico (lâmina) | Canhão de Antimatéria | **Lâmina de Antimatéria** | lâmina |
| | Lendário (lâmina) | Lâmina do Vazio | Lâmina do Vazio ✓ | lâmina |
| 7 · Infernal | Básico | Tridente de Brasa | ? | **Arte: qual o formato?** |
| | Raro | Foice Sombria | ? | ? |
| | Épico | Lâmina Infernal | Lâmina Infernal ✓ (se for lâmina) | ? |
| | Mítico | Garra do Abismo | ? | ? |
| | Lendário | Ceifadora do Submundo | ? | ? |
| 8 · Celeste | Básico | Lança de Luz | **Lâmina de Luz** (se for lâmina) | ? |
| | Raro | Espada Alada | Espada Alada ✓ | ? |
| | Épico | Lâmina Celeste | Lâmina Celeste ✓ | ? |
| | Mítico | Gládio do Firmamento | **Lâmina do Firmamento** | ? |
| | Lendário | Juízo do Arcanjo | Juízo do Arcanjo ✓ (nome próprio, lâmina) | ? |

**Notas:**
- Era 6: o estilo vem do código. Básico e Raro ATIRAM (`gunAtR0` em `js/sys/stats.js`); do Épico para cima é LÂMINA. O nome segue o que o jogador vê acontecer.
- Eras 7 e 8: as famílias "infernal" e "celeste" são corpo a corpo. Falta a Arte dizer o formato de cada imagem (tridente, foice, garra?). Se as 5 forem lâminas, o padrão é "Lâmina ...".
- O Códex, o Equipamento e a Forja leem esses mesmos nomes, então a troca vale em todas as telas de uma vez.
