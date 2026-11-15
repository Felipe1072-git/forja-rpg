"""Escreve os nomes no mapa de Drayone (Aethelgard) e gera os mapas de cada aventura.

Parte do mapa limpo de Dyson Logos e grava os mapas do site:
    python campanhas/aethelgard/mapa.py

Lugar novo: acrescente uma linha em NOMES: (texto, x, y, estilo).
x e y são o canto superior esquerdo do texto, em pixels do mapa (1500 x 1029).

Mapa de aventura: acrescente uma linha em DESTAQUES com os hexágonos
(coordenadas axiais q, r; veja hexagono_em) e o nome que fica colorido.

Também grava o exemplo de viagem do livro (docs/jogo/viagem.md): um recorte
do mapa, sem nomes, com a rota, o perigo de cada hexágono e os acampamentos.
"""
import math
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / 'docs' / 'assets' / 'images' / 'aethelgard'
FONTES = {  # arquivo, tamanho, espaço entre letras, contorno branco
    'cidade': (r'C:\Windows\Fonts\BOOKOSB.TTF', 38, 4, 7),
    'lugar': (r'C:\Windows\Fonts\BOOKOSB.TTF', 26, 3, 7),
    'regiao': (r'C:\Windows\Fonts\BOOKOSBI.TTF', 30, 5, 11),
}

NOMES = [
    ('JAVA', 1352, 356, 'cidade'),
    ('TORRE VERMELHA', 585, 308, 'lugar'),
    ('FLORESTA BRANCA', 175, 168, 'regiao'),
    ('DESERTO DE PEDRA', 70, 955, 'regiao'),
]

# Grade de hexágonos do mapa (topo plano), medida sobre as linhas vermelhas.
LADO, ORIGEM_X, ORIGEM_Y = 49.6, -33.25, -87.25
COR = (29, 78, 196)


def vizinhos(q, r):
    """O hexágono e os seis em volta."""
    return [(q, r), (q + 1, r), (q + 1, r - 1), (q, r - 1), (q - 1, r), (q - 1, r + 1), (q, r + 1)]


DESTAQUES = {  # arquivo: (hexágonos, nome colorido)
    'mapa-cidadela.webp': ([(10, -1)], 'TORRE VERMELHA'),
    'mapa-cidade-perdida.webp': (vizinhos(3, 9), 'DESERTO DE PEDRA'),
}


def centro(q, r):
    return (ORIGEM_X + 1.5 * LADO * q, ORIGEM_Y + math.sqrt(3) * LADO * (r + q / 2))


def cantos(q, r):
    cx, cy = centro(q, r)
    return [(cx + LADO * math.cos(math.radians(60 * i)), cy + LADO * math.sin(math.radians(60 * i)))
            for i in range(6)]


def hexagono_em(x, y):
    """Coordenadas axiais (q, r) do hexágono que contém o pixel (x, y)."""
    px, py = x - ORIGEM_X, y - ORIGEM_Y
    cq = (2 / 3 * px) / LADO
    cr = (-1 / 3 * px + math.sqrt(3) / 3 * py) / LADO
    cs = -cq - cr
    q, r, s = round(cq), round(cr), round(cs)
    dq, dr, ds = abs(q - cq), abs(r - cr), abs(s - cs)
    if dq > dr and dq > ds:
        q = -r - s
    elif dr > ds:
        r = -q - s
    return q, r


def destacar(im, hexagonos):
    """Pinta os hexágonos de leve e contorna a borda externa do grupo."""
    camada = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for h in hexagonos:
        d.polygon(cantos(*h), fill=COR + (45,))
    im.alpha_composite(camada)
    d = ImageDraw.Draw(im)
    vizinho_do_lado = [(1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1)]  # lado i liga o canto i ao i+1
    grupo = set(hexagonos)
    for q, r in hexagonos:
        c = cantos(q, r)
        for i, (dq, dr) in enumerate(vizinho_do_lado):
            if (q + dq, r + dr) not in grupo:
                d.line([c[i], c[(i + 1) % 6]], fill=COR + (255,), width=6, joint='curve')


def escrever(d, texto, x, y, estilo, cor):
    arquivo, tamanho, espaco, contorno = FONTES[estilo]
    fonte = ImageFont.truetype(arquivo, tamanho)
    x0 = x
    for letra in texto:  # primeiro o contorno branco de tudo, depois as letras
        d.text((x, y), letra, font=fonte, fill='white', stroke_width=contorno, stroke_fill='white')
        x += d.textlength(letra, font=fonte) + espaco
    x = x0
    for letra in texto:
        d.text((x, y), letra, font=fonte, fill=cor)
        x += d.textlength(letra, font=fonte) + espaco
    return x


def gerar(arquivo, hexagonos=(), colorido=None):
    im = Image.open(PASTA / 'mapa-drayone-limpo.webp').convert('RGBA')
    if hexagonos:
        destacar(im, hexagonos)
    d = ImageDraw.Draw(im)
    for texto, x, y, estilo in NOMES:
        fim = escrever(d, texto, x, y, estilo, COR if texto == colorido else 'black')
        if fim > im.width - 10:
            print(f'Aviso: "{texto}" passa da borda ({fim:.0f} px).')
    im.convert('RGB').save(PASTA / arquivo, quality=90)


