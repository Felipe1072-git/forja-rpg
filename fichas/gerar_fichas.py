"""Gera as fichas do Forja RPG em PDF.

Monta cada ficha como uma página HTML A4 independente (estilo em
fichas/ficha.css) e imprime em PDF com o Chrome em modo headless.
Os PDFs vão para docs/assets/fichas/ e são publicados com o site.

Uso, na raiz do projeto:

    python fichas/gerar_fichas.py
"""
import os
import pathlib
import shutil
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BUILD = RAIZ / 'fichas' / 'build'
SAIDA = RAIZ / 'docs' / 'assets' / 'fichas'

CHROMES = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'google-chrome',
    'chromium',
]

ANVIL = 'M9 5v5c4.03 2.47-.56 4.97-3 6v3h15v-3c-6.41-2.73-3.53-7 1-8V5zM2 6c.81 2.13 2.42 3.5 5 4V6z'
LOGO = (
    '<div class="fh-logo">'
    f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{ANVIL}"/></svg>'
    '<span>Forja RPG</span></div>'
)
ATRIBUTOS = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma']
SIGLAS = ['For', 'Des', 'Con', 'Int', 'Sab', 'Car']


# ------------------------------------------------------------ peças

def campo(rotulo, cls=''):
    c = f' {cls}' if cls else ''
    return f'<div class="fh-campo{c}"><span class="fh-rotulo">{rotulo}</span></div>'


def caixa(rotulo, sub=None):
    if sub:
        inner = ''.join(f'<div class="fh-sub"><span>{x}</span></div>' for x in sub)
        return (f'<div class="fh-caixa fh-dupla"><div class="fh-caixa-rot">{rotulo}</div>'
                f'<div class="fh-subs">{inner}</div></div>')
    return f'<div class="fh-caixa"><div class="fh-caixa-rot">{rotulo}</div><div class="fh-caixa-val"></div></div>'


def bolinhas(n):
    return '<span class="fh-bolinhas">' + '<i></i>' * n + '</span>'


def tabela(cabecalho, linhas, cls=''):
    th = ''.join(f'<th>{h}</th>' for h in cabecalho)
    tr = ''.join('<tr>' + '<td></td>' * len(cabecalho) + '</tr>' for _ in range(linhas))
    return f'<table class="fh-tabela {cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'


def titulo(texto):
    return f'<div class="fh-secao">{texto}</div>'


