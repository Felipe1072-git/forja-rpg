# Simulação de Progressão

Nota de trabalho, não faz parte do livro. Simula cada classe do nível 1 ao 10 com as regras atuais.

> **Atenção.** Depois destas simulações, várias habilidades mudaram de dado e de custo (ex.: Golpe Poderoso agora usa d8 e custa 2; Raio de Fogo usa d10 e custa 4). Os números abaixo usam os valores antigos.

## Premissas

| Item | Como foi calculado |
|---|---|
| PV | Dado de vida médio arredondado para cima (d10 = 6). Nível 1: dado + mod. de Constituição. Níveis seguintes: só o dado. Se o mod. de Constituição aumentar, soma a diferença uma vez. |
| Mana | Mana da base × nível + mod. do atributo principal. |
| Limite de Mana | Nível + 5. Só vale ao criar habilidades; não afeta classes. |
| Mana extra (escalonamento) | No máximo igual ao nível. |
| Avanços | A partir do nível 2: 1 por nível, ou 2 nos níveis indicados pela base. Dois avanços no mesmo nível devem ser diferentes. |
| Melhoria | +1 no custo (passivas não têm custo). |
| +1 dado | Sem mudar o custo. |
| Médias de dado | d6 = 3,5 · d10 = 5,5. |
| Compras de equipamento | Nenhuma depois do nível 1, para isolar o efeito das regras. |

---

## Guerreiro

### FICHA NO NÍVEL 1

| Campo | Valor |
|---|---|
| Base | d10 (2 habilidades iniciais, 2 de Mana por nível, 2 avanços nos níveis 5 e 10) |
| Atributo principal | Força |
| Atributos | For 16 (+3) · Des 13 (+1) · Con 14 (+2) · Int 10 (+0) · Sab 12 (+1) · Car 8 (-1) |
| Antecedente | Soldado |
| Divindade | Nenhuma |
| PV | 6 + 2 = **8** |
| Mana | 2 × 1 + 3 = **5** |
| Sanidade | 10 + 0 + 1 - 1 = **10** |
| Equipamento | Pacote inicial: kit de exploração, espada longa (10 po), gibão de peles (15 po) |
| CA | Gibão de peles: 12 + 1 = **13** |
| Carga | 3 + 2 + 5 (mochila) = **10 espaços** |
| Ataque | Espada longa com duas mãos: d20 + 3 (For) + 1 (Maestria) = **+4** · dano **1d10 + 3** |

**Habilidades iniciais**

| Habilidade | Custo | Efeito |
|---|---|---|
| Maestria com Arma (espadas longas) | Passiva | +1 em ataques com espadas longas |
| Golpe Poderoso | 1 | Ataque com arma +1d6 de dano. Escalonamento: +1d6 |

### PROGRESSÃO

| Nível | PV | Mana | Mana extra máx. | CA | Avanços | Escolhas |
|---|---|---|---|---|---|---|
| 1 | 8 | 5 | 1 | 13 | — | Habilidades iniciais |
| 2 | 14 | 8 | 2 | 13 | 1 | Atributos: +2 For → 18 |
| 3 | 20 | 10 | 3 | 13 | 1 | Melhoria: Golpe Poderoso ganha Derrubar → custo 2 |
| 4 | 26 | 12 | 4 | 14 | 1 | Nova habilidade: Defesa com Armadura (+1 CA) |
| 5 | 32 | 14 | 5 | 14 | 2 | Nova habilidade: Ataque Duplo · +1 dado: Golpe Poderoso → +2d6 |
| 6 | 38 | 16 | 6 | 15 | 1 | Melhoria: Defesa com Armadura ganha Reforço (+2 CA) |
| 7 | 45 | 18 | 7 | 15 | 1 | Atributos: +2 Con → 16 (mod. +3, soma +1 PV) |
| 8 | 51 | 20 | 8 | 15 | 1 | Nova habilidade: Investida |
| 9 | 57 | 22 | 9 | 15 | 1 | Melhoria: Ataque Duplo ganha Precisão → custo 3 |
| 10 | 69 | 25 | 10 | 15 | 2 | Atributos: +2 For → 20 · Vigor: +1 dado de vida |

**Como a Mana foi calculada.** Nível 1: mod. de For +3. Níveis 2 a 9: For 18, mod. +4. Nível 10: For 20, mod. +5.

