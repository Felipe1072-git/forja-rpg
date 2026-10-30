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

  function caDaArmadura(a, des) {
    const m = a.ca.match(/(\d+)(\s*\+\s*Des)?/);
    return parseInt(m[1], 10) + (m[2] ? des : 0);
  }

  // ---------------------------------------------------------------- geração

  function novoPersonagem(op) {
    const classes = D.classes.filter((c) => op.exoticas || !c.exotica);
    const classe = op.classe != null ? D.classes[op.classe] : um(classes);
    const anc = op.ancestralidade != null ? D.ancestralidades[op.ancestralidade] : sortearAncestralidade();
    const nivel = op.nivel;
    const pj = { nivel, classe, anc, avancos: [], treinos: 0 };

    // atributos e atributo principal
    pj.principal = op.principal || um(classe.atributos);
    if (op.atributos) {
      pj.atr = op.atributos.slice();
      if (!op.principal) {
        pj.principal = classe.atributos.slice().sort((a, b) => pj.atr[ATR.indexOf(b)] - pj.atr[ATR.indexOf(a)])[0];
      }
    } else if (nivel === 0) {
      pj.atr = ATR.map(rolar4d6);
    } else {
      const valores = ATR.map(rolar4d6).sort((a, b) => b - a);
      pj.atr = new Array(6);
      const ip = ATR.indexOf(pj.principal);
      pj.atr[ip] = valores.shift();
      if (ip !== 2) pj.atr[2] = valores.shift();
      embaralhar(valores).forEach((v) => { const i = pj.atr.findIndex((x) => x === undefined); pj.atr[i] = v; });
    }

    pj.nome = op.nome || um(D.nomes[anc.nome] || D.nomes.Humano);
    pj.antecedente = op.antecedente != null ? D.antecedentes[op.antecedente] : um(D.antecedentes);
    const eixoBem = op.bem != null ? op.bem : Math.floor((d(6) - 1) / 2);
    const eixoOrdem = op.ordem != null ? op.ordem : Math.floor((d(6) - 1) / 2);
    pj.tendencia = tendencia(eixoBem, eixoOrdem);
    const tit = D.titulos[classe.nome];
    pj.titulo = op.titulo || (tit ? um(tit)[eixoOrdem] : '');

    // movimento
    const mov = traco(anc, 'Movimento');
    pj.movimento = mov ? parseInt(mov[1], 10) : 6;

    // divindade
    pj.divindade = null;
    if (nivel >= 1) {
      let escolha = op.divindade || 'auto';
      if (escolha === 'auto') escolha = exigeDivindade(classe) ? 'sortear' : 'nenhuma';
      if (escolha === 'sortear') {
        const demoniacas = D.divindades.filter((x) => /Demônio|Diabo/.test(x.entidade));
        pj.divindade = classe.nome === 'Cavaleiro Profano' && demoniacas.length ? um(demoniacas) : um(D.divindades);
      } else if (escolha !== 'nenhuma') {
        pj.divindade = D.divindades[parseInt(escolha, 10)];
      }
    }

    // habilidades iniciais
    pj.habilidades = [];
    pj.elemento = temColunas(classe) ? d(4) - 1 : 0;
    if (nivel >= 1) {
      const n = BASES[classe.base].iniciais;
      const escolhidas = (op.habilidades || []).slice(0, n);
      const resto = embaralhar(classe.habilidades.map((_, i) => ({ i, col: pj.elemento })))
        .filter((h) => !escolhidas.some((e) => e.i === h.i));
      escolhidas.concat(resto).slice(0, n).forEach((h) => adicionarHabilidade(pj, h.i, h.col != null ? h.col : pj.elemento));
    }

    // PV
    const robusto = !!traco(anc, 'Robusto');
    const dadoVida = () => { let r = d(classe.base); if (robusto) r = Math.max(r, d(classe.base)); return r; };
    pj.pv = Math.max(1, dadoVida() + mod(pj.atr[2])) + (robusto ? 1 : 0);
    for (let L = 2; L <= nivel; L++) {
      let r = dadoVida();
      if (r === 1) r = dadoVida();
      pj.pv += r + (robusto ? 1 : 0);
    }

    // avanços
    const vagas = vagasDeAvanco(classe, anc, nivel);
    if (op.avancosManuais) {
      let k = 0;
      vagas.forEach((v) => {
        const itens = [];
        const usados = [];
        for (let q = 0; q < v.qtd; q++) itens.push(aplicarEscolha(pj, op.avancosManuais[k++] || { tipo: 'sortear' }, usados));
        pj.avancos.push({ nivel: v.nivel, motivo: v.motivo, itens });
      });
    } else {
      vagas.forEach((v) => registrarAvancos(pj, v.nivel, v.qtd, op.sortear, v.motivo));
    }

    // tabelas da classe que se rolam na criação
    pj.extras = rolarExtras(pj);

    // equipamento
    equipar(pj, op.equipamento || 'pacote');
    calcular(pj);
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

  function registrarAvancos(pj, nivel, qtd, sortear, motivo) {
    const itens = [];
    const usados = [];
    for (let k = 0; k < qtd; k++) {
      if (!sortear) { itens.push('a escolher'); continue; }
      const op = opcoesDeAvanco(pj, usados);
      let total = op.reduce((s, [, p]) => s + p, 0);
      let r = Math.random() * total;
      let tipo = op[op.length - 1][0];
      for (const [t, p] of op) { if ((r -= p) < 0) { tipo = t; break; } }
      usados.push(tipo);
      itens.push(aplicarAvanco(pj, tipo));
    }
    pj.avancos.push({ nivel, motivo, itens });
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

  function equipar(pj, modo) {
    pj.equipamento = [];
    pj.armadura = null;
    pj.ouro = 0;
    if (pj.nivel === 0) {
      const n = d(4);
      for (let k = 0; k < n; k++) pj.equipamento.push(um(D.equipamentoNivel0));
      return;
    }
    if (modo === 'ouro') { pj.ouro = (d(6) + d(6)) * 5; return; }
    pj.equipamento.push(KIT);
    const arma = escolherArma(pj.classe, pj.principal);
    if (arma) {
      pj.arma = arma;
      pj.equipamento.push(arma.nome + ' (' + arma.dano + ', ' + arma.tipo.toLowerCase() + ')');
      if (/munição/.test(arma.propriedades)) pj.equipamento.push(/besta/i.test(arma.nome) ? 'Virotes (20)' : 'Flechas (20)');
    }
    const armaduras = armadurasPermitidas(pj.classe).filter((a) => a.custo <= 15 && a.categoria !== 'Escudo');
    if (armaduras.length && !traco(pj.anc, 'Blindagem integrada')) {
      pj.armadura = armaduras.sort((a, b) => caDaArmadura(b, 0) - caDaArmadura(a, 0))[0];
      pj.equipamento.push(pj.armadura.nome);
    }
  }

  function calcular(pj) {
    const m = pj.atr.map(mod);
    const ip = ATR.indexOf(pj.principal);
    const des = m[1];
    let ca = 10 + des;
    if (pj.armadura) ca = Math.max(ca, caDaArmadura(pj.armadura, des));
    if (traco(pj.anc, 'Blindagem integrada')) ca = Math.max(ca, 13 + des);
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

  function textoHabilidade(pj, h) {
    const c = pj.classe;
    const hab = c.habilidades[h.i];
    let custo = hab.custo;
    if (/^\d+$/.test(custo)) custo = String(parseInt(custo, 10) + h.melhorias.length);
    let efeito;
    if (temColunas(c)) {
      efeito = h.colunas.map((col) => '<b>' + c.colunas[col] + ':</b> ' + md(hab.partes[col])).join('<br>');
    } else {
      efeito = md(hab.partes[0]);
      h.melhorias.slice().sort().forEach((k) => { efeito += '<br>' + md(hab.partes[k + 1]); });
    }
    if (h.dados) efeito += '<br><b>+' + h.dados + ' dado' + (h.dados > 1 ? 's' : '') + '</b> (avanço).';
    return { nome: md(hab.nome), custo, efeito };
  }

  // ---------------------------------------------------------------- montar (charactermancer)
  // Tudo que o jogador escolhe fica no estado M. Os sorteios também são guardados em M,
  // para a ficha não mudar a cada clique. M é o que vai para o JSON.

  let M = null;

  function estadoNovo() {
    return {
      versao: 1, nome: '', nivel: 1, classe: null, anc: null, antecedente: null, bem: null, ordem: null,
      titulo: '', divindade: 'auto', atr: [10, 10, 10, 10, 10, 10], principal: null, pv: [],
      habilidades: [], elemento: null, avancos: {}, equipModo: 'pacote', equipamento: null, ouro: 0,
      extras: null, extrasChave: '',
    };
  }

  function chaveVaga(v, q) { return v.nivel + (v.motivo ? 'a' : '') + ':' + q; }

  function nomeMelhoria(c, i, k) {
    const m = c.habilidades[i].partes[k + 1] || '';
    return limpo((m.match(/\*\*(.+?):?\*\*/) || [, 'melhoria ' + (k + 1)])[1].replace(/:$/, ''));
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
    if (t === 'dado') {
      const h = um(pj.habilidades.filter((x) => temDados(c.habilidades[x.i].partes.join(' '))));
      return { tipo: 'dado', i: h.i };
    }
    if (t === 'atributos') {
      const ip = ATR.indexOf(pj.principal);
      if (pj.atr[ip] <= 18) return { tipo: 'atributos', a1: ip, a2: ip };
      const outros = embaralhar([0, 1, 2, 3, 4, 5].filter((i) => pj.atr[i] < 20));
      return { tipo: 'atributos', a1: outros[0], a2: outros[1] != null ? outros[1] : outros[0] };
    }
    return { tipo: t };
  }

  function preencherHabilidades(m, classe) {
    const n = BASES[classe.base].iniciais;
    const resto = embaralhar(classe.habilidades.map((_, i) => i)).filter((i) => !m.habilidades.some((h) => h.i === i));
    while (m.habilidades.length < n) m.habilidades.push({ i: resto.shift(), col: m.elemento || 0 });
  }

  // Constrói o personagem a partir do estado. Com sortearBrancos, preenche as vagas vazias.
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
    if (m.nivel >= 1) {
      const n = BASES[classe.base].iniciais;
      if (sortearBrancos) preencherHabilidades(m, classe);
      m.habilidades.slice(0, n).forEach((h) => adicionarHabilidade(pj, h.i, h.col || 0));
    }

    const robusto = !!traco(anc, 'Robusto');
    const dv = () => { let r = d(classe.base); if (robusto) r = Math.max(r, d(classe.base)); return r; };
    for (let L = 1; L <= Math.max(1, m.nivel); L++) if (m.pv[L - 1] == null) m.pv[L - 1] = dv();
    m.pv.length = Math.max(1, m.nivel);
    pj.pv = Math.max(1, m.pv[0] + mod(pj.atr[2])) + (robusto ? 1 : 0);
    for (let L = 2; L <= m.nivel; L++) pj.pv += m.pv[L - 1] + (robusto ? 1 : 0);

    vagasDeAvanco(classe, anc, m.nivel).forEach((v) => {
      const itens = [];
      const usados = [];
      for (let q = 0; q < v.qtd; q++) {
        const ch = chaveVaga(v, q);
        let e = m.avancos[ch];
        if ((!e || e.tipo === 'branco') && sortearBrancos) { e = escolhaAleatoria(pj, usados); m.avancos[ch] = e; }
        if (!e) e = { tipo: 'branco' };
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
    Object.keys(m.avancos).forEach((ch) => { if (parseInt(ch, 10) > m.nivel) delete m.avancos[ch]; });

    const chave = classe.nome + '|' + m.nivel + '|' + pj.habilidades.map((h) => h.i + '.' + h.melhorias.join('')).join(',');
    if (!m.extras || m.extrasChave !== chave) { m.extras = rolarExtras(pj); m.extrasChave = chave; }
    pj.extras = m.extras;

    if (m.equipamento == null) {
      equipar(pj, m.equipModo);
      m.equipamento = pj.equipamento.slice();
      m.ouro = pj.ouro;
    }
    pj.equipamento = m.equipamento.filter((x) => x.trim());
    pj.ouro = m.ouro;
    pj.armadura = D.armaduras.find((a) => a.categoria !== 'Escudo' && pj.equipamento.some((x) => x.toLowerCase().startsWith(a.nome.toLowerCase()))) || null;
    calcular(pj);
    return pj;
  }

  function iniciarMontar(painel) {
    M = estadoNovo();
    const $ = (sel) => painel.querySelector(sel);

    function opcoesDe(lista, sel, vazio) {
      return (vazio != null ? `<option value="">${vazio}</option>` : '')
        + lista.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`).join('');
    }

    function render() {
      const c = M.classe ? D.classes.find((x) => x.nome === M.classe) : null;
      const anc = M.anc ? D.ancestralidades.find((x) => x.nome === M.anc) : null;
      const eixos = ['Ordem', 'Neutro', 'Caos'];
      const tit = c ? (D.titulos[c.nome] || []) : [];
      const titulos = M.ordem == null ? [0, 1, 2].flatMap((col) => tit.map((l) => [l[col], eixos[col] + ': ' + l[col]])) : tit.map((l) => [l[M.ordem], l[M.ordem]]);
      painel.innerHTML = `
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
      const n = BASES[c.base].iniciais;
      const principal = c.atributos.length > 1
        ? `<label>Atributo principal <select data-m="principal">${opcoesDe(c.atributos.map((a) => [a, a]), M.principal, 'O maior')}</select></label>` : '';
      const robusto = traco(anc, 'Robusto') ? ' +1 (Robusto)' : '';
      const pvLinhas = Array.from({ length: Math.max(1, M.nivel) }, (_, k) => `<div class="fj-g-pv"><span>Nível ${M.nivel === 0 ? 0 : k + 1}</span>
        <input type="number" min="1" max="${c.base}" data-pv="${k}" value="${M.pv[k] != null ? M.pv[k] : ''}" placeholder="d${c.base}">
        <button type="button" data-acao="pv" data-k="${k}" title="Rolar d${c.base}">🎲</button>
        <small>${k === 0 ? 'd' + c.base + ' + mod. de Con' : 'd' + c.base}${robusto}</small></div>`).join('');
      const habs = c.habilidades.map((h, i) => {
        const marcada = M.habilidades.some((x) => x.i === i);
        const efeito = esc(limpo(h.partes[0]));
        const col = temColunas(c) ? ` <select data-col="${i}">${c.colunas.map((x, k) => `<option value="${k}"${(M.habilidades.find((y) => y.i === i) || {}).col === k ? ' selected' : ''}>${x}</option>`).join('')}</select>` : '';
        const mels = temColunas(c) ? '' : h.partes.slice(1).map((m, k) => !m ? '' : `<label title="${esc(limpo(m))}"><input type="checkbox" data-mel="${i}:${k}"${Object.values(M.avancos).some((e) => e.tipo === 'melhoria' && e.i === i && e.k === k) ? ' checked' : ''}> ${esc(nomeMelhoria(c, i, k))}</label>`).join('');
        return `<div class="fj-g-hab"><label title="${efeito}"><input type="checkbox" data-hab="${i}"${marcada ? ' checked' : ''}> ${md(h.nome)} <small>(${esc(h.custo)})</small></label>${col}${mels ? `<div class="fj-g-mels">${mels}</div>` : ''}</div>`;
      }).join('');
      const vagas = vagasDeAvanco(c, anc, M.nivel);
      const avs = vagas.map((v) => `<div class="fj-g-avnivel"><div class="fj-g-avcab">Nível ${v.nivel}${v.motivo ? ' (' + v.motivo + ')' : ''}
          <small>${v.qtd === 2 ? '2 avanços: a base d' + c.base + ' dá dois neste nível' : '1 avanço'}</small></div>
          ${Array.from({ length: v.qtd }, (_, q) => vagaHTML(c, chaveVaga(v, q))).join('')}</div>`).join('');
      const equip = (M.equipamento || []).join('\n');
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
        ${M.nivel >= 1 ? `<div class="fj-g-passo"><h3>4. Habilidades iniciais <small>(${M.habilidades.length} de ${n} escolhidas; passe o mouse para ler o efeito)</small></h3>
          <div class="fj-g-habs">${habs}</div>
          <div class="fj-g-acoes"><button type="button" data-acao="sortear-habs">Sortear as que faltam</button></div>
          <p><small>Marcar uma melhoria usa a primeira vaga de avanço em branco.</small></p>
        </div>` : ''}
        ${vagas.length ? `<div class="fj-g-passo"><h3>5. Avanços</h3>${avs}
          <div class="fj-g-acoes"><button type="button" data-acao="sortear-avancos">Sortear as vagas em branco</button></div>
        </div>` : ''}
        <div class="fj-g-passo"><h3>6. Equipamento</h3>
          <div class="fj-g-acoes"><button type="button" data-acao="pacote">Pacote inicial</button><button type="button" data-acao="ouro">Ouro (2d6 × 5 po)</button></div>
          <label class="fj-g-equip">Um item por linha<textarea data-m="equipamento" rows="5">${esc(equip)}</textarea></label>
          <label class="fj-g-equip">Peças de ouro <input type="number" min="0" data-m="ouro" value="${M.ouro || 0}"></label>
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

    function vagaHTML(c, ch) {
      const e = M.avancos[ch] || { tipo: 'branco' };
      const melhoria = temColunas(c) ? 'Outro elemento' : 'Melhoria';
      const tipos = [['branco', 'A escolher'], ['nova', 'Nova habilidade'], ['melhoria', melhoria], ['dado', '+1 dado'], ['atributos', 'Atributos'], ['vigor', 'Vigor'], ['treino', 'Treino']];
      const habs = c.habilidades.map((h, i) => [i, limpo(h.nome)]);
      const cols = c.colunas.map((x, k) => [k, x]);
      let alvo = '';
      if (e.tipo === 'nova' || e.tipo === 'dado' || (e.tipo === 'melhoria' && temColunas(c))) {
        alvo = `<select data-av="${ch}" data-campo="i">${opcoesDe(habs, e.i)}</select>`;
        if (temColunas(c) && e.tipo !== 'dado') alvo += `<select data-av="${ch}" data-campo="col">${opcoesDe(cols, e.col)}</select>`;
      } else if (e.tipo === 'melhoria') {
        const ops = c.habilidades.flatMap((h, i) => h.partes.slice(1).map((m, k) => m ? [i + ':' + k, limpo(h.nome) + ': ' + nomeMelhoria(c, i, k)] : null).filter(Boolean));
        alvo = `<select data-av="${ch}" data-campo="ik">${opcoesDe(ops, e.i + ':' + e.k)}</select>`;
      } else if (e.tipo === 'atributos') {
        const atrs = ATR.map((a, i) => [i, a]);
        alvo = `+1 <select data-av="${ch}" data-campo="a1">${opcoesDe(atrs, e.a1)}</select> +1 <select data-av="${ch}" data-campo="a2">${opcoesDe(atrs, e.a2)}</select>`;
      } else if (e.tipo === 'vigor') {
        alvo = `<input type="number" min="1" max="${c.base}" data-av="${ch}" data-campo="pv" value="${e.pv != null ? e.pv : ''}" placeholder="d${c.base}"><button type="button" data-acao="vigor" data-ch="${ch}" title="Rolar d${c.base}">🎲</button>`;
      } else if (e.tipo === 'treino') {
        alvo = `<input type="text" data-av="${ch}" data-campo="texto" value="${esc(e.texto || '')}" placeholder="Arma, armadura, escudo ou idioma">`;
      }
      return `<div class="fj-g-av"><select data-av="${ch}" data-campo="tipo">${opcoesDe(tipos, e.tipo)}</select>${alvo}</div>`;
    }

    function previa() {
      let pj;
      try { pj = personagemDoEstado(M, false); } catch (err) { $('.fj-g-previa').innerHTML = '<p>Não deu para montar a ficha.</p>'; return; }
      atual = pj;
      $('.fj-g-previa').innerHTML = cartao(pj);
      const nome = $('.fj-g-previa .fj-g-nome');
      nome.addEventListener('input', () => { M.nome = nome.value; atual.nome = nome.value; const campo = $('[data-m="nome"]'); if (campo) campo.value = nome.value; });
      $('.fj-g-previa .fj-g-novonome').addEventListener('click', () => { M.nome = um(D.nomes[M.anc] || D.nomes.Humano); render(); });
      // os valores sorteados agora aparecem nos campos
      ['antecedente', 'bem', 'ordem', 'titulo', 'divindade'].forEach((k) => { const el = $(`[data-m="${k}"]`); if (el && M[k] != null) el.value = M[k]; });
      painel.querySelectorAll('[data-pv]').forEach((el) => { const k = parseInt(el.dataset.pv, 10); if (M.pv[k] != null) el.value = M.pv[k]; });
      const eq = $('[data-m="equipamento"]');
      if (eq && document.activeElement !== eq) eq.value = (M.equipamento || []).join('\n');
      const ouro = $('[data-m="ouro"]');
      if (ouro) ouro.value = M.ouro || 0;
    }

    function ligar() {
      painel.querySelectorAll('[data-m]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.m;
        let v = el.value;
        if (['nivel', 'bem', 'ordem', 'ouro'].includes(k)) v = v === '' ? null : parseInt(v, 10);
        if (k === 'equipamento') { M.equipamento = el.value.split('\n'); previa(); return; }
        if (k === 'ouro') { M.ouro = v || 0; previa(); return; }
        if (v === '' && ['antecedente', 'titulo', 'classe', 'anc', 'principal'].includes(k)) v = k === 'titulo' ? '' : null;
        const estrutural = ['nivel', 'classe', 'anc', 'ordem'].includes(k);
        if (k === 'classe' && v !== M.classe) {
          Object.assign(M, { habilidades: [], avancos: {}, titulo: '', elemento: null, extras: null, principal: null, equipamento: null, divindade: 'auto' });
        }
        if (k === 'ordem') M.titulo = '';
        M[k] = v;
        if (estrutural) render(); else previa();
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
        const c = D.classes.find((x) => x.nome === M.classe);
        const i = parseInt(el.dataset.hab, 10);
        if (el.checked) {
          if (M.habilidades.length >= BASES[c.base].iniciais) { el.checked = false; return; }
          const sel = painel.querySelector(`[data-col="${i}"]`);
          M.habilidades.push({ i, col: sel ? parseInt(sel.value, 10) : 0 });
        } else {
          M.habilidades = M.habilidades.filter((h) => h.i !== i);
        }
        M.extras = null;
        render();
      }));
      painel.querySelectorAll('[data-col]').forEach((el) => el.addEventListener('change', () => {
        const h = M.habilidades.find((x) => x.i === parseInt(el.dataset.col, 10));
        if (h) { h.col = parseInt(el.value, 10); previa(); }
      }));
      painel.querySelectorAll('[data-mel]').forEach((el) => el.addEventListener('change', () => {
        const [i, k] = el.dataset.mel.split(':').map((x) => parseInt(x, 10));
        const c = D.classes.find((x) => x.nome === M.classe);
        const anc = D.ancestralidades.find((x) => x.nome === M.anc);
        const chaves = [];
        vagasDeAvanco(c, anc, M.nivel).forEach((v) => { for (let q = 0; q < v.qtd; q++) chaves.push(chaveVaga(v, q)); });
        if (el.checked) {
          const livre = chaves.find((ch) => !M.avancos[ch] || M.avancos[ch].tipo === 'branco');
          if (!livre) { el.checked = false; alert('Sem vaga de avanço em branco. Suba o nível ou libere uma vaga.'); return; }
          M.avancos[livre] = { tipo: 'melhoria', i, k };
          if (!M.habilidades.some((h) => h.i === i) && M.habilidades.length < BASES[c.base].iniciais) M.habilidades.push({ i, col: 0 });
        } else {
          const ch = chaves.find((x) => M.avancos[x] && M.avancos[x].tipo === 'melhoria' && M.avancos[x].i === i && M.avancos[x].k === k);
          if (ch) M.avancos[ch] = { tipo: 'branco' };
        }
        render();
      }));
      painel.querySelectorAll('[data-av]').forEach((el) => el.addEventListener('change', () => {
        const ch = el.dataset.av;
        const campo = el.dataset.campo;
        const e = M.avancos[ch] || { tipo: 'branco' };
        if (campo === 'tipo') {
          const novo = { tipo: el.value };
          if (['nova', 'dado', 'melhoria'].includes(el.value)) { novo.i = 0; novo.k = 0; novo.col = 0; }
          if (el.value === 'atributos') { const ip = ATR.indexOf(personagemDoEstado(JSON.parse(JSON.stringify(M)), false).principal); novo.a1 = ip; novo.a2 = ip; }
          M.avancos[ch] = novo;
          render();
          return;
        }
        if (campo === 'ik') { const [i, k] = el.value.split(':').map((x) => parseInt(x, 10)); e.i = i; e.k = k; }
        else if (campo === 'texto') e.texto = el.value;
        else e[campo] = el.value === '' ? null : parseInt(el.value, 10);
        M.avancos[ch] = e;
        if (campo === 'i' || campo === 'ik') render(); else previa();
      }));
      painel.querySelectorAll('[data-acao]').forEach((el) => {
        const acao = el.dataset.acao;
        if (acao === 'carregar') { el.addEventListener('change', () => carregar(el.files[0])); return; }
        el.addEventListener('click', () => {
          const c = M.classe ? D.classes.find((x) => x.nome === M.classe) : null;
          if (acao === 'nome') { M.nome = um(D.nomes[M.anc] || D.nomes.Humano); render(); }
          if (acao === 'subir' && M.nivel < 10) { M.nivel += 1; render(); }
          if (acao === 'rolar-atr') { M.atr = ATR.map(rolar4d6); render(); }
          if (acao === 'pv') { M.pv[parseInt(el.dataset.k, 10)] = d(c.base); render(); }
          if (acao === 'pv-todos') { for (let k = 0; k < Math.max(1, M.nivel); k++) if (M.pv[k] == null) M.pv[k] = d(c.base); render(); }
          if (acao === 'vigor') { M.avancos[el.dataset.ch].pv = d(c.base); render(); }
          if (acao === 'sortear-avancos') { personagemDoEstado(M, true); render(); }
          if (acao === 'sortear-habs') { preencherHabilidades(M, c); M.extras = null; render(); }
          if (acao === 'pacote' || acao === 'ouro') { M.equipModo = acao; M.equipamento = null; render(); }
          if (acao === 'imprimir') imprimir(folhaPersonagem(personagemDoEstado(M, false)), 'Ficha de ' + (M.nome || 'personagem'));
          if (acao === 'json') baixarJSON();
        });
      });
    }

    function baixarJSON() {
      const blob = new Blob([JSON.stringify(M, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (M.nome || 'personagem').replace(/[^\wÀ-ÿ -]/g, '') + '.forja.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }

    function carregar(arquivo) {
      if (!arquivo) return;
      const leitor = new FileReader();
      leitor.onload = () => {
        try {
          const dados = JSON.parse(leitor.result);
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
  }

  // ---------------------------------------------------------------- tela

  function montarTela() {
    const opClasses = D.classes.map((c, i) => `<option value="${i}">${esc(c.nome)}${c.exotica ? ' (exótica)' : ''}</option>`).join('');
    const opAnc = D.ancestralidades.map((a, i) => `<option value="${i}">${esc(a.nome)}</option>`).join('');
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
        </div>
        <div id="g-saida"></div>
      </div>
      <div class="fj-g-painel" data-painel="montar" hidden>
        <p>Monte passo a passo. A ficha embaixo atualiza a cada escolha. Baixe o JSON para guardar o personagem e carregue de novo para subir de nível.</p>
        <div id="g-montar"></div>
      </div>
      <div class="fj-g-painel" data-painel="funil" hidden>
        <p>Quatro personagens de nível 0, prontos para o Funil (veja Mestre).</p>
        <div class="fj-g-acoes">
          <button type="button" id="g-funil" class="fj-g-primario">Gerar 4 de nível 0</button>
          <button type="button" id="g-funil-imprimir" disabled>Imprimir ficha de Funil</button>
        </div>
        <div id="g-funil-saida"></div>
      </div>`;

    const $ = (id) => document.getElementById(id);
    raiz.querySelectorAll('.fj-g-abas button').forEach((b) => b.addEventListener('click', () => {
      raiz.querySelectorAll('.fj-g-abas button').forEach((x) => x.classList.toggle('ativa', x === b));
      raiz.querySelectorAll('.fj-g-painel').forEach((p) => { p.hidden = p.dataset.painel !== b.dataset.aba; });
    }));
    iniciarMontar($('g-montar'));

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
      $('g-imprimir').disabled = false;
      const nome = $('g-saida').querySelector('.fj-g-nome');
      nome.addEventListener('input', () => { atual.nome = nome.value; });
      $('g-saida').querySelector('.fj-g-novonome').addEventListener('click', () => {
        atual.nome = um(D.nomes[atual.anc.nome] || D.nomes.Humano);
        nome.value = atual.nome;
      });
    });
    $('g-imprimir').addEventListener('click', () => imprimir(folhaPersonagem(atual), 'Ficha de ' + atual.nome));

    $('g-funil').addEventListener('click', () => {
      const exo = $('g-exoticas').checked;
      funil = [0, 1, 2, 3].map(() => novoPersonagem({ nivel: 0, exoticas: exo, sortear: true }));
      $('g-funil-saida').innerHTML = funil.map(linhaFunil).join('');
      $('g-funil-imprimir').disabled = false;
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
        <p><b>Equipamento:</b> ${pj.equipamento.length ? pj.equipamento.map(esc).join(' · ') : ''}${pj.ouro ? pj.ouro + ' po para comprar o que quiser' : ''}</p>
      </div>`;
  }

  function linhaFunil(pj) {
    const voc = vocacao(pj.classe);
    return `<div class="fj-g-cartao fj-g-pequeno">
      <p><b>${esc(pj.nome)}</b>, ${esc(pj.anc.nome)} ${esc(pj.classe.nome)} (${esc(pj.antecedente[0])}, ${esc(pj.tendencia)})</p>
      <p>${linhaAtributos(pj)} · <b>PV</b> ${pj.pv} · <b>CA</b> ${pj.ca} · <b>Sanidade</b> ${pj.sanidade}</p>
      <p>${voc ? `<b>Vocação, ${esc(voc[0])}:</b> ${md(voc[1])} ` : ''}${pj.extras.map((e) => `<b>${esc(e.titulo)}:</b> ${e.itens.join(', ')}. `).join('')}<b>Equipamento:</b> ${pj.equipamento.map(esc).join(', ')}</p>
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
      <h2>Equipamento</h2><p>${pj.equipamento.map(esc).join(' · ')}${pj.ouro ? pj.ouro + ' po para comprar o que quiser' : ''}</p>
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
