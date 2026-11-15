"""Gera o material do evento da APR em PDF.

Lê campanhas/evento-apr/personagens.md (um `##` por personagem), monta
uma ficha pronta A4 para cada um e imprime tudo num PDF com o Chrome
headless, usando as funções de fichas/gerar_fichas.py.

Uso, na raiz do projeto:

    python campanhas/evento-apr/gerar.py
"""
import base64
import html
import pathlib
import re
import subprocess
import sys

import markdown

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
sys.path.insert(0, str(RAIZ / 'fichas'))
import gerar_fichas as gf  # noqa: E402

BUILD = AQUI / 'build'
SAIDA = AQUI / 'pdf'

SIGLAS = ['For', 'Des', 'Con', 'Int', 'Sab', 'Car']


def mod(valor):
    m = (valor - 10) // 2
    return f'+{m}' if m >= 0 else str(m)


def md(texto):
    return markdown.markdown(texto, extensions=['tables', 'attr_list'])


def ler_personagens():
    texto = (AQUI / 'personagens.md').read_text(encoding='utf-8')
    blocos = re.split(r'^## ', texto, flags=re.M)[1:]
    personagens = []
    for bloco in blocos:
        nome, _, resto = bloco.partition('\n')
        topo, *secoes = re.split(r'^### ', resto, flags=re.M)
        campos = dict(re.findall(r'^\*\*(.+?)\.\*\* (.+)$', topo, flags=re.M))
        partes = {}
        for s in secoes:
            titulo, _, corpo = s.partition('\n')
            partes[titulo.strip()] = corpo.strip()
        personagens.append({'nome': nome.strip(), 'campos': campos, 'secoes': partes})
    return personagens



COMO_JOGAR = (
    '<footer class="pp-turno"><div class="pp-turno-tit">Como jogar</div><div class="pp-turno-col">'
    + ''.join(f'<p><b>{t}.</b> {x}</p>' for t, x in [
        ('Seu turno', '1 ação, 1 movimento de até 6 casas e 1 ação livre (sacar arma, abrir porta, beber poção). '
                      'Troque a ação por mais um movimento, se quiser.'),
        ('Reação', '1 por rodada, fora do seu turno. Se um inimigo sair do seu alcance, você pode atacá-lo.'),
        ('Atacar', 'd20 + bônus de ataque, igual ou maior que a CA do alvo. 20 natural: crítico, dobre os dados de dano.'),
        ('Testes', 'd20 + modificador do atributo, igual ou maior que a CD. Vantagem: role 2d20 e fique com o maior. '
                   'Desvantagem: com o menor.'),
        ('Mana', 'Habilidades gastam Mana. Gaste até 3 a mais para aumentar o efeito. Sem Mana, pague com Sanidade, 1 por 1.'),
        ('1 natural', 'Tirar 1 no d20 custa 1 de Sanidade.'),
        ('Distâncias', 'Adjacente: 1 casa. Perto: até 6. Longe: até 12. Muito longe: 13 ou mais. '
                       'Área pequena: 3 × 3 casas. Média: 5 × 5.'),
        ('0 PV', 'Você cai, morrendo, e morre em rodadas iguais ao seu modificador de Constituição (mínimo 1). '
                 'Qualquer cura levanta você.'),
        ('Inspiração', '2 por sessão. Gaste 1 para rolar de novo um ataque ou teste seu, ou dê para um amigo.'),
    ])
    + '</div><div class="pp-turno-pe">Marque PV e Mana com dados, fichas ou a lápis. Use o verso para anotações.</div></footer>'
)