**Como os PV foram calculados.** +6 por nível. Nível 7: +1 pela Constituição. Nível 10: +6 a mais pelo Vigor.

### DETALHE NÍVEL A NÍVEL

**Nível 2.** Força primeiro: melhora ataque, dano e Mana de uma vez.

**Nível 3.** O Golpe Poderoso ganha Derrubar: o alvo fica caído. O custo sobe de 1 para 2.

**Nível 4.** Começa o caminho de tanque: Defesa com Armadura dá +1 de CA (13 → 14).

**Nível 5.** Primeiro nível com 2 avanços. Pega Ataque Duplo (custo 2) e +1 dado no Golpe Poderoso (+2d6, ainda custo 2).

**Nível 6.** Reforço: a Defesa com Armadura passa a dar +2 de CA (14 → 15).

**Nível 7.** Constituição 16. O mod. vai de +2 para +3: soma 1 ao PV máximo.

**Nível 8.** Investida (custo 2).

**Nível 9.** Precisão: +1 nos dois ataques do Ataque Duplo. Custo 3.

**Nível 10.** Segundo nível com 2 avanços. Força 20 (mod. +5) e Vigor (+6 PV).

### FICHA NO NÍVEL 10

| Campo | Valor |
|---|---|
| PV | **69** |
| Mana | **25** (+12 no descanso curto) |
| Mana extra máxima | **10** |
| CA | **15** (gibão 13 + Defesa com Armadura com Reforço +2) |
| Ataque | d20 + 5 (For) + 1 (Maestria) = **+6** · dano **1d10 + 5** |

| Habilidade | Custo | Efeito no nível 10 |
|---|---|---|
| Maestria com Arma | Passiva | +1 em ataques com espadas longas |
| Golpe Poderoso (Derrubar, +1 dado) | 2 | Ataque com arma +2d6 de dano, o alvo fica caído. Escalonamento: +1d6 |
| Defesa com Armadura (Reforço) | Passiva | +2 de CA usando armadura |
| Ataque Duplo (Precisão) | 3 | Dois ataques com arma, +1 em cada |
| Investida | 2 | Move até perto e ataca com +1d6. Escalonamento: +1d6 |

### DANO POR TURNO

Dano médio de um acerto (sem crítico).

| Nível | Ataque básico | Golpe Poderoso (custo) | Golpe Poderoso com Mana extra máxima (Mana total) |
|---|---|---|---|
| 1 | 8,5 | 12 (1) | 15,5 (2) |
| 5 | 9,5 | 16,5 (2) | 34 (7) |
| 10 | 10,5 | 17,5 (2) | 52,5 (12) |

| Nível | Ataque Duplo (custo) | Dano médio se os dois acertarem |
|---|---|---|
| 5 | 2 | 19 |
| 10 | 3 | 21 |

### USOS POR DIA (NÍVEL 10)

Com 25 de Mana, mais 12 do descanso curto (37 no total):

| Uso | Mana por uso | Usos por dia |
|---|---|---|
| Golpe Poderoso simples | 2 | 18 |
| Ataque Duplo | 3 | 12 |
| Golpe Poderoso com Mana extra máxima | 12 | 3 |

### OBSERVAÇÕES

1. **Golpe Poderoso no máximo:** cerca de 52 de dano num acerto, 3 vezes por dia. O autor aceitou: nível 10 deve ser poderoso, e os monstros serão ajustados.
2. **Constituição:** com a regra da diferença, subir a Constituição de 14 para 16 no nível 7 deu só +1 PV. Ela segue pouco atraente como compra.
3. **Habilidades:** com 11 avanços, o Guerreiro termina com 5 habilidades (antes eram 4) e ainda comprou atributos, Vigor e melhorias.
4. **CA:** o caminho de tanque levou a CA de 13 a 15 sem equipamento. Com escudo e Mestre do escudo, chegaria a 18.

---

## Sacerdote

> **Atenção.** Esta simulação foi feita com o desconto divino, que depois foi removido. Os custos pagos agora são os custos base.

### FICHA NO NÍVEL 1

