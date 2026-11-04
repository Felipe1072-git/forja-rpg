"""Gera as fichas do Forja RPG em PDF.

Monta cada ficha como uma página HTML A4 independente (estilo em
fichas/ficha.css) e imprime em PDF com o Chrome em modo headless.
Os PDFs vão para docs/assets/fichas/ e são publicados com o site.

Uso, na raiz do projeto:

    python fichas/gerar_fichas.py
"""
import os
import pathlib
import re
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


def dica(texto):
    return f'<span class="fh-dica">{texto}</span>' if texto else ''


def caixa(rotulo, sub=None, formula=''):
    """Caixa de valor. `formula` aparece clarinha, para escrever por cima."""
    if sub:
        inner = ''
        for i, x in enumerate(sub):
            inner += f'<div class="fh-sub"><span>{x}</span>{dica(formula) if i == 0 else ""}</div>'
        return (f'<div class="fh-caixa fh-dupla"><div class="fh-caixa-rot">{rotulo}</div>'
                f'<div class="fh-subs">{inner}</div></div>')
    return (f'<div class="fh-caixa"><div class="fh-caixa-rot">{rotulo}</div>'
            f'<div class="fh-caixa-val">{dica(formula)}</div></div>')


EXAUSTAO = ['Desvantagem em testes', 'Movimento à metade', 'Desvantagem em ataques',
            'PV e Mana máx. à metade', 'Não pode se mover', 'Morte']


def exaustao():
    itens = ''.join(f'<div class="fh-exa-item"><i></i><b>{n}</b><span>{e}</span></div>'
                    for n, e in enumerate(EXAUSTAO, 1))
    return ('<div class="fh-exaustao"><div class="fh-exa-rot"><span class="fh-rotulo">Exaustão</span>'
            '<em>descanso longo remove 1</em></div><div class="fh-exa-itens">' + itens + '</div></div>')


VIRTUDES = [('Firme', 'imune a medo e encanto'), ('Corajoso', 'aliado perto +1 San./turno'),
            ('Focado', '+1 ataque; vant. Int, Sab, Car'), ('Poderoso', '+1d4 de dano'),
            ('Vigoroso', 'cura 1d6; +1 de CA'), ('Inabalável', 'vant. em resistências')]


def virtude():
    itens = ''.join(f'<div class="fh-exa-item"><i></i><b>{n}</b><span>{e}</span></div>' for n, e in VIRTUDES)
    return ('<div class="fh-exaustao fh-virtude"><div class="fh-exa-rot"><span class="fh-rotulo">Virtude (d6)</span>'
            '<em>Sanidade 0: CD 10, maior atributo mental · falhou: morre</em></div>'
            '<div class="fh-exa-itens">' + itens + '</div>'
            '<div class="fh-vir-rodape"><em>até o descanso longo, imune a dano de Sanidade; depois, trauma</em>'
            + campo('Traumas') + '</div></div>')


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
        '<div class="fh-esquerda"><div class="fh-atributos">' + atributos + '</div>' + exaustao() + '</div>'
        '<div class="fh-recursos">' +
        caixa('Pontos de Vida', ['Máx.', 'Atual'], 'nível 1: dado de vida + Con · cada nível: + dado de vida') +
        caixa('Mana', ['Máx.', 'Atual'], 'Mana da base × nível + mod. do atributo principal') +
        caixa('Sanidade', ['Máx.', 'Atual'], '10 + mod. de Int + Sab + Car') +
        '<div class="fh-trio">' +
        caixa('CA', formula='10 + Des, ou armadura (+ escudo)') +
        caixa('CD de habilidade', formula='10 + mod. do atributo principal') +
        caixa('Mana extra máx.', formula='igual ao seu nível') + '</div>'
        '<div class="fh-marcas">'
        f'<div><span class="fh-rotulo">Inspiração</span>{bolinhas(6)}</div>'
        '<div class="fh-mov"><span class="fh-rotulo">Movimento</span>'
        '<span class="fh-mov-linha"><span class="fh-dica">6 casas · anão, gnomo, halfling: 5</span></span></div>'
        '</div>' + virtude() +
        '</div></div>' +
        titulo('Ataques') +
        tabela(['Arma', 'Ataque', 'Dano', 'Tipo', 'Propriedades'], 4, 'fh-ataques') +
        titulo('Habilidades') +
        tabela(['Habilidade', 'Custo', 'Ação', 'Efeito, escalonamento e melhorias'], 9, 'fh-habilidades') +
        '</div>'
    )

    carga = ''.join(f'<div class="fh-espaco"><span>{i}</span></div>' for i in range(1, 17))
    avancos = ''.join(f'<tr><td>{n}</td><td></td><td></td></tr>' for n in range(1, 11))
    verso = (
        '<div class="fh-folha">'
        '<header class="fh-topo fh-topo-curto">' + LOGO + campo('Nome', 'fh-larga') + '</header>' +
        titulo('Equipamento') +
        '<div class="fh-carga-topo">' + campo('Espaços (máx.)') + campo('Peças de ouro (po)') +
        campo('Armadura e escudo') + '</div>'
        '<div class="fh-carga">' + carga + '</div>'
        '<div class="fh-duas">'
        '<div>' + titulo('Ancestralidade e traços') + '<div class="fh-bloco fh-ancestral"></div>' +
        titulo('Proficiências e idiomas') + '<div class="fh-bloco fh-prof"></div></div>'
        '<div>' + titulo('Divindade') +
        '<div class="fh-bloco fh-alto"><span class="fh-rotulo">Domínio · Responsabilidades · Bênçãos</span></div>' +
        titulo('Avanços') +
        '<table class="fh-tabela fh-avancos"><thead><tr><th>Nível</th><th>Dado de vida</th><th>Avanço(s)</th></tr></thead>'
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
            '<div class="fh-trio">' + caixa('PV', formula='dado + Con (mín. 1)') + caixa('CA', formula='10 + Des, ou armadura') + caixa('Sanidade', formula='10 + Int + Sab + Car') + '</div>'
            '<div class="fh-pj-equip"><span class="fh-rotulo">Equipamento e vocação</span><i></i><i></i><i></i><i></i><i></i></div>'
            '<div class="fh-pj-fim"><span class="fh-check"></span> Morreu '
            '<span class="fh-check"></span> Sobreviveu</div>'
            '</div>'
        )
    folha = (
        '<div class="fh-folha">'
        '<header class="fh-topo fh-topo-curto">' + LOGO +
        '<div class="fh-titulo-folha">Ficha de Funil</div>' + campo('Jogador') + '</header>'
        '<div class="fh-pjs">' + pjs + '</div>'
        '<p class="fh-rodape">Nível 0: sem Mana nem habilidades, só a vocação da classe. Com 0 PV, o personagem morre. '
        'Quem sobreviver ao Funil sobe para o nível 1 e soma o dado de vida aos PV que já tinha.</p>'
        '</div>'
    )
    return documento('Ficha de Funil', folha)


# ------------------------------------------------------------ referências rápidas

def regra(termo, texto):
    return f'<p><b>{termo}.</b> {texto}</p>'


def quadro(cabecalho, linhas, cls=''):
    """Tabela preenchida. Cada linha é uma lista de células."""
    c = f' class="{cls}"' if cls else ''
    th = ''.join(f'<th>{h}</th>' for h in cabecalho)
    tr = ''.join('<tr>' + ''.join(f'<td>{x}</td>' for x in linha) + '</tr>' for linha in linhas)
    return f'<table{c}><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'


def bloco(nome, *partes):
    return f'<section class="rf-bloco"><h2>{nome}</h2>{"".join(partes)}</section>'


def linha(cabecalho, valores):
    """Tabela de uma linha só, deitada, para economizar altura."""
    return quadro(cabecalho, [valores], 'rf-centro')


def referencia(titulo_doc, subtitulo, blocos, cls):
    folha = (
        f'<div class="fh-folha rf-folha {cls}">'
        '<header class="rf-topo">' + LOGO +
        f'<div class="rf-titulo">{titulo_doc}</div><div class="rf-sub">{subtitulo}</div></header>'
        '<div class="rf-colunas">' + ''.join(blocos) + '</div>'
        '</div>'
    )
    return documento(titulo_doc, folha)


CD = quadro(['Fácil', 'Normal', 'Difícil', 'Extrema'], [['9', '12', '15', '18']], 'rf-centro')

EXAUSTAO_TAB = quadro(['Pontos', 'Efeito (acumula)'], [[n, e] for n, e in enumerate(EXAUSTAO, 1)])
EXAUSTAO_CURTA = ('<p>Acumula; descanso longo remove 1. <b>1</b> desv. em testes · <b>2</b> movimento à metade · '
                  '<b>3</b> desv. em ataques · <b>4</b> PV e Mana máx. à metade · <b>5</b> imóvel · <b>6</b> morte.</p>')

