"""Gera em PDF o material do Mestre de Aethelgard (frente e verso, A4).

Usa o mesmo visual dos encontros do evento da APR. Tudo antes de
"## Criaturas" vai na frente; dali em diante, no verso.

    python campanhas/aethelgard/gerar.py
"""
import html
import importlib.util
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
BUILD = AQUI / 'build'
SAIDA = AQUI / 'pdf'

_spec = importlib.util.spec_from_file_location('evento', RAIZ / 'campanhas' / 'evento-apr' / 'gerar.py')
ev = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ev)

DOCUMENTOS = [('viagem-torre-vermelha-mestre.md', 'viagem-torre-vermelha')]


def pagina(arquivo):
    texto = (AQUI / arquivo).read_text(encoding='utf-8')
    titulo, _, corpo = texto.partition('\n')
    titulo = titulo.lstrip('# ').strip()

    def folha(conteudo, lado, cls=''):
        return (
            f'<section class="fh-folha {cls}"><header class="en-topo"><div>{ev.gf.LOGO}<h1>{html.escape(titulo)}</h1></div>'
            f'<div class="en-lado">Material do Mestre · Aethelgard<br>{lado}</div></header>'
            f'<div class="en-colunas">{ev.md(conteudo)}</div></section>'
        )

    frente, _, verso = corpo.partition('\n## Criaturas')
    corpo_html = folha(frente, 'Frente: a viagem') + folha('## Criaturas' + verso, 'Verso: criaturas', 'en-verso')
    return ev.documento(corpo_html, titulo, ev.CSS_EN, ev.MEDIDA_EN)


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    SAIDA.mkdir(parents=True, exist_ok=True)
    chrome = ev.gf.achar_chrome()
    for arquivo, nome in DOCUMENTOS:
        html_path = BUILD / f'{nome}.html'
        html_path.write_text(pagina(arquivo), encoding='utf-8')
        pdf = SAIDA / f'{nome}.pdf'
        ev.gf.imprimir(chrome, html_path, pdf)
        print(pdf.relative_to(RAIZ))
        ev.conferir(chrome, html_path)


if __name__ == '__main__':
    main()
