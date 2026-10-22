# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

**Nome do sistema: Forja RPG.** Sempre escreva exatamente `Forja RPG` (nunca só "Forja") para que o nome possa ser trocado com uma substituição em massa sem pegar palavras comuns como "forja" ou "forjar".

Livro de regras de um RPG de mesa próprio: uma versão simplificada de D&D, escrita em **português** e em arquivos **Markdown**. Não há código, build nem testes. Mais tarde o conteúdo pode virar site ou PDF, então o Markdown deve ser limpo e portátil (sem HTML embutido, sem sintaxe específica de uma ferramenta).

O autor dita as regras **capítulo a capítulo**. O trabalho do Claude é redigir, organizar e manter a coerência, não inventar regras. Quando faltar uma regra para fechar um texto, pergunte em vez de preencher a lacuna; se precisar sugerir algo, marque claramente como sugestão.

Dúvidas de regra sem resposta vão para [PENDENCIAS.md](PENDENCIAS.md), agrupadas por capítulo. Ao resolver uma, aplique no texto e remova da lista.

## Princípios do jogo

1. **Classes prontas + criação livre opcional.** Como no Shadowdark, há classes prontas (Guerreiro, Sacerdote, Ladino, Mago), escritas uma de cada vez. Cada classe é um pacote montado **com** as regras de criação: uma base, um atributo principal e uma lista de habilidades com custo calculado pelos componentes e uma melhoria descrita. A criação livre (Personagem Forjado, Criando Habilidades) é uma **regra opcional incentivada** e fica no **fim** dos capítulos 2 e 3. Não mude as regras de criação ao escrever classes: use-as.
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

Use sempre estes termos (definidos em `01-introducao.md`, seção O Básico): **Mestre**, **personagem**, **casa** (1 casa = 1,5 m), faixas **adjacente / perto / longe / muito longe**, **teste**, **Classe de Dificuldade (CD)**, **modificador**, **vantagem / desvantagem**, **Pontos de Vida (PV)**, **Sanidade**, **Mana**, **ação**, **movimento**, **turno**, **rodada**, iniciativa **rápida / tática**, **surpresa**, **turno compartilhado**. Atributos: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma. De `02-personagens.md`: **classe**, **Base** (d4–d12, o motor de cada classe), **Personagem Forjado**, **avanço** (o que se ganha a cada nível: 1 ou 2, conforme a base; não existem mais Pontos de Forja), **ancestralidade**, **antecedente**, **tendência**, **divindade**.

De `03-habilidades.md`: **atributo principal**, **Limite de Mana**, **componentes**, **escalonamento**, **CD de habilidade**, habilidade **ativa / passiva**, funções **ataque / suporte / controle / utilidade**, natureza **magia / marcial**, **elementos** e **escolas**, **descanso curto / longo**, **colapso**.

Capítulos próprios do Forja RPG, sem equivalente no Shadowdark: **Criação de Habilidades** (`03-habilidades.md`, substitui Classes e o capítulo Magia) e **Divindades** (`04-divindades.md`; mistura de clérigo e bruxo do 5e: qualquer entidade poderosa, vínculo de devoção ou pacto). Com isso, Jogo é `05`, Equipamento `06` (separado de Personagens), Mestre `07`, etc.

De `05-jogo.md`: **turno de exploração** (10 min), **Inspiração**, **crítico**, **ação livre**, **reação**, **ataque de oportunidade** (habilidades que movem provocam, salvo se disserem "sem provocar ataques de oportunidade"), **cobertura**, **Moral**, **morrendo**, **estabilizar**, **exaustão**, condições (**amedrontado, atordoado, caído, cego, enfeitiçado, lento, paralisado, surdo**), **tempo livre**, **farra**. Moeda única: **peça de ouro (po)** — não há prata nem cobre; itens baratos em lotes.

De `06-equipamento.md`: **espaço** de carga, **sobrecarga**, armas **simples / marciais**, propriedades **acuidade, alcance, arremesso, duas mãos, munição, pesada, recarga, versátil**, armaduras **leve / média / pesada**, **escudo**, **kit de exploração**, **pacote inicial**.

De `04-divindades.md`: **divindade** (qualquer entidade que concede poder), **domínio**, **vínculo** (**devoção / pacto**), **responsabilidades**, **bênçãos** (**menor / maior / milagre**), habilidade **divina**, **penitência**.

Diferenças em relação ao Shadowdark/D&D que não podem escapar: Mana é o combustível de **todas** as habilidades, mágicas ou marciais (não há slots vancianos nem usos por descanso); não existe bônus de proficiência; a morte com 0 PV vem em rodadas = mod. de Constituição (mínimo 1), sem o 1d4.

## Organização (base: Shadowdark)

O PDF de referência é [pdfcoffee.com_shadowdark-rpg-v41.pdf](pdfcoffee.com_shadowdark-rpg-v41.pdf) (332 páginas, em inglês). Seus capítulos principais, que servem de esqueleto:

1. Introdução (o jogo, o básico) — `01-introducao.md`
2. Personagens — `02-personagens.md`
3. Habilidades (regras gerais; Criando Habilidades opcional no fim) — `03-habilidades.md`
4. Divindades — `04-divindades.md`
5. Jogo — `05-jogo.md`
6. Equipamento — `06-equipamento.md`
7. Mestre (inclui armadilhas, Funil, Sanidade, conversão de monstros) — `07-mestre.md`
8. Geradores (tabelas de improviso) — `08-geradores.md`
9. Ficha de personagem, ficha de Funil (4 personagens de nível 0) e referência rápida — a escrever; terão página para imprimir no site

**Sem capítulo de Tesouro**: o autor usa tesouros de outros livros.

**Não há capítulo de Monstros:** o autor usa monstros do Shadowdark, do 5e e do Monster Overhaul, convertidos pela seção Monstros de `07-mestre.md`. O Mestre deve ter o mínimo de trabalho possível.

Convenção de arquivos sugerida (ajuste conforme os capítulos forem chegando): um arquivo por capítulo, numerado, ex. `01-introducao.md`, `02-personagens.md`. Use `#` para o capítulo e `##`/`###` para seções, para facilitar a geração futura de sumário, site ou PDF.

## Consultando o PDF de referência

O PDF é grande; não leia inteiro. Para ver a estrutura ou páginas específicas, use `pypdf` rodando a partir do diretório de rascunho (o módulo está instalado no Python do usuário; `python -I` não o encontra):

```bash
python -c "import pypdf,sys; r=pypdf.PdfReader(sys.argv[1]); print(r.pages[int(sys.argv[2])-1].extract_text())" "C:/Users/Paulo Souza/Documents/D&D Genérico/pdfcoffee.com_shadowdark-rpg-v41.pdf" 85
```

O sumário (outline) do PDF está disponível via `r.outline`. Use o PDF como referência de **forma e organização**; não copie texto dele.
