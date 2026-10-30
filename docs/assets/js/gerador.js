/* Gerador de Personagens do Forja RPG.
   Os dados vêm de assets/data/gerador.json, gerado no build a partir do livro
   (hooks/gerador.py). Nada é salvo: o jogador gera, ajusta e imprime. */
(function () {
  'use strict';
  const raiz = document.getElementById('fj-gerador');
  if (!raiz) return;

  const ATR = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'];
  const ABR = ['For', 'Des', 'Con', 'Int', 'Sab', 'Car'];
  const BASES = {
    4: { iniciais: 4, mana: 5, dois: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
    6: { iniciais: 3, mana: 4, dois: [3, 5, 7, 9, 10] },
    8: { iniciais: 3, mana: 3, dois: [3, 6, 9] },
    10: { iniciais: 2, mana: 2, dois: [5, 10] },
    12: { iniciais: 2, mana: 2, dois: [] },
  };
  const KIT = 'Kit de exploração (mochila, pederneira, 5 tochas, 3 rações, corda de 15 m, gancho de escalada, 10 cravos de ferro)';
  let D = null;
  let atual = null;
  let funil = [];

  // ---------------------------------------------------------------- utilidades

  const d = (n) => 1 + Math.floor(Math.random() * n);
  const um = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const mod = (v) => Math.floor((v - 10) / 2);
  const sinal = (n) => (n >= 0 ? '+' + n : String(n));
  const embaralhar = (l) => { const c = l.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  const limpo = (s) => String(s).replace(/\*/g, '').trim();
  const rolar4d6 = () => { const r = [d(6), d(6), d(6), d(6)].sort((a, b) => a - b); return r[1] + r[2] + r[3]; };

  function sortearAncestralidade() {
    const r = d(20);
    const linha = D.rolagemAncestralidade.find(([a, b]) => r >= a && r <= b);
    return D.ancestralidades.find((x) => x.nome === linha[2]);
  }

  function traco(anc, nome) { return anc.tracos.find(([t]) => t === nome); }
  function regraDe(classe, prefixo) { return classe.regras.find(([t]) => t.startsWith(prefixo)); }
  function vocacao(classe) { const r = regraDe(classe, 'Vocação'); return r ? [r[0].replace('Vocação: ', ''), r[1]] : null; }
  function exigeDivindade(classe) {
    return classe.regras.some(([t, txt]) => (t === 'Divindade' && txt.startsWith('Obrigatória')) || t === 'Demônio interior');
  }
  function temColunas(classe) { return classe.colunas[0] !== 'Efeito'; }
  function temDados(texto) { return /\d+d\d+/.test(texto); }

  // ---------------------------------------------------------------- equipamento

  function armaPermitida(classe, arma) {
    const t = classe.armas.toLowerCase();
    const n = arma.nome.toLowerCase();
    if (t.startsWith('todas') && !t.includes('corpo a corpo')) return true;
    if (t.includes('corpo a corpo') && arma.alcance === 'Adjacente') return true;
    if (t.includes('simples') && arma.categoria === 'Simples') return true;
    if (t.includes('espadas') && /espada|florete|cimitarra/.test(n)) return true;
    if (t.includes('bestas') && n.startsWith('besta')) return true;
    return t.includes(n);
  }

  function escolherArma(classe, principal) {
    let lista = D.armas.filter((a) => a.custo <= 10 && armaPermitida(classe, a));
    if (!lista.length) return null;
    const des = principal === 'Destreza';
    const preferidas = lista.filter((a) => (des ? /acuidade/i.test(a.propriedades) || a.alcance !== 'Adjacente'
      : a.alcance === 'Adjacente' && !/acuidade/i.test(a.propriedades)));
    return um(preferidas.length ? preferidas : lista);
  }

  function armadurasPermitidas(classe) {
    const t = classe.armaduras.toLowerCase();
    if (t.startsWith('nenhuma')) return [];
    const cats = [];
    if (t.startsWith('todas')) cats.push('Leve', 'Média', 'Pesada');
    if (t.includes('leves')) cats.push('Leve');
    if (t.includes('médias')) cats.push('Média');
    if (t.includes('pesadas')) cats.push('Pesada');
    return D.armaduras.filter((a) => cats.includes(a.categoria));
  }

  function textoArma(a) { return a.nome + ' (' + a.dano + ', ' + a.tipo.toLowerCase() + ')'; }
  function textoArmadura(a) {
    if (a.categoria === 'Escudo') return a.nome + ' (+2 de CA)';
    const p = a.propriedades && a.propriedades !== '—' ? '; ' + a.propriedades.charAt(0).toLowerCase() + a.propriedades.slice(1) : '';
    return a.nome + ' (CA ' + a.ca + p + ')';
  }

  function caDaArmadura(a, des) {
    const m = a.ca.match(/(\d+)(\s*\+\s*Des)?/);
    return parseInt(m[1], 10) + (m[2] ? des : 0);
  }

  // ---------------------------------------------------------------- geração

  // O Aleatório sorteia um estado e usa o mesmo construtor do Montar; assim o personagem
  // gerado pode ser editado no Montar ou baixado em JSON.
  function estadoAleatorio(op) {
    const classes = D.classes.filter((c) => op.exoticas || !c.exotica);
    const classe = op.classe != null ? D.classes[op.classe] : um(classes);
    const anc = op.ancestralidade != null ? D.ancestralidades[op.ancestralidade] : sortearAncestralidade();
    const m = estadoNovo();
    m.nivel = op.nivel;
    m.classe = classe.nome;
    m.anc = anc.nome;
    m.principal = um(classe.atributos);
    if (op.nivel === 0) {
      m.atr = ATR.map(rolar4d6);
    } else {
      const valores = ATR.map(rolar4d6).sort((a, b) => b - a);
      const atr = new Array(6);
      const ip = ATR.indexOf(m.principal);
      atr[ip] = valores.shift();
      if (ip !== 2) atr[2] = valores.shift();
      embaralhar(valores).forEach((v) => { atr[atr.findIndex((x) => x === undefined)] = v; });
      m.atr = atr;
    }
    m.nome = um(D.nomes[anc.nome] || D.nomes.Humano);
    const div = op.divindade || 'auto';
    if (div === 'sortear') m.divindade = um(D.divindades).nome;
    else if (div === 'auto' || div === 'nenhuma') m.divindade = div;
    else m.divindade = D.divindades[parseInt(div, 10)].nome;
    m.equipModo = op.equipamento === 'ouro' ? 'ouro' : 'pacote';
    if (op.antecedente) m.antecedente = op.antecedente;
    return m;
  }

  function novoPersonagem(op) {
    const m = estadoAleatorio(op);
    const classe = D.classes.find((c) => c.nome === m.classe);
    if (m.nivel >= 1) { m.elemento = temColunas(classe) ? d(4) - 1 : 0; preencherHabilidades(m, classe); }
    const pj = personagemDoEstado(m, op.sortear !== false);
    pj.estado = m;
    return pj;
  }

  function habilidadePorNome(pj, nome) {
    return pj.habilidades.find((h) => limpo(pj.classe.habilidades[h.i].nome).startsWith(nome));
  }

  function rolarExtras(pj) {
    const t = pj.classe.tabelas || {};
    const extras = [];
    // Elemento inato (Feiticeiro): 1d10, desde o nível 0, porque a vocação depende dele.
    if (t['Elemento']) {
      const lista = [];
      t['Elemento'].forEach((l) => { lista[parseInt(l[1], 10) - 6 + 5] = l[2]; });
      t['Elemento'].forEach((l, k) => { lista[k] = l[0]; });
      extras.push({ titulo: 'Elemento inato', itens: [esc(lista[d(10) - 1])] });
    }
    // Origem do vazio (Quebra-Feitiço): só história, vale desde o nível 0.
    if (t['Origem do vazio']) {
      extras.push({ titulo: 'Origem do vazio', itens: [md(um(t['Origem do vazio'])[0])] });
    }
    if (pj.nivel < 1) return extras;
    // Lótus Negro: 1d12; com 1, role duas vezes (de novo nos outros 1); sem repetir.
    if (t['Dom do lótus']) {
      const tab = t['Dom do lótus'];
      const dons = [];
      let rolagens = 1;
      while (rolagens > 0 && dons.length < tab.length - 1) {
        const r = d(tab.length);
        if (r === 1) { rolagens += 2; } else if (!dons.includes(r)) { dons.push(r); }
        rolagens -= 1;
      }
      extras.push({ titulo: 'Lótus Negro', itens: dons.map((r) => md(tab[r - 1][0])) });
    }
    // Elixires (Caçador de Prata): 3 receitas com Elixir de Caçador, +3 com Livro de receitas.
    const elixir = habilidadePorNome(pj, 'Elixir de Caçador');
    if (t['Elixir'] && elixir) {
      const n = 3 + (elixir.melhorias.includes(0) ? 3 : 0);
      const receitas = embaralhar(t['Elixir']).slice(0, n);
      extras.push({ titulo: 'Receitas de elixir', itens: receitas.map((l) => `${md(l[0])}. ${md(l[1])}`) });
    }
    // Pactos: 2 demônios no nível 1, mais os do Livro de Pactos; cada um com seu tributo.
    if (t['Demônio'] && t['Tributo']) {
      let n = 2;
      const livro = habilidadePorNome(pj, 'Livro de Pactos');
      if (livro) n += 2 + (livro.melhorias.includes(0) ? 2 : 0);
      const demonios = embaralhar(t['Demônio'].map((l) => l[0])).slice(0, n);
      const pactos = demonios.map((dem) => ({ nome: limpo(dem), tributo: um(t['Tributo']) }));
      if (habilidadePorNome(pj, 'Diabrete Espião')) pactos.push({ nome: 'Diabrete Espião', tributo: um(t['Tributo']) });
      extras.push({
        titulo: 'Pactos',
        itens: pactos.map((p) => `<b>${esc(p.nome)}.</b> Tributo: ${md(p.tributo[0])} Ou: ${esc(p.tributo[1])} de Sanidade máxima.`),
      });
    }
    return extras;
  }

  function tendencia(bem, ordem) {
    const a = ['Bem', 'Neutro', 'Mal'][bem];
    const b = ['Ordem', 'Neutro', 'Caos'][ordem];
    if (a === 'Neutro' && b === 'Neutro') return 'Neutro';
    return a + ' e ' + b;
  }

  function adicionarHabilidade(pj, i, col) {
    const ja = pj.habilidades.find((h) => h.i === i);
    if (ja) { if (!ja.colunas.includes(col)) ja.colunas.push(col); return; }
    pj.habilidades.push({ i, melhorias: [], dados: 0, colunas: [col] });
  }

  function opcoesDeAvanco(pj, usados) {
    const c = pj.classe;
    const op = [];
    const livres = c.habilidades.map((_, i) => i).filter((i) => !pj.habilidades.some((h) => h.i === i));
    if (livres.length) op.push(['nova', 35]);
    const podeMelhorar = pj.habilidades.some((h) => temColunas(c) ? h.colunas.length < 4
      : c.habilidades[h.i].partes.slice(1).some((p, k) => p && !h.melhorias.includes(k)));
    if (podeMelhorar) op.push(['melhoria', 25]);
    if (pj.habilidades.some((h) => temDados(c.habilidades[h.i].partes.join(' ')))) op.push(['dado', 12]);
    if (pj.atr.some((v) => v < 20)) op.push(['atributos', 15]);
    op.push(['vigor', 8], ['treino', 5]);
    return op.filter(([t]) => !usados.includes(t));
  }

  function vagasDeAvanco(classe, anc, nivel) {
    const vagas = [];
    if (nivel >= 1 && anc && traco(anc, 'Ambicioso')) vagas.push({ nivel: 1, qtd: 1, motivo: 'Ambicioso' });
    for (let L = 2; L <= nivel; L++) vagas.push({ nivel: L, qtd: BASES[classe.base].dois.includes(L) ? 2 : 1 });
    return vagas;
  }

  function sortearTipo(pj, usados) {
    const op = opcoesDeAvanco(pj, usados);
    let r = Math.random() * op.reduce((s, [, p]) => s + p, 0);
    for (const [t, p] of op) { if ((r -= p) < 0) return t; }
    return op[op.length - 1][0];
  }

  // Avanço escolhido pelo jogador no Montar.
  function aplicarEscolha(pj, e, usados) {
    const c = pj.classe;
    const nomeHab = (i) => limpo(c.habilidades[i].nome);
    const dono = (i) => pj.habilidades.find((h) => h.i === i);
    if (e.tipo === 'branco') return 'a escolher';
    if (e.tipo === 'sortear') { const t = sortearTipo(pj, usados); usados.push(t); return aplicarAvanco(pj, t); }
    usados.push(e.tipo);
    if (e.tipo === 'nova') {
      if (dono(e.i) && !temColunas(c)) return 'Nova habilidade: ' + nomeHab(e.i) + ' (já tinha)';
      adicionarHabilidade(pj, e.i, e.col || 0);
      return 'Nova habilidade: ' + nomeHab(e.i) + (temColunas(c) ? ' (' + c.colunas[e.col || 0] + ')' : '');
    }
    if (e.tipo === 'melhoria') {
      const h = dono(e.i);
      if (!h) return 'Melhoria: ' + nomeHab(e.i) + ' (você não tem essa habilidade)';
      if (temColunas(c)) {
        if (!h.colunas.includes(e.col)) h.colunas.push(e.col);
        return 'Outro elemento: ' + nomeHab(e.i) + ' (' + c.colunas[e.col] + ')';
      }
      if (!h.melhorias.includes(e.k)) h.melhorias.push(e.k);
      const nm = (c.habilidades[e.i].partes[e.k + 1].match(/\*\*(.+?):?\*\*/) || [, 'melhoria'])[1].replace(/:$/, '');
      return 'Melhoria: ' + nomeHab(e.i) + ', ' + limpo(nm);
    }
    if (e.tipo === 'dado') {
      const h = dono(e.i);
      if (!h) return '+1 dado: ' + nomeHab(e.i) + ' (você não tem essa habilidade)';
      h.dados += 1;
      return '+1 dado: ' + nomeHab(e.i);
    }
    if (e.tipo === 'atributos') {
      const conAntes = mod(pj.atr[2]);
      [e.a1, e.a2].forEach((a) => { pj.atr[a] = Math.min(20, pj.atr[a] + 1); });
      const dif = mod(pj.atr[2]) - conAntes;
      if (dif > 0) pj.pv += dif;
      return 'Atributos: ' + (e.a1 === e.a2 ? '+2 em ' + ATR[e.a1] : '+1 em ' + ATR[e.a1] + ', +1 em ' + ATR[e.a2]);
    }
    return aplicarAvanco(pj, e.tipo);
  }

  function aplicarAvanco(pj, tipo) {
    const c = pj.classe;
    if (tipo === 'nova') {
      const livres = c.habilidades.map((_, i) => i).filter((i) => !pj.habilidades.some((h) => h.i === i));
      const i = um(livres);
      adicionarHabilidade(pj, i, pj.elemento);
      return 'Nova habilidade: ' + limpo(c.habilidades[i].nome) + (temColunas(c) ? ' (' + c.colunas[pj.elemento] + ')' : '');
    }
    if (tipo === 'melhoria') {
      if (temColunas(c)) {
        const h = um(pj.habilidades.filter((x) => x.colunas.length < 4));
        const col = um([0, 1, 2, 3].filter((x) => !h.colunas.includes(x)));
        h.colunas.push(col);
        return 'Outro elemento: ' + limpo(c.habilidades[h.i].nome) + ' (' + c.colunas[col] + ')';
      }
      const cand = pj.habilidades.filter((h) => c.habilidades[h.i].partes.slice(1).some((p, k) => p && !h.melhorias.includes(k)));
      const h = um(cand);
      const livres = [0, 1, 2].filter((k) => c.habilidades[h.i].partes[k + 1] && !h.melhorias.includes(k));
      const k = livres[0] === 0 || !/Fase|palavra/i.test(c.habilidades[h.i].partes[1]) ? um(livres) : livres[0];
      h.melhorias.push(k);
      const nomeMelhoria = (c.habilidades[h.i].partes[k + 1].match(/\*\*(.+?):?\*\*/) || [, 'melhoria'])[1].replace(/:$/, '');
      return 'Melhoria: ' + limpo(c.habilidades[h.i].nome) + ', ' + limpo(nomeMelhoria);
    }
    if (tipo === 'dado') {
      const h = um(pj.habilidades.filter((x) => temDados(c.habilidades[x.i].partes.join(' '))));
      h.dados += 1;
      return '+1 dado: ' + limpo(c.habilidades[h.i].nome);
    }
    if (tipo === 'atributos') {
      const conAntes = mod(pj.atr[2]);
      const ip = ATR.indexOf(pj.principal);
      let txt;
      if (pj.atr[ip] <= 18) { pj.atr[ip] += 2; txt = '+2 em ' + pj.principal; }
      else {
        const outros = embaralhar([0, 1, 2, 3, 4, 5].filter((i) => pj.atr[i] < 20)).slice(0, 2);
        outros.forEach((i) => { pj.atr[i] += 1; });
        txt = outros.map((i) => '+1 em ' + ATR[i]).join(', ');
      }
      const dif = mod(pj.atr[2]) - conAntes;
      if (dif > 0) pj.pv += dif;
      return 'Atributos: ' + txt;
    }
    if (tipo === 'vigor') { const r = d(pj.classe.base); pj.pv += r; return 'Vigor: +' + r + ' PV'; }
    pj.treinos += 1;
    return 'Treino: uma proficiência ou um idioma (anote)';
  }

  function itensDeNivel0() {
    return Array.from({ length: d(4) }, () => um(D.equipamentoNivel0));
  }

  function equipar(pj, modo) {
    pj.equipamento = [];
    pj.armadura = null;
    pj.ouro = 0;
    if (pj.nivel === 0) { pj.equipamento = itensDeNivel0(); return; }
    if (modo === 'ouro') { pj.ouro = (d(6) + d(6)) * 5; return; }
    pj.equipamento.push(KIT);
    const arma = escolherArma(pj.classe, pj.principal);
    if (arma) {
      pj.arma = arma;
      pj.equipamento.push(textoArma(arma));
      if (/munição/.test(arma.propriedades)) pj.equipamento.push(/besta/i.test(arma.nome) ? 'Virotes (20)' : 'Flechas (20)');
    }
    const armaduras = armadurasPermitidas(pj.classe).filter((a) => a.custo <= 15 && a.categoria !== 'Escudo');
    if (armaduras.length && !traco(pj.anc, 'Blindagem integrada')) {
      pj.armadura = armaduras.sort((a, b) => caDaArmadura(b, 0) - caDaArmadura(a, 0))[0];
      pj.equipamento.push(textoArmadura(pj.armadura));
    }
  }

  function calcular(pj) {
    const m = pj.atr.map(mod);
    const ip = ATR.indexOf(pj.principal);
    const des = m[1];
    let ca = 10 + des;
    if (pj.armadura) ca = Math.max(ca, caDaArmadura(pj.armadura, des));
    if (traco(pj.anc, 'Blindagem integrada')) ca = Math.max(ca, 13 + des);
    if ((pj.equipamento || []).some((x) => /^escudo\b/i.test(x))) ca += 2;
    const textos = pj.classe.regras.map(([, t]) => t)
      .concat(pj.habilidades.map((h) => pj.classe.habilidades[h.i].partes[0]));
    textos.forEach((t) => {
      const r = t.match(/sua CA é (\d+) \+ mod\. de Destreza(?: \+ mod\. de (\w+))?/);
      if (r) ca = Math.max(ca, parseInt(r[1], 10) + des + (r[2] ? m[ATR.indexOf(r[2])] : 0));
    });
    pj.ca = ca;
    pj.sanidade = 10 + m[3] + m[4] + m[5];
    if (pj.nivel >= 1) {
      pj.mana = BASES[pj.classe.base].mana * pj.nivel + m[ip];
      pj.cd = 10 + m[ip];
    }
  }

  function bencaos(pj) {
    if (!pj.divindade) return [];
    const partes = pj.divindade.bencaos.split(/(?=Menor:|Maior:|Milagre:)/).map((s) => s.trim());
    const ok = [];
    partes.forEach((p) => {
      if (p.startsWith('Menor') && pj.nivel >= 1) ok.push(p);
      if (p.startsWith('Maior') && pj.nivel >= 5) ok.push(p);
      if (p.startsWith('Milagre') && pj.nivel >= 9) ok.push(p);
    });
    return ok;
  }

  // ---------------------------------------------------------------- textos das habilidades

  // +1 dado: soma os dados ao primeiro dado do efeito (fora do escalonamento) e destaca.
  function comDados(texto, extra) {
    if (!extra) return texto;
    const corte = texto.indexOf('Escalonamento:');
    const antes = corte >= 0 ? texto.slice(0, corte) : texto;
    const depois = corte >= 0 ? texto.slice(corte) : '';
    let feito = false;
    const novo = antes.replace(/(\d+)d(\d+)/, (_, n, x) => { feito = true; return '**' + (parseInt(n, 10) + extra) + 'd' + x + '**'; });
    return feito ? novo + depois : texto;
  }

  function textoHabilidade(pj, h) {
    const c = pj.classe;
    const hab = c.habilidades[h.i];
    let custo = hab.custo;
    if (/^\d+$/.test(custo)) custo = String(parseInt(custo, 10) + h.melhorias.length);
    let efeito;
    if (temColunas(c)) {
      efeito = h.colunas.map((col) => '<b>' + c.colunas[col] + ':</b> ' + md(comDados(hab.partes[col], h.dados))).join('<br>');
    } else {
      efeito = md(comDados(hab.partes[0], h.dados));
      h.melhorias.slice().sort().forEach((k) => { efeito += '<br>' + md(hab.partes[k + 1]); });
    }
    if (h.dados) efeito += '<br><b>+' + h.dados + ' dado' + (h.dados > 1 ? 's' : '') + '</b> (avanço).';
    return { nome: md(hab.nome), custo, efeito };
  }

  // ---------------------------------------------------------------- montar (charactermancer)
  // Tudo que o jogador escolhe fica no estado M; os sorteios também, para a ficha não mudar
  // a cada clique. Habilidades e melhorias se marcam na lista de habilidades: as primeiras
  // são as iniciais e as outras gastam avanços. Os outros avanços (+1 dado, atributos, vigor,
  // treino) ficam em M.outros. O gerador distribui tudo pelos níveis. M é o que vai para o JSON.

  let M = null;

  function estadoNovo() {
    return {
      versao: 2, nome: '', nivel: 1, classe: null, anc: null, antecedente: null, bem: null, ordem: null,
      titulo: '', divindade: 'auto', atr: [10, 10, 10, 10, 10, 10], principal: null, pv: [],
      habilidades: [], melhorias: [], outros: [], elemento: null,
      equipModo: 'pacote', equipamento: null, equipExtra: '', compras: [], ouroInicial: null, compraLivre: false, ouro: 0, extras: null, extrasChave: '',
    };
  }

  // Fichas antigas (versão 1) guardavam os avanços por vaga.
  function migrar(dados) {
    if (dados.versao === 1 && dados.avancos) {
      dados.melhorias = dados.melhorias || [];
      dados.outros = dados.outros || [];
      Object.values(dados.avancos).forEach((e) => {
        if (e.tipo === 'nova') dados.habilidades.push({ i: e.i, col: e.col || 0 });
        else if (e.tipo === 'melhoria') dados.melhorias.push({ i: e.i, k: e.k, col: e.col });
        else if (e.tipo !== 'branco' && e.tipo !== 'sortear') dados.outros.push(e);
      });
      delete dados.avancos;
      dados.versao = 2;
    }
    return dados;
  }

  // Fichas antigas guardavam a lista de itens editada à mão.
  function migrarEquipamento(dados) {
    if (dados.equipExtra == null && Array.isArray(dados.equipamento)) {
      if (dados.equipModo === 'ouro') { dados.equipExtra = dados.equipamento.join('\n'); dados.ouroInicial = dados.ouro || 0; dados.compras = []; }
      dados.equipamento = null;
    }
    return dados;
  }

  function nomeMelhoria(c, i, k) {
    const m = c.habilidades[i].partes[k + 1] || '';
    return limpo((m.match(/\*\*(.+?):?\*\*/) || [, 'melhoria ' + (k + 1)])[1].replace(/:$/, ''));
  }

  function contaAvancos(m, classe, anc) {
    const total = vagasDeAvanco(classe, anc, m.nivel).reduce((s, v) => s + v.qtd, 0);
    const n = m.nivel >= 1 ? BASES[classe.base].iniciais : 0;
    const usados = Math.max(0, m.habilidades.length - n) + m.melhorias.length + m.outros.length;
    return { total, usados, livres: total - usados, iniciais: n };
  }

  function escolhaAleatoria(pj, usados) {
    const t = sortearTipo(pj, usados);
    const c = pj.classe;
    if (t === 'nova') {
      const livres = c.habilidades.map((_, i) => i).filter((i) => !pj.habilidades.some((h) => h.i === i));
      return { tipo: 'nova', i: um(livres), col: pj.elemento };
    }
    if (t === 'melhoria') {
      if (temColunas(c)) {
        const h = um(pj.habilidades.filter((x) => x.colunas.length < 4));
        return { tipo: 'melhoria', i: h.i, col: um([0, 1, 2, 3].filter((x) => !h.colunas.includes(x))) };
      }
      const h = um(pj.habilidades.filter((x) => c.habilidades[x.i].partes.slice(1).some((p, k) => p && !x.melhorias.includes(k))));
      return { tipo: 'melhoria', i: h.i, k: um([0, 1, 2].filter((k) => c.habilidades[h.i].partes[k + 1] && !h.melhorias.includes(k))) };
    }
    if (t === 'dado') return { tipo: 'dado', i: um(pj.habilidades.filter((x) => temDados(c.habilidades[x.i].partes.join(' ')))).i };
    if (t === 'atributos') {
      const ip = ATR.indexOf(pj.principal);
      if (pj.atr[ip] <= 18) return { tipo: 'atributos', a1: ip, a2: ip };
      const outros = embaralhar([0, 1, 2, 3, 4, 5].filter((i) => pj.atr[i] < 20));
      return { tipo: 'atributos', a1: outros[0], a2: outros[1] != null ? outros[1] : outros[0] };
    }
    if (t === 'vigor') return { tipo: 'vigor', pv: d(c.base) };
    return { tipo: t };
  }

  function armasDoPacote(classe) { return D.armas.filter((a) => a.custo <= 10 && armaPermitida(classe, a)); }
  function armadurasDoPacote(classe, anc) {
    if (traco(anc, 'Blindagem integrada')) return [];
    return armadurasPermitidas(classe).filter((a) => a.custo <= 15 && a.categoria !== 'Escudo');
  }
  function itensDoPacote(m) {
    const itens = [KIT];
    const arma = D.armas.find((a) => a.nome === m.arma);
    if (arma) {
      itens.push(textoArma(arma));
      if (/munição/.test(arma.propriedades)) itens.push(/besta/i.test(arma.nome) ? 'Virotes (20)' : 'Flechas (20)');
    }
    const armadura = D.armaduras.find((a) => a.nome === m.armadura);
    if (armadura) itens.push(textoArmadura(armadura));
    return itens;
  }

  function preencherHabilidades(m, classe) {
    const n = BASES[classe.base].iniciais;
    const resto = embaralhar(classe.habilidades.map((_, i) => i)).filter((i) => !m.habilidades.some((h) => h.i === i));
    while (m.habilidades.length < n) m.habilidades.push({ i: resto.shift(), col: m.elemento || 0 });
  }

  // Constrói o personagem a partir do estado. Com sortearBrancos, preenche os avanços livres.
  function personagemDoEstado(m, sortearBrancos) {
    const classe = D.classes.find((c) => c.nome === m.classe);
    const anc = D.ancestralidades.find((a) => a.nome === m.anc);
    const pj = { nivel: m.nivel, classe, anc, avancos: [], treinos: 0, atr: m.atr.slice() };
    const ordemAtr = classe.atributos.slice().sort((a, b) => pj.atr[ATR.indexOf(b)] - pj.atr[ATR.indexOf(a)]);
    pj.principal = classe.atributos.includes(m.principal) ? m.principal : ordemAtr[0];
    pj.nome = m.nome || 'Sem nome';
    if (m.antecedente == null) m.antecedente = um(D.antecedentes)[0];
    pj.antecedente = D.antecedentes.find((a) => a[0] === m.antecedente) || D.antecedentes[0];
    if (m.bem == null) m.bem = Math.floor((d(6) - 1) / 2);
    if (m.ordem == null) m.ordem = Math.floor((d(6) - 1) / 2);
    pj.tendencia = tendencia(m.bem, m.ordem);
    const tit = D.titulos[classe.nome];
    if (!m.titulo && tit) m.titulo = um(tit)[m.ordem];
    pj.titulo = m.titulo;
    const mov = traco(anc, 'Movimento');
    pj.movimento = mov ? parseInt(mov[1], 10) : 6;

    pj.divindade = null;
    if (m.nivel >= 1) {
      if (m.divindade === 'auto') {
        if (exigeDivindade(classe)) {
          const demoniacas = D.divindades.filter((x) => /Demônio|Diabo/.test(x.entidade));
          m.divindade = (classe.nome === 'Cavaleiro Profano' && demoniacas.length ? um(demoniacas) : um(D.divindades)).nome;
        } else m.divindade = 'nenhuma';
      }
      pj.divindade = D.divindades.find((x) => x.nome === m.divindade) || null;
    }

    if (m.elemento == null) m.elemento = temColunas(classe) ? d(4) - 1 : 0;
    pj.elemento = m.elemento;
    pj.habilidades = [];
    const n = m.nivel >= 1 ? BASES[classe.base].iniciais : 0;
    if (sortearBrancos && m.nivel >= 1) preencherHabilidades(m, classe);
    m.habilidades.slice(0, n).forEach((h) => adicionarHabilidade(pj, h.i, h.col || 0));

    const robusto = !!traco(anc, 'Robusto');
    const dv = () => { let r = d(classe.base); if (robusto) r = Math.max(r, d(classe.base)); return r; };
    for (let L = 1; L <= Math.max(1, m.nivel); L++) if (m.pv[L - 1] == null) m.pv[L - 1] = dv();
    m.pv.length = Math.max(1, m.nivel);
    pj.pv = Math.max(1, m.pv[0] + mod(pj.atr[2])) + (robusto ? 1 : 0);
    for (let L = 2; L <= m.nivel; L++) pj.pv += m.pv[L - 1] + (robusto ? 1 : 0);

    // fila de avanços: habilidades além das iniciais, melhorias, depois o resto
    const fila = m.habilidades.slice(n).map((h) => ({ tipo: 'nova', i: h.i, col: h.col || 0 }))
      .concat(m.melhorias.map((x) => ({ tipo: 'melhoria', i: x.i, k: x.k, col: x.col })))
      .concat(m.outros);
    // dois avanços no mesmo nível devem ser escolhas diferentes: mesmo tipo em alvos diferentes vale
    // (a mesma habilidade não recebe duas melhorias, nem dois elementos, no mesmo nível)
    const chaveDe = (e) => (['nova', 'melhoria', 'dado'].includes(e.tipo) ? e.tipo + ':' + e.i : e.tipo);
    vagasDeAvanco(classe, anc, m.nivel).forEach((v) => {
      const itens = [];
      const usados = [];
      const escolhidas = [];
      for (let q = 0; q < v.qtd; q++) {
        // escolhe o avanço que pode entrar agora (sem repetir no nível e com a habilidade já obtida),
        // dando preferência aos que se repetem mais, para espalhá-los pelos níveis
        const pode = (e) => !escolhidas.includes(chaveDe(e))
          && (e.tipo === 'nova' || !['melhoria', 'dado'].includes(e.tipo) || pj.habilidades.some((h) => h.i === e.i));
        const repete = (e) => fila.filter((x) => chaveDe(x) === chaveDe(e)).length;
        let idx = -1;
        fila.forEach((e, k) => { if (pode(e) && (idx < 0 || repete(e) > repete(fila[idx]))) idx = k; });
        let e = idx >= 0 ? fila.splice(idx, 1)[0] : null;
        if (e) escolhidas.push(chaveDe(e));
        if (!e && sortearBrancos) {
          e = escolhaAleatoria(pj, usados);
          if (e.tipo === 'nova') m.habilidades.push({ i: e.i, col: e.col || 0 });
          else if (e.tipo === 'melhoria') m.melhorias.push({ i: e.i, k: e.k, col: e.col });
          else m.outros.push(e);
        }
        if (!e) { itens.push('a escolher'); continue; }
        if (e.tipo === 'vigor') {
          if (e.pv == null) e.pv = d(classe.base);
          pj.pv += e.pv;
          usados.push('vigor');
          itens.push('Vigor: +' + e.pv + ' PV');
        } else if (e.tipo === 'treino') {
          usados.push('treino');
          pj.treinos += 1;
          itens.push('Treino: ' + (e.texto || 'uma proficiência ou um idioma (anote)'));
        } else {
          itens.push(aplicarEscolha(pj, e, usados));
        }
      }
      pj.avancos.push({ nivel: v.nivel, motivo: v.motivo, itens });
    });
    pj.sobras = fila;

    const chave = classe.nome + '|' + m.nivel + '|' + pj.habilidades.map((h) => h.i + '.' + h.melhorias.join('')).join(',');
    if (!m.extras || m.extrasChave !== chave) { m.extras = rolarExtras(pj); m.extrasChave = chave; }
    pj.extras = m.extras;

    if (m.nivel === 0) {
      if (!m.equip0) m.equip0 = itensDeNivel0();
      m.equipamento = m.equip0;
    } else if (m.equipModo === 'ouro') {
      if (m.ouroInicial == null) m.ouroInicial = (d(6) + d(6)) * 5;
      m.compras = m.compras || [];
      m.equipamento = m.compras.map((x) => x.texto);
      m.ouro = m.ouroInicial - (m.compraLivre ? 0 : m.compras.reduce((t, x) => t + x.custo, 0));
    } else {
      if (m.arma === undefined) { const a = escolherArma(classe, pj.principal); m.arma = a ? a.nome : ''; }
      if (m.armadura === undefined) {
        const op = armadurasDoPacote(classe, anc);
        m.armadura = op.length ? op.sort((a, b) => caDaArmadura(b, 0) - caDaArmadura(a, 0))[0].nome : '';
      }
      m.equipamento = itensDoPacote(m);
    }
    pj.equipamento = m.equipamento.concat((m.equipExtra || '').split('\n')).filter((x) => x.trim());
    pj.ouro = m.ouro;
    pj.armadura = D.armaduras.find((a) => a.categoria !== 'Escudo' && pj.equipamento.some((x) => x.toLowerCase().startsWith(a.nome.toLowerCase()))) || null;
    calcular(pj);
    return pj;
  }

  function iniciarMontar(painel) {
    M = estadoNovo();
    const $ = (sel) => painel.querySelector(sel);
    const classeAtual = () => D.classes.find((x) => x.nome === M.classe);
    const ancAtual = () => D.ancestralidades.find((x) => x.nome === M.anc);

    function opcoesDe(lista, sel, vazio) {
      return (vazio != null ? `<option value="">${vazio}</option>` : '')
        + lista.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`).join('');
    }

    function render() {
      const c = M.classe ? classeAtual() : null;
      const anc = M.anc ? ancAtual() : null;
      const eixos = ['Ordem', 'Neutro', 'Caos'];
      const tit = c ? (D.titulos[c.nome] || []) : [];
      const titulos = M.ordem == null ? [0, 1, 2].flatMap((col) => tit.map((l) => [l[col], eixos[col] + ': ' + l[col]])) : tit.map((l) => [l[M.ordem], l[M.ordem]]);
      painel.innerHTML = `
        <div class="fj-g-acoes fj-g-topo">
          <label class="fj-g-arquivo">Carregar ficha (JSON) <input type="file" accept=".json,application/json" data-acao="carregar"></label>
          <button type="button" data-acao="nova">Começar do zero</button>
        </div>
        <div class="fj-g-passo"><h3>1. Personagem</h3>
          <div class="fj-g-grade">
            <label>Nome <span class="fj-g-linha"><input data-m="nome" type="text" value="${esc(M.nome)}" placeholder="Nome"><button type="button" data-acao="nome" title="Sortear nome">🎲</button></span></label>
            <label>Nível <span class="fj-g-linha"><select data-m="nivel">${opcoesDe(Array.from({ length: 11 }, (_, i) => [i, i]), M.nivel)}</select><button type="button" data-acao="subir" title="Subir de nível">Subir ↑</button></span></label>
            <label>Classe <select data-m="classe">${opcoesDe(D.classes.map((x) => [x.nome, x.nome + (x.exotica ? ' (exótica)' : '')]), M.classe, 'Escolha')}</select></label>
            <label>Ancestralidade <select data-m="anc">${opcoesDe(D.ancestralidades.map((x) => [x.nome, x.nome]), M.anc, 'Escolha')}</select></label>
            <label>Antecedente <select data-m="antecedente">${opcoesDe(D.antecedentes.map((x) => [x[0], x[0]]), M.antecedente, 'Sortear')}</select></label>
            <label>Bem x Mal <select data-m="bem">${opcoesDe([[0, 'Bem'], [1, 'Neutro'], [2, 'Mal']], M.bem, 'Sortear')}</select></label>
            <label>Ordem x Caos <select data-m="ordem">${opcoesDe([[0, 'Ordem'], [1, 'Neutro'], [2, 'Caos']], M.ordem, 'Sortear')}</select></label>
            <label>Título <select data-m="titulo">${opcoesDe(titulos, M.titulo, 'Sortear')}</select></label>
            <label>Divindade <select data-m="divindade">${opcoesDe([['auto', 'Só se a classe exigir'], ['nenhuma', 'Nenhuma']].concat(D.divindades.map((x) => [x.nome, x.nome])), M.divindade)}</select></label>
          </div>
        </div>
        ${c && anc ? passos(c, anc) : '<p><em>Escolha a classe e a ancestralidade para continuar.</em></p>'}`;
      ligar();
      if (c && anc) previa();
    }

    function passos(c, anc) {
      const conta = contaAvancos(M, c, anc);
      const n = conta.iniciais;
      const principal = c.atributos.length > 1
        ? `<label>Atributo principal <select data-m="principal">${opcoesDe(c.atributos.map((a) => [a, a]), M.principal, 'O maior')}</select></label>` : '';
      const robusto = traco(anc, 'Robusto') ? ' +1 (Robusto)' : '';
      const pvLinhas = Array.from({ length: Math.max(1, M.nivel) }, (_, k) => `<div class="fj-g-pv"><span>Nível ${M.nivel === 0 ? 0 : k + 1}</span>
        <input type="number" min="1" max="${c.base}" data-pv="${k}" value="${M.pv[k] != null ? M.pv[k] : ''}" placeholder="d${c.base}">
        <button type="button" data-acao="pv" data-k="${k}" title="Rolar d${c.base}">🎲</button>
        <small>${k === 0 ? 'd' + c.base + ' + mod. de Con' : 'd' + c.base}${robusto}</small></div>`).join('');
      const cheio = conta.livres <= 0;
      const habs = c.habilidades.map((h, i) => {
        const pos = M.habilidades.findIndex((x) => x.i === i);
        const marcada = pos >= 0;
        const podeMarcar = marcada || M.habilidades.length < n || !cheio;
        const efeito = esc(limpo(h.partes[0]));
        let extra = '';
        if (temColunas(c)) {
          const base = marcada ? M.habilidades[pos].col : null;
          extra = `<div class="fj-g-mels">${c.colunas.map((x, k) => {
            const tem = base === k || M.melhorias.some((y) => y.i === i && y.col === k);
            const pode = tem || (base == null ? podeMarcar : !cheio);
            return `<label title="${esc(limpo(h.partes[k]))}"><input type="checkbox" data-el="${i}:${k}"${tem ? ' checked' : ''}${pode ? '' : ' disabled'}> ${x}</label>`;
          }).join('')}</div>`;
        } else {
          extra = `<div class="fj-g-mels">${h.partes.slice(1).map((mm, k) => {
            if (!mm) return '';
            const tem = M.melhorias.some((y) => y.i === i && y.k === k);
            const pode = tem || (marcada && !cheio);
            return `<label title="${esc(limpo(mm))}"><input type="checkbox" data-mel="${i}:${k}"${tem ? ' checked' : ''}${pode ? '' : ' disabled'}> ${esc(nomeMelhoria(c, i, k))}</label>`;
          }).join('')}</div>`;
        }
        const etiqueta = marcada ? (pos < n ? '<small class="fj-g-tag">inicial</small>' : '<small class="fj-g-tag">avanço</small>') : '';
        const caixa = temColunas(c) ? '' : `<input type="checkbox" data-hab="${i}"${marcada ? ' checked' : ''}${podeMarcar ? '' : ' disabled'}> `;
        return `<div class="fj-g-hab"><label title="${efeito}">${caixa}${md(h.nome)} <small>(${esc(h.custo)})</small> ${etiqueta}</label>${extra}</div>`;
      }).join('');
      const outros = M.outros.map((e, j) => outroHTML(c, e, j)).join('');
      const equip = (M.equipamento || []).join('\n');
      const resumo = `<div class="fj-g-conta">Habilidades: <b>${M.habilidades.length}</b> (${Math.min(M.habilidades.length, n)} de ${n} iniciais)
        · Avanços: <b>${conta.usados}</b> de ${conta.total} usados${conta.livres > 0 ? ` · <b>${conta.livres}</b> livre${conta.livres > 1 ? 's' : ''}` : ''}${conta.livres < 0 ? ' · <b>avanços demais: desmarque algo</b>' : ''}</div>`;
      return `
        <div class="fj-g-passo"><h3>2. Atributos</h3>
          <div class="fj-g-acoes"><button type="button" data-acao="rolar-atr">Rolar 4d6 seis vezes</button></div>
          <div class="fj-g-atr">${ATR.map((a, i) => `<label>${a}<input type="number" min="3" max="20" data-atr="${i}" value="${M.atr[i]}"></label>`).join('')}</div>
          <div class="fj-g-grade">${principal}</div>
        </div>
        <div class="fj-g-passo"><h3>3. Pontos de Vida</h3>
          <p><small>Digite o resultado do dado ou role. Em branco, o gerador rola. O Vigor tem o próprio dado, nos Avanços.</small></p>
          <div class="fj-g-pvs">${pvLinhas}</div>
          <div class="fj-g-acoes"><button type="button" data-acao="pv-todos">Rolar os que faltam</button></div>
        </div>
        ${M.nivel >= 1 ? `<div class="fj-g-passo"><h3>4. Habilidades <small>(passe o mouse para ler o efeito)</small></h3>
          <p><small>As ${n} primeiras são as iniciais. Cada habilidade a mais${temColunas(c) ? ' e cada elemento a mais' : ' e cada melhoria'} gasta um avanço.</small></p>
          ${resumo}<div class="fj-g-aviso" hidden></div>
          <div class="fj-g-habs">${habs}</div>
          <div class="fj-g-acoes"><button type="button" data-acao="sortear-habs">Sortear as iniciais que faltam</button></div>
        </div>` : ''}
        ${conta.total ? `<div class="fj-g-passo"><h3>5. Outros avanços</h3>
          <p><small>Avanços que não são habilidade nem melhoria. O gerador distribui todos os avanços pelos níveis.</small></p>
          ${resumo}<div class="fj-g-aviso" hidden></div>
          <div class="fj-g-outros">${outros || '<em>Nenhum.</em>'}</div>
          <div class="fj-g-acoes">
            <select data-acao="add-outro"${conta.livres > 0 ? '' : ' disabled'}><option value="">+ Adicionar avanço</option><option value="dado">+1 dado</option><option value="atributos">Atributos</option><option value="vigor">Vigor</option><option value="treino">Treino</option></select>
            <button type="button" data-acao="sortear-avancos"${conta.livres > 0 ? '' : ' disabled'}>Sortear os livres</button>
          </div>
        </div>` : ''}
        <div class="fj-g-passo"><h3>6. Equipamento</h3>
          ${M.nivel >= 1 ? `<div class="fj-g-acoes"><button type="button" data-acao="pacote"${M.equipModo === 'pacote' ? ' class="fj-g-primario"' : ''}>Pacote inicial</button><button type="button" data-acao="ouro"${M.equipModo === 'ouro' ? ' class="fj-g-primario"' : ''}>Ouro e loja</button></div>
          ${M.equipModo === 'ouro' ? lojaHTML(c) : `<p><small>Pacote inicial: kit de exploração, uma arma de até 10 po e uma armadura de até 15 po.</small></p>
          <div class="fj-g-grade">
            <label>Arma <select data-pacote="arma">${opcoesDe(armasDoPacote(c).map((a) => [a.nome, a.nome + ' (' + a.dano + ', ' + a.custo + ' po)']), M.arma, 'Nenhuma')}</select></label>
            ${armadurasDoPacote(c, anc).length ? `<label>Armadura <select data-pacote="armadura">${opcoesDe(armadurasDoPacote(c, anc).map((a) => [a.nome, a.nome + ' (CA ' + a.ca + ', ' + a.custo + ' po)']), M.armadura, 'Nenhuma')}</select></label>` : ''}
          </div>`}` : nivel0HTML()}
          <label class="fj-g-equip">Outros itens (um por linha)<textarea data-m="equipExtra" rows="3">${esc(M.equipExtra || '')}</textarea></label>
          ${M.equipModo === 'ouro' && M.nivel >= 1 ? '' : `<label class="fj-g-equip">Peças de ouro <input type="number" min="0" data-m="ouro" value="${M.ouro || 0}"></label>`}
        </div>
        <div class="fj-g-passo"><h3>Ficha</h3>
          <div class="fj-g-acoes">
            <button type="button" class="fj-g-primario" data-acao="imprimir">Imprimir ficha</button>
            <button type="button" data-acao="json">Baixar JSON</button>
            <label class="fj-g-arquivo">Carregar JSON <input type="file" accept=".json,application/json" data-acao="carregar"></label>
          </div>
          <div class="fj-g-previa"></div>
        </div>`;
    }

    // Nível 0: os itens saem da tabela de nível 0, sorteados (1d4) ou escolhidos um a um.
    function nivel0HTML() {
      if (!M.equip0) M.equip0 = itensDeNivel0();
      const tabela = D.equipamentoNivel0.map((x) => [x, x]);
      const itens = M.equip0.map((x, k) => `<div class="fj-g-av"><select data-e0="${k}">${opcoesDe(tabela, x)}</select> <button type="button" data-acao="tirar-e0" data-k="${k}" title="Tirar">✕</button></div>`).join('');
      return `<p><small>Nível 0: role 1d4 vezes na tabela de nível 0 (veja Equipamento). Sorteie ou escolha os itens.</small></p>
          <div class="fj-g-outros">${itens || '<em>Nenhum item.</em>'}</div>
          <div class="fj-g-acoes"><button type="button" data-acao="sortear-e0">🎲 Sortear 1d4 itens</button><button type="button" data-acao="add-e0"${M.equip0.length >= 4 ? ' disabled' : ''}>+ Item</button></div>`;
    }

    // Loja do modo Ouro: compra armas, armaduras e itens com o ouro inicial (2d6 × 5 po,
    // ou o valor que o grupo combinar para personagens de nível alto), ou de graça na compra livre.
    function lojaHTML(c) {
      const gasto = M.compraLivre ? 0 : (M.compras || []).reduce((t, x) => t + x.custo, 0);
      const resta = (M.ouroInicial || 0) - gasto;
      const opc = (lista) => lista.map((x) => `<option value="${esc(x.v)}"${!M.compraLivre && x.custo > resta ? ' disabled' : ''}>${esc(x.t)}</option>`).join('');
      const armas = D.armas.map((a) => ({ v: a.nome, custo: a.custo, t: a.nome + ' (' + a.dano + ', ' + a.custo + ' po)' + (armaPermitida(c, a) ? '' : ' · sem proficiência') }));
      const permitidas = armadurasPermitidas(c).map((a) => a.nome);
      const escudo = /escudo/i.test(c.armaduras);
      const armaduras = D.armaduras.map((a) => ({ v: a.nome, custo: a.custo, t: a.nome + (a.categoria === 'Escudo' ? ' (+2)' : ' (CA ' + a.ca + ')') + ', ' + a.custo + ' po'
        + ((a.categoria === 'Escudo' ? escudo : permitidas.includes(a.nome)) ? '' : ' · sem proficiência') }));
      const itens = [{ v: 'KIT', custo: 7, t: 'Kit de exploração, 7 po' }].concat(D.equipamentoBasico.map((x) => ({ v: x.nome, custo: x.custo, t: x.nome + ', ' + x.custo + ' po' })));
      const compras = (M.compras || []).map((x, k) => `<div class="fj-g-av">${esc(x.texto)} <small>(${x.custo} po)</small> <button type="button" data-acao="devolver" data-k="${k}" title="Devolver">✕</button></div>`).join('');
      return `<div class="fj-g-conta">Ouro inicial: <input type="number" min="0" step="5" class="fj-g-num" data-m="ouroInicial" value="${M.ouroInicial || 0}"> po
          <button type="button" data-acao="rolar-ouro" title="Rolar 2d6 × 5">🎲 2d6 × 5</button>
          ${[100, 500].map((v) => `<button type="button" data-acao="mais-ouro" data-v="${v}">+${v}</button>`).join('')}
          · Gasto: <b>${gasto} po</b> · Sobra: <b>${resta} po</b>
          <label class="fj-g-livre"><input type="checkbox" data-m="compraLivre"${M.compraLivre ? ' checked' : ''}> Compra livre (não gasta ouro)</label></div>
        <p><small>Personagem de nível alto? Digite o ouro que o grupo combinou, some com os botões ou use a compra livre.</small></p>
        <div class="fj-g-grade fj-g-loja">
          <label>Armas <span class="fj-g-linha"><select data-loja="arma">${opc(armas)}</select><button type="button" data-acao="comprar" data-de="arma">Comprar</button></span></label>
          <label>Armaduras e escudo <span class="fj-g-linha"><select data-loja="armadura">${opc(armaduras)}</select><button type="button" data-acao="comprar" data-de="armadura">Comprar</button></span></label>
          <label>Itens <span class="fj-g-linha"><select data-loja="item">${opc(itens)}</select><button type="button" data-acao="comprar" data-de="item">Comprar</button></span></label>
        </div>
        <div class="fj-g-outros">${compras || '<em>Nada comprado ainda.</em>'}</div>`;
    }

    function comprar(de) {
      const sel = painel.querySelector(`[data-loja="${de}"]`);
      if (!sel || !sel.value) return;
      let item;
      if (de === 'arma') { const a = D.armas.find((x) => x.nome === sel.value); item = { texto: textoArma(a), custo: a.custo }; }
      else if (de === 'armadura') { const a = D.armaduras.find((x) => x.nome === sel.value); item = { texto: textoArmadura(a), custo: a.custo }; }
      else if (sel.value === 'KIT') item = { texto: KIT, custo: 7 };
      else { const b = D.equipamentoBasico.find((x) => x.nome === sel.value); item = { texto: b.nome, custo: b.custo }; }
      const resta = M.ouroInicial - M.compras.reduce((t, x) => t + x.custo, 0);
      if (!M.compraLivre && item.custo > resta) { alert('Ouro insuficiente.'); return; }
      M.compras.push(item);
      render();
    }

    function outroHTML(c, e, j) {
      const minhas = M.habilidades.map((h) => [h.i, limpo(c.habilidades[h.i].nome)]);
      const atrs = ATR.map((a, i) => [i, a]);
      let corpo = '';
      if (e.tipo === 'dado') corpo = `+1 dado em <select data-out="${j}" data-campo="i">${opcoesDe(minhas, e.i, 'Escolha')}</select>`;
      if (e.tipo === 'atributos') corpo = `Atributos: +1 <select data-out="${j}" data-campo="a1">${opcoesDe(atrs, e.a1)}</select> +1 <select data-out="${j}" data-campo="a2">${opcoesDe(atrs, e.a2)}</select>`;
      if (e.tipo === 'vigor') corpo = `Vigor: <input type="number" min="1" max="${c.base}" data-out="${j}" data-campo="pv" value="${e.pv != null ? e.pv : ''}" placeholder="d${c.base}"> <button type="button" data-acao="vigor" data-j="${j}" title="Rolar d${c.base}">🎲</button> PV`;
      if (e.tipo === 'treino') corpo = `Treino: <input type="text" data-out="${j}" data-campo="texto" value="${esc(e.texto || '')}" placeholder="Arma, armadura, escudo ou idioma">`;
      return `<div class="fj-g-av">${corpo} <button type="button" data-acao="tirar" data-j="${j}" title="Remover">✕</button></div>`;
    }

    function previa() {
      let pj;
      try { pj = personagemDoEstado(M, false); } catch (err) { $('.fj-g-previa').innerHTML = '<p>Não deu para montar a ficha.</p>'; return; }
      atual = pj;
      $('.fj-g-previa').innerHTML = cartao(pj);
      // avanços que a regra não deixa encaixar (dois iguais no mesmo nível)
      const c = pj.classe;
      const descreve = (e) => {
        const nh = e.i != null && c.habilidades[e.i] ? limpo(c.habilidades[e.i].nome) : '';
        if (e.tipo === 'nova') return 'Nova habilidade: ' + nh;
        if (e.tipo === 'melhoria') return (temColunas(c) ? 'Outro elemento: ' : 'Melhoria: ') + nh;
        if (e.tipo === 'dado') return '+1 dado: ' + nh;
        return { atributos: 'Atributos', vigor: 'Vigor', treino: 'Treino' }[e.tipo] || e.tipo;
      };
      painel.querySelectorAll('.fj-g-aviso').forEach((el) => {
        el.hidden = !pj.sobras.length;
        el.innerHTML = pj.sobras.length ? '<b>Não coube:</b> ' + pj.sobras.map((e) => esc(descreve(e))).join(' · ')
          + '. Dois avanços no mesmo nível precisam ser escolhas diferentes (o mesmo tipo de avanço na mesma habilidade, ou Atributos, Vigor e Treino repetidos), e não há outro nível para eles. Troque um deles ou suba de nível.' : '';
      });
      const nome = $('.fj-g-previa .fj-g-nome');
      nome.addEventListener('input', () => { M.nome = nome.value; atual.nome = nome.value; const campo = $('[data-m="nome"]'); if (campo) campo.value = nome.value; });
      $('.fj-g-previa .fj-g-novonome').addEventListener('click', () => { M.nome = um(D.nomes[M.anc] || D.nomes.Humano); render(); });
      ['antecedente', 'bem', 'ordem', 'titulo', 'divindade'].forEach((k) => { const el = $(`[data-m="${k}"]`); if (el && M[k] != null) el.value = M[k]; });
      ['arma', 'armadura'].forEach((k) => { const el = $(`[data-pacote="${k}"]`); if (el && M[k] != null) el.value = M[k]; });
      painel.querySelectorAll('[data-pv]').forEach((el) => { const k = parseInt(el.dataset.pv, 10); if (M.pv[k] != null) el.value = M.pv[k]; });
      const eq = $('[data-m="equipExtra"]');
      if (eq && document.activeElement !== eq) eq.value = M.equipExtra || '';
      const ouro = $('[data-m="ouro"]');
      if (ouro) ouro.value = M.ouro || 0;
    }

    function ligar() {
      painel.querySelectorAll('[data-m]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.m;
        let v = el.value;
        if (['nivel', 'bem', 'ordem', 'ouro'].includes(k)) v = v === '' ? null : parseInt(v, 10);
        if (k === 'equipExtra') { M.equipExtra = el.value; previa(); return; }
        if (k === 'ouro') { M.ouro = v || 0; previa(); return; }
        if (k === 'ouroInicial') { M.ouroInicial = Math.max(0, parseInt(v, 10) || 0); render(); return; }
        if (k === 'compraLivre') { M.compraLivre = el.checked; render(); return; }
        if (v === '' && ['antecedente', 'titulo', 'classe', 'anc', 'principal'].includes(k)) v = k === 'titulo' ? '' : null;
        if (k === 'classe' && v !== M.classe) {
          Object.assign(M, { habilidades: [], melhorias: [], outros: [], titulo: '', elemento: null, extras: null, principal: null, equipamento: null, divindade: 'auto', arma: undefined, armadura: undefined, compras: [] });
        }
        if (k === 'ordem') M.titulo = '';
        M[k] = v;
        if (['nivel', 'classe', 'anc', 'ordem'].includes(k)) render(); else previa();
      }));
      painel.querySelectorAll('[data-atr]').forEach((el) => el.addEventListener('change', () => {
        M.atr[parseInt(el.dataset.atr, 10)] = Math.max(3, Math.min(20, parseInt(el.value, 10) || 10));
        previa();
      }));
      painel.querySelectorAll('[data-pv]').forEach((el) => el.addEventListener('change', () => {
        const k = parseInt(el.dataset.pv, 10);
        M.pv[k] = el.value === '' ? null : Math.max(1, parseInt(el.value, 10));
        previa();
      }));
      painel.querySelectorAll('[data-hab]').forEach((el) => el.addEventListener('change', () => {
        const i = parseInt(el.dataset.hab, 10);
        if (el.checked) M.habilidades.push({ i, col: 0 });
        else {
          M.habilidades = M.habilidades.filter((h) => h.i !== i);
          M.melhorias = M.melhorias.filter((x) => x.i !== i);
          M.outros = M.outros.filter((x) => !(x.tipo === 'dado' && x.i === i));
        }
        M.extras = null;
        render();
      }));
      painel.querySelectorAll('[data-mel]').forEach((el) => el.addEventListener('change', () => {
        const [i, k] = el.dataset.mel.split(':').map((x) => parseInt(x, 10));
        if (el.checked) M.melhorias.push({ i, k });
        else M.melhorias = M.melhorias.filter((x) => !(x.i === i && x.k === k));
        M.extras = null;
        render();
      }));
      // Dobrador Elemental: o primeiro elemento marcado é a habilidade; os outros gastam avanços.
      painel.querySelectorAll('[data-el]').forEach((el) => el.addEventListener('change', () => {
        const [i, k] = el.dataset.el.split(':').map((x) => parseInt(x, 10));
        const h = M.habilidades.find((x) => x.i === i);
        if (el.checked) {
          if (!h) M.habilidades.push({ i, col: k });
          else M.melhorias.push({ i, col: k });
        } else if (h && h.col === k) {
          const extra = M.melhorias.find((x) => x.i === i);
          if (extra) { h.col = extra.col; M.melhorias = M.melhorias.filter((x) => x !== extra); }
          else { M.habilidades = M.habilidades.filter((x) => x !== h); M.outros = M.outros.filter((x) => !(x.tipo === 'dado' && x.i === i)); }
        } else {
          M.melhorias = M.melhorias.filter((x) => !(x.i === i && x.col === k));
        }
        render();
      }));
      painel.querySelectorAll('[data-e0]').forEach((el) => el.addEventListener('change', () => {
        M.equip0[parseInt(el.dataset.e0, 10)] = el.value;
        previa();
      }));
      painel.querySelectorAll('[data-pacote]').forEach((el) => el.addEventListener('change', () => {
        M[el.dataset.pacote] = el.value;
        previa();
      }));
      painel.querySelectorAll('[data-out]').forEach((el) => el.addEventListener('change', () => {
        const e = M.outros[parseInt(el.dataset.out, 10)];
        const campo = el.dataset.campo;
        if (campo === 'texto') e.texto = el.value;
        else e[campo] = el.value === '' ? null : parseInt(el.value, 10);
        previa();
      }));
      painel.querySelectorAll('[data-acao]').forEach((el) => {
        const acao = el.dataset.acao;
        if (acao === 'carregar') { el.addEventListener('change', () => carregar(el.files[0])); return; }
        if (acao === 'add-outro') {
          el.addEventListener('change', () => {
            const t = el.value;
            if (!t) return;
            const c = classeAtual();
            const e = { tipo: t };
            if (t === 'dado') e.i = M.habilidades.length ? M.habilidades[0].i : null;
            if (t === 'atributos') { const ip = ATR.indexOf(personagemDoEstado(JSON.parse(JSON.stringify(M)), false).principal); e.a1 = ip; e.a2 = ip; }
            if (t === 'vigor') e.pv = d(c.base);
            M.outros.push(e);
            render();
          });
          return;
        }
        el.addEventListener('click', () => {
          const c = M.classe ? classeAtual() : null;
          if (acao === 'nome') { M.nome = um(D.nomes[M.anc] || D.nomes.Humano); render(); }
          if (acao === 'subir' && M.nivel < 10) { M.nivel += 1; render(); }
          if (acao === 'rolar-atr') { M.atr = ATR.map(rolar4d6); render(); }
          if (acao === 'pv') { M.pv[parseInt(el.dataset.k, 10)] = d(c.base); render(); }
          if (acao === 'pv-todos') { for (let k = 0; k < Math.max(1, M.nivel); k++) if (M.pv[k] == null) M.pv[k] = d(c.base); render(); }
          if (acao === 'vigor') { M.outros[parseInt(el.dataset.j, 10)].pv = d(c.base); render(); }
          if (acao === 'tirar') { M.outros.splice(parseInt(el.dataset.j, 10), 1); render(); }
          if (acao === 'sortear-avancos') { personagemDoEstado(M, true); M.extras = null; render(); }
          if (acao === 'sortear-habs') { preencherHabilidades(M, c); M.extras = null; render(); }
          if (acao === 'pacote' || acao === 'ouro') {
            M.equipModo = acao;
            if (acao === 'ouro' && M.ouroInicial == null) { M.ouroInicial = (d(6) + d(6)) * 5; M.compras = []; }
            render();
          }
          if (acao === 'rolar-ouro') { M.ouroInicial = (d(6) + d(6)) * 5; M.compras = []; render(); }
          if (acao === 'mais-ouro') { M.ouroInicial = (M.ouroInicial || 0) + parseInt(el.dataset.v, 10); render(); }
          if (acao === 'comprar') comprar(el.dataset.de);
          if (acao === 'sortear-e0') { M.equip0 = itensDeNivel0(); render(); }
          if (acao === 'add-e0' && M.equip0.length < 4) { M.equip0.push(D.equipamentoNivel0[0]); render(); }
          if (acao === 'tirar-e0') { M.equip0.splice(parseInt(el.dataset.k, 10), 1); render(); }
          if (acao === 'devolver') { M.compras.splice(parseInt(el.dataset.k, 10), 1); render(); }
          if (acao === 'imprimir') imprimir(folhaPersonagem(personagemDoEstado(M, false)), 'Ficha de ' + (M.nome || 'personagem'));
          if (acao === 'json') baixarJSON();
          if (acao === 'nova' && (!M.classe || confirm('Apagar o personagem atual e começar do zero?'))) { M = estadoNovo(); render(); }
        });
      });
    }

    function baixarJSON() { baixarEstado(M); }

    function carregar(arquivo) {
      if (!arquivo) return;
      const leitor = new FileReader();
      leitor.onload = () => {
        try {
          const dados = migrarEquipamento(migrar(JSON.parse(leitor.result)));
          if (!D.classes.some((c) => c.nome === dados.classe)) throw new Error('classe');
          M = Object.assign(estadoNovo(), dados);
          render();
        } catch (err) {
          alert('Esse arquivo não é uma ficha do gerador do Forja RPG.');
        }
      };
      leitor.readAsText(arquivo);
    }

    render();
    return { carregarEstado(m) { M = Object.assign(estadoNovo(), JSON.parse(JSON.stringify(m))); render(); } };
  }

  function baixarEstado(m) {
    const blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (m.nome || 'personagem').replace(/[^\wÀ-ÿ -]/g, '') + '.forja.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------------------------------------------------------------- tela

  function montarTela() {
    const opClasses = D.classes.map((c, i) => `<option value="${i}">${esc(c.nome)}${c.exotica ? ' (exótica)' : ''}</option>`).join('');
    const opAnc = D.ancestralidades.map((a, i) => `<option value="${i}">${esc(a.nome)}</option>`).join('');
    const opAnt = D.antecedentes.map((x) => `<option value="${esc(x[0])}">${esc(x[0])}</option>`).join('');
    const opDiv = D.divindades.map((x, i) => `<option value="${i}">${esc(x.nome)}</option>`).join('');
    const opNivel = Array.from({ length: 11 }, (_, i) => `<option value="${i}"${i === 1 ? ' selected' : ''}>${i}</option>`).join('');
    raiz.innerHTML = `
      <div class="fj-g-abas">
        <button type="button" data-aba="aleatorio" class="ativa">Aleatório</button>
        <button type="button" data-aba="montar">Montar</button>
        <button type="button" data-aba="funil">Funil (4 de nível 0)</button>
      </div>
      <div class="fj-g-painel" data-painel="aleatorio">
        <div class="fj-g-grade">
          <label>Nível <select id="g-nivel">${opNivel}</select></label>
          <label>Classe <select id="g-classe"><option value="">Aleatória</option>${opClasses}</select></label>
          <label>Ancestralidade <select id="g-anc"><option value="">Aleatória</option>${opAnc}</select></label>
          <label>Divindade <select id="g-div"><option value="auto">Só se a classe exigir</option><option value="sortear">Sortear</option><option value="nenhuma">Nenhuma</option>${opDiv}</select></label>
          <label>Equipamento <select id="g-equip"><option value="pacote">Pacote inicial</option><option value="ouro">Ouro (2d6 × 5 po)</option></select></label>
          <label>Avanços <select id="g-avancos"><option value="sortear">Sortear</option><option value="escolher">Deixar para escolher na mesa</option></select></label>
          <label class="fj-g-check"><input id="g-exoticas" type="checkbox"> Incluir classes exóticas no sorteio</label>
        </div>
        <div class="fj-g-acoes">
          <button type="button" id="g-gerar" class="fj-g-primario">Gerar personagem</button>
          <button type="button" id="g-imprimir" disabled>Imprimir ficha</button>
          <button type="button" id="g-editar" disabled>Editar no Montar</button>
          <button type="button" id="g-baixar" disabled>Baixar JSON</button>
        </div>
        <div id="g-saida"></div>
      </div>
      <div class="fj-g-painel" data-painel="montar" hidden>
        <p>Monte passo a passo. A ficha embaixo atualiza a cada escolha. Baixe o JSON para guardar o personagem e carregue de novo para subir de nível.</p>
        <div id="g-montar"></div>
      </div>
      <div class="fj-g-painel" data-painel="funil" hidden>
        <p>Quatro personagens de nível 0, prontos para o Funil (veja Mestre). Deixe tudo aleatório ou escolha a classe, a ancestralidade e o antecedente de cada um.</p>
        <div class="fj-g-funil">${[0, 1, 2, 3].map((k) => `
          <div class="fj-g-grade">
            <label>Personagem ${k + 1}: classe <select data-f="classe" data-k="${k}"><option value="">Aleatória</option>${opClasses}</select></label>
            <label>Ancestralidade <select data-f="anc" data-k="${k}"><option value="">Aleatória</option>${opAnc}</select></label>
            <label>Antecedente <select data-f="antecedente" data-k="${k}"><option value="">Aleatório</option>${opAnt}</select></label>
          </div>`).join('')}
        </div>
        <label class="fj-g-check"><input id="g-funil-exoticas" type="checkbox" checked> Incluir classes exóticas no sorteio</label>
        <div class="fj-g-acoes">
          <button type="button" id="g-funil" class="fj-g-primario">Gerar os 4 de nível 0</button>
          <button type="button" id="g-funil-imprimir" disabled>Imprimir ficha de Funil</button>
        </div>
        <div id="g-funil-saida"></div>
      </div>`;

    const $ = (id) => document.getElementById(id);
    raiz.querySelectorAll('.fj-g-abas button').forEach((b) => b.addEventListener('click', () => {
      raiz.querySelectorAll('.fj-g-abas button').forEach((x) => x.classList.toggle('ativa', x === b));
      raiz.querySelectorAll('.fj-g-painel').forEach((p) => { p.hidden = p.dataset.painel !== b.dataset.aba; });
    }));
    const montar = iniciarMontar($('g-montar'));
    const irPara = (aba) => raiz.querySelector(`.fj-g-abas button[data-aba="${aba}"]`).click();

    function opcoes() {
      const v = (id) => $(id).value;
      return {
        nivel: parseInt(v('g-nivel'), 10),
        classe: v('g-classe') === '' ? null : parseInt(v('g-classe'), 10),
        ancestralidade: v('g-anc') === '' ? null : parseInt(v('g-anc'), 10),
        divindade: v('g-div'), equipamento: v('g-equip'), sortear: v('g-avancos') === 'sortear',
        exoticas: $('g-exoticas').checked,
      };
    }

    $('g-gerar').addEventListener('click', () => {
      atual = novoPersonagem(opcoes());
      $('g-saida').innerHTML = cartao(atual);
      ['g-imprimir', 'g-editar', 'g-baixar'].forEach((id) => { $(id).disabled = false; });
      const nome = $('g-saida').querySelector('.fj-g-nome');
      nome.addEventListener('input', () => { atual.nome = nome.value; atual.estado.nome = nome.value; });
      $('g-saida').querySelector('.fj-g-novonome').addEventListener('click', () => {
        atual.nome = um(D.nomes[atual.anc.nome] || D.nomes.Humano);
        atual.estado.nome = atual.nome;
        nome.value = atual.nome;
      });
    });
    $('g-imprimir').addEventListener('click', () => imprimir(folhaPersonagem(atual), 'Ficha de ' + atual.nome));
    $('g-editar').addEventListener('click', () => { montar.carregarEstado(atual.estado); irPara('montar'); });
    $('g-baixar').addEventListener('click', () => baixarEstado(atual.estado));

    // Cada vaga do Funil usa a classe, a ancestralidade e o antecedente escolhidos, ou sorteia.
    function gerarVaga(k) {
      const v = (f) => raiz.querySelector(`[data-f="${f}"][data-k="${k}"]`).value;
      const pj = novoPersonagem({
        nivel: 0, sortear: true, exoticas: $('g-funil-exoticas').checked,
        classe: v('classe') === '' ? null : parseInt(v('classe'), 10),
        ancestralidade: v('anc') === '' ? null : parseInt(v('anc'), 10),
        antecedente: v('antecedente') || null,
      });
      // nível 0 ganha uma alcunha, da tabela de Ancestralidades
      if (D.alcunhas && D.alcunhas.length) { pj.nome += ' ' + um(D.alcunhas); pj.estado.nome = pj.nome; }
      funil[k] = pj;
    }
    const mostrarFunil = () => { $('g-funil-saida').innerHTML = funil.map(linhaFunil).join(''); };
    $('g-funil').addEventListener('click', () => {
      [0, 1, 2, 3].forEach(gerarVaga);
      mostrarFunil();
      $('g-funil-imprimir').disabled = false;
    });
    $('g-funil-saida').addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-vaga]');
      if (!b) return;
      const k = parseInt(b.dataset.vaga, 10);
      if (b.dataset.acao === 'de-novo') { gerarVaga(k); mostrarFunil(); }
      if (b.dataset.acao === 'editar') { montar.carregarEstado(funil[k].estado); irPara('montar'); }
    });
    $('g-funil-imprimir').addEventListener('click', () => imprimir(folhaFunil(funil), 'Ficha de Funil'));
  }

  function linhaAtributos(pj) {
    return ATR.map((a, i) => `<b>${ABR[i]}</b> ${pj.atr[i]} (${sinal(mod(pj.atr[i]))})`).join(' · ');
  }

  function cartao(pj) {
    const c = pj.classe;
    const voc = vocacao(c);
    const habs = pj.habilidades.map((h) => { const t = textoHabilidade(pj, h); return `<tr><td>${t.nome}</td><td>${esc(t.custo)}</td><td>${t.efeito}</td></tr>`; }).join('');
    const regras = c.regras.filter(([t]) => !t.startsWith('Vocação')).map(([t, x]) => `<p><b>${esc(t)}.</b> ${md(x)}</p>`).join('');
    const tracos = pj.anc.tracos.map(([t, x]) => `<p><b>${esc(t)}.</b> ${md(x)}</p>`).join('');
    const av = pj.avancos.map((a) => `<li><b>Nível ${a.nivel}${a.motivo ? ' (' + a.motivo + ')' : ''}:</b> ${a.itens.map(esc).join(' · ')}</li>`).join('');
    const ben = bencaos(pj);
    return `
      <div class="fj-g-cartao">
        <div class="fj-g-cab">
          <input class="fj-g-nome" type="text" value="${esc(pj.nome)}" aria-label="Nome">
          <button type="button" class="fj-g-novonome">Outro nome</button>
        </div>
        <p class="fj-g-sub">${esc(pj.anc.nome)} · ${esc(c.nome)} de nível ${pj.nivel}${pj.titulo ? ' · ' + esc(pj.titulo) : ''}</p>
        <p><b>Antecedente:</b> ${esc(pj.antecedente[0])} (vantagem para ${esc(pj.antecedente[1])}) · <b>Tendência:</b> ${esc(pj.tendencia)}${pj.nivel >= 1 ? ' · <b>Atributo principal:</b> ' + esc(pj.principal) : ''}</p>
        <p>${linhaAtributos(pj)}</p>
        <p><b>PV</b> ${pj.pv} · <b>CA</b> ${pj.ca} · <b>Sanidade</b> ${pj.sanidade}${pj.nivel >= 1 ? ` · <b>Mana</b> ${pj.mana} · <b>CD</b> ${pj.cd} · <b>Mana extra máx.</b> ${pj.nivel}` : ''} · <b>Movimento</b> ${pj.movimento} casas · <b>Dado de vida</b> d${c.base}</p>
        ${voc ? `<p><b>Vocação, ${esc(voc[0])}.</b> ${md(voc[1])}</p>` : ''}
        ${pj.nivel >= 1 && regras ? `<details><summary>Regras da classe</summary>${regras}</details>` : ''}
        ${pj.extras.map((e) => `<p><b>${esc(e.titulo)}:</b></p><ul>${e.itens.map((i) => '<li>' + i + '</li>').join('')}</ul>`).join('')}
        <details><summary>Traços de ${esc(pj.anc.nome)}</summary>${tracos}</details>
        ${pj.divindade ? `<p><b>Divindade:</b> ${esc(pj.divindade.nome)} (${esc(pj.divindade.entidade)}, ${esc(pj.divindade.dominio)}, ${esc(pj.divindade.vinculo)}). <i>Responsabilidades:</i> ${esc(pj.divindade.responsabilidades)}${ben.length ? ' <i>Bênçãos:</i> ' + ben.map(esc).join(' ') : ''}</p>` : ''}
        ${habs ? `<table class="fj-g-tabela"><thead><tr><th>Habilidade</th><th>Custo</th><th>Efeito</th></tr></thead><tbody>${habs}</tbody></table>` : ''}
        ${av ? `<p><b>Avanços</b></p><ul>${av}</ul>` : ''}
        <p><b>Equipamento:</b> ${pj.equipamento.length ? pj.equipamento.map(esc).join(' · ') : ''}${pj.ouro ? (pj.equipamento.length ? ' · ' : '') + pj.ouro + ' po' : ''}</p>
      </div>`;
  }

  function linhaFunil(pj, k) {
    const voc = vocacao(pj.classe);
    return `<div class="fj-g-cartao fj-g-pequeno">
      <p><b>${esc(pj.nome)}</b>, ${esc(pj.anc.nome)} ${esc(pj.classe.nome)} (${esc(pj.antecedente[0])}, ${esc(pj.tendencia)})</p>
      <p>${linhaAtributos(pj)} · <b>PV</b> ${pj.pv} · <b>CA</b> ${pj.ca} · <b>Sanidade</b> ${pj.sanidade}</p>
      <p>${voc ? `<b>Vocação, ${esc(voc[0])}:</b> ${md(voc[1])} ` : ''}${pj.extras.map((e) => `<b>${esc(e.titulo)}:</b> ${e.itens.join(', ')}. `).join('')}<b>Equipamento:</b> ${pj.equipamento.map(esc).join(', ')}</p>
      <div class="fj-g-acoes"><button type="button" data-vaga="${k}" data-acao="de-novo">🎲 Gerar de novo</button><button type="button" data-vaga="${k}" data-acao="editar">Editar no Montar</button></div>
    </div>`;
  }

  // ---------------------------------------------------------------- impressão

  const CSS_IMPRESSAO = `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "EB Garamond", Georgia, serif; color: #000; font-size: 10pt; line-height: 1.25; margin: 0; }
    h1 { font-family: "IM Fell English SC", Georgia, serif; font-size: 20pt; margin: 0 0 1mm; }
    h2 { font-family: "IM Fell English SC", Georgia, serif; font-size: 12pt; margin: 3mm 0 1mm; border-bottom: 1.5px solid #000; }
    p { margin: 0 0 1.2mm; }
    .sub { font-style: italic; margin-bottom: 2mm; }
    .linha { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; margin: 2mm 0; }
    .caixa { border: 2px solid #000; text-align: center; padding: 1mm; }
    .caixa b { display: block; font-family: "IM Fell English SC", Georgia, serif; font-size: 8pt; }
    .caixa span { font-size: 15pt; }
    .caixa small { display: block; }
    table { width: 100%; border-collapse: collapse; margin-top: 1mm; }
    th { border-bottom: 2px solid #000; color: #000; text-align: left; font-family: "IM Fell English SC", Georgia, serif; font-weight: normal; padding: 0.8mm 1.5mm; font-size: 8.5pt; }
    td { border-bottom: 1px solid #000; padding: 1mm 1.5mm; vertical-align: top; font-size: 9pt; }
    td:first-child { width: 22%; } td:nth-child(2) { width: 7%; text-align: center; }
    .notas { border: 1.5px solid #000; height: 35mm; }
    .funil { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .pj { border: 2px solid #000; padding: 2.5mm; break-inside: avoid; min-height: 125mm; }
    .pj h2 { margin-top: 0; }
    .pj .linha { grid-template-columns: repeat(3, 1fr); }
    .vazio { border-bottom: 1px solid #000; height: 6mm; }
  `;

  function imprimir(corpo, titulo) {
    const w = window.open('', '_blank');
    if (!w) { alert('Libere as janelas pop-up deste site para imprimir.'); return; }
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=IM+Fell+English+SC&display=swap" rel="stylesheet">
      <style>${CSS_IMPRESSAO}</style></head><body>${corpo}</body></html>`);
    w.document.close();
    w.addEventListener('load', () => setTimeout(() => w.print(), 400));
  }

  function folhaPersonagem(pj) {
    const c = pj.classe;
    const voc = vocacao(c);
    const caixas = ATR.map((a, i) => `<div class="caixa"><b>${a}</b><span>${pj.atr[i]}</span><small>${sinal(mod(pj.atr[i]))}</small></div>`).join('');
    const nums = [['PV', pj.pv], ['CA', pj.ca], ['Sanidade', pj.sanidade]]
      .concat(pj.nivel >= 1 ? [['Mana', pj.mana], ['CD', pj.cd], ['Mana extra', pj.nivel]] : [['Movimento', pj.movimento + ' casas'], ['Dado de vida', 'd' + c.base], ['Nível', 0]])
      .map(([t, v]) => `<div class="caixa"><b>${t}</b><span>${v}</span></div>`).join('');
    const habs = pj.habilidades.map((h) => { const t = textoHabilidade(pj, h); return `<tr><td>${t.nome}</td><td>${esc(t.custo)}</td><td>${t.efeito}</td></tr>`; }).join('');
    const regras = c.regras.filter(([t]) => !t.startsWith('Vocação')).map(([t, x]) => `<p><b>${esc(t)}.</b> ${md(x)}</p>`).join('');
    const tracos = pj.anc.tracos.map(([t, x]) => `<p><b>${esc(t)}.</b> ${md(x)}</p>`).join('');
    const av = pj.avancos.map((a) => `<p><b>Nível ${a.nivel}${a.motivo ? ' (' + a.motivo + ')' : ''}:</b> ${a.itens.map(esc).join(' · ')}</p>`).join('');
    const ben = bencaos(pj);
    return `
      <h1>${esc(pj.nome)}</h1>
      <p class="sub">${esc(pj.anc.nome)} · ${esc(c.nome)} de nível ${pj.nivel}${pj.titulo ? ' · ' + esc(pj.titulo) : ''} · Forja RPG</p>
      <p><b>Antecedente:</b> ${esc(pj.antecedente[0])} (vantagem para ${esc(pj.antecedente[1])}) · <b>Tendência:</b> ${esc(pj.tendencia)}${pj.nivel >= 1 ? ' · <b>Atributo principal:</b> ' + esc(pj.principal) : ''} · <b>Movimento:</b> ${pj.movimento} casas · <b>Dado de vida:</b> d${c.base}</p>
      <div class="linha">${caixas}</div>
      <div class="linha">${nums}</div>
      ${voc ? `<p><b>Vocação, ${esc(voc[0])}.</b> ${md(voc[1])}</p>` : ''}
      ${pj.nivel >= 1 && regras ? `<h2>Regras da classe</h2>${regras}` : ''}
      ${pj.extras.map((e) => `<h2>${esc(e.titulo)}</h2>${e.itens.map((i) => '<p>' + i + '</p>').join('')}`).join('')}
      <h2>Traços de ${esc(pj.anc.nome)}</h2>${tracos}
      ${pj.divindade ? `<h2>Divindade</h2><p><b>${esc(pj.divindade.nome)}</b> (${esc(pj.divindade.entidade)}, ${esc(pj.divindade.dominio)}, ${esc(pj.divindade.vinculo)}). <b>Responsabilidades:</b> ${esc(pj.divindade.responsabilidades)}</p>${ben.length ? `<p><b>Bênçãos:</b> ${ben.map(esc).join(' ')}</p>` : ''}` : ''}
      ${habs ? `<h2>Habilidades</h2><table><thead><tr><th>Habilidade</th><th>Custo</th><th>Efeito</th></tr></thead><tbody>${habs}</tbody></table>` : ''}
      ${av ? `<h2>Avanços</h2>${av}` : ''}
      <h2>Equipamento</h2><p>${pj.equipamento.map(esc).join(' · ')}${pj.ouro ? (pj.equipamento.length ? ' · ' : '') + pj.ouro + ' po' : ''}</p>
      <h2>Notas</h2><div class="notas"></div>`;
  }

  function folhaFunil(lista) {
    return `<h1>Ficha de Funil</h1><p class="sub">Forja RPG · nível 0: sem Mana nem habilidades, só a vocação da classe. Com 0 PV, o personagem morre.</p>
      <div class="funil">${lista.map((pj) => {
        const voc = vocacao(pj.classe);
        return `<div class="pj">
          <h2>${esc(pj.nome)}</h2>
          <p>${esc(pj.anc.nome)} · ${esc(pj.classe.nome)} (d${pj.classe.base}) · ${esc(pj.antecedente[0])} · ${esc(pj.tendencia)}</p>
          <div class="linha">${ATR.map((a, i) => `<div class="caixa"><b>${ABR[i]}</b><span>${pj.atr[i]}</span><small>${sinal(mod(pj.atr[i]))}</small></div>`).join('')}</div>
          <div class="linha"><div class="caixa"><b>PV</b><span>${pj.pv}</span></div><div class="caixa"><b>CA</b><span>${pj.ca}</span></div><div class="caixa"><b>Sanidade</b><span>${pj.sanidade}</span></div></div>
          ${voc ? `<p><b>Vocação, ${esc(voc[0])}.</b> ${md(voc[1])}</p>` : ''}
          ${pj.extras.map((e) => `<p><b>${esc(e.titulo)}:</b> ${e.itens.join(', ')}.</p>`).join('')}
          <p><b>Equipamento:</b> ${pj.equipamento.map(esc).join(', ')}</p>
          <p>☐ Morreu &nbsp; ☐ Sobreviveu</p>
        </div>`;
      }).join('')}</div>`;
  }

  // ---------------------------------------------------------------- início

  raiz.innerHTML = '<p><em>Carregando o gerador…</em></p>';
  fetch(new URL('../assets/data/gerador.json', location.href))
    .then((r) => r.json())
    .then((dados) => { D = dados; montarTela(); })
    .catch(() => { raiz.innerHTML = '<p>Não foi possível carregar os dados do gerador.</p>'; });
})();
