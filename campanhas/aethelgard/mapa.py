"""Escreve os nomes no mapa de Drayone (Aethelgard) e gera os mapas de cada aventura.

Parte do mapa limpo de Dyson Logos e grava os mapas do site:
    python campanhas/aethelgard/mapa.py

Lugar novo: acrescente uma linha em NOMES: (texto, x, y, estilo).
x e y são o canto superior esquerdo do texto, em pixels do mapa (1500 x 1029).

Mapa de aventura: acrescente uma linha em DESTAQUES com os hexágonos
(coordenadas axiais q, r; veja hexagono_em) e o nome que fica colorido.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

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


def main():
    gerar('mapa-drayone.webp')
    for arquivo, (hexagonos, colorido) in DESTAQUES.items():
        gerar(arquivo, hexagonos, colorido)


if __name__ == '__main__':
    main()
