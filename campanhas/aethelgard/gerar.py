"""Gera em PDF o material do Mestre de Aethelgard (frente e verso, A4).

Usa o mesmo visual dos encontros do evento da APR. Cada linha
"<!-- pagina -->" começa uma página nova.

Cada "###" vira um cartão com borda. A linha de material do encontro
(miniaturas e terreno) leva "{: .material }" logo abaixo e sai em destaque.

    python campanhas/aethelgard/gerar.py
"""
import html
import importlib.util
import pathlib
import re
import shutil

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
BUILD = AQUI / 'build'
SAIDA = AQUI / 'pdf'

_spec = importlib.util.spec_from_file_location('evento', RAIZ / 'campanhas' / 'evento-apr' / 'gerar.py')
ev = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ev)

DOCUMENTOS = [
    ('viagem-torre-vermelha-mestre.md', 'viagem-torre-vermelha'),
    ('mae-dos-morros-mestre.md', 'mae-dos-morros'),
    ('mina-da-treva-mestre.md', 'mina-da-treva'),
    ('torre-vermelha-mestre.md', 'torre-vermelha'),
]

CSS = ev.CSS_EN + """
.en-colunas .cartao { break-inside: avoid; border: 1.3px solid #111; border-radius: 2mm; padding: 1.2mm 2.4mm .4mm;
  margin: 0 0 2mm; }
.en-colunas .cartao h3 { margin: 0 0 .8mm; font-size: 12pt; border-bottom: 1px solid #111; }
.en-colunas .material { background: #e4e4e4; border-left: 3px solid #111; padding: .7mm 2mm; margin: 0 0 1.2mm;
  font-size: 9.6pt; line-height: 1.25; }
.en-colunas .material strong { font-family: "IM Fell English SC", serif; font-weight: normal; font-size: 10.4pt; }
.grade .en-colunas { column-count: auto; display: grid; grid-template-columns: 1fr 1fr;
  grid-template-rows: auto repeat(3, minmax(min-content, 1fr)); gap: 2.5mm 4mm; }
.grade .en-colunas h2 { grid-column: 1 / -1; margin: 0; }
.grade .en-colunas { font-size: 11.4pt; line-height: 1.25; }
.grade .en-colunas .material { font-size: 10.6pt; }
.grade .en-colunas .cartao h3 { font-size: 13pt; }
.grade .en-colunas .cartao { margin: 0; }
.meio .en-colunas { column-count: 1; font-size: 13.2pt; line-height: 1.36; }
.meio .en-colunas p { margin-bottom: 2.2mm; }
.meio .en-colunas h2 { font-size: 14pt; }
.folga .en-colunas h2.condicoes { break-before: column; margin-top: 0; }
.folga .en-colunas h2.condicoes ~ p { font-size: 11.3pt; line-height: 1.3; margin-bottom: 2.2mm; }
.unica .en-colunas { font-size: 9.6pt; line-height: 1.2; column-gap: 4.5mm; }
.unica .en-colunas p { margin-bottom: 1mm; break-inside: avoid; }
.unica .en-colunas h2 { font-size: 11.5pt; margin: 1.2mm 0 .8mm; }
.unica .en-colunas.abertura { flex: none; column-fill: balance; margin-bottom: 1.5mm; }
.unica .en-colunas.cenas, .unica .en-colunas.cartoes { font-size: 9.4pt; column-count: auto; display: flex;
  flex-direction: column; }
.unica .en-colunas.cenas h2, .unica .en-colunas.cartoes h2 { margin-top: 0; }
.unica .en-colunas.cartoes:not(:last-child) { flex: none; margin-bottom: 1.5mm; }
.unica .en-colunas.colunas { column-fill: auto; }
.larga .en-colunas, .larga .en-colunas.cartoes { font-size: 10.4pt; line-height: 1.22; }
.larga .en-colunas .cartao h3 { font-size: 12pt; }
.larga .en-colunas table { font-size: 10.2pt; }
.unica .en-colunas.tabela { flex: none; column-count: 1; margin-top: 1.5mm; }
.unica .en-colunas.tabela table { font-size: 9.4pt; }
.unica .trio { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 4mm; }
.unica .trio > div { display: flex; flex-direction: column; }
.unica .trio > div > .cartao:last-child { flex: 1; margin-bottom: 0; }
.unica .en-colunas .cartao { padding: 1mm 2mm .2mm; margin-bottom: 1.6mm; }
.unica .en-colunas .cartao h3 { font-size: 11pt; }
.unica .en-colunas .material { font-size: 9pt; padding: .6mm 1.6mm; margin-bottom: 1mm; }
.unica .en-colunas .material strong { font-size: 9.6pt; }
.en-colunas h2.registro + table td { height: 27mm; vertical-align: top; border: 1px solid #111; }
.en-colunas h2.registro + table td:first-child { width: 8mm; text-align: center; vertical-align: middle; }
.en-colunas h2.registro + table td:nth-child(2) { width: 24mm; }
.en-colunas h2.registro + table tr:nth-child(even) td { background: none; }
"""


