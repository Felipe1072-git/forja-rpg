"""Escreve os nomes no mapa de Drayone (Aethelgard).

Parte do mapa limpo de Dyson Logos e grava o mapa do site:
    python campanhas/aethelgard/mapa.py
Para um lugar novo, acrescente uma linha em NOMES: (texto, x, y, estilo).
x e y são o canto superior esquerdo do texto, em pixels do mapa (1500 x 1029).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
PASTA = RAIZ / 'docs' / 'assets' / 'images' / 'aethelgard'
FONTES = {
    'cidade': (r'C:\Windows\Fonts\BOOKOSB.TTF', 38, 4, 7),   # maiúsculas, negrito
    'lugar': (r'C:\Windows\Fonts\BOOKOSB.TTF', 26, 3, 7),    # vila, ruína
    'regiao': (r'C:\Windows\Fonts\BOOKOSBI.TTF', 30, 5, 11),  # floresta, deserto
}

NOMES = [
    ('JAVA', 1352, 356, 'cidade'),
    ('TORRE VERMELHA', 585, 308, 'lugar'),
    ('FLORESTA BRANCA', 175, 168, 'regiao'),
    ('DESERTO DE PEDRA', 70, 900, 'regiao'),
]


def escrever(d, texto, x, y, estilo):
    arquivo, tamanho, espaco, contorno = FONTES[estilo]
    fonte = ImageFont.truetype(arquivo, tamanho)
    x0 = x
    for letra in texto:  # primeiro o contorno branco de tudo, depois as letras
        d.text((x, y), letra, font=fonte, fill='white', stroke_width=contorno, stroke_fill='white')
        x += d.textlength(letra, font=fonte) + espaco
    x = x0
    for letra in texto:
        d.text((x, y), letra, font=fonte, fill='black', stroke_width=0)
        x += d.textlength(letra, font=fonte) + espaco
    return x


def main():
    im = Image.open(PASTA / 'mapa-drayone-limpo.webp').convert('RGB')
    d = ImageDraw.Draw(im)
    for texto, x, y, estilo in NOMES:
        fim = escrever(d, texto, x, y, estilo)
        if fim > im.width - 10:
            print(f'Aviso: "{texto}" passa da borda ({fim:.0f} px).')
    im.save(PASTA / 'mapa-drayone.webp', quality=90)


if __name__ == '__main__':
    main()