CONDICOES = [
    ('Amedrontado', 'Desvantagem em ataques e testes. Não se aproxima da fonte do medo.'),
    ('Atordoado', 'Não age nem se move. Ataques contra você têm vantagem.'),
    ('Caído', 'Desvantagem em ataques. Corpo a corpo contra você: vantagem; à distância: desvantagem.'),
    ('Cego', 'Desvantagem no que exige visão. Ataques contra você têm vantagem.'),
    ('Enfeitiçado', 'Não ataca quem o enfeitiçou e o trata como amigo.'),
    ('Lento', 'Movimento à metade.'),
    ('Paralisado', 'Não age, não se move, não fala. Ataques contra você têm vantagem; corpo a corpo que acerta é crítico.'),
    ('Surdo', 'Não ouve. Falha em testes de audição.'),
]

LUZ = quadro(['Fonte', 'Ilumina', 'Dura'], [
    ['Vela', 'adjacente', '3 turnos'],
    ['Tocha', 'perto', '6 turnos (1 h)'],
    ['Lanterna', 'longe', '4 h por frasco de óleo'],
    ['Fogueira', 'perto', '8 h; fixa'],
])

MORRENDO = [
    regra('0 PV', 'Inconsciente e morrendo. Morre em rodadas = mod. de Constituição (mín. 1). Ganha 1 de exaustão.'),
    regra('Rolagem de morte', 'A cada turno seu, d20. Com 20, levanta com 1 PV e age. Com 1, morre.'),
    regra('Estabilizar', 'Criatura adjacente, Inteligência CD 15. Para de morrer; inconsciente até um descanso longo.'),
    regra('Cura', 'Qualquer cura faz parar de morrer e acordar.'),
]


def referencia_jogador():
    blocos = [
        bloco('Testes',
              regra('Teste', 'd20 + modificador do atributo. Igual ou maior que a CD: sucesso. Não existe bônus de proficiência.'),
              CD,
              regra('Vantagem / desvantagem', 'Role 2d20 e use o melhor / o pior. As duas juntas se anulam.'),
              regra('20 natural', 'Ataque: acerta e é crítico (dobre os dados de dano). Teste: o melhor sucesso possível.'),
              regra('1 natural', 'Ataque erra, teste falha. Perca 1 de Sanidade.'),
              regra('Resistido', 'Os dois lados rolam; o maior vence. Empate: rolem de novo.'),
              regra('Inspiração', 'Comece a sessão com 1. Gaste 1 para rolar de novo um ataque ou teste seu. Pode passar a outro jogador. Some no fim da sessão.')),
        bloco('Atributos',
              quadro(['Valor', '1–3', '4–5', '6–7', '8–9', '10–11', '12–13', '14–15', '16–17', '18–19', '20'],
                     [['Mod.', '-4', '-3', '-2', '-1', '+0', '+1', '+2', '+3', '+4', '+5']], 'rf-centro rf-mod'),
              regra('For', 'golpear, arrombar, erguer, nadar.'),
              regra('Des', 'atirar, desviar, escalar, esconder-se.'),
              regra('Con', 'fôlego, dor, veneno.'),
              regra('Int', 'primeiros socorros, saber, achar comida.'),
              regra('Sab', 'notar, rastrear, instinto.'),
              regra('Car', 'convencer, enganar, liderar.')),
        bloco('Distância e áreas',
              '<p>1 casa = 1,5 m.</p>',
              quadro(['Adjacente', 'Perto', 'Longe', 'Muito longe'], [['1 casa', '2–6', '7–12', '13+']], 'rf-centro'),
              quadro(['Área pequena', 'Média', 'Grande'], [['3 × 3', '5 × 5', '9 × 9']], 'rf-centro')),
        bloco('Seu turno',
              regra('Turno', '1 ação + 1 movimento de até 6 casas (anão, gnomo, halfling: 5). Troque a ação por um segundo movimento.'),
              regra('Ação livre', '1 por rodada: sacar arma, abrir porta, beber poção.'),
              regra('Reação', '1 por rodada, fora do seu turno.'),
              regra('Ataque de oportunidade', 'Inimigo sai do seu alcance com o próprio movimento: reação para um ataque corpo a corpo. Empurrão e teleporte não provocam. Habilidade que move provoca, salvo se disser o contrário.'),
              regra('Levantar', 'Custa metade do movimento.'),
              regra('Iniciativa', '<i>Rápida:</i> personagens, depois inimigos. <i>Tática:</i> d20 + Des, do maior ao menor.'),
              regra('Surpresa', 'Teste de Sab. Falhou: perde o 1º turno, e ataques contra você têm vantagem.'),
              regra('Turno compartilhado', 'O grupo age junto, na ordem que quiser.')),
        bloco('Ataque e dano',
              quadro(['Ataque', 'Rolagem', 'Dano'], [
                  ['Corpo a corpo', 'd20 + For ≥ CA', 'arma + For'],
                  ['À distância', 'd20 + Des ≥ CA', 'arma + Des'],
                  ['Habilidade', 'd20 + atrib. ≥ CA', 'dados da habilidade'],
                  ['Desarmado', 'd20 + For ≥ CA', '1 + For'],
              ]),
              regra('Acuidade', 'For ou Des. <b>Arremesso:</b> até perto, For ou Des.'),
              regra('Nocaute', 'Ao levar alguém a 0 PV, deixe inconsciente em vez de matar.'),
              regra('Armas comuns', 'Alguns monstros resistem a armas não mágicas. Magia vence; prata vence contra os malignos e sobrenaturais.'),
              quadro(['Cobertura', 'Metade', '3/4', 'Total'], [['CA', '+2', '+5', 'não é alvo']], 'rf-centro')),
        bloco('Habilidades e Mana',
              regra('Mana', 'Paga todas as habilidades, mágicas ou marciais. Sem Mana, pague com Sanidade, 1 por 1 (com 0 de Sanidade, não).'),
              regra('CD de habilidade', '10 + mod. do atributo principal. Quem resiste sofre metade do dano e ignora as condições.'),
              regra('Escalonamento', 'Cada compra custa +1 de Mana. Mana extra máx. = seu nível.'),
              regra('Elementos', 'Fogo ⇄ Gelo · Tempestade ⇄ Terra · Radiante ⇄ Necrótico · Arcano ⇄ Psíquico · Veneno · Ácido. Mesmo elemento: metade do dano. Oposto: o dobro.'),
              regra('Marcial', 'Imune a dissipar, antimagia e contramágica.')),
        bloco('Morrendo', *MORRENDO),
        bloco('Sanidade',
              regra('Máxima', '10 + mod. de Int + Sab + Car.'),
              regra('Colapso', 'Em 0: teste CD 10 com seu maior atributo mental, uma vez. Falhou: morre. Passou: virtude (d6) e imune a dano de Sanidade até o descanso longo.'),
              regra('Trauma', 'No fim da virtude: role 1d12 de trauma, -1 de Sanidade máx. até tratar no tempo livre.'),
              regra('Terror', 'Falhou contra medo: -1 de Sanidade (1d4 se sobrenatural). Coragem protege a mente.')),
        bloco('Exaustão', EXAUSTAO_TAB, '<p>Descanso longo remove 1.</p>'),
        bloco('Condições', *[regra(n, t) for n, t in CONDICOES]),
        bloco('Descanso',
              regra('Longo', '8 h e 1 ração. Recupere tudo (PV, Mana, Sanidade) e remova 1 de exaustão.'),
              regra('Curto', '1 vez por dia, 1 h. Recupere metade dos PV, Mana e Sanidade máximos.'),
              regra('Interrompido', 'Constituição CD 12. Falhou: sem benefício.')),
        bloco('Exploração',
              regra('Tempo', 'Rodada ≈ 6 s. Turno de exploração = 10 min. A cada 6 turnos, descanse 1 ou tenha desvantagem.'),
              LUZ,
              regra('Escuro', 'Desvantagem no que exige visão.'),
              regra('Escalar', 'For ou Des; metade do movimento.'),
              regra('Nadar', 'Metade do movimento. Água agitada: For.'),
              regra('Cair', '1d6 a cada 2 casas. Onde se segurar: reação e Des.'),
              regra('Fôlego', 'Sem ar, Con a cada rodada: CD 8, +1 por rodada. Falhou: 10 de dano por rodada.'),
              regra('Terreno difícil', 'Metade do movimento.'),
              regra('Atravessar', 'Aliados: livre. Inimigo: resistido de For ou Des.'),
              regra('Esconder-se', 'Des. Atacar revela você.')),
        bloco('Carga',
              regra('Espaços', 'mod. de For + Con (mín. 1). Mochila: +5.'),
              regra('Grátis', 'armadura vestida, armas em mãos, acessórios, roupas, até 100 po.'),
              regra('Sobrecarga', 'Movimento à metade, -2 em ataques e testes. Máx. o dobro.'),
              regra('Armas', '<i>Alcance</i> 2 casas · <i>Duas mãos</i> · <i>Munição</i> recupere metade · <i>Pesada</i> For &lt; 15 tem desvantagem · <i>Recarga</i> gasta o movimento · <i>Versátil</i> dado maior com duas mãos.'),
              regra('Poções', 'Beber é ação livre.')),
        bloco('Armaduras',
              quadro(['Armadura', 'CA', 'For', 'Nota'], [
                  ['Couro (leve)', '11 + Des', '—', ''],
                  ['Couro batido (leve)', '12 + Des', '—', ''],
                  ['Gibão de peles (média)', '12 + Des', '11', ''],
                  ['Cota de malha (média)', '13 + Des', '13', 'desv. furtividade, nado'],
                  ['Cota de talas (pesada)', '15', '13', 'desv. furtividade, nado'],
                  ['Placas (pesada)', '16', '15', 'desv. furtividade; não nada'],
                  ['Escudo', '+2', '—', 'ocupa uma mão'],
              ], 'rf-armaduras'),
              regra('Sem a Força', 'Movimento à metade.'),
              regra('Sem proficiência', 'Movimento à metade, desvantagem em ataques e em testes de For e Des. Para usar habilidade, For CD 15 antes (falhou: Mana gasta).')),
        bloco('Divindade',
              regra('Bênçãos', 'Menor no nível 1, maior no 5, milagre no 9. Não gastam avanços.'),
              regra('Quebrar uma responsabilidade', 'Perde bênçãos e habilidades divinas; -2 de Sanidade máx. Escolha: penitência, nova divindade ou seguir sem divindade.')),
        bloco('Tempo livre',
              '<p>Entre aventuras, uma atividade (ou role d10): <b>1</b> Farra · <b>2</b> Aprender · <b>3</b> Pesquisar · '
              '<b>4</b> Trabalhar (2d6 × 5 po) · <b>5</b> Servir à divindade · <b>6</b> Recuperar-se (toda a exaustão) · '
              '<b>7</b> Fazer contatos · <b>8</b> Fabricar · <b>9</b> Treinar (+1 Inspiração) · <b>10</b> Assuntos pessoais.</p>'),
        bloco('Avanço',
              regra('Subir', 'XP = nível atual × 10. O XP volta a 0. Máx. nível 10.'),
              regra('Ao subir', 'Role o dado de vida e some ao PV máx. (tirou 1: role de novo, 1 vez). Ganhe 1 avanço, ou 2 nos níveis da sua base.'),
              regra('Avanços', 'Nova habilidade · Melhoria (+1 no custo) · +1 dado · +2 em atributos · Vigor (+1 dado de vida) · Treino (proficiência ou idioma).')),
    ]
    return referencia('Referência do Jogador', 'regras na mão, sem abrir o livro', blocos, 'rf-jogador')


