"""Corta uma grade de retratos gerada no Gemini em um arquivo por NPC.

Acha as linhas e as colunas pelas faixas brancas entre os desenhos, corta cada
retrato na ordem de leitura (esquerda para a direita, de cima para baixo),
apara o branco em volta e salva em quadrado em campanhas/aethelgard/retratos/.

    python campanhas/aethelgard/recortar_retratos.py grade.png broz roch ariadna-ambrozy ...

Os nomes são os da tabela de NPCs em notas/prompts-artes.md. Um retrato que
já existe é substituído.
"""
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
SAIDA = AQUI / 'retratos'
BRANCO = 235      # acima disso, o pixel conta como fundo
FOLGA_MIN = 6     # faixa branca mínima, em pixels, para separar dois retratos
MARGEM = 0.06     # branco em volta do retrato, em fração do lado


def faixas(tinta, minimo):
    """Intervalos [início, fim) onde há tinta, separados por pelo menos `minimo` posições vazias."""
    faixas, inicio, vazio = [], None, 0
    for i, t in enumerate(tinta + [0] * minimo):
        if t:
            if inicio is None:
                inicio = i
            vazio = 0
        elif inicio is not None:
            vazio += 1
            if vazio >= minimo:
                faixas.append((inicio, i - vazio + 1))
                inicio, vazio = None, 0
    return faixas


def recortar(imagem, nomes):
    cinza = imagem.convert('L')
    w, h = cinza.size
    px = cinza.load()
    escuro = [[px[x, y] < BRANCO for x in range(w)] for y in range(h)]
    linhas = faixas([sum(l) > 2 for l in escuro], FOLGA_MIN)
    por_linha = []
    for y0, y1 in linhas:
        if y1 - y0 < h * 0.05:
            continue  # sujeira solta
        tinta = [sum(escuro[y][x] for y in range(y0, y1)) for x in range(w)]
        colunas = [c for c in faixas([t > 2 for t in tinta], FOLGA_MIN) if c[1] - c[0] >= w * 0.05]
        por_linha.append((y0, y1, tinta, colunas))

    # Dois retratos encostados viram uma faixa só: divide as faixas largas demais
    # no ponto de menos tinta, perto de onde a grade dividiria.
    larguras = sorted(x1 - x0 for *_, cols in por_linha for x0, x1 in cols)
    celula = larguras[len(larguras) // 2]
    retratos = []
    for y0, y1, tinta, colunas in por_linha:
        for x0, x1 in colunas:
            partes = max(1, round((x1 - x0) / celula))
            cortes = [x0]
            for k in range(1, partes):
                alvo = x0 + (x1 - x0) * k // partes
                raio = celula // 6
                cortes.append(min(range(alvo - raio, alvo + raio), key=lambda x: tinta[x]))
            cortes.append(x1)
            retratos += [(a, y0, b, y1) for a, b in zip(cortes, cortes[1:])]
    if len(retratos) != len(nomes):
        sys.exit(f'Achei {len(retratos)} retratos e recebi {len(nomes)} nomes. Nada foi salvo.')
    SAIDA.mkdir(exist_ok=True)
    for nome, (x0, y0, x1, y1) in zip(nomes, retratos):
        pedaco = imagem.crop((x0, y0, x1, y1))
        lado = int(max(x1 - x0, y1 - y0) * (1 + 2 * MARGEM))
        quadro = Image.new('RGB', (lado, lado), 'white')
        quadro.paste(pedaco, ((lado - (x1 - x0)) // 2, (lado - (y1 - y0)) // 2))
        quadro.save(SAIDA / f'{nome}.png')
        print(f'{nome}.png  {x1 - x0}x{y1 - y0}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    recortar(Image.open(sys.argv[1]).convert('RGB'), sys.argv[2:])
