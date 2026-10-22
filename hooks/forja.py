"""Hooks do MkDocs para o Forja RPG.

Sequências de dois ou mais parágrafos no formato "**Termo.** texto" viram
uma lista de regras em duas colunas (termo | texto). O Markdown continua
simples de editar; só o HTML final muda.
"""
import re

_ITEM = r'<p><strong>[^<]+?[.:]</strong>(?:(?!</p>).)*</p>'
_RUN = re.compile(r'(?:' + _ITEM + r'\s*){2,}', re.S)
_PARTES = re.compile(r'<p><strong>([^<]+?)[.:]</strong>\s*((?:(?!</p>).)*)</p>', re.S)


def _lista(match):
    itens = []
    for termo, texto in _PARTES.findall(match.group(0)):
        itens.append(
            '<div class="fj-item">'
            f'<div class="fj-termo">{termo}</div>'
            f'<div class="fj-texto">{texto}</div>'
            '</div>'
        )
    return '<div class="fj-lista">' + ''.join(itens) + '</div>\n'


def on_page_content(html, **kwargs):
    return _RUN.sub(_lista, html)
