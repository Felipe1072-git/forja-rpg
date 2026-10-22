# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

**Nome do sistema: Forja RPG.** Sempre escreva exatamente `Forja RPG` (nunca só "Forja") para que o nome possa ser trocado com uma substituição em massa sem pegar palavras comuns como "forja" ou "forjar".

Livro de regras de um RPG de mesa próprio: uma versão simplificada de D&D, escrita em **português** e em arquivos **Markdown**. Não há código, build nem testes. Mais tarde o conteúdo pode virar site ou PDF, então o Markdown deve ser limpo e portátil (sem HTML embutido, sem sintaxe específica de uma ferramenta).

O autor dita as regras **capítulo a capítulo**. O trabalho do Claude é redigir, organizar e manter a coerência, não inventar regras. Quando faltar uma regra para fechar um texto, pergunte em vez de preencher a lacuna; se precisar sugerir algo, marque claramente como sugestão.

Dúvidas de regra sem resposta vão para [PENDENCIAS.md](PENDENCIAS.md), agrupadas por capítulo. Ao resolver uma, aplique no texto e remova da lista.

## Princípios do jogo

1. **Classes prontas + criação livre opcional.** Como no Shadowdark, há classes prontas (Guerreiro, Sacerdote, Ladino, Mago), escritas uma de cada vez. Cada classe é um pacote montado **com** as regras de criação: uma base, um atributo principal e uma lista de habilidades com custo calculado pelos componentes e uma melhoria descrita. A criação livre (Personagem Forjado, Criando Habilidades) é uma **regra opcional incentivada** e fica no fim das seções Personagem (`personagem/forjado.md`) e Habilidades (`habilidades/criando.md`). Não mude as regras de criação ao escrever classes: use-as.
2. **Escrita o mais direta possível**, no estilo do *Shadowdark RPG*.
3. **Fantasia genérica.** Sem cenário próprio; o sistema serve para qualquer mundo. Não amarre regras ou exemplos a uma ambientação específica.

Os três pilares que definem o jogo (usados na Introdução): **forje seu personagem**, **regras simples**, **criatividade acima das regras**. Sem ficção de abertura por enquanto.

## Estilo de escrita (modelo: Shadowdark)

Público: **os jogadores da mesa do autor** (não é para publicação). O livro é material de jogador: regras, criação e evolução de personagem. Material de Mestre (tesouros, monstros, aventuras) vem de outros livros (Shadowdark, Monster Overhaul, módulos prontos). Escreva de forma **técnica e direta**: regra primeiro, sem texto de venda, sem floreio narrativo e sem explicar o que é RPG.

- Frases curtas, voz ativa, segunda pessoa ("Você pode se mover até perto.").
- Uma regra por bloco, com **título em caixa alta ou negrito** seguido do texto. Ex.: `**Movimento.** No seu turno, você pode se mover até perto.`
- Termos de jogo definidos uma vez e usados sempre com a mesma palavra.
- Exemplos concretos curtos logo após a regra, quando ajudam.
- Tabelas de rolagem (ex.: `2d6 | Efeito`) em vez de prosa para resultados aleatórios.
- Nada de justificativas longas, texto de "designer" ou repetição entre capítulos — remeta à seção pelo nome ("veja Testes").
- Cada seção deve caber em uma ou duas páginas do livro final (o Shadowdark usa ~1 página por tópico).

## Termos fixos

Use sempre estes termos (definidos em `docs/jogo/basico.md`): **Mestre**, **personagem**, **casa** (1 casa = 1,5 m), faixas **adjacente / perto / longe / muito longe**, **teste**, **Classe de Dificuldade (CD)**, **modificador**, **vantagem / desvantagem**, **Pontos de Vida (PV)**, **Sanidade**, **Mana**, **ação**, **movimento**, **turno**, **rodada**, iniciativa **rápida / tática**, **surpresa**, **turno compartilhado**. Atributos: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma. De `docs/personagem/` e `docs/classes/`: **classe**, **Base** (d4–d12, o motor de cada classe), **Personagem Forjado**, **avanço** (o que se ganha a cada nível: 1 ou 2, conforme a base; não existem mais Pontos de Forja), **ancestralidade**, **antecedente**, **tendência**, **divindade**.

De `docs/habilidades/`: **atributo principal**, **Limite de Mana**, **componentes**, **escalonamento**, **CD de habilidade**, habilidade **ativa / passiva**, funções **ataque / suporte / controle / utilidade**, natureza **magia / marcial**, **elementos** e **escolas**, **descanso curto / longo**, **colapso**.

Capítulos próprios do Forja RPG, sem equivalente no Shadowdark: **Criando Habilidades** (`docs/habilidades/criando.md`) e **Divindades** (`docs/divindades.md`; mistura de clérigo e bruxo do 5e: qualquer entidade poderosa, vínculo de devoção ou pacto).

De `docs/jogo/`: **turno de exploração** (10 min), **Inspiração**, **crítico**, **ação livre**, **reação**, **ataque de oportunidade** (habilidades que movem provocam, salvo se disserem "sem provocar ataques de oportunidade"), **cobertura**, **Moral**, **morrendo**, **estabilizar**, **exaustão**, condições (**amedrontado, atordoado, caído, cego, enfeitiçado, lento, paralisado, surdo**), **tempo livre**, **farra**. Moeda única: **peça de ouro (po)** — não há prata nem cobre; itens baratos em lotes.