def referencia_mestre():
    blocos = [
        bloco('Testes',
              regra('Quando rolar', 'A falha tem consequência, a ação exige perícia ou há pressão de tempo. Se o personagem sabe fazer, faz.'),
              quadro(['CD', 'Exemplo'], [
                  ['9 Fácil', 'pular fosso estreito, passar por guarda distraído'],
                  ['12 Normal', 'arrombar porta emperrada, fechadura simples'],
                  ['15 Difícil', 'nadar contra a correnteza, estabilizar'],
                  ['18 Extrema', 'escalar penhasco liso, segurar leão furioso'],
              ]),
              regra('Int x Sab', 'Sab é sentidos e instinto; Int é saber e lógica.')),
        bloco('Exploração',
              regra('Turno de exploração', '10 min. Uma atividade: explorar uma área, procurar, escutar, desarmar, abrir caminho, descansar.'),
              regra('Encontros', 'A cada 2 turnos, 1d6: com 1, encontro. Barulho alto pede uma rolagem.'),
              regra('Cansaço', 'A cada 6 turnos (1 h), 1 turno de descanso. Sem isso, desvantagem em ataques e testes.'),
              LUZ),
        bloco('Encontros',
              linha(['d6', '1', '2–4', '5–6'], ['Distância', 'Adjacente', 'Perto', 'Longe']),
              quadro(['d12', 'Atividade', 'd12', 'Atividade'], [
                  ['1–3', 'Caçando', '8–9', 'Brincando, conversando'],
                  ['4–5', 'Comendo', '10–11', 'De guarda'],
                  ['6–7', 'Ninho, construindo', '12', 'Dormindo'],
              ]),
              linha(['d20 + Car', '1–5', '6–9', '10–12', '13–16', '17+'],
                    ['Reação', 'Hostil', 'Descon&shy;fiada', 'Neutra', 'Curiosa', 'Amigável']),
              '<p>Quem fala soma Car, mas revela o grupo.</p>',
              regra('Surpresa', 'Emboscados testam Sab. Falhou: perde o 1º turno e ataques contra ele têm vantagem.')),
        bloco('Moral',
              regra('Quando', 'Primeira baixa do lado; metade do grupo caiu (ou o solitário perdeu metade dos PV).'),
              regra('Teste', 'd20 maior que a Moral: foge ou se rende. Grupo rola uma vez. Passou duas vezes: luta até o fim.'),
              linha(['5', '10', '15', '20'], ['covardes, animais', 'bandidos, soldados', 'elite, fanáticos', 'sem mente, nunca foge']),
              '<p>Monstro convertido: 10 + mod. de Sab.</p>'),
        bloco('Sanidade',
              '<p>Teste com o maior atributo mental, CD 12. Sucesso: não perde nada. Mesma situação, só 1 vez por aventura.</p>',
              quadro(['Situação', 'Dano'], [
                  ['Cena macabra', '1'],
                  ['Morte de um aliado', '1d4'],
                  ['Criatura sobrenatural aterrorizante', '1d4'],
                  ['Ser controlado por magia mental', '1d4'],
                  ['Pesadelo mágico, tortura', '1d6'],
                  ['Horror cósmico, outro plano', '2d6'],
                  ['Ser antigo ou divindade em forma real', '3d6'],
              ]),
              regra('Colapso', 'Em 0: CD 10 com o maior atributo mental, uma vez, ou morre. Passou: virtude até o descanso longo, depois trauma.'),
              regra('Monstros', 'Sem Sanidade: dano de Sanidade neles vira teste de Moral.')),
        bloco('Dano improvisado',
              quadro(['Gravidade', 'Dano', 'Exemplos'], [
                  ['Leve', '1d6', 'brasas, estante que cai'],
                  ['Grave', '2d8', 'pisar na fogueira, um raio'],
                  ['Mortal', '3d10', 'túnel que desaba, tonel de ácido'],
                  ['Catastrófico', '6d10', 'paredes que esmagam, lava'],
              ]),
              regra('Cair', '1d6 a cada 2 casas. Onde se segurar: reação e Des.'),
              regra('Fôlego', 'Con a cada rodada, CD 8 +1 por rodada. Falhou: 10 de dano por rodada; a 0 PV sem ar, morre.')),
        bloco('Armadilhas',
              '<p>Toda armadilha tem um sinal. Procurar no lugar certo encontra. Com tempo e bom método, desarma sem rolar. Quem cai testa para reduzir ou evitar.</p>',
              quadro(['d12', 'Armadilha', 'Gatilho', 'Efeito'], [
                  ['1', 'Dardo envenenado', 'fio esticado', '1d6'],
                  ['2', 'Agulhas', 'placa de pressão', '1d6, lento'],
                  ['3', 'Gás tóxico', 'abrir porta', '1d6, cego'],
                  ['4', 'Rede com farpas', 'alavanca', '1d6, caído'],
                  ['5', 'Lâmina pendular', 'degrau falso', '2d8'],
                  ['6', 'Fosso com estacas', 'chão falso', '2d8, caído'],
                  ['7', 'Bola de pedra', 'pegar objeto', '2d8, caído'],
                  ['8', 'Runa de medo', 'ler inscrição', '1d6 San., amedrontado'],
                  ['9', 'Jato de fogo', 'fechar porta', '3d10 fogo'],
                  ['10', 'Teto desaba', 'falar alto', '3d10'],
                  ['11', 'Sala inunda', 'abrir baú', '3d10, fôlego'],
                  ['12', 'Estátua maldita', 'usar magia', '3d10, paralisado'],
              ], 'rf-armadilhas')),
        bloco('Perigos',
              quadro(['d12', 'Movimento', 'Dano', 'Enfraquecimento'], [
                  ['1', 'Areia movediça', 'Poças de ácido', 'Fumaça cegante'],
                  ['2', 'Entulho solto', 'Vapor escaldante', 'Antimagia'],
                  ['3', 'Gelo', 'Lava', 'Runas de exaustão'],
                  ['4', 'Lama funda', 'Água congelante', 'Silêncio mágico'],
                  ['5', 'Teias', 'Mofo tóxico', 'Esporos de sono'],
                  ['6', 'Vinhas', 'Granizo', 'Cheiro nauseante'],
                  ['7', 'Correnteza', 'Pedras caindo', 'Frio entorpecente'],
                  ['8', 'Ventania', 'Cortina de fogo', 'Sons confusos'],
                  ['9', 'Ladeira', 'Campo elétrico', 'Reflexos'],
                  ['10', 'Piche', 'Chuva ácida', 'Névoa apaga-luz'],
                  ['11', 'Chão ilusório', 'Gêiseres', 'Sussurros (San.)'],
                  ['12', 'Gravidade louca', 'Cristais', 'Ar rarefeito'],
              ], 'rf-perigos')),
        bloco('Morrendo', *MORRENDO),
        bloco('Exaustão', EXAUSTAO_CURTA),
        bloco('Condições', *[regra(n, t) for n, t in CONDICOES]),
        bloco('Combate',
              regra('Iniciativa', '<i>Rápida:</i> personagens, depois inimigos. <i>Tática:</i> d20 + Des. <i>Caos</i> (opcional): role de novo a cada rodada.'),
              quadro(['Cobertura', 'Metade', '3/4', 'Total'], [['CA', '+2', '+5', 'não é alvo']], 'rf-centro'),
              regra('Improvisar', 'Lustre, estante, empurrão: peça um teste ou um ataque e decida o efeito.')),
        bloco('Descanso',
              regra('Interrompido', 'Con CD 12 ou perde o benefício. O longo gasta a ração mesmo assim.'),
              '<p><b>Perigo.</b> 1d6, encontro com 1:</p>',
              linha(['Inseguro', 'Arriscado', 'Mortal'], ['a cada 3 h', 'a cada 2 h', 'a cada hora'])),
        bloco('Viagem',
              '<p>Hexágono de 10 km:</p>',
              linha(['A pé', 'Montado', 'Navegando', 'Difícil', 'Árduo'], ['4 h', '2 h', '1 h', 'o dobro', '8 h']),
              regra('Ritmo', 'Até 8 h por dia. Encontros pela tabela de Perigo.'),
              regra('Marcha forçada', 'Cada hora além de 8: Con CD 10, +2 por hora. Falhou: 1 de exaustão.'),
              regra('Navegação', 'Terreno desconhecido: Int ao sair do hexágono. Falhou: hexágono vizinho aleatório.'),
              regra('Comida', '3 dias sem ração; depois, 1 de exaustão por dia. Caçar: Int, 1 ração.')),
        bloco('XP',
              quadro(['Tesouro', 'XP', 'Outros', 'XP'], [
                  ['Comum', '0', 'Ideia brilhante', '1'],
                  ['Bom', '1', 'Combate difícil', '1'],
                  ['Fabuloso', '3', 'Marco menor', '2'],
                  ['Lendário', '10', 'Marco maior', '5'],
              ], 'rf-xp'),
              '<p>Cada personagem recebe tudo. Subir: nível × 10.</p>'),
        bloco('Monstros',
              linha(['Close', 'Near', 'Double near', 'Far'], ['Adjacente', 'Perto (6)', '12 casas', 'Longe']),
              regra('Pés', '÷ 5 = casas.'),
              regra('Valores', 'Old school: como estão. Sem Mana.'),
              regra('Do 5e', 'NV = ND + 2. PV = NV × 4,5 + Con. Ataque = mod. (+1 NV 4–7, +2 NV 8+). Dano sem mod. '
                    'CD ≤10: 9, 11–15: 12, 16–20: 15, 21+: 18. Medo e horror: falhou, perde Sanidade (Terror, 1d6 ou 2d6).'),
              regra('Tendência', 'Lawful: Bem e Ordem. Chaotic: Mal e Caos. Neutral: Neutro.')),
        bloco('O Funil',
              regra('Nível 0', '4 personagens aleatórios por jogador, um em jogo por vez. Morrem a 0 PV. Perdeu todos: crie mais 1d4.'),
              regra('Fim', 'Cada jogador escolhe um sobrevivente, que sobe para o nível 1.')),
        bloco('Modos de jogo',
              '<p><b>Mortal</b> morre a 0 PV · <b>Brutal</b> descanso longo recupera metade · <b>Escassez</b> sem descanso curto · '
              '<b>Heroico</b> 1d4 Inspiração; gaste 1 para virar crítico · <b>Impulso</b> dano explode · '
              '<b>Caçador</b> XP = metade do nível do monstro · <b>Caos</b> iniciativa a cada rodada · <b>Sem loucura</b> sem Sanidade.</p>'),
    ]
    return referencia('Referência do Mestre', 'escudo de bolso', blocos, 'rf-mestre')