def documento(titulo_doc, folhas):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{titulo_doc} — Forja RPG</title>
<link rel="stylesheet" href="../ficha.css">
</head>
<body>
{folhas}
</body>
</html>
"""


# ------------------------------------------------------------ ficha de personagem

def ficha_personagem():
    atributos = ''.join(
        f'<div class="fh-attr"><div class="fh-attr-nome">{a}</div><div class="fh-attr-valor"></div>'
        f'<div class="fh-attr-mod"><span>mod.</span></div></div>' for a in ATRIBUTOS)

    frente = (
        '<div class="fh-folha">'
        '<header class="fh-topo">' + LOGO +
        '<div class="fh-campos">' +
        campo('Nome', 'fh-larga') + campo('Jogador') +
        campo('Ancestralidade') + campo('Classe') + campo('Nível') +
        campo('Antecedente') + campo('Tendência') + campo('XP') +
        campo('Título') + campo('Divindade') + campo('Atributo principal') +
        '</div></header>'
        '<div class="fh-meio">'
        '<div class="fh-atributos">' + atributos + '</div>'
        '<div class="fh-recursos">' +
        caixa('Pontos de Vida', ['Máx.', 'Atual']) +
        caixa('Mana', ['Máx.', 'Atual']) +
        caixa('Sanidade', ['Máx.', 'Atual']) +
        '<div class="fh-trio">' + caixa('CA') + caixa('CD de habilidade') + caixa('Mana extra máx.') + '</div>'
        '<div class="fh-marcas">'
        f'<div><span class="fh-rotulo">Exaustão</span>{bolinhas(6)}</div>'
        f'<div><span class="fh-rotulo">Inspiração</span>{bolinhas(5)}</div>'
        '</div>'
        '</div></div>' +
        titulo('Ataques') +
        tabela(['Arma', 'Ataque', 'Dano', 'Tipo', 'Propriedades'], 4, 'fh-ataques') +
        titulo('Habilidades') +
        tabela(['Habilidade', 'Custo', 'Ação', 'Efeito e escalonamento', 'Melhorias'], 12, 'fh-habilidades') +
        '</div>'
    )

    carga = ''.join(f'<div class="fh-espaco"><span>{i}</span></div>' for i in range(1, 17))
    avancos = ''.join(f'<tr><td>{n}</td><td></td></tr>' for n in range(2, 11))
    verso = (
        '<div class="fh-folha">'
        '<header class="fh-topo fh-topo-curto">' + LOGO + campo('Nome', 'fh-larga') + '</header>' +
        titulo('Equipamento') +
        '<div class="fh-carga-topo">' + campo('Espaços (máx.)') + campo('Peças de ouro (po)') +
        campo('Armadura e escudo') + '</div>'
        '<div class="fh-carga">' + carga + '</div>'
        '<div class="fh-duas">'
        '<div>' + titulo('Ancestralidade e traços') + '<div class="fh-bloco fh-alto"></div>' +
        titulo('Proficiências e idiomas') + '<div class="fh-bloco fh-prof"></div></div>'
        '<div>' + titulo('Divindade') +
        '<div class="fh-bloco fh-alto"><span class="fh-rotulo">Domínio · Responsabilidades · Bênçãos</span></div>' +
        titulo('Avanços') +
        '<table class="fh-tabela fh-avancos"><thead><tr><th>Nível</th><th>Avanço(s)</th></tr></thead>'
        '<tbody>' + avancos + '</tbody></table>'
        '</div></div>' +
        titulo('Notas') + '<div class="fh-bloco fh-notas"></div>'
        '</div>'
    )
    return documento('Ficha de Personagem', frente + '\n' + verso)


# ------------------------------------------------------------ ficha de funil

def ficha_funil():
    mini = ''.join(f'<div class="fh-mini"><b>{s}</b><span></span><em>mod.</em></div>' for s in SIGLAS)
    pjs = ''
    for n in range(1, 5):
        pjs += (
            '<div class="fh-pj">'
            f'<div class="fh-pj-topo"><span class="fh-num">{n}</span>' + campo('Nome', 'fh-larga') + '</div>'
            '<div class="fh-pj-campos">' + campo('Ancestralidade') + campo('Classe (dado de vida)') +
            campo('Antecedente') + campo('Tendência') + '</div>'
            '<div class="fh-minis">' + mini + '</div>'
            '<div class="fh-trio">' + caixa('PV') + caixa('CA') + caixa('Sanidade') + '</div>'
            '<div class="fh-pj-equip"><span class="fh-rotulo">Equipamento</span><i></i><i></i><i></i><i></i><i></i></div>'
            '<div class="fh-pj-fim"><span class="fh-check"></span> Morreu '
            '<span class="fh-check"></span> Sobreviveu</div>'
            '</div>'
        )
    folha = (
        '<div class="fh-folha">'
        '<header class="fh-topo fh-topo-curto">' + LOGO +
        '<div class="fh-titulo-folha">Ficha de Funil</div>' + campo('Jogador') + '</header>'
        '<div class="fh-pjs">' + pjs + '</div>'
        '<p class="fh-rodape">Nível 0: sem Mana nem habilidades. Com 0 PV, o personagem morre. '
        'Quem sobreviver ao Funil sobe para o nível 1 e soma o dado de vida aos PV que já tinha.</p>'
        '</div>'
    )
    return documento('Ficha de Funil', folha)


# ------------------------------------------------------------ impressão

def achar_chrome():
    for c in CHROMES:
        if os.path.isfile(c) or shutil.which(c):
            return c
    sys.exit('Chrome ou Edge não encontrado. Ajuste a lista CHROMES em fichas/gerar_fichas.py.')


def imprimir(chrome, html, pdf):
    perfil = BUILD / 'perfil-chrome'
    perfil.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        chrome, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
        f'--user-data-dir={perfil}', '--virtual-time-budget=5000',
        f'--print-to-pdf={pdf}', html.as_uri(),
    ], check=True, timeout=120, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    SAIDA.mkdir(parents=True, exist_ok=True)
    chrome = achar_chrome()
    for nome, gerar in [('ficha-personagem', ficha_personagem), ('ficha-funil', ficha_funil)]:
        html = BUILD / f'{nome}.html'
        html.write_text(gerar(), encoding='utf-8')
        pdf = SAIDA / f'{nome}.pdf'
        imprimir(chrome, html, pdf)
        print(f'{pdf.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