# Exemplo de viagem do livro: a pé, saindo da cidade (P), dois dias.
EXEMPLO = RAIZ / 'docs' / 'assets' / 'images' / 'jogo' / 'viagem-exemplo.webp'
SANGUE = (142, 27, 23)  # o vermelho do site
ROTA = [(17, -3), (17, -2), (17, -1), (16, 0), (15, 1)]  # partida, depois 1 a 4
PERIGO = {(17, -2): 35, (17, -1): 35, (16, 0): 70, (15, 1): 110}  # Seguro, Inseguro, Arriscado
ACAMPA = [(17, -1), (15, 1)]


def exemplo_viagem(escala=2):
    """Recorte em tinta (a grade vermelha vira cinza), cortado na borda dos hexágonos."""
    im = Image.open(PASTA / 'mapa-drayone-limpo.webp').convert('RGB')
    vermelho = ImageChops.subtract(im.getchannel('R'), im.getchannel('G')).point(lambda v: 255 if v > 50 else 0)
    cinza = im.convert('L')
    cinza.paste(185, mask=vermelho)
    im = cinza.convert('RGB').resize((im.width * escala, im.height * escala), Image.LANCZOS)

    def ponto(q, r):
        x, y = centro(q, r)
        return x * escala, y * escala

    def borda(q, r):
        return [(x * escala, y * escala) for x, y in cantos(q, r)]

    regiao = [(q, r) for q in range(12, 22) for r in range(-7, 6)
              if (((centro(q, r)[0] - 1150) / 300) ** 2 + ((centro(q, r)[1] - 560) / 250) ** 2 < 1
                  or (q, r) in [(17, -4), (16, -3), (18, -4)])
              and all(8 < x < 1488 and 8 < y < 1020 for x, y in cantos(q, r))]
    mascara = Image.new('L', im.size, 0)
    for h in regiao:
        ImageDraw.Draw(mascara).polygon(borda(*h), fill=255)
    recorte = Image.new('RGB', im.size, 'white')
    recorte.paste(im, mask=mascara)
    im = recorte.convert('RGBA')

    camada = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    for h, alfa in PERIGO.items():
        d.polygon(borda(*h), fill=SANGUE + (alfa,))
    for h in PERIGO:
        d.line(borda(*h) + [borda(*h)[0]], fill=SANGUE + (255,), width=5, joint='curve')
    pontos = [ponto(*h) for h in ROTA]
    for (x0, y0), (x1, y1) in zip(pontos, pontos[1:]):  # rota tracejada
        n = int(math.dist((x0, y0), (x1, y1)) // 22)
        for i in range(0, n, 2):
            a, b = i / n, min((i + 1) / n, 1)
            d.line([(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), (x0 + (x1 - x0) * b, y0 + (y1 - y0) * b)],
                   fill=SANGUE + (255,), width=9)
    im.alpha_composite(camada)

    d = ImageDraw.Draw(im)
    grupo = set(regiao)
    vizinho_do_lado = [(1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1)]
    for q, r in regiao:  # contorno de tinta do recorte
        c = borda(q, r)
        for i, (dq, dr) in enumerate(vizinho_do_lado):
            if (q + dq, r + dr) not in grupo:
                d.line([c[i], c[(i + 1) % 6]], fill=(20, 18, 16), width=5)
    fonte = ImageFont.truetype(FONTES['cidade'][0], 46)
    x, y = ponto(*ROTA[0])
    d.rectangle([x - 34, y - 34, x + 34, y + 34], fill='white', outline=SANGUE, width=7)
    d.text((x, y), 'P', font=fonte, fill=SANGUE, anchor='mm')
    for n, h in enumerate(ROTA[1:], 1):
        x, y = ponto(*h)
        d.ellipse([x - 36, y - 36, x + 36, y + 36], fill=SANGUE, outline='white', width=6)
        d.text((x, y + 2), str(n), font=fonte, fill='white', anchor='mm')
    for h in ACAMPA:  # lua: acampamento
        x, y = ponto(*h)
        x, y = x + 50, y - 46
        d.ellipse([x - 25, y - 25, x + 25, y + 25], fill='white', outline=SANGUE, width=5)
        d.ellipse([x - 15, y - 15, x + 15, y + 15], fill=SANGUE)
        d.ellipse([x - 7, y - 19, x + 19, y + 7], fill='white')

    x0, y0, x1, y1 = mascara.getbbox()
    EXEMPLO.parent.mkdir(parents=True, exist_ok=True)
    im.crop((x0 - 6, y0 - 6, x1 + 6, y1 + 6)).convert('RGB').resize(
        ((x1 - x0 + 12) * 3 // 4, (y1 - y0 + 12) * 3 // 4), Image.LANCZOS).save(EXEMPLO, quality=88)


def main():
    exemplo_viagem()
    gerar('mapa-drayone.webp')
    for arquivo, (hexagonos, colorido) in DESTAQUES.items():
        gerar(arquivo, hexagonos, colorido)


if __name__ == '__main__':
    main()