def passos(*itens):
    return '<ol class="rf-passos">' + ''.join(f'<li>{i}</li>' for i in itens) + '</ol>'


def guia_criacao():
    blocos = [
        bloco('Passo a passo',
              passos('<b>Atributos.</b> Role e distribua.',
                     '<b>Ancestralidade.</b> Escolha ou role d20.',
                     '<b>Classe.</b> Escolha ou role d20. Anote base, atributo principal e proficiências.',
                     '<b>Números.</b> PV, Mana, Sanidade, CA e o resto.',
                     '<b>Habilidades.</b> As iniciais, da lista da classe.',
                     '<b>Antecedente.</b> Escolha ou role d20.',
                     '<b>Tendência e título.</b>',
                     '<b>Divindade.</b> Opcional.',
                     '<b>Idiomas.</b>',
                     '<b>Equipamento.</b> Ouro ou pacote inicial.',
                     '<b>Nome.</b> E um motivo para se aventurar.')),
        bloco('1. Atributos',
              regra('Rolagem', '4d6, descarte o menor dado e some. Repita até ter seis valores e distribua como quiser. Máximo 18 na criação.'),
              quadro(['Valor', '3', '4–5', '6–7', '8–9', '10–11', '12–13', '14–15', '16–17', '18'],
                     [['Mod.', '-4', '-3', '-2', '-1', '+0', '+1', '+2', '+3', '+4']], 'rf-centro rf-mod')),
        bloco('2. Ancestralidade',
              quadro(['d20', 'Povo', 'Traços'], [
                  ['1–3', 'Humano', '1 avanço extra no nível 1; +1 Inspiração por sessão.'],
                  ['4–5', 'Anão', 'Visão no escuro; +1 PV por nível e dados de vida com vantagem; resiste a veneno.'],
                  ['6–7', 'Elfo', 'Visão no escuro; vantagem para notar escondidos; transe; 1 magia de Mago de custo até 2; espada longa e arco longo.'],
                  ['8', 'Drow', 'Visão no escuro até longe; sensível ao sol; transe; escuridão e luz que revela; besta leve, espada curta, florete.'],
                  ['9', 'Meio-elfo', 'Visão no escuro; 1 traço de Humano e 1 de Elfo.'],
                  ['10–11', 'Halfling*', 'Rola de novo o 1 natural; vantagem contra medo; passa por criaturas maiores.'],
                  ['12', 'Draconato', 'Resiste a um elemento; +1 de CA; sopro de 2d6 em área pequena.'],
                  ['13', 'Gnomo*', 'Visão no escuro; vantagem contra magia (Int, Sab, Car); conhece Ilusão; fala com bichos pequenos.'],
                  ['14', 'Orc', 'Visão no escuro; 1 vez fica com 1 PV ao cair a 0; +1 de dano corpo a corpo.'],
                  ['15', 'Meio-orc', 'Visão no escuro; 1 traço de Humano e 1 de Orc.'],
                  ['16', 'Tiefling', 'Visão no escuro; imune a fogo; escuridão mágica.'],
                  ['17–18', 'Goblin*', 'Visão no escuro; vantagem para se esconder e +1d6 contra surpreendidos; foge 2 casas sem provocar.'],
                  ['19–20', 'Autômato', 'Não respira, come nem dorme; imune a veneno e doença; corpo é a armadura: CA 13 + Des ou 17.'],
              ], 'rf-ancestral'),
              '<p>* Pequeno. Detalhes e usos por descanso: veja Ancestralidades. <b>Própria:</b> 2 pontos de traço (menor 1, maior 2).</p>'),
        bloco('3. Classe',
              quadro(['d20', 'Classe', 'Base', 'Atributo', 'Armaduras'], [
                  ['1', 'Guerreiro', 'd10', 'For ou Des', 'Todas, escudo'],
                  ['2', 'Sacerdote', 'd8', 'Sab', 'Todas, escudo'],
                  ['3', 'Ladino', 'd6', 'Des', 'Leves'],
                  ['4', 'Mago', 'd4', 'Int', '—'],
                  ['5', 'Bárbaro', 'd12', 'For', 'L, M, escudo'],
                  ['6', 'Patrulheiro', 'd8', 'Des ou Sab', 'L, M, escudo'],
                  ['7', 'Bardo', 'd6', 'Car', 'Leves'],
                  ['8', 'Druida', 'd8', 'Sab', 'L, M, escudo'],
                  ['9', 'Paladino', 'd10', 'Car', 'Todas, escudo'],
                  ['10', 'Feiticeiro', 'd6', 'Car ou Con', '—'],
                  ['11', 'Monge', 'd8', 'Des ou Sab', '—'],
                  ['12', 'Alquimista', 'd8', 'Int', 'Leves'],
                  ['13', 'Guerreiro Basilisco', 'd8', 'Con', '—'],
                  ['14', 'Duelista', 'd8', 'Des ou Car', 'Leves'],
                  ['15', 'Cavaleiro Verde', 'd8', 'For ou Sab', 'Todas, escudo'],
                  ['16', 'Cavaleiro Profano', 'd10', 'For ou Car', 'Todas, escudo'],
                  ['17', 'Necromante', 'd6', 'Int', 'L, M'],
                  ['18', 'Lâmina Silenciosa', 'd8', 'Des', 'Leves'],
                  ['19', 'Lobo do Mar', 'd8', 'For ou Con', 'L, M, escudo'],
                  ['20', 'Malvidente', 'd4', 'Sab ou Car', 'Leves'],
              ], 'rf-classes'),
              '<p>L leves, M médias. As armas de cada classe estão na página dela. Com dois atributos, escolha um.</p>',
              quadro(['Base', 'Mana por nível', 'Habilidades no nível 1', 'Níveis com 2 avanços'], [
                  ['d4', '5', '4', 'todos'],
                  ['d6', '4', '3', '3, 5, 7, 9, 10'],
                  ['d8', '3', '3', '3, 6, 9'],
                  ['d10', '2', '2', '5, 10'],
                  ['d12', '2', '2', 'nenhum'],
              ], 'rf-centro')),
        bloco('4. Números',
              regra('PV', 'dado de vida (a base) + mod. de Con (mín. 1).'),
              regra('Mana', 'Mana por nível da base + mod. do atributo principal (mín. 1).'),
              regra('Sanidade', '10 + mod. de Int + Sab + Car.'),
              regra('CA', '10 + Des, ou a da armadura. Escudo +2.'),
              regra('CD de habilidade', '10 + mod. do atributo principal.'),
              regra('Mana extra máxima', 'igual ao nível (1).'),
              regra('Espaços de carga', 'mod. de For + Con (mín. 1). Mochila +5.'),
              regra('Movimento', '6 casas (anão, gnomo, halfling: 5). <b>Inspiração:</b> 1 por sessão.')),
        bloco('5. Habilidades',
              '<p>Escolha na lista da sua classe quantas a base manda, ou role d20 na lista. Anote na ficha o custo, a ação, o efeito e o escalonamento. As três melhorias de cada uma ficam para os avanços. Toda habilidade ativa gasta Mana.</p>'),
        bloco('6. Antecedente',
              '<p>Vantagem em testes ligados a ele. <b>1</b> Trombadinha · <b>2</b> Marinheiro · <b>3</b> Ferreiro · <b>4</b> Caçador · '
              '<b>5</b> Acólito · <b>6</b> Erudito · <b>7</b> Soldado · <b>8</b> Nobre · <b>9</b> Herbalista · <b>10</b> Mercador · '
              '<b>11</b> Artista · <b>12</b> Saqueador de tumbas · <b>13</b> Mineiro · <b>14</b> Fazendeiro · <b>15</b> Cirurgião-barbeiro · '
              '<b>16</b> Aprendiz de mago · <b>17</b> Guarda · <b>18</b> Andarilho · <b>19</b> Contrabandista · <b>20</b> Cultista.</p>'),
        bloco('7. Tendência e título',
              regra('Tendência', 'Um lado em cada eixo: Bem, Neutro ou Mal; Ordem, Neutro ou Caos. Escreva "Bem e Ordem", "Mal e Neutro"... Neutro nos dois é só "Neutro". Aleatório: 1d6 por eixo (1–2 Bem/Ordem, 3–4 Neutro, 5–6 Mal/Caos).'),
              regra('Título', 'Só sabor. 1d6 na tabela de títulos da sua classe, na coluna do eixo Ordem x Caos.')),
        bloco('8. Divindade (opcional)',
              '<p>Você cria a sua: <b>nome</b>, <b>entidade</b> (deus, demônio, fada, ser antigo...), <b>domínio</b> (vantagem em testes ligados a ele), '
              '<b>vínculo</b> (devoção ou pacto) e <b>2 responsabilidades</b>. Quebrou uma: perde as bênçãos e -2 de Sanidade máx.</p>',
              regra('Bênção menor (nível 1)', 'role d20 na tabela de Divindades (ex.: resistência ao elemento divino, visão no escuro, +1 de CA, '
                    'imune a medo, +1 PV por nível). Maior no 5, milagre no 9.')),
        bloco('9. Idiomas',
              '<p>Não há língua comum. Você fala a do seu povo e mais idiomas = mod. de Int (se positivo).</p>'),
        bloco('10. Equipamento',
              regra('Ouro', '2d6 × 5 po e compre o que quiser.'),
              regra('Ou pacote inicial', 'Kit de exploração + uma arma de até 10 po + uma armadura de até 15 po.'),
              regra('Kit de exploração', '7 po, 2 espaços: mochila, pederneira, 5 tochas, 3 rações, corda de 15 m, gancho de escalada, 10 cravos.'),
              quadro(['Armadura', 'Custo', 'CA', 'For'], [
                  ['Couro (L)', '10 po', '11 + Des', '—'], ['Couro batido (L)', '25 po', '12 + Des', '—'],
                  ['Gibão de peles (M)', '15 po', '12 + Des', '11'], ['Cota de malha (M)', '60 po', '13 + Des', '13'],
                  ['Cota de talas (P)', '100 po', '15', '13'], ['Placas (P)', '200 po', '16', '15'],
                  ['Escudo', '10 po', '+2', '—'],
              ], 'rf-armaduras')),
        bloco('Armas',
              quadro(['Simples', 'po', 'Dano', 'Propriedades'], [
                  ['Adaga', '2', '1d4', 'acuidade, arremesso'], ['Azagaia', '1', '1d6', 'arremesso (longe)'],
                  ['Bumerangue', '2', '1d4', 'arremesso (longe)'], ['Bordão', '1', '1d4', 'versátil (1d6)'],
                  ['Clava', '1', '1d4', '—'], ['Lança', '1', '1d6', 'arremesso, versátil (1d8)'],
                  ['Boleadeira', '2', '1d4', 'arremesso'], ['Shuriken', '1', '1d4', 'acuidade, arremesso'],
                  ['Zarabatana', '2', '1', 'perto, munição'], ['Arco curto', '6', '1d6', 'longe, duas mãos, munição'],
                  ['Besta leve', '8', '1d6', 'longe, duas mãos, munição, recarga'],
              ], 'rf-armas'),
              quadro(['Marciais', 'po', 'Dano', 'Propriedades'], [
                  ['Chicote', '2', '1d4', 'acuidade, alcance'], ['Cimitarra', '8', '1d6', 'acuidade'],
                  ['Corrente de lâminas', '10', '1d6', 'acuidade, alcance'], ['Espada curta', '7', '1d6', 'acuidade'],
                  ['Florete', '10', '1d8', 'acuidade'], ['Machadinha', '3', '1d6', 'arremesso'],
                  ['Maça', '5', '1d6', '—'], ['Mangual', '8', '1d8', '—'],
                  ['Espada longa', '10', '1d8', 'versátil (1d10)'], ['Machado de batalha', '10', '1d8', 'versátil (1d10)'],
                  ['Martelo de guerra', '10', '1d8', 'versátil (1d10)'], ['Alabarda', '15', '1d10', 'alcance, duas mãos, pesada'],
                  ['Pique', '8', '1d10', 'alcance, duas mãos, pesada'], ['Espadão', '15', '1d12', 'duas mãos, pesada'],
                  ['Machado grande', '15', '1d12', 'duas mãos, pesada'], ['Arco longo', '12', '1d8', 'muito longe, duas mãos, munição, pesada'],
                  ['Besta pesada', '15', '1d10', 'muito longe, duas mãos, munição, recarga, pesada'],
              ], 'rf-armas')),
        bloco('Nível 0 e o Funil',
              '<p>Atributos em ordem (For, Des, Con, Int, Sab, Car). Ancestralidade, classe (dado de vida e vocação), antecedente e tendência rolados. '
              'Sem Mana, sem habilidades; usa qualquer arma e armadura. Equipamento: 1d4 itens em d12: '
              '<b>1</b> tocha · <b>2</b> adaga · <b>3</b> vara de 3 m · <b>4</b> arco curto e 5 flechas · <b>5</b> corda · <b>6</b> óleo · '
              '<b>7</b> pé de cabra · <b>8</b> 10 cravos · <b>9</b> pederneira · <b>10</b> gancho · <b>11</b> clava · <b>12</b> estrepes.</p>',
              regra('Sobreviveu', 'Vira nível 1: ganha o resto da classe e soma mais um dado de vida aos PV.')),
        bloco('Personagem Forjado (opcional)',
              '<p>Sem classe: escolha uma base e qualquer atributo principal, e crie suas habilidades iniciais (custo até 6, veja Criando Habilidades).</p>',
              linha(['d4', 'd6', 'd8', 'd10', 'd12'],
                    ['simples', 'simples; leves', 'simples e marciais; leves, escudo', 'todas', 'todas'])),
    ]
    return referencia('Criação de Personagem', 'do zero ao nível 1 numa página', blocos, 'rf-criacao')


