"""Dados do Gerador de Personagens.

No fim do build, lê as páginas do livro (classes, ancestralidades,
antecedentes, títulos, equipamento e divindades) e grava um JSON que a
página Gerador usa no navegador. Assim o gerador acompanha o livro sem
precisar copiar nenhuma regra (nem os nomes, que saem das tabelas de
Ancestralidades).
"""
import json
import os
import re

_TRACO = re.compile(r'^\*\*(.+?)\.\*\*\s*(.+)$')
_FORA = {'Base', 'Atributo principal', 'Armas', 'Armaduras', 'Habilidades iniciais', 'Classe exótica'}


def _ler(docs, rel):
    with open(os.path.join(docs, rel), encoding='utf-8') as f:
        return f.read()


def _celulas(linha):
    return [c.strip() for c in linha.strip().strip('|').split(' | ')]


def _tabelas(texto):
    """Devolve as tabelas do texto como listas de linhas (a primeira é o cabeçalho)."""
    tabelas, atual = [], []
    for linha in texto.split('\n'):
        if linha.startswith('|'):
            if re.match(r'^\|[-|\s]+\|$', linha):
                continue
            atual.append(_celulas(linha))
        elif atual:
            tabelas.append(atual)
            atual = []
    if atual:
        tabelas.append(atual)
    return tabelas


def _paginas_de_classe(nav):
    for item in nav:
        if isinstance(item, dict) and 'Classes' in item:
            def achatar(lista):
                for x in lista:
                    if isinstance(x, dict):
                        for v in x.values():
                            if isinstance(v, list):
                                yield from achatar(v)
                            else:
                                yield v
            return [p for p in achatar(item['Classes']) if not p.endswith('index.md')]
    return []


def _classe(docs, rel, exoticas):
    texto = _ler(docs, rel)
    nome = re.search(r'^# (.+)$', texto, re.M).group(1).strip()
    epigrafe = re.search(r'\n\n(.+)\n\{ \.epigrafe \}', texto)
    intro = texto.split('\n## ')[0]
    base = int(re.search(r'\*\*Base\.\*\* d(\d+)', texto).group(1))
    attr = re.search(r'\*\*Atributo principal\.\*\* ([^.\n]+)', texto).group(1)
    armas = re.search(r'\*\*Armas\.\*\* (.+?)\n', texto).group(1).rstrip('.')
    armaduras = re.search(r'\*\*Armaduras\.\*\* (.+?)\n', texto).group(1).rstrip('.')
    regras = []
    for linha in intro.split('\n'):
        m = _TRACO.match(linha)
        if m and m.group(1) not in _FORA:
            regras.append([m.group(1), m.group(2)])
    habilidades, colunas, tabelas, titulos = [], [], {}, []
    for tab in _tabelas(texto):
        cab = tab[0]
        if cab == ['d6', 'Ordem', 'Neutro', 'Caos']:
            titulos = [l[1:4] for l in tab[1:]]
        elif re.match(r'^d\d+$', cab[0]) and cab[1] not in ('Habilidade', 'Magia'):
            tabelas[cab[1]] = [l[1:] for l in tab[1:]]
        if cab[0] == 'd20' and len(cab) >= 7 and cab[1] in ('Habilidade', 'Magia'):
            colunas = cab[3:]
            for linha in tab[1:]:
                if len(linha) < 7:
                    continue
                habilidades.append({'nome': linha[1], 'custo': linha[2], 'partes': linha[3:7]})
    return {
        'nome': nome, 'arquivo': rel, 'exotica': nome in exoticas,
        'epigrafe': epigrafe.group(1).strip() if epigrafe else '',
        'base': base, 'atributos': [a.strip() for a in attr.split(' ou ')],
        'armas': armas, 'armaduras': armaduras, 'regras': regras,
        'colunas': colunas, 'habilidades': habilidades, 'tabelas': tabelas, 'titulos': titulos,
    }


def _ancestralidades(docs):
    texto = _ler(docs, 'personagem/ancestralidades.md')
    rolagem = []
    for linha in _tabelas(texto)[0][1:]:
        faixa = [int(x) for x in re.findall(r'\d+', linha[0])]
        rolagem.append([faixa[0], faixa[-1], linha[1]])
    lista = []
    for bloco in texto.split('<div class="fj-card" markdown>')[1:]:
        nome = re.search(r'^## (.+)$', bloco, re.M).group(1).strip()
        epi = re.search(r'\n\n(.+)\n\{ \.epigrafe \}', bloco)
        tracos = [[m.group(1), m.group(2)] for m in (_TRACO.match(l) for l in bloco.split('</div>')[0].split('\n')) if m]
        lista.append({'nome': nome, 'epigrafe': epi.group(1).strip() if epi else '', 'tracos': tracos})
    return rolagem, lista