| Campo | Valor |
|---|---|
| Base | d8 (3 habilidades iniciais, 3 de Mana por nível, 2 avanços nos níveis 3, 6 e 9) |
| Atributo principal | Sabedoria |
| Atributos | Sab 16 (+3) · Con 14 (+2) · Car 13 (+1) · For 12 (+1) · Des 10 (+0) · Int 10 (+0) |
| Antecedente | Acólito |
| Divindade | Seraphiel, a Lâmina da Aurora (celestial, Bem e Ordem, devoção). Elemento divino: radiante |
| Responsabilidades | Nunca ataque um inimigo rendido. Persiga todo crime até o fim. |
| PV | 5 + 2 = **7** |
| Mana | 3 × 1 + 3 = **6** |
| Desconto divino | **-1** |
| Sanidade | 10 + 0 + 3 + 1 = **14** |
| Equipamento | Pacote inicial: kit de exploração, maça (5 po), gibão de peles (15 po) |
| CA | Gibão de peles 12 + 0 + 1 (bênção menor) = **13** |
| Carga | 1 + 2 + 5 (mochila) = **8 espaços** |
| Ataque com arma | Maça: d20 + 1 (For) = **+1** · dano **1d6 + 1** |
| Ataque divino | d20 + 3 (Sab) = **+3** · CD de habilidade **13** |

**Habilidades iniciais e bênção**

| Habilidade | Custo base | Custo pago (com desconto) | Efeito |
|---|---|---|---|
| Palavra de Cura | 1 | 1 | Um aliado até perto cura 1d6. Escalonamento: +1d6 |
| Chama Sagrada | 2 | 1 | Ataque divino até longe: 1d6 radiante. Escalonamento: +1d6 |
| Escudo da Fé | 2 | 1 | Um aliado até perto ganha +1 de CA por 10 rodadas |
| Bênção menor de Seraphiel | Passiva | — | +1 de CA |

### PROGRESSÃO

| Nível | PV | Mana | Mana extra máx. | Desconto | Avanços | Escolhas | Bênção |
|---|---|---|---|---|---|---|---|
| 1 | 7 | 6 | 1 | -1 | — | Habilidades iniciais | Menor: +1 de CA |
| 2 | 12 | 10 | 2 | -1 | 1 | Atributos: +2 Sab → 18 | — |
| 3 | 17 | 13 | 3 | -1 | 2 | Nova habilidade: Bênção · Melhoria: Palavra de Cura ganha Coro | — |
| 4 | 22 | 16 | 4 | -1 | 1 | Nova habilidade: Expulsar Mortos-Vivos | — |
| 5 | 27 | 19 | 5 | -2 | 1 | +1 dado: Palavra de Cura → 2d6 | Maior: Comando |
| 6 | 32 | 22 | 6 | -2 | 2 | Nova habilidade: Santuário · Melhoria: Chama Sagrada ganha Punir | — |
| 7 | 37 | 26 | 7 | -2 | 1 | Atributos: +2 Sab → 20 | — |
| 8 | 42 | 29 | 8 | -2 | 1 | Nova habilidade: Cura em Massa | — |
| 9 | 52 | 32 | 9 | -3 | 2 | Melhoria: Expulsar ganha Fogo divino · Vigor | Milagre: Palavra Divina |
| 10 | 57 | 35 | 10 | -3 | 1 | Nova habilidade: Revivificar | — |

**Como a Mana foi calculada.** Nível 1: mod. de Sab +3. Níveis 2 a 6: Sab 18, mod. +4. Níveis 7 a 10: Sab 20, mod. +5.

**Como os PV foram calculados.** +5 por nível (d8 médio). No nível 9, +5 a mais pelo Vigor.

### DETALHE NÍVEL A NÍVEL

**Nível 2.** Sabedoria primeiro: melhora ataque divino, CD de habilidade e Mana.

**Nível 3.** Primeiro nível com 2 avanços. Bênção (custo 3, paga 2) e Coro na Palavra de Cura (custo 1 → 2, paga 1).

**Nível 4.** Expulsar Mortos-Vivos (custo 4, paga 3).

**Nível 5.** A Palavra de Cura passa a curar 2d6. Bênção maior: Comando (custo 2, paga 1). O desconto sobe para -2.

**Nível 6.** Santuário (custo 3, paga 1). Punir na Chama Sagrada: dano dobrado contra mortos-vivos e demônios (custo 2 → 3, paga 1).

**Nível 7.** Sabedoria 20 (mod. +5).

**Nível 8.** Cura em Massa (custo 3, paga 1).

**Nível 9.** Fogo divino no Expulsar: quem falha também sofre 2d6 radiante (custo 4 → 5, paga 2). Vigor: +5 PV. Milagre: Palavra Divina (custo 7, grátis 1 vez por descanso longo). O desconto sobe para -3.