# ------------------------------------------------------------ ficha de exploração (Mestre)

def fx_bolas(n, grupo=0, cls=''):
    """Bolinhas para marcar. `grupo` separa de tantas em tantas (ex.: 6 = 1 hora)."""
    c = f' {cls}' if cls else ''
    bolas = ''
    for i in range(1, n + 1):
        bolas += '<i></i>'
        if grupo and i % grupo == 0 and i < n:
            bolas += '<b class="fx-sep"></b>'
    return f'<span class="fx-bolas{c}">{bolas}</span>'


def fx_turnos(horas):
    cab = '<th>Hora</th>' + ''.join(
        f'<th>{t}{" · 1d6" if t % 2 == 0 else ""}{" · desc." if t == 6 else ""}</th>' for t in range(1, 7)) + '<th>Onde / notas</th>'
    linhas = ''
    for h in range(1, horas + 1):
        celulas = ''
        for t in range(1, 7):
            n = (h - 1) * 6 + t
            extra = '<span class="fx-d6"></span>' if t % 2 == 0 else ''
            extra += '<span class="fx-desc"></span>' if t == 6 else ''
            celulas += f'<td><span class="fx-n">{n}</span><i></i>{extra}</td>'
        linhas += f'<tr><td class="fx-hora">{h}</td>{celulas}<td></td></tr>'
    return f'<table class="fx-turnos"><thead><tr>{cab}</tr></thead><tbody>{linhas}</tbody></table>'