def cartoes(corpo_html):
    """Põe cada <h3> e o que vem até o próximo título num <div class="cartao">."""
    partes = re.split(r'(?=<h[23][ >])', corpo_html)
    return ''.join(f'<div class="cartao">{p}</div>' if p.startswith('<h3') else p for p in partes)


def trio(corpo_html, equilibrar=False):
    """Cartões em três colunas, em ordem de leitura (a primeira coluna pega os primeiros cartões).

    Sem equilibrar, cada coluna leva o mesmo número de cartões (1 e 2, 3 e 4, 5 e 6).
    Equilibrando, os cortes caem onde as três colunas ficam com tamanhos mais parecidos.
    """
    partes = re.split(r'(?=<h[23][ >])', corpo_html)
    cabeca = ''.join(p for p in partes if not p.startswith('<h3'))
    cards = [p for p in partes if p.startswith('<h3')]
    n = len(cards)
    if equilibrar and n > 3:
        peso = [len(re.sub(r'<[^>]+>', '', c)) + 120 for c in cards]  # 120: título e borda de cada cartão
        cortes = min(((i, j) for i in range(1, n - 1) for j in range(i + 1, n)),
                     key=lambda c: max(sum(peso[:c[0]]), sum(peso[c[0]:c[1]]), sum(peso[c[1]:])))
        limites = [0, *cortes, n]
    else:
        por = -(-n // 3)
        limites = list(range(0, n, por)) + [n]
    grupos = [''.join(f'<div class="cartao">{c}</div>' for c in cards[a:b]) for a, b in zip(limites, limites[1:])]
    return cabeca + '<div class="trio">' + ''.join(f'<div>{g}</div>' for g in grupos) + '</div>'


def pagina(arquivo):
    texto = (AQUI / arquivo).read_text(encoding='utf-8')
    titulo, _, corpo = texto.partition('\n')
    titulo = titulo.lstrip('# ').strip()

    def folha(conteudo, lado, cls):
        # "<!-- secao: classe -->" divide a página em blocos empilhados, cada um com as suas colunas
        # (ex.: página "unica", com a abertura em duas colunas e os cartões das cenas em três).
        trechos = re.split(r'<!-- secao(?:: ([\w-]+))? -->', conteudo)
        blocos = [(trechos[0], 'abertura' if len(trechos) > 1 else '')]
        blocos += [(trechos[i + 1], trechos[i] or '') for i in range(1, len(trechos), 2)]
        def montar(t, c):
            if c == 'cenas':
                return trio(ev.md(t))
            if c == 'cartoes':
                return trio(ev.md(t), equilibrar=True)
            return cartoes(ev.md(t))

        colunas = ''.join(f'<div class="en-colunas {c}">{montar(t, c)}</div>' for t, c in blocos if t.strip())
        return (
            f'<section class="fh-folha {cls}"><header class="en-topo"><div>{ev.gf.LOGO}<h1>{html.escape(titulo)}</h1></div>'
            f'<div class="en-lado">Material do Mestre · Aethelgard<br>{lado}</div></header>'
            f'{colunas}</section>'
        )

    # "<!-- pagina -->" começa uma página nova; "<!-- pagina: classe -->" muda o estilo dela
    # (en-verso: uma coluna, letra grande; meio: uma coluna, letra média; grade: cartões 2 × 3).
    # Logo abaixo do título, o marcador muda o estilo da primeira página.
    pedacos = re.split(r'<!-- pagina(?:: ([\w -]+?))? -->', corpo)
    paginas = [(pedacos[0], '')] + [(pedacos[i + 1], pedacos[i] or '') for i in range(1, len(pedacos), 2)]
    paginas = [(c, cls) for c, cls in paginas if c.strip()]
    corpo_html = ''.join(folha(c, f'Página {n} de {len(paginas)}' if len(paginas) > 1 else 'Folha única', cls)
                         for n, (c, cls) in enumerate(paginas, 1))
    return ev.documento(corpo_html, titulo, CSS, ev.MEDIDA_EN)


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    SAIDA.mkdir(parents=True, exist_ok=True)
    chrome = ev.gf.achar_chrome()
    for arquivo, nome in DOCUMENTOS:
        if not (AQUI / arquivo).exists():
            continue
        html_path = BUILD / f'{nome}.html'
        html_path.write_text(pagina(arquivo), encoding='utf-8')
        # Imprime no build e só depois copia: o Chrome não avisa quando não consegue gravar
        # (por exemplo, com o PDF aberto num leitor), e o arquivo velho ficaria no lugar.
        temp = BUILD / f'{nome}.pdf'
        temp.unlink(missing_ok=True)
        ev.gf.imprimir(chrome, html_path, temp)
        pdf = SAIDA / f'{nome}.pdf'
        if not temp.exists():
            print(f'ERRO: o Chrome não gerou {temp.name}')
        else:
            try:
                shutil.copyfile(temp, pdf)
                print(pdf.relative_to(RAIZ))
            except PermissionError:
                print(f'ERRO: {pdf.name} está aberto em outro programa. Feche e rode de novo.')
        ev.conferir(chrome, html_path)


if __name__ == '__main__':
    main()