**Nível 10.** Revivificar (custo 5, paga 2).

### CUSTOS PAGOS AO LONGO DOS NÍVEIS

| Habilidade | Custo base | Nível 1 (-1) | Nível 5 (-2) | Nível 10 (-3) |
|---|---|---|---|---|
| Palavra de Cura (Coro a partir do 3) | 1 → 2 | 1 | 1 | 1 |
| Chama Sagrada (Punir a partir do 6) | 2 → 3 | 1 | 1 | 1 |
| Escudo da Fé | 2 | 1 | 1 | 1 |
| Bênção | 3 | — | 1 | 1 |
| Expulsar Mortos-Vivos (Fogo divino a partir do 9) | 4 → 5 | — | 2 | 2 |
| Comando (bênção maior) | 2 | — | 1 | 1 |
| Santuário | 3 | — | — | 1 |
| Cura em Massa | 3 | — | — | 1 |
| Revivificar | 5 | — | — | 2 |
| Palavra Divina (milagre) | 7 | — | — | Grátis, 1 vez por descanso longo |

### FICHA NO NÍVEL 10

| Campo | Valor |
|---|---|
| PV | **57** |
| Mana | **35** (+17 no descanso curto) |
| Mana extra máxima | **10** |
| Desconto divino | **-3** |
| CA | **13** |
| Ataque divino | d20 + 5 · CD de habilidade **15** |
| Habilidades | 8 da classe + Comando + Palavra Divina + passiva de +1 de CA |

### DANO E CURA

Valores médios.

| Nível | Chama Sagrada (Mana) | Chama Sagrada com Mana extra máxima (Mana) | Contra mortos-vivos e demônios (Punir) |
|---|---|---|---|
| 1 | 3,5 (1) | 7 (2) | — |
| 5 | 3,5 (1) | 21 (6) | — |
| 10 | 3,5 (1) | 38,5 (11) | **77 (11)** |

| Nível | Palavra de Cura (Mana) | Com Mana extra máxima (Mana) |
|---|---|---|
| 1 | 3,5 em 1 aliado (1) | 7 em 1 aliado (2) |
| 5 | 7 em 2 aliados (1) | 24,5 em 2 aliados (6) |
| 10 | 7 em 2 aliados (1) | **42 em 2 aliados (11)** |

| Nível 10 | Mana | Efeito médio |
|---|---|---|
| Cura em Massa | 1 | 3,5 em cada aliado numa área média |
| Cura em Massa com Mana extra máxima | 11 | **38,5 em cada aliado numa área média** |
| Expulsar com Fogo divino e Mana extra máxima | 12 | 42 de dano radiante em cada morto-vivo que falhar, e ele fica amedrontado |

### USOS POR DIA

| Nível | Mana total no dia (com descanso curto) | Habilidades de custo 1 por dia |
|---|---|---|
| 1 | 6 + 3 = 9 | 9 |
| 5 | 19 + 9 = 28 | 28 |
| 10 | 35 + 17 = 52 | 52 |

### OBSERVAÇÕES

1. **[Decidido: o desconto divino foi removido do jogo; ficam só as bênçãos.]** **O desconto divino zera os custos.** No nível 10, sete das nove habilidades custam 1. O custo base quase não importa mais, e melhorias que deveriam encarecer a habilidade (Coro, Punir) saem de graça. Com 52 de Mana por dia, o sacerdote praticamente não tem limite de usos simples.
2. **Cura escalonada é enorme.** No nível 10, Cura em Massa com 10 de Mana extra cura 38,5 em cada aliado da área. A Palavra de Cura com Coro cura 42 em dois aliados. Isso quase enche a barra de PV de qualquer personagem (o Guerreiro tem 69).
3. **Punir dobra o escalonamento.** Contra mortos-vivos e demônios, a Chama Sagrada no máximo causa 77 de dano médio num ataque.
4. **Versatilidade alta.** Com 12 avanços e as bênçãos, o sacerdote termina com 10 habilidades ativas, mais do que o dobro do Guerreiro.
5. **CA baixa.** CA 13 o jogo todo, sem compra de equipamento. O sacerdote tem proficiência em todas as armaduras; com ouro, chega a 17 (placas + bênção) ou 19 (com escudo).
6. **Conflito de dogma.** Morvhen, a divindade de exemplo da morte, proíbe trazer mortos de volta, mas o Sacerdote tem Revivificar. Não é erro (é uma boa escolha de interpretação), mas vale um aviso no texto da classe ou da divindade.