def ficha(p):
    c = p['campos']
    s = p['secoes']
    valores = [int(v) for v in re.findall(r'\d+', c['Atributos'])]
    atributos = ''.join(
        f'<div class="pp-attr"><span class="pp-attr-nome">{sig}</span>'
        f'<span class="pp-attr-mod">{mod(v)}</span><span class="pp-attr-val">{v}</span></div>'
        for sig, v in zip(SIGLAS, valores)
    )

    def caixa(rotulo, valor, sub=''):
        sub = f'<span class="pp-sub">{sub}</span>' if sub else ''
        return f'<div class="pp-num"><span class="pp-rot">{rotulo}</span><span class="pp-max">{valor}</span>{sub}</div>'

    numeros = (
        caixa('PV', c['PV']) + caixa('CA', c['CA']) + caixa('Mana', c['Mana'], 'extra: até 3 por uso')
        + caixa('Sanidade', c['Sanidade']) + caixa('CD', c['CD'], 'de habilidade')
        + caixa('Movimento', c['Movimento'], 'casas')
    )
    nomes = ' · '.join(html.escape(n.strip()) for n in c['Nomes'].split(','))
    arquivo = RAIZ / 'docs' / 'assets' / 'images' / 'classes' / f'{c["Arte"]}.webp'
    arte = 'data:image/webp;base64,' + base64.b64encode(arquivo.read_bytes()).decode()
    return (
        '<section class="fh-folha pp-folha">'
        '<div class="pp-cima"><div class="pp-esq">'
        f'{gf.LOGO}'
        f'<h1>{html.escape(p["nome"])}</h1>'
        f'<div class="pp-conceito">{html.escape(c["Conceito"])} · {html.escape(c["Tendência"])}</div>'
        f'<div class="pp-linha">{md("**Antecedente:** " + c["Antecedente"])[3:-4]}</div>'
        f'<div class="pp-nomes"><span class="pp-rot">Escolha um nome</span> {nomes} <i>ou invente o seu</i></div>'
        f'<div class="pp-numeros">{numeros}</div>'
        f'<div class="pp-atributos">{atributos}</div>'
        '</div>'
        f'<img class="pp-arte" src="{arte}" alt="">'
        '</div>'
        f'<div class="pp-quem">{md("**Quem é você.** " + c["Quem é"])}</div>'
        f'<h2>Ataques</h2><div class="pp-ataques">{md(s["Ataques"])}</div>'
        f'<h2>Habilidades</h2><div class="pp-habs">{md(s["Habilidades"])}</div>'
        '<div class="pp-duas">'
        f'<div><h2>Traços</h2>{md(s["Traços"])}</div>'
        f'<div><h2>Equipamento</h2>{md(s["Equipamento"])}</div>'
        '</div>'
        f'{COMO_JOGAR}'
        '</section>'
    )


CSS = """
@import url("https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap");
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.fh-folha {
  width: 210mm; height: 297mm; padding: 9mm 11mm 8mm; overflow: hidden;
  background: #fff; color: #111; font-family: "EB Garamond", Georgia, serif;
  font-size: 11pt; line-height: 1.28; break-after: page; position: relative;
  display: flex; flex-direction: column;
}
.fh-folha:last-child { break-after: auto; }
.fh-logo { display: flex; align-items: center; gap: 2mm; font-family: "IM Fell English SC", serif;
  font-size: 13pt; letter-spacing: .04em; line-height: 1; }
.fh-logo svg { width: 9mm; height: 9mm; }
.pp-rot, h1, h2, .pp-attr-nome { font-family: "IM Fell English SC", "EB Garamond", serif; letter-spacing: .04em; }
p { margin: 0 0 1.3mm; }
.pp-cima { display: grid; grid-template-columns: 1fr 54mm; gap: 5mm; align-items: center;
  border-bottom: 2px solid #111; padding-bottom: 2mm; }
.pp-esq { display: flex; flex-direction: column; gap: 1.6mm; }
.pp-esq .fh-logo { font-size: 11pt; }
.pp-esq .fh-logo svg { width: 7mm; height: 7mm; }
h1 { font-size: 30pt; margin: 0; line-height: .95; font-weight: normal; }
.pp-conceito { font-size: 12.5pt; font-weight: bold; }
.pp-linha { font-size: 10pt; }
.pp-nomes { font-size: 11.5pt; border: 1px solid #111; border-radius: 2mm; padding: 1mm 2.5mm; }
.pp-nomes .pp-rot { font-size: 9pt; margin-right: 1.5mm; }
.pp-nomes i { font-size: 9.5pt; color: #444; margin-left: 1mm; }
.pp-arte { width: 54mm; height: 72mm; object-fit: contain; }
.pp-numeros { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6mm; }
.pp-num { border: 2px solid #111; border-radius: 2mm; text-align: center; padding: .6mm 1mm; display: flex;
  flex-direction: column; justify-content: center; }
.pp-rot { font-size: 9pt; text-transform: uppercase; }
.pp-max { font-size: 16pt; font-weight: bold; line-height: 1; }
.pp-sub { font-size: 7.5pt; }
.pp-atributos { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.4mm; }
.pp-attr { border: 1px solid #111; border-radius: 2mm; text-align: center; padding: .8mm; }
.pp-attr-nome { display: block; font-size: 9pt; }
.pp-attr-mod { display: block; font-size: 14pt; font-weight: bold; line-height: 1.05; }
.pp-attr-val { display: block; font-size: 8pt; color: #444; }
.pp-quem { margin-top: 2.5mm; font-style: italic; }
h2 { font-size: 12pt; font-weight: normal; margin: 2mm 0 1mm; border-bottom: 1px solid #111; text-transform: uppercase; }
.pp-ataques table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.pp-ataques th { text-align: left; font-family: "IM Fell English SC", serif; border-bottom: 1px solid #111; font-weight: normal; }
.pp-ataques td, .pp-ataques th { padding: .5mm 1.5mm; }
.pp-ataques tr:nth-child(even) td { background: #eee; }
.pp-habs { font-size: 10.6pt; }
.pp-habs p { padding-left: 3mm; text-indent: -3mm; margin-bottom: 1.6mm; }
.pp-duas { display: grid; grid-template-columns: 1.4fr 1fr; gap: 5mm; font-size: 9.6pt; }
.pp-turno { margin-top: auto; border: 2px solid #111; border-radius: 2mm; padding: 1.2mm 3mm 1mm; font-size: 8.6pt; line-height: 1.18; }
.pp-turno-tit { font-family: "IM Fell English SC", serif; font-size: 11pt; text-transform: uppercase; letter-spacing: .04em;
  border-bottom: 1px solid #111; margin-bottom: 1mm; }
.pp-turno-col { column-count: 3; column-gap: 5mm; }
.pp-turno-col p { break-inside: avoid; margin-bottom: 1mm; }
.pp-turno-pe { border-top: 1px solid #111; margin-top: .5mm; padding-top: .8mm; text-align: center; font-weight: bold; font-size: 9pt; }
.pp-medida { display: none; }
"""