def fx_luz():
    linhas = ''
    for _ in range(5):
        linhas += f'<tr><td>Tocha</td><td></td><td>{fx_bolas(6)}</td></tr>'
    for _ in range(2):
        linhas += f'<tr><td>Lanterna</td><td></td><td>{fx_bolas(24, 6, "fx-miudas")}</td></tr>'
    linhas += f'<tr><td>Vela</td><td></td><td>{fx_bolas(9, 3)}</td></tr>'
    return ('<table class="fx-tab fx-luz"><thead><tr><th>Fonte</th><th>Quem carrega</th>'
            '<th>Turnos (marque um por turno)</th></tr></thead><tbody>' + linhas + '</tbody></table>')


def fx_vazia(cabecalho, n, cls=''):
    th = ''.join(f'<th>{h}</th>' for h in cabecalho)
    tr = ''.join('<tr>' + '<td></td>' * len(cabecalho) + '</tr>' for _ in range(n))
    return f'<table class="fx-tab {cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'


def ficha_exploracao():
    regras = (
        '<div class="fx-regras">'
        + bloco('Turno de exploração',
                '<p>10 minutos. O grupo faz <b>uma</b> atividade: explorar uma área; procurar armadilhas, portas secretas ou tesouro; '
                'escutar, abrir caminho ou desarmar; descansar.</p>')
        + bloco('Encontros',
                '<p>A cada 2 turnos, role 1d6: com <b>1</b>, encontro. <b>Barulho alto</b> pede uma rolagem na hora. '
                'Distância 1d6: 1 adjacente, 2–4 perto, 5–6 longe.</p>')
        + bloco('Cansaço',
                '<p>A cada 6 turnos (1 hora), o grupo descansa 1 turno. Sem isso: desvantagem em ataques e testes até descansar.</p>')
        + bloco('Luz', LUZ)
        + '</div>'
    )
    folha = (
        '<div class="fh-folha fx-folha">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ficha de Exploração</div>'
        '<div class="fx-campos">' + campo('Local') + campo('Andar ou área') + campo('Sessão') + '</div>'
        '</header>'
        + regras +
        titulo('Turnos <span class="fx-dica">marque a bolinha de cada turno · nos pares, anote o 1d6 de encontro · '
               'no 6º, marque o descanso do grupo</span>')
        + fx_turnos(6) +
        '<div class="fx-duas">'
        '<div>' + titulo('Luz <span class="fx-dica">tocha 6 · lanterna 24 por frasco · vela 3</span>') + fx_luz() + '</div>'
        '<div>' + titulo('Barulho <span class="fx-dica">cada barulho alto: role 1d6 de encontro</span>')
        + fx_vazia(['Turno', 'O que fez barulho', '1d6'], 8, 'fx-barulho') + '</div>'
        '</div>'
        + titulo('Encontros <span class="fx-dica">atividade 1d12 · reação d20 + Car: 1–5 hostil, 6–9 desconfiada, '
                 '10–12 neutra, 13–16 curiosa, 17+ amigável</span>')
        + fx_vazia(['Turno', 'Onde', 'Quem ou o quê', 'Dist.', 'Atividade', 'Reação', 'Resultado'], 6, 'fx-encontros') +
        '<div class="fx-duas fx-fim">'
        '<div>' + titulo('Ordem de marcha') +
        '<div class="fx-marcha">' + ''.join(
            f'<div class="fx-pos"><span class="fh-num">{i}</span><span class="fx-linha"></span></div>' for i in range(1, 7)) +
        '</div><p class="fx-nota">1 vai na frente (pisa primeiro nas armadilhas); 6 fecha a retaguarda.</p></div>'
        '<div>' + titulo('Descanso') +
        '<p class="fx-nota"><b>Curto:</b> 1 vez por dia, 1 hora; recupera metade de PV, Mana e Sanidade. '
        '<b>Longo:</b> 8 horas e 1 ração; recupera tudo e remove 1 de exaustão. '
        '<b>Interrompido:</b> Constituição CD 12 ou perde o benefício. '
        '<b>Lugar perigoso:</b> 1d6 de encontro a cada 3 h (inseguro), 2 h (arriscado) ou 1 h (mortal).</p>'
        + fx_vazia(['Dia', 'Curto', 'Longo', 'Rações'], 2, 'fx-descanso') + '</div>'
        '</div>'
        '</div>'
    )
    return documento('Ficha de Exploração', folha)


# ------------------------------------------------------------ ficha de mundo (sessão 1)

ANCESTRAIS = ['Humano', 'Anão', 'Elfo', 'Drow', 'Meio-elfo', 'Halfling', 'Draconato',
              'Gnomo', 'Orc', 'Meio-orc', 'Tiefling', 'Goblin', 'Autômato']
AVENTURAS = ['Masmorra profunda', 'Explorar terras selvagens', 'Intriga na cidade',
             'Caçar um vilão', 'Guerra ou invasão', 'Horror e mistério']
TONS = ['Sombrio', 'Heroico', 'Cômico', 'Sério']


def mw_campos(*rotulos):
    return '<div class="mw-campos">' + ''.join(campo(r) for r in rotulos) + '</div>'


def mw_marcas(itens):
    return '<div class="mw-marcas">' + ''.join(
        f'<span><span class="fh-check"></span> {i}</span>' for i in itens) + '</div>'


def mw_votos(itens):
    return '<div class="mw-votos">' + ''.join(
        f'<div>{fx_bolas(5, 0, "fx-miudas")} {i}</div>' for i in itens) + '</div>'