---

## Ladino

### FICHA NO NÍVEL 1

| Campo | Valor |
|---|---|
| Base | d6 (3 habilidades iniciais, 4 de Mana por nível, 2 avanços nos níveis 3, 5, 7, 9 e 10) |
| Atributo principal | Destreza |
| Atributos | Des 16 (+3) · Con 14 (+2) · Int 12 (+1) · Sab 12 (+1) · Car 10 (+0) · For 8 (-1) |
| Antecedente | Trombadinha |
| Divindade | Nenhuma |
| PV | 4 + 2 = **6** |
| Mana | 4 × 1 + 3 = **7** |
| Sanidade | 10 + 1 + 1 + 0 = **12** |
| Equipamento | Pacote inicial: kit de exploração, espada curta (7 po), armadura de couro (10 po) |
| CA | Couro: 11 + 3 = **14** |
| Carga | -1 + 2 + 5 (mochila) = **6 espaços** |
| Ataque | Espada curta (acuidade): d20 + 3 (Des) = **+3** · dano **1d6 + 3** |

**Habilidades iniciais**

| Habilidade | Custo | Efeito |
|---|---|---|
| Ladinagem | Passiva | Vantagem para escalar, se esconder, abrir fechaduras, desarmar armadilhas e bater carteiras |
| Ataque Furtivo | 1 | Ataque com arma contra alvo surpreso, distraído ou adjacente a um aliado: +2d6 de dano. Escalonamento: +1d6 |
| Fuga | 2 | Move até perto sem provocar ataques de oportunidade |

### PROGRESSÃO

| Nível | PV | Mana | Mana extra máx. | CA | Avanços | Escolhas |
|---|---|---|---|---|---|---|
| 1 | 6 | 7 | 1 | 14 | — | Habilidades iniciais |
| 2 | 10 | 12 | 2 | 15 | 1 | Atributos: +2 Des → 18 |
| 3 | 14 | 16 | 3 | 15 | 2 | Nova habilidade: Truque Sujo · Melhoria: Ataque Furtivo ganha Lâmina envenenada |
| 4 | 18 | 20 | 4 | 15 | 1 | +1 dado: Ataque Furtivo → +3d6 |
| 5 | 22 | 24 | 5 | 15 | 2 | Nova habilidade: Esquiva · Melhoria: Fuga ganha Sumir |
| 6 | 26 | 29 | 6 | 16 | 1 | Atributos: +2 Des → 20 |
| 7 | 30 | 33 | 7 | 16 | 2 | Nova habilidade: Distração · +1 dado: Ataque Furtivo → +4d6 |
| 8 | 34 | 37 | 8 | 16 | 1 | Nova habilidade: Golpe de Misericórdia |
| 9 | 42 | 41 | 9 | 16 | 2 | Melhoria: Ataque Furtivo ganha Escapada · Vigor |
| 10 | 46 | 45 | 10 | 16 | 2 | Nova habilidade: Bomba de Fumaça · Melhoria: Ladinagem ganha Escalador |

**Como a Mana foi calculada.** Nível 1: mod. de Des +3. Níveis 2 a 5: Des 18, mod. +4. Níveis 6 a 10: Des 20, mod. +5.

**Como os PV foram calculados.** +4 por nível (d6 médio). No nível 9, +4 a mais pelo Vigor.

**Como a CA foi calculada.** Couro (11) + mod. de Des, que sobe com a Destreza.

### DETALHE NÍVEL A NÍVEL

**Nível 2.** Destreza primeiro: melhora ataque, dano, CA e Mana de uma vez.

**Nível 3.** Truque Sujo (custo 1). Lâmina envenenada no Ataque Furtivo: +1d6 de veneno, que também escalona (custo 1 → 2).

**Nível 4.** O Ataque Furtivo passa a causar +3d6, ainda por custo 2.

**Nível 5.** Esquiva (custo 2). Sumir na Fuga: no fim do movimento, faz um teste para se esconder (custo 2 → 3).

**Nível 6.** Destreza 20 (mod. +5).

**Nível 7.** Distração (custo 2), que deixa o alvo "distraído" para o Ataque Furtivo. O Ataque Furtivo passa a +4d6.

**Nível 8.** Golpe de Misericórdia (custo 2).