De `docs/equipamento.md`: **espaço** de carga, **sobrecarga**, armas **simples / marciais**, propriedades **acuidade, alcance, arremesso, duas mãos, munição, pesada, recarga, versátil**, armaduras **leve / média / pesada**, **escudo**, **kit de exploração**, **pacote inicial**.

De `docs/divindades.md`: **divindade** (qualquer entidade que concede poder), **domínio**, **vínculo** (**devoção / pacto**), **responsabilidades**, **bênçãos** (**menor / maior / milagre**), habilidade **divina**, **penitência**.

Diferenças em relação ao Shadowdark/D&D que não podem escapar: Mana é o combustível de **todas** as habilidades, mágicas ou marciais (não há slots vancianos nem usos por descanso); não existe bônus de proficiência; a morte com 0 PV vem em rodadas = mod. de Constituição (mínimo 1), sem o 1d4.

## Organização (base: Shadowdark)

O PDF de referência é [pdfcoffee.com_shadowdark-rpg-v41.pdf](pdfcoffee.com_shadowdark-rpg-v41.pdf) (332 páginas, em inglês), que serviu de esqueleto para a organização.

O conteúdo é um site **MkDocs Material** em `docs/`, publicado no GitHub Pages (https://felipe1072-git.github.io/forja-rpg/, repositório `Felipe1072-git/forja-rpg`). **Os arquivos de `docs/` são a fonte única**; não existem mais os capítulos `01-...md` na raiz.

| Seção do site | Arquivos |
|---|---|
| Início | `docs/index.md` (o que é Forja RPG, por onde começar) |
| Regras | `docs/jogo/`: `basico.md`, `testes.md`, `exploracao.md` (exploração, luz, descanso, furtividade), `combate.md` (inclui morte, exaustão, condições), `viagem.md`, `tempo-livre.md` |
| Personagem | `docs/personagem/`: `index.md` (visão geral, nível inicial, personagem aleatório, atributos), `ancestralidades.md`, `detalhes.md` (antecedente, tendência, títulos, idiomas, CA), `avanco.md`, `forjado.md` (opcional) |
| Classes | `docs/classes/`: `index.md` (bases e regras de habilidade de classe), uma página por classe |
| Habilidades | `docs/habilidades/`: `index.md` (Mana, anatomia, testes, escalonamento, elementos), `criando.md` (opcional) |
| Divindades, Equipamento | `docs/divindades.md`, `docs/equipamento.md` |
| Mestre | `docs/mestre/`: `index.md` (papel, XP, Funil), `encontros.md` (encontros, Sanidade, armadilhas, perigos), `modos-e-monstros.md`, `geradores.md` |

Ainda a escrever: ficha de personagem, ficha de Funil (4 personagens de nível 0) e referência rápida, com página para imprimir.

**Sem capítulo de Tesouro nem de Monstros**: o autor usa material de outros livros (Shadowdark, 5e, Monster Overhaul), convertido pela seção Monstros de `docs/mestre/modos-e-monstros.md`.

### TRABALHANDO NO SITE

- Cada página começa com `#` (título da página); seções em `##` e `###`. Remissões em texto ("veja Combate") usam o nome da página ou seção.
- **Página nova precisa entrar no `nav` do `mkdocs.yml`.**
- Visual "tinta e papel" (Shadowdark): `docs/assets/css/forja.css`. Frase de ambientação de classe usa `{ .epigrafe }` na linha seguinte ao parágrafo.
- **Listas de regras automáticas:** dois ou mais parágrafos seguidos no formato `**Termo.** texto` viram uma lista em duas colunas no site (`hooks/forja.py`). Para isso funcionar, cada item precisa ser um parágrafo próprio (linha em branco entre eles), não um item de lista com `- `.
- **Cartões:** blocos destacados (ex.: cada ancestralidade) usam `<div class="fj-card" markdown>` … `</div>`, com `## Nome`, a frase de ambientação com `{ .epigrafe }` e os traços como parágrafos `**Traço.** texto`. Sempre deixe linha em branco antes de uma lista Markdown, senão ela vira texto corrido.
- Conferir antes de publicar: `python -m mkdocs build --strict` (o executável `mkdocs` não está no PATH). Prévia: `python -m mkdocs serve` (servida em `/forja-rpg/`).
- Publicação: push na `main` dispara `.github/workflows/deploy.yml` (versões fixadas em `mkdocs<2`, `mkdocs-material<10`).
- O PDF do Shadowdark é ignorado pelo git e **nunca** deve ser publicado.

## Consultando o PDF de referência

O PDF é grande; não leia inteiro. Para ver a estrutura ou páginas específicas, use `pypdf` rodando a partir do diretório de rascunho (o módulo está instalado no Python do usuário; `python -I` não o encontra):

```bash
python -c "import pypdf,sys; r=pypdf.PdfReader(sys.argv[1]); print(r.pages[int(sys.argv[2])-1].extract_text())" "C:/Users/Paulo Souza/Documents/D&D Genérico/pdfcoffee.com_shadowdark-rpg-v41.pdf" 85
```

O sumário (outline) do PDF está disponível via `r.outline`. Use o PDF como referência de **forma e organização**; não copie texto dele.