# Mede quanto sobra entre os blocos e o rodapé de cada folha (veja conferir()).
MEDIDA = (
    '<script>addEventListener("load", () => setTimeout(() => {'
    'const m = document.createElement("pre"); m.className = "pp-medida"; m.id = "medida";'
    'm.textContent = [...document.querySelectorAll(".fh-folha")].map(f => f.querySelector("h1").textContent + "="'
    ' + Math.round((f.querySelector(".pp-turno").getBoundingClientRect().top'
    ' - f.querySelector(".pp-duas").getBoundingClientRect().bottom'
    ' - Math.max(0, f.querySelector(".pp-turno").getBoundingClientRect().bottom'
    ' - f.getBoundingClientRect().bottom + 30)) / 3.78)).join("; ");'
    'document.body.appendChild(m); }, 300));</script>'
)


def documento(corpo, titulo='Personagens Prontos', css=None, medida=None):
    css = CSS if css is None else css
    medida = MEDIDA if medida is None else medida
    return (
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
        f'<title>{titulo}</title><style>{css}</style></head><body>{corpo}{medida}</body></html>'
    )


# ------------------------------------------------------------ encontros

# Arquivos de encontro: tudo antes de "## Criaturas" vai na frente; dali em diante, no verso.
ENCONTROS = [('1-goblins-mestre.md', 'encontro-1-goblins'), ('2-companhia-mestre.md', 'encontro-2-companhia'), ('3-fenda-mestre.md', 'encontro-3-fenda'),
             ('lista-material-mestre.md', 'lista-material')]

CSS_EN = """
@import url("https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap");
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
.fh-folha { width: 210mm; height: 297mm; padding: 9mm 10mm 8mm; overflow: hidden; background: #fff; color: #111;
  font-family: "EB Garamond", Georgia, serif; font-size: 10.2pt; line-height: 1.22; break-after: page;
  display: flex; flex-direction: column; }
.fh-folha:last-child { break-after: auto; }
.fh-logo { display: flex; align-items: center; gap: 1.5mm; font-family: "IM Fell English SC", serif; font-size: 10pt; }
.fh-logo svg { width: 6mm; height: 6mm; }
.en-topo { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 2px solid #111;
  padding-bottom: 1.5mm; margin-bottom: 2mm; }
.en-topo h1 { font-family: "IM Fell English SC", serif; font-weight: normal; font-size: 24pt; margin: 0; line-height: 1; }
.en-topo .en-lado { text-align: right; font-size: 8.5pt; font-style: italic; }
.en-colunas { flex: 1; min-height: 0; column-count: 2; column-gap: 6mm; column-fill: auto;
  column-rule: 1px solid #bbb; }
.en-colunas h2 { font-family: "IM Fell English SC", serif; font-weight: normal; font-size: 12.5pt; text-transform: uppercase;
  letter-spacing: .04em; margin: 2.2mm 0 1mm; border-bottom: 1px solid #111; break-after: avoid; }
.en-colunas h2:first-child { margin-top: 0; }
.en-colunas p { margin: 0 0 1.4mm; }
.en-colunas table { width: 100%; border-collapse: collapse; margin: 0 0 1.6mm; font-size: 10pt; break-inside: avoid; }
.en-colunas th { font-family: "IM Fell English SC", serif; font-weight: normal; text-align: left; border-bottom: 1px solid #111; }
.en-colunas td, .en-colunas th { padding: .3mm 1mm; }
.en-colunas tr:nth-child(even) td { background: #eee; }
.en-lista .en-colunas { font-size: 11pt; }
.en-lista ul { list-style: none; padding: 0; margin: 0 0 1mm; }
.en-lista li { padding-left: 6mm; text-indent: -6mm; margin-bottom: .9mm; break-inside: avoid; }
.en-lista li::before { content: ""; display: inline-block; width: 3.4mm; height: 3.4mm; border: 1.3px solid #111;
  border-radius: .6mm; margin-right: 2.6mm; vertical-align: -.4mm; }
.en-colunas .destaque { border: 2px solid #111; border-radius: 2mm; padding: 1.4mm 2.5mm; background: #eee;
  break-inside: avoid; }
.en-colunas h3 { font-family: "IM Fell English SC", serif; font-weight: normal; font-size: 11pt; letter-spacing: .04em;
  margin: 2mm 0 .8mm; break-after: avoid; }
.en-verso .en-colunas { column-count: 1; font-size: 12.8pt; line-height: 1.32; }
.en-verso .en-colunas > p { break-inside: avoid; border: 1px solid #111; border-radius: 2mm; padding: 1.6mm 3mm; margin-bottom: 2.4mm; }
.en-verso .en-colunas h2 { font-size: 14pt; }
"""