def ficha_mundo():
    folha = (
        '<div class="fh-folha fx-folha mw-folha">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ficha de Mundo</div>'
        '<div class="mw-topo-campos">' + campo('Mesa') + campo('Data') + '</div>'
        '</header>'
        '<p class="fx-nota"><b>Como preencher.</b> Na primeira sessão, antes de criar os personagens. O grupo preenche junto, '
        'de cima para baixo, e todo mundo responde alguma coisa. Quem criou é a autoridade sobre aquilo; o Mestre pode vetar. '
        'Empacou? Fique com a primeira ideia e siga: o resto aparece jogando.</p>'
        '<div class="fx-duas mw-duas">'
        '<div>' + titulo('O Mundo') +
        mw_campos('Nome do mundo', 'Nome do continente', 'Idiomas mais falados',
                  'Algo estranho que todo mundo sabe', 'O maior perigo de hoje') +
        '</div>'
        '<div>' + titulo('A Cidade Inicial') +
        mw_campos('Nome da cidade', 'Vive de quê', 'Quem manda', 'O problema de agora',
                  'Onde o grupo costuma se encontrar') +
        '</div>'
        '</div>'
        + titulo('Os Deuses <span class="fx-dica">sacerdotes criam a sua divindade; quem segue uma é o especialista nela</span>') +
        '<p class="fx-nota">Comece pelo que o mundo precisa: luz, mar, fogo, morte, natureza, guerra, segredos, tempestade '
        '(veja a tabela de domínios em Divindades). Quem cuida da divindade conhece seus ritos, servos, inimigos e segredos, e vai inventando mais durante a campanha. '
        'Divindade sem dono fica com o Mestre.</p>'
        + fx_vazia(['Nome', 'Entidade', 'Domínio', 'Elemento', 'Duas responsabilidades', 'Quem cuida'], 6, 'mw-deuses') +
        titulo('Os Povos <span class="fx-dica">marque quem existe neste mundo</span>') +
        mw_marcas(ANCESTRAIS) +
        titulo('A Aventura <span class="fx-dica">cada um marca até duas bolinhas; o Mestre prepara a mais votada</span>') +
        '<div class="fx-duas mw-duas">'
        '<div><span class="fh-rotulo">Que tipo de aventura?</span>' + mw_votos(AVENTURAS) + '</div>'
        '<div><span class="fh-rotulo">Que tom?</span>' + mw_votos(TONS) +
        '<span class="fh-rotulo mw-rotulo-2">Como começamos?</span>' +
        mw_marcas(['Funil (nível 0)', 'Nível 1']) + '</div>'
        '</div>'
        + titulo('Cada Jogador <span class="fx-dica">adiciona algo à cidade e propõe um gancho; depois, todos votam no gancho</span>')
        + fx_vazia(['Jogador', 'Um lugar ou uma pessoa da cidade', 'Um gancho: o que nos tira de casa?', 'Votos'], 5, 'mw-ganchos') +
        '<div class="fx-duas mw-duas mw-fim">'
        '<div>' + titulo('O Grupo') + mw_campos('Por que estamos juntos') + '</div>'
        '<div>' + titulo('Segurança') + mw_campos('Linhas (não aparecem)', 'Véus (fora de cena)') + '</div>'
        '</div>'
        '</div>'
    )
    return documento('Ficha de Mundo', folha)


# ------------------------------------------------------------ quem é você (história do personagem)

def qv_secao(nome, arquivo='personagem/quem-e-voce.md'):
    """Linhas de uma seção do livro, a fonte das perguntas e tabelas destas fichas."""
    texto = (RAIZ / 'docs' / arquivo).read_text(encoding='utf-8')
    m = re.search(rf'^#+ {nome}\n(.*?)(?=^#|\Z)', texto, re.M | re.S)
    return m.group(1).splitlines()


def qv_negrito(texto):
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', texto)


def qv_perguntas(nome, arquivo='personagem/quem-e-voce.md'):
    return [m.group(1) for m in (re.match(r'\d+\. (.+)', l) for l in qv_secao(nome, arquivo)) if m]


def qv_linhas(linhas):
    return [[c.strip() for c in l.strip('|').split('|')]
            for l in linhas if l.startswith('|') and not l.startswith('|---')]


def qv_render(linhas, cls=''):
    th = ''.join(f'<th>{c}</th>' for c in linhas[0])
    tr = ''.join('<tr>' + ''.join(f'<td>{qv_negrito(c)}</td>' for c in l) + '</tr>' for l in linhas[1:])
    return f'<table class="fx-tab qv-tab {cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'


def qv_tabela(nome, cls=''):
    return qv_render(qv_linhas(qv_secao(nome)), cls)


def qv_linha(texto):
    return f'<div class="qv-pergunta"><span>{texto}</span></div>'


def qv_cartao(n, perguntas):
    return (
        f'<div class="qv-cartao"><div class="qv-nome"><span class="fh-num">{n}</span>' + campo('Nome') + '</div>'
        + ''.join(qv_linha(p) for p in perguntas) + qv_linha('Se morreu, como?') + '</div>'
    )


def ficha_quem_e_voce():
    funil = qv_perguntas('No Funil')
    frente = (
        '<div class="fh-folha fx-folha qv-folha">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Quem É Você?</div>'
        '<div class="qv-topo-campo">' + campo('Jogador') + '</div>'
        '</header>'
        '<p class="fx-nota"><b>Como usar.</b> Responda em uma linha e fique com a primeira ideia: o resto aparece jogando. '
        'Empacou? Vire a folha: as tabelas do verso dão ideias para rolar ou escolher.</p>'
        '<div class="qv-faixa">Nível 0: os 4 do Funil <span>uma frase para cada; não pense muito, eles podem morrer em 20 minutos</span></div>'
        '<div class="qv-cartoes">' + ''.join(qv_cartao(n, funil) for n in range(1, 5)) + '</div>'
        '<div class="qv-faixa">Nível 1: quem avança <span>o sobrevivente que você escolher, ou seu personagem, se o jogo já começa no nível 1</span></div>'
        '<div class="qv-nivel1">'
        '<div class="qv-mestre">' + campo('Nome') + campo('Classe') + campo('Ancestralidade') + '</div>'
        + titulo('O Conceito <span class="fx-dica">uma frase: sou um coveiro, que quer ver o mar, mas deve a vida a quem não devia</span>') +
        '<div class="qv-conceito"><div><b>Sou</b><i></i></div><div><b>que quer</b><i></i></div><div><b>mas</b><i></i></div></div>'
        + titulo('As Perguntas') +
        '<div class="qv-perguntas">' + ''.join(qv_linha(p) for p in qv_perguntas('As Perguntas')) +
        qv_linha('Veio do Funil? Quem não voltou, e o que você fez ou deixou de fazer?') + '</div>'
        + titulo('Da Tabela <span class="fx-dica">role ou escolha no verso; o segredo você conta só ao Mestre, se quiser</span>') +
        '<div class="qv-quatro">' + campo('Trope') + campo('Motivação') + campo('Segredo') + campo('Mania') + '</div>'
        + titulo('Laço <span class="fx-dica">com o personagem do jogador à sua esquerda</span>') +
        '<div class="qv-laco">' + campo('Com quem') + campo('Qual') + '</div>'
        + titulo('Para o Mestre <span class="fx-dica">escreva sabendo que serão usadas</span>') +
        '<div class="qv-mestre">' + campo('Uma pessoa querida') + campo('Um inimigo') + campo('Um lugar') + '</div>'
        '</div>'
        '</div>'
    )
    verso = (
        '<div class="fh-folha fx-folha qv-folha qv-verso">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ideias</div>'
        '</header>'
        '<p class="fx-nota"><b>Role ou escolha, e mude o que quiser.</b> Quando seu segredo, sua mania ou seu juramento complicar sua vida em cena, '
        'isso é boa interpretação: o Mestre pode dar Inspiração.</p>'
        '<div class="fx-duas qv-duas">'
        '<div class="qv-pilha">' + qv_tabela('Tropes', 'qv-d') + qv_tabela('Laços', 'qv-d') + '</div>'
        '<div class="qv-pilha">' + qv_tabela('Motivações', 'qv-d') + qv_tabela('Segredos', 'qv-d') + qv_tabela('Manias', 'qv-d') + '</div>'
        '</div>'
        '</div>'
    )
    return documento('Quem É Você?', frente + verso)


# ------------------------------------------------------------ ficha de divindade

def dv_tabelas():
    """Tabelas de docs/divindades.md, pela segunda coluna do cabeçalho."""
    tabelas, atual = {}, []
    for linha in (RAIZ / 'docs' / 'divindades.md').read_text(encoding='utf-8').splitlines() + ['']:
        if linha.startswith('|'):
            atual.append(linha)
        elif atual:
            linhas = qv_linhas(atual)
            tabelas[linhas[0][1]] = linhas
            atual = []
    return tabelas


def dv_compacta(titulo_tab, linhas):
    """Só o nome e o custo, em duas metades; o efeito fica no livro."""
    itens = [(l[0], re.search(r'\*\*(.+?)\.\*\*', l[1]).group(1), l[2].replace('Todo o Limite', 'Limite'))
             for l in linhas[1:]]
    meio = len(itens) // 2
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in a + b) + '</tr>'
                 for a, b in zip(itens[:meio], itens[meio:]))
    return (f'<table class="fx-tab qv-tab dv-compacta"><thead><tr><th>d20</th><th>{titulo_tab}</th><th>Custo</th>'
            f'<th></th><th></th><th></th></tr></thead><tbody>{tr}</tbody></table>')