def _nomes(docs):
    """Nomes e alcunhas das tabelas do fim de Ancestralidades."""
    nomes, alcunhas = {}, []
    for tab in _tabelas(_ler(docs, 'personagem/ancestralidades.md')):
        cab = tab[0]
        if cab[0] == 'd20' and len(cab) > 1 and ': ' in cab[1]:
            for col, titulo in enumerate(cab[1:], 1):
                povo = titulo.split(':')[0]
                nomes.setdefault(povo, []).extend(l[col] for l in tab[1:] if len(l) > col)
        elif cab[:2] == ['d20', 'Alcunha']:
            for l in tab[1:]:
                alcunhas.extend(l[k] for k in range(1, len(l), 2))
    return nomes, alcunhas


def _detalhes(docs):
    texto = _ler(docs, 'personagem/detalhes.md')
    antecedentes = []
    for tab in _tabelas(texto):
        cab = tab[0]
        if cab[1] == 'Antecedente':
            antecedentes = [[l[1], l[2]] for l in tab[1:]]
    return antecedentes


def _equipamento(docs):
    texto = _ler(docs, 'equipamento.md')
    nivel0, armas, armaduras, basico = [], [], [], []
    for tab in _tabelas(texto):
        cab = tab[0]
        if cab[:2] == ['d12', 'Item']:
            nivel0 = [l[1] for l in tab[1:]]
        elif cab[0] == 'Arma':
            for l in tab[1:]:
                armas.append({'nome': l[0], 'categoria': l[1], 'custo': int(re.sub(r'\D', '', l[2]) or 0),
                              'dano': l[3], 'tipo': l[4], 'alcance': l[5], 'propriedades': l[6]})
        elif cab[0] == 'Armadura':
            for l in tab[1:]:
                armaduras.append({'nome': l[0], 'categoria': l[1], 'custo': int(re.sub(r'\D', '', l[2]) or 0),
                                  'ca': l[3], 'forca': l[4], 'propriedades': l[5]})
        elif cab == ['Item', 'Custo', 'Por espaço', 'Efeito']:
            for l in tab[1:]:
                basico.append({'nome': l[0], 'custo': int(re.sub(r'\D', '', l[1]) or 0), 'efeito': l[3]})
    return nivel0, armas, armaduras, basico


def _divindades(docs):
    texto = _ler(docs, 'divindades.md')
    exemplos = []
    for tab in _tabelas(texto):
        if tab[0][0] == 'Nome':
            for l in tab[1:]:
                exemplos.append({'nome': l[0].strip('*'), 'entidade': l[1], 'tendencia': l[2], 'dominio': l[3],
                                 'vinculo': l[4], 'responsabilidades': l[5], 'bencaos': l[6]})
    return exemplos


def on_post_build(config, **kwargs):
    docs = config['docs_dir']
    indice = _ler(docs, 'classes/index.md')
    exoticas = set()
    if '## CLASSES EXÓTICAS' in indice:
        for tab in _tabelas(indice.split('## CLASSES EXÓTICAS')[1])[:1]:
            exoticas = {l[0] for l in tab[1:]}
    classes = [_classe(docs, rel, exoticas) for rel in _paginas_de_classe(config['nav'])]
    rolagem, ancestralidades = _ancestralidades(docs)
    antecedentes = _detalhes(docs)
    titulos = {c['nome']: c['titulos'] for c in classes}
    nivel0, armas, armaduras, basico = _equipamento(docs)
    nomes, alcunhas = _nomes(docs)
    dados = {
        'classes': classes, 'ancestralidades': ancestralidades, 'rolagemAncestralidade': rolagem,
        'antecedentes': antecedentes, 'titulos': titulos, 'equipamentoNivel0': nivel0, 'equipamentoBasico': basico,
        'armas': armas, 'armaduras': armaduras, 'divindades': _divindades(docs), 'nomes': nomes, 'alcunhas': alcunhas,
    }
    destino = os.path.join(config['site_dir'], 'assets', 'data')
    os.makedirs(destino, exist_ok=True)
    with open(os.path.join(destino, 'gerador.json'), 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False)