MEDIDA_EN = (
    '<script>addEventListener("load", () => setTimeout(() => {'
    'const m = document.createElement("pre"); m.className = "pp-medida"; m.id = "medida"; m.style.display = "none";'
    'm.textContent = [...document.querySelectorAll(".en-colunas")].map((c, i) => {'
    ' const r = c.getBoundingClientRect(), u = c.lastElementChild.getBoundingClientRect();'
    ' if (c.scrollWidth > c.clientWidth + 2 || u.right > r.right + 2) return "pág " + (i + 1) + "=PASSOU";'
    ' const col = u.left < r.left + r.width / 2 ? "1ª coluna" : "2ª coluna";'
    ' return "pág " + (i + 1) + "=" + Math.round((r.bottom - u.bottom) / 3.78) + " (" + col + ")"; }).join("; ");'
    'document.body.appendChild(m); }, 300));</script>'
)


def encontro(arquivo):
    texto = (AQUI / arquivo).read_text(encoding='utf-8')
    titulo, _, corpo = texto.partition('\n')
    titulo = titulo.lstrip('# ').strip()
    def folha(conteudo, lado, cls=''):
        return (
            f'<section class="fh-folha {cls}"><header class="en-topo"><div>{gf.LOGO}<h1>{html.escape(titulo)}</h1></div>'
            f'<div class="en-lado">Material do Mestre · Evento APR<br>{lado}</div></header>'
            f'<div class="en-colunas">{md(conteudo)}</div></section>'
        )

    frente, achou, verso = corpo.partition('\n## Criaturas')
    verso = '## Criaturas' + verso

    if achou:
        corpo_html = folha(frente, 'Frente: a aventura') + folha(verso, 'Verso: criaturas e prisioneiros', 'en-verso')
    else:  # folha única, como a lista de material
        corpo_html = folha(frente, 'Para arrumar a caixa', 'en-lista')
    return documento(corpo_html, titulo, CSS_EN, MEDIDA_EN)


def main():
    BUILD.mkdir(parents=True, exist_ok=True)
    SAIDA.mkdir(parents=True, exist_ok=True)
    chrome = gf.achar_chrome()
    personagens = ler_personagens()
    html_path = BUILD / 'personagens-prontos.html'
    html_path.write_text(documento(''.join(ficha(p) for p in personagens)), encoding='utf-8')
    pdf = SAIDA / 'personagens-prontos.pdf'
    gf.imprimir(chrome, html_path, pdf)
    print(pdf.relative_to(RAIZ), f'({len(personagens)} fichas)')
    conferir(chrome, html_path)
    for arquivo, nome in ENCONTROS:
        html_path = BUILD / f'{nome}.html'
        html_path.write_text(encontro(arquivo), encoding='utf-8')
        pdf = SAIDA / f'{nome}.pdf'
        gf.imprimir(chrome, html_path, pdf)
        print(pdf.relative_to(RAIZ))
        conferir(chrome, html_path)


def conferir(chrome, html_path):
    """Mostra quantos mm sobram em cada folha; negativo = o texto passou da margem."""
    saida = subprocess.run([
        chrome, '--headless=new', '--disable-gpu', f'--user-data-dir={gf.BUILD / "perfil-chrome"}',
        '--virtual-time-budget=5000', '--dump-dom', html_path.as_uri(),
    ], capture_output=True, text=True, encoding='utf-8', timeout=120).stdout
    achado = re.search(r'<pre[^>]*id="medida"[^>]*>(.*?)</pre>', saida)
    print('sobra (mm):', achado.group(1) if achado else 'não medida')


if __name__ == '__main__':
    main()
