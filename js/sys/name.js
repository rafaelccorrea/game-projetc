/* Sys.name — regra do NOME DO JOGADOR (tela 29 NomeJogador / fluxo de entrada js/p_intro.js). Servidor fps-6f.
   Puro, sem estado. A mesma lista de palavrões do filtro do chat do servidor (fps-server/src/core/chat/filter.ts), adaptada a nome
   (sem espaço: a palavra proibida pode vir colada em outra, "MataPutaX", então raízes de 4+ letras valem DENTRO do nome).
   Regras:
   - 3 a 14 caracteres; letras (com acento), números e _;
   - sem palavrão (com l33t: 0→o, 4/@→a, 3→e, 1→i/l, 5/$→s, 7→t; letras repetidas contam uma vez);
   - sem nome reservado (admin, moderador, suporte, eonbound, gm…);
   - MENOR DE IDADE (ou idade desconhecida, que é tratada como menor): sem dado de contato no nome — nada de 5+ dígitos seguidos
     (telefone, CPF, ano completo), nem "zap/whats/insta/tiktok/face/tel/fone/email/gmail/hotmail", nem @.
     Para adulto valem as regras gerais (o servidor ainda pode recusar).
   - Nome ÚNICO só o servidor confirma (uniq fica true aqui; com o Sys.net ligado, o servidor responde name_taken).
   check(nome, {minor, current}) → {ok, len, chars, clean, uniq, contact, msg}.
   MODO ESTRITO (Perfil V5, troca de nome; check(nome, {strict:true})): soma ao de cima a lista DATA.strict (mais palavrões e ofensas para menores),
   o filtro de TEXTO livre profane() (ignora acento, l33t, letras repetidas e pontos/espaços/traços entre as letras: "p.u.t.a", "p u t a") e o
   bloqueio de se passar pela equipe impersonates() ("Admin_Kael", "KaelOficial", "Suporte2", "GM_x", "e0nb0und"). Sem strict o check é o MESMO de antes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Sys = root.Sys || {}; root.Sys.name = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DATA = {
    min: 3, max: 14,
    roots: ['porra', 'bosta', 'cacete', 'idiota', 'otario', 'otaria', 'babaca', 'imbecil', 'foda', 'fode', 'foder',
      'puta', 'vadia', 'viado', 'cuzao', 'shit', 'bitch', 'whore', 'slut', 'nazi', 'hitler', 'sexo', 'sexy', 'porno', 'putinh'],   // no COMEÇO de um pedaço do nome ("MataPuta", "puta_x")
    inside: ['merd', 'caralho', 'karalho', 'kralho', 'buceta', 'xoxota', 'xereca', 'piroca', 'punheta', 'siririca', 'arrombad', 'fuck', 'asshole'],                      // em qualquer lugar (não aparecem dentro de palavra comum)
    short: ['cu', 'fdp', 'vsf', 'pqp', 'krl', 'crl', 'vtnc', 'tnc', 'tmnc'],     // só valem como pedaço inteiro (separado por _ ou número, ou o nome todo)
    reserved: ['admin', 'adm', 'moderador', 'moderadora', 'mod', 'suporte', 'eonbound', 'gm', 'staff', 'oficial', 'sistema', 'system'],
    contact: ['zapzap', 'whats', 'wpp', 'insta', 'tiktok', 'facebook', 'telefone', 'telegram', 'celular', 'email', 'gmail', 'hotmail', 'outlook', 'discord'],   // em qualquer lugar do nome
    contactPiece: ['zap', 'face', 'tel', 'fone', 'cel'],   // curtas: só como pedaço INTEIRO ("MeuTel99"), para não recusar "MarteloRubro", "Castelo", "Faceiro" (achado do QA 14/11: o nome sugerido pelo jogo era recusado)
    maxDigitsMinor: 4,
    /* só no modo estrito (strict:true) e no profane(): não muda o check() de sempre */
    strict: {
      roots: ['arromb', 'corno', 'vagabund', 'escrot', 'safad', 'tesao', 'gostos', 'boquet', 'fudid', 'fuder', 'bucet', 'penis', 'vagina', 'peitud',
        'bunda', 'estupr', 'pedof', 'maconh', 'cocain', 'nazist', 'traveco', 'sapatao', 'retardad', 'dick', 'cock', 'pussy', 'faggot', 'bastard'],
      inside: ['putaria', 'cunt', 'nigg', 'motherf', 'xvideo', 'pornhub', 'onlyfans'],
      short: ['bicha', 'pau', 'rola', 'xota', 'cus', 'fag', 'wtf', 'stfu'],
    },
    /* se passar pela equipe/jogo (modo estrito): 'contains' em qualquer lugar; 'piece' só como pedaço inteiro ("Dev_Kael", não "Devon") */
    impersonate: {
      contains: ['admin', 'moderador', 'moderadora', 'suporte', 'support', 'eonbound', 'staff', 'oficial', 'official', 'desenvolvedor', 'developer',
        'gamemaster', 'owner', 'atendimento'],
      piece: ['adm', 'mod', 'mods', 'gm', 'dev', 'devs', 'dono', 'ceo', 'sistema', 'system', 'equipe', 'team', 'bot', 'sac'],
    },
  };
  const LEET = { '4': 'a', '@': 'a', '3': 'e', '0': 'o', '5': 's', '$': 's', '7': 't', '!': 'i', '|': 'l' };
  const base = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const collapse = s => s.replace(/([a-z])\1+/g, '$1');
  const leet = (s, one) => s.replace(/[4@3057$!|1]/g, c => (c === '1' ? one : LEET[c]));
  const CHARS = /^[A-Za-z0-9_À-ÖØ-öø-ÿ]+$/;

  /* pedaços do nome: separados por _, por número ou por letra maiúscula ("MataPuta" → mata, puta). "Computador" é um pedaço só. */
  const pieces = n => String(n).replace(/([a-zà-ÿ])([A-ZÀ-Ö])/g, '$1 $2').split(/[ _]+/).filter(Boolean);
  function dirty(n) {
    for (const one of ['i', 'l']) {
      const all = collapse(leet(base(n), one).replace(/_/g, ''));
      if (DATA.inside.some(r => all.includes(collapse(r)))) return true;
      /* números como separador: "123puta"/"2025put4" — corta nos grupos de 2+ dígitos ANTES de trocar 1/3/4... por letras (senão "123" vira "iie" e gruda) */
      const ps = pieces(n).flatMap(p => [p, ...base(p).split(/[0-9]{2,}/)]).flatMap(p => leet(base(p), one).split(/[0-9]+/)).filter(Boolean).map(collapse);
      if (ps.some(p => DATA.roots.some(r => p.startsWith(collapse(r))))) return true;
      if (ps.some(p => DATA.short.includes(p) || DATA.short.some(x => p === x + 's'))) return true;
      if (DATA.roots.some(r => all === collapse(r))) return true;
    }
    return false;
  }
  function reserved(n) { const w = collapse(leet(base(n), 'i').replace(/[_0-9]+/g, '')); return DATA.reserved.some(r => w === collapse(r)); }
  function contact(n) {
    if (/[@]/.test(n)) return true;
    if (new RegExp('[0-9]{' + (DATA.maxDigitsMinor + 1) + ',}').test(n)) return true;
    const w = base(n).replace(/[_0-9]+/g, '');
    if (DATA.contact.some(c => w.includes(c))) return true;
    const ps = pieces(n).map(x => base(x).replace(/[0-9]+/g, '')).filter(Boolean);
    return ps.some(x => DATA.contactPiece.includes(x));
  }

  /* ---------- modo estrito ---------- */
  /* pedaços de um texto livre: corta em tudo que não é letra/número; letras soltas seguidas ("p u t a", "p.u.t.a") viram um pedaço só */
  function tokens(text) {
    const raw = base(text).split(/[^a-z0-9@$!|]+/).filter(Boolean), out = []; let run = '';
    for (const p of raw) { if (p.length === 1) { run += p; continue; } if (run) { out.push(run); run = ''; } out.push(p); }
    if (run) out.push(run);
    return out;
  }
  const allRoots = () => DATA.roots.concat(DATA.strict.roots), allInside = () => DATA.inside.concat(DATA.strict.inside), allShort = () => DATA.short.concat(DATA.strict.short);
  /* texto livre com palavrão? (nome, apelido, nome de guilda, frase curta). Ignora acento, l33t (0→o 1→i/l 3→e 4/@→a 5/$→s 7→t), letras repetidas e separadores */
  function profane(text) {
    const s = String(text == null ? '' : text); if (!s.trim()) return false;
    const tk = tokens(s), toks = [...tk, ...pieces(s).map(base)];
    for (const one of ['i', 'l']) {
      const lt = toks.map(t => collapse(leet(t, one))).filter(Boolean), joined = collapse(tk.map(t => collapse(leet(t, one))).join('').replace(/[0-9]+/g, ''));
      if (allInside().some(r => joined.includes(collapse(r)))) return true;
      const ps = lt.flatMap(t => t.split(/[0-9]+/)).filter(Boolean);
      if (ps.some(p => allRoots().some(r => p.startsWith(collapse(r))))) return true;
      if (ps.some(p => allShort().some(x => p === collapse(x) || p === collapse(x) + 's'))) return true;
    }
    return dirty(s.replace(/[^A-Za-z0-9_À-ÖØ-öø-ÿ]+/g, '_'));
  }
  /* se passa pela equipe do jogo? */
  function impersonates(text) {
    const I = DATA.impersonate, s = String(text == null ? '' : text);
    const flat = collapse(leet(base(s), 'i').replace(/[^a-z]+/g, ''));
    if (I.contains.some(w => flat.includes(collapse(w)))) return true;
    const ps = [...tokens(s), ...pieces(s).map(base)].flatMap(t => leet(t, 'i').split(/[^a-z]+/)).filter(Boolean).map(collapse);
    return ps.some(p => I.piece.some(w => p === collapse(w)));
  }

  function check(name, o) {
    o = o || {}; const n = String(name == null ? '' : name), minor = o.minor !== false;
    const r = {
      len: n.length >= DATA.min && n.length <= DATA.max,
      chars: n.length > 0 && CHARS.test(n),
      clean: n.length > 0 && !dirty(n) && !reserved(n),
      contact: n.length > 0 && minor && contact(n),
      uniq: !(o.current && n === o.current),
      msg: '',
    };
    if (!n.length) r.msg = 'Digite um nome ou toque no dado.';
    else if (n.length < DATA.min) r.msg = 'Faltam ' + (DATA.min - n.length) + ' caractere(s). Mínimo de ' + DATA.min + '.';
    else if (n.length > DATA.max) r.msg = 'No máximo ' + DATA.max + ' caracteres.';
    else if (!r.chars) r.msg = 'Use só letras, números e _ (sem espaço).';
    else if (!r.clean) r.msg = reserved(n) ? 'Esse nome é reservado.' : 'Esse nome não é permitido.';
    else if (r.contact) r.msg = 'Não use telefone, rede social ou e-mail no nome.';
    else if (!r.uniq) r.msg = 'Esse já é o seu nome atual.';
    if (o.strict && n.length && r.len && r.chars && r.clean) {   // modo estrito (troca de nome do Perfil V5)
      const imp = impersonates(n), bad = !imp && profane(n);
      if (imp || bad) { r.clean = false; r.msg = imp ? 'Esse nome é reservado.' : 'Esse nome não é permitido.'; }
    }
    if (r.contact) r.clean = false;            // a tela mostra "Sem palavras proibidas" como não cumprida
    r.ok = r.len && r.chars && r.clean && r.uniq;
    return r;
  }
  return { DATA, check, profane, impersonates };
});