def ficha_divindade():
    t = dv_tabelas()
    frente = (
        '<div class="fh-folha fx-folha qv-folha dv-frente">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ficha de Divindade</div>'
        '<div class="mw-topo-campos">' + campo('Personagem') + campo('Jogador') + '</div>'
        '</header>'
        '<p class="fx-nota"><b>Você é a autoridade.</b> Quando surgir uma pergunta sobre a sua divindade, você responde; o Mestre pode vetar. '
        'Responda em uma linha e invente o resto durante a campanha. Empacou? Vire a folha: o verso tem ideias para rolar ou escolher.</p>'
        '<div class="qv-faixa">A Divindade</div>'
        '<div class="qv-nivel1">'
        '<div class="qv-mestre">' + campo('Nome') + campo('Entidade') + campo('Tendência (opcional)') + '</div>'
        '<div class="dv-dominio">' + campo('Domínio') + campo('Elemento') + campo('Vantagem em testes para...') + '</div>'
        '<div class="dv-vinculos">'
        '<div><span class="fh-check"></span> <b>Devoção.</b> Você serve por fé. As responsabilidades são regras de conduta.</div>'
        '<div><span class="fh-check"></span> <b>Pacto.</b> Você fez um acordo. As responsabilidades são o preço.</div>'
        '</div>'
        '<div class="qv-quatro">' + campo('1ª responsabilidade') + campo('2ª responsabilidade') + '</div>'
        '<div class="dv-sagrados">' + campo('Símbolo') + campo('Arma sagrada') + campo('Animal sagrado') + campo('Lugar sagrado') + '</div>'
        '</div>'
        '<div class="qv-faixa">As Bênçãos <span>não gastam avanços; o milagre sai uma vez por descanso longo, sem gastar Mana</span></div>'
        '<div class="qv-nivel1">'
        '<div class="dv-bencao"><b>Nível 1</b>' + campo('Menor (passiva)') + '</div>'
        '<div class="dv-bencao"><b>Nível 5</b>' + campo('Maior (ativa)') + campo('Custo') + '</div>'
        '<div class="dv-bencao"><b>Nível 9</b>' + campo('Milagre (ativa)') + campo('Custo') + '</div>'
        '</div>'
        '<div class="qv-faixa">O Que Só Você Sabe</div>'
        '<div class="qv-nivel1"><div class="dv-perguntas">'
        + ''.join(qv_linha(p) for p in qv_perguntas('Dando Vida à Divindade', 'divindades.md')) +
        '</div></div>'
        '<div class="qv-faixa">Se Quebrar uma Responsabilidade</div>'
        '<div class="qv-nivel1">'
        '<p class="fx-nota">Você perde as bênçãos e as habilidades divinas, e sua Sanidade máxima diminui em 2. Escolha um caminho: '
        '<b>Penitência</b> (o Mestre define uma missão ou um sacrifício; ao cumprir, você recupera tudo), '
        '<b>Nova divindade</b> (recupera a Sanidade máxima e recebe as bênçãos dela) ou '
        '<b>Sem divindade</b> (o Mestre define a jornada; ao final, +10 de Sanidade máxima, sem bênçãos). Veja Divindades.</p>'
        + campo('O que você quebrou e o que está fazendo a respeito') +
        '</div>'
        '</div>'
    )
    verso = (
        '<div class="fh-folha fx-folha qv-folha dv-verso">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ideias para a Divindade</div>'
        '</header>'
        '<p class="fx-nota"><b>Role ou escolha, e mude o que quiser.</b> Na tabela do seu vínculo, role duas vezes na coluna de responsabilidades.</p>'
        '<div class="fx-duas qv-duas">'
        '<div>' + qv_render(t['Devoção: a divindade é...'], 'dv-tres') + '</div>'
        '<div>' + qv_render(t['Pacto: a entidade é...'], 'dv-tres') + '</div>'
        '</div>'
        '<div class="fx-duas qv-duas dv-bloco">'
        '<div>' + qv_render(t['Domínio'], 'dv-tres') + '</div>'
        '<div>' + qv_render(t['Bênção menor (passiva)'], 'qv-d') + '</div>'
        '</div>'
        '<div class="fx-duas qv-duas dv-bloco">'
        '<div>' + dv_compacta('Bênção maior', t['Bênção maior (ativa)']) + '</div>'
        '<div>' + dv_compacta('Milagre', t['Milagre (ativa, 1 vez por descanso longo)']) + '</div>'
        '</div>'
        '<p class="fx-nota dv-efeitos">Os efeitos das bênçãos maiores e dos milagres estão em Divindades.</p>'
        '<div class="dv-tres-colunas dv-bloco">'
        + qv_render(t['O que ela quer'], 'qv-d')
        + qv_render(t['Como ela fala com você'], 'qv-d')
        + qv_render(t['Quando ela se desagrada'], 'qv-d') +
        '</div>'
        '</div>'
    )
    return documento('Ficha de Divindade', frente + verso)


# ------------------------------------------------------------ o plano (grupo)

PLANO = 'fichas/plano.md'


def pl_passos(n):
    tr = ''.join(f'<tr><td class="fx-hora">{i}</td><td></td><td></td><td></td></tr>' for i in range(1, n + 1))
    return ('<table class="fx-tab pl-passos"><thead><tr><th></th><th>O que fazemos</th><th>Quem</th><th>Se der errado</th></tr></thead>'
            f'<tbody>{tr}</tbody></table>')


def ficha_plano():
    regras = ''.join(f'<p>{qv_negrito(l)}</p>' for l in qv_secao('Regras a Seu Favor', PLANO) if l.startswith('**'))
    perguntas = ''.join(f'<li>{p}</li>' for p in qv_perguntas('Antes de Agir', PLANO))
    frente = (
        '<div class="fh-folha fx-folha qv-folha pl-frente">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">O Plano</div>'
        '<div class="mw-topo-campos">' + campo('Missão') + campo('Data') + '</div>'
        '</header>'
        '<p class="fx-nota"><b>Como usar.</b> O grupo preenche junto, antes de agir. Não precisa ser perfeito: um plano que cabe nesta folha já é melhor que nenhum. '
        'Empacou? Vire a folha.</p>'
        '<div class="qv-faixa">O Objetivo</div>'
        '<div class="qv-nivel1">' + campo('O que queremos, em uma frase') +
        '<div class="qv-quatro">' + campo('Como saberemos que deu certo') + campo('Quando desistimos') + '</div></div>'
        '<div class="qv-faixa">O Que Sabemos</div>'
        + fx_vazia(['Vimos com os próprios olhos', 'Só ouvimos dizer', 'Como descobrir o resto'], 4, 'pl-sabemos') +
        '<div class="qv-faixa">O Obstáculo</div>'
        '<div class="qv-nivel1"><div class="dv-perguntas">'
        + qv_linha('O que está no caminho?') + qv_linha('Dá para evitar, enganar, comprar ou assustar?')
        + qv_linha('O que ele quer ou teme?') + qv_linha('O que este lugar nos oferece?') +
        '</div></div>'
        '<div class="qv-faixa">Passo a Passo</div>'
        + pl_passos(6) +
        '<div class="fx-duas qv-duas">'
        '<div><div class="qv-faixa">O Que Levamos</div><div class="qv-nivel1">'
        + campo('Luz') + campo('Comida e água') + campo('Comprar antes de sair') +
        '</div></div>'
        '<div><div class="qv-faixa">Quando Der Errado</div><div class="qv-nivel1">'
        + campo('Sinal de retirada') + campo('Rota de fuga') + campo('Ponto de encontro') +
        '</div></div>'
        '</div>'
        '</div>'
    )
    verso = (
        '<div class="fh-folha fx-folha qv-folha qv-verso pl-verso">'
        '<header class="fh-topo fx-topo">' + LOGO +
        '<div class="fh-titulo-folha">Ideias para o Plano</div>'
        '</header>'
        '<p class="fx-nota"><b>Conte ao Mestre o que quer fazer, e o Mestre diz o que precisa de teste.</b> Uma boa ideia pode valer mais que uma boa rolagem.</p>'
        '<div class="fx-duas qv-duas">'
        '<div>' + qv_render(qv_linhas(qv_secao('Truques', PLANO)), 'qv-d') + '</div>'
        '<div class="qv-pilha">' + titulo('Antes de Agir') + f'<ol class="pl-lista">{perguntas}</ol>'
        + qv_render(qv_linhas(qv_secao('O Que Pode Dar Errado', PLANO)), 'qv-d') +
        '<p class="fx-nota">Antes de sair, role uma vez e responda: o que fazemos se isso acontecer?</p></div>'
        '</div>'
        + titulo('Regras a Seu Favor') +
        f'<div class="pl-regras">{regras}</div>'
        + titulo('Rascunho do Lugar <span class="fx-dica">desenhe o que vocês viram: entradas, guardas, rota de fuga</span>') +
        '<div class="pl-rascunho"></div>'
        '</div>'
    )
    return documento('O Plano', frente + verso)


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
    fichas = [
        ('ficha-personagem', ficha_personagem), ('ficha-funil', ficha_funil),
        ('referencia-jogador', referencia_jogador), ('referencia-mestre', referencia_mestre),
        ('guia-criacao', guia_criacao), ('ficha-exploracao', ficha_exploracao),
        ('ficha-mundo', ficha_mundo), ('ficha-quem-e-voce', ficha_quem_e_voce),
        ('ficha-divindade', ficha_divindade), ('ficha-plano', ficha_plano),
    ]
    for nome, gerar in fichas:
        html = BUILD / f'{nome}.html'
        html.write_text(gerar(), encoding='utf-8')
        pdf = SAIDA / f'{nome}.pdf'
        imprimir(chrome, html, pdf)
        print(f'{pdf.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