**Nível 9.** Escapada no Ataque Furtivo: depois do ataque, move até perto sem provocar ataques de oportunidade (custo 2 → 3). Vigor: +4 PV.

**Nível 10.** Bomba de Fumaça (custo 3). Escalador na Ladinagem: escala com movimento normal.

### FICHA NO NÍVEL 10

| Campo | Valor |
|---|---|
| PV | **46** |
| Mana | **45** (+22 no descanso curto) |
| Mana extra máxima | **10** |
| CA | **16** |
| Ataque | d20 + 5 · dano **1d6 + 5** |

| Habilidade | Custo | Efeito no nível 10 |
|---|---|---|
| Ladinagem (Escalador) | Passiva | Vantagem nos testes de ladrão; escala com movimento normal |
| Ataque Furtivo (Lâmina envenenada, Escapada, +2 dados) | 3 | +4d6 de dano e +1d6 de veneno; depois, move até perto sem provocar. Escalonamento: +1d6 |
| Fuga (Sumir) | 3 | Move até perto sem provocar e tenta se esconder |
| Truque Sujo | 1 | Ataque que pode cegar o alvo por 1 rodada |
| Esquiva | 2 | Reação: vantagem numa resistência de Destreza; sucesso = nenhum dano |
| Distração | 2 | Deixa um inimigo distraído para o Ataque Furtivo |
| Golpe de Misericórdia | 2 | +4d6 contra quem tem metade dos PV ou menos. Escalonamento: +1d6 |
| Bomba de Fumaça | 3 | Fumaça numa área pequena por 10 rodadas |

### DANO POR TURNO

Dano médio de um acerto (sem crítico). No Ataque Furtivo, a Mana extra pode ir para o dano furtivo ou para o veneno; o total é o mesmo.

| Nível | Ataque básico | Ataque Furtivo (custo) | Ataque Furtivo com Mana extra máxima (Mana total) |
|---|---|---|---|
| 1 | 6,5 | 13,5 (1) | 17 (2) |
| 3 | 7,5 | 18 (2) | 28,5 (5) |
| 4 | 7,5 | 21,5 (2) | 35,5 (6) |
| 7 | 8,5 | 26 (2) | 50,5 (9) |
| 10 | 8,5 | 26 (3) | **61 (13)** |

| Nível | Golpe de Misericórdia (custo) | Com Mana extra máxima (Mana total) |
|---|---|---|
| 8 | 22,5 (2) | 50,5 (10) |
| 10 | 22,5 (2) | 57,5 (12) |

### USOS POR DIA (NÍVEL 10)

Com 45 de Mana, mais 22 do descanso curto (67 no total):

| Uso | Mana por uso | Usos por dia |
|---|---|---|
| Ataque Furtivo simples | 3 | 22 |
| Ataque Furtivo com Mana extra máxima | 13 | 5 |

### COMPARAÇÃO COM O GUERREIRO (NÍVEL 10)

| | Guerreiro | Ladino |
|---|---|---|
| PV | 69 | 46 |
| CA | 15 | 16 |
| Mana por dia | 37 | 67 |
| Golpe principal simples (Mana) | Golpe Poderoso: 17,5 (2) | Ataque Furtivo: 26 (3) |
| Golpe principal no máximo (Mana) | 52,5 (12) | 61 (13) |
| Usos do golpe no máximo por dia | 3 | 5 |

### OBSERVAÇÕES

1. **O Ladino bate mais que o Guerreiro.** O Ataque Furtivo funciona quase todo turno (basta um aliado adjacente ao alvo) e causa 26 de dano médio contra 17,5 do Golpe Poderoso. No máximo, 61 contra 52,5, e o Ladino faz isso 5 vezes por dia contra 3.
2. **A Mana da base d6 pesa.** O Ladino tem 4 de Mana por nível contra 2 do Guerreiro. Somada à condição fácil do Ataque Furtivo, isso dá ao Ladino mais dano e mais usos.
3. **CA maior que a do Guerreiro.** Armadura leve sem limite de Destreza deixa o Ladino com CA 16 contra 15 do Guerreiro tanque. O Guerreiro só passa à frente comprando armadura melhor.
4. **Fuga sempre disponível.** Fuga, Escapada e Sumir permitem atacar e sumir no mesmo turno sem sofrer ataques de oportunidade.
5. **Constituição de novo sem uso.** Como no Guerreiro, subir a Constituição dá pouco retorno (só a diferença, uma vez).
