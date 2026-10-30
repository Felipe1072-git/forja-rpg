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
    pj.titulo = tit ? um(tit)[eixoOrdem] : '';

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
    if (nivel >= 1 && traco(anc, 'Ambicioso')) registrarAvancos(pj, 1, 1, op.sortear, 'Ambicioso');
    for (let L = 2; L <= nivel; L++) {
      registrarAvancos(pj, L, BASES[classe.base].dois.includes(L) ? 2 : 1, op.sortear);
    }

    // equipamento
    equipar(pj, op.equipamento || 'pacote');
    calcular(pj);
    return pj;
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

  // ---------------------------------------------------------------- tela

  function montarTela() {
    const opClasses = D.classes.map((c, i) => `<option value="${i}" data-exotica="${c.exotica}">${esc(c.nome)}${c.exotica ? ' (exótica)' : ''}</option>`).join('');
    const opAnc = D.ancestralidades.map((a, i) => `<option value="${i}">${esc(a.nome)}</option>`).join('');
    const opAnt = D.antecedentes.map((a, i) => `<option value="${i}">${esc(a[0])}</option>`).join('');
    const opDiv = D.divindades.map((x, i) => `<option value="${i}">${esc(x.nome)}</option>`).join('');
    const opNivel = Array.from({ length: 11 }, (_, i) => `<option value="${i}"${i === 1 ? ' selected' : ''}>${i}</option>`).join('');
    raiz.innerHTML = `
      <div class="fj-g-abas">
        <button type="button" data-aba="aleatorio" class="ativa">Aleatório</button>
        <button type="button" data-aba="montar">Montar</button>
        <button type="button" data-aba="funil">Funil (4 de nível 0)</button>
      </div>
      <div class="fj-g-painel" data-painel="aleatorio montar">
        <div class="fj-g-grade">
          <label>Nível <select id="g-nivel">${opNivel}</select></label>
          <label>Classe <select id="g-classe"><option value="">Aleatória</option>${opClasses}</select></label>
          <label>Ancestralidade <select id="g-anc"><option value="">Aleatória</option>${opAnc}</select></label>
          <label class="so-montar">Antecedente <select id="g-ant"><option value="">Aleatório</option>${opAnt}</select></label>
          <label class="so-montar">Bem x Mal <select id="g-bem"><option value="">Aleatório</option><option value="0">Bem</option><option value="1">Neutro</option><option value="2">Mal</option></select></label>
          <label class="so-montar">Ordem x Caos <select id="g-ordem"><option value="">Aleatório</option><option value="0">Ordem</option><option value="1">Neutro</option><option value="2">Caos</option></select></label>
          <label>Divindade <select id="g-div"><option value="auto">Só se a classe exigir</option><option value="sortear">Sortear</option><option value="nenhuma">Nenhuma</option>${opDiv}</select></label>
          <label>Equipamento <select id="g-equip"><option value="pacote">Pacote inicial</option><option value="ouro">Ouro (2d6 × 5 po)</option></select></label>
          <label>Avanços <select id="g-avancos"><option value="sortear">Sortear</option><option value="escolher">Deixar para escolher</option></select></label>
          <label class="so-montar">Nome <input id="g-nome" type="text" placeholder="Aleatório"></label>
          <label class="fj-g-check"><input id="g-exoticas" type="checkbox"> Incluir classes exóticas no sorteio</label>
        </div>
        <div class="so-montar fj-g-bloco">
          <div class="fj-g-titulo">Atributos <button type="button" id="g-rolar">Rolar 4d6 seis vezes</button></div>
          <div class="fj-g-atr">${ATR.map((a, i) => `<label>${a}<input type="number" min="3" max="20" id="g-atr-${i}" value="10"></label>`).join('')}</div>
          <div class="fj-g-titulo">Habilidades iniciais <span id="g-hab-limite"></span></div>
          <div id="g-habs" class="fj-g-habs"><em>Escolha uma classe.</em></div>
        </div>
        <div class="fj-g-acoes">
          <button type="button" id="g-gerar" class="fj-g-primario">Gerar personagem</button>
          <button type="button" id="g-imprimir" disabled>Imprimir ficha</button>
        </div>
        <div id="g-saida"></div>
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
    let aba = 'aleatorio';
    raiz.querySelectorAll('.fj-g-abas button').forEach((b) => b.addEventListener('click', () => {
      aba = b.dataset.aba;
      raiz.querySelectorAll('.fj-g-abas button').forEach((x) => x.classList.toggle('ativa', x === b));
      raiz.querySelectorAll('.fj-g-painel').forEach((p) => { p.hidden = !p.dataset.painel.split(' ').includes(aba); });
      raiz.classList.toggle('montando', aba === 'montar');
      $('g-gerar').textContent = aba === 'montar' ? 'Montar personagem' : 'Gerar personagem';
    }));

    $('g-rolar').addEventListener('click', () => ATR.forEach((_, i) => { $('g-atr-' + i).value = rolar4d6(); }));
    $('g-classe').addEventListener('change', listarHabilidades);
    $('g-nivel').addEventListener('change', listarHabilidades);

    function listarHabilidades() {
      const ic = $('g-classe').value;
      const caixa = $('g-habs');
      if (ic === '') { caixa.innerHTML = '<em>Escolha uma classe.</em>'; $('g-hab-limite').textContent = ''; return; }
      const c = D.classes[parseInt(ic, 10)];
      const n = BASES[c.base].iniciais;
      $('g-hab-limite').textContent = '(escolha ' + n + '; em branco, sorteia)';
      caixa.innerHTML = c.habilidades.map((h, i) => `<label class="fj-g-hab"><input type="checkbox" value="${i}"> ${md(h.nome)} <small>(${esc(h.custo)})</small>`
        + (temColunas(c) ? ` <select data-col="${i}">${c.colunas.map((x, k) => `<option value="${k}">${x}</option>`).join('')}</select>` : '') + '</label>').join('');
      caixa.querySelectorAll('input').forEach((inp) => inp.addEventListener('change', () => {
        const marcadas = caixa.querySelectorAll('input:checked');
        if (marcadas.length > n) inp.checked = false;
      }));
    }

    function opcoes() {
      const v = (id) => $(id).value;
      const op = {
        nivel: parseInt(v('g-nivel'), 10),
        classe: v('g-classe') === '' ? null : parseInt(v('g-classe'), 10),
        ancestralidade: v('g-anc') === '' ? null : parseInt(v('g-anc'), 10),
        divindade: v('g-div'), equipamento: v('g-equip'), sortear: v('g-avancos') === 'sortear',
        exoticas: $('g-exoticas').checked,
      };
      if (aba === 'montar') {
        if (v('g-ant') !== '') op.antecedente = parseInt(v('g-ant'), 10);
        if (v('g-bem') !== '') op.bem = parseInt(v('g-bem'), 10);
        if (v('g-ordem') !== '') op.ordem = parseInt(v('g-ordem'), 10);
        if (v('g-nome').trim()) op.nome = v('g-nome').trim();
        op.atributos = ATR.map((_, i) => Math.max(3, Math.min(20, parseInt($('g-atr-' + i).value, 10) || 10)));
        op.habilidades = Array.from($('g-habs').querySelectorAll('input:checked')).map((inp) => {
          const sel = $('g-habs').querySelector(`select[data-col="${inp.value}"]`);
          return { i: parseInt(inp.value, 10), col: sel ? parseInt(sel.value, 10) : 0 };
        });
      }
      return op;
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
      <p>${voc ? `<b>Vocação, ${esc(voc[0])}:</b> ${md(voc[1])} ` : ''}<b>Equipamento:</b> ${pj.equipamento.map(esc).join(', ')}</p>
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
    th { background: #000; color: #fff; text-align: left; font-family: "IM Fell English SC", Georgia, serif; font-weight: normal; padding: 0.8mm 1.5mm; font-size: 8.5pt; }
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
