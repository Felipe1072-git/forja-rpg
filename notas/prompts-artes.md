# Prompts de arte (Gemini / Nano Banana)

Gere todas as artes **na mesma conversa**, uma por mensagem, para o estilo ficar igual. Mande o prompt base uma vez com a primeira classe; depois, só "Same style, same rules. Next:" + a linha da classe.

Salve cada arte como `docs/assets/images/classes/<arquivo>.webp` (nome na tabela; converta para WebP com o fundo transparente: quase branco vira branco, e o alfa sai do escuro do traço, como em `guerreiro.webp`). Na página da classe, ponha a arte logo depois da epígrafe:

```markdown
![Guerreiro](../assets/images/classes/guerreiro.webp){ .fj-arte .fj-arte-classe loading=lazy }
```

## Prompt base

```text
Black and white pen-and-ink illustration for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, heavy solid blacks, crosshatching and stippling for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: one character, full body, dynamic pose, centered, vertical 3:4 format, with empty space around the figure. Loose ink splatter or a few smoke/debris strokes at the base are fine, but no scenery box.

Background: pure flat white (#FFFFFF) everywhere outside the drawing. No paper texture, no beige, no gradient, no vignette, no frame, no border.

No text, no letters, no logo, no signature, no watermark.

Character: [CLASSE]
```

## Classes

| Classe | Arquivo | Linha para [CLASSE] |
|---|---|---|
| Guerreiro | guerreiro | A battle-scarred warrior in mismatched plate and chain armor, longsword in one hand and a dented shield in the other, standing firm, cape torn. |
| Sacerdote | sacerdote | A grim priest in chainmail and a hooded robe, raising a holy symbol that radiates light, a heavy mace in the other hand. |
| Ladino | ladino | A hooded thief crouching on a ledge, dagger drawn, a coin pouch and lockpicks on the belt, face half in shadow. |
| Mago | mago | A thin old wizard in a long robe with a staff, casting a crackling arcane spell from an open hand, books and scrolls hanging from the belt. |
| Bárbaro | barbaro | A huge barbarian in furs and leather, roaring mid-charge with a greataxe raised, scars and tribal paint on bare arms. |
| Patrulheiro | patrulheiro | A cloaked ranger drawing a longbow, a wolf companion at their side, leaves and branches at their feet. |
| Bardo | bardo | A charismatic bard in a feathered hat and travel clothes, playing a lute mid-song, a rapier at the hip. |
| Druida | druida | A druid in a cloak of leaves and bone ornaments, holding a gnarled staff, half of the body shifting into a bear, birds around. |
| Paladino | paladino | A holy knight in full plate with a tabard, holding a greatsword point-down in prayer, divine light behind the helmet. |
| Feiticeiro | feiticeiro | A young sorcerer with wild hair and glowing eyes, raw elemental fire and lightning bursting uncontrolled from both hands. |
| Monge | monge | A barefoot monk in simple wraps mid-kick, perfectly balanced on one foot, energy lines around the fists. |
| Alquimista | alquimista | A plague doctor with a beaked mask, wide-brimmed hat and long leather coat, holding up a smoking flask, vials and bombs on a bandolier. No magic. |
| Guerreiro Basilisco | guerreiro-basilisco | A tribal warrior covered in dried mud and stone flakes, glowing reptilian eyes, crouched to strike with a spear, a boomerang on the back. |
| Duelista | duelista | A swashbuckler musketeer in a plumed hat and cape, lunging with a rapier, smiling arrogantly, one hand behind the back. |
| Cavaleiro Verde | cavaleiro-verde | A towering knight in moss-covered armor with an antlered helm, holding a huge axe, vines and holly growing from the armor. |
| Cavaleiro Profano | cavaleiro-profano | A demonic death knight in spiked black plate armor, horned helm, burning eyes, a cursed sword in hand, skeletal hands rising from the ground around them. |
| Necromante | necromante | A gaunt necromancer in chainmail and a tattered cloak, longsword at the hip, raising a staff as skulls and skeletons rise in swirling smoke around them. |
| Lâmina Silenciosa | lamina-silenciosa | A masked samurai assassin in dark wraps, drawing a curved blade in a low stance, black lotus petals and smoke swirling around. |
| Lobo do Mar | lobo-do-mar | A raider in a winged helm with long braided hair, round shield and axe, one foot on the prow of a longboat, waves crashing below. |
| Ferreiro de Guerra | ferreiro-de-guerra | A burly blacksmith-artificer in a leather apron over patched armor, a heavy hammer in one hand and a smoking hand cannon in the other, a small brass spider-construct climbing on the shoulder, gears and tools hanging from the belt. |
| Sangue de Dragão | sangue-de-dragao | A warrior in fur and scale armor with a horned helm, shouting a blast of fire and wind from the mouth, a sword in hand, the faint shape of a dragon skull in the smoke behind them. |
| Caçador de Prata | cacador-de-prata | A grim monster hunter in a long coat and wide-brimmed hat, a silver longsword in one hand and a chain whip in the other, vials and stakes on a bandolier, a crossbow on the back, standing over a slain werewolf. |
| Dobrador Elemental | dobrador-elemental | A barefoot monk in simple wraps and a sash, in a dynamic martial arts stance, fire swirling around one fist, water whipping from the other hand, wind and small stones circling around the body. |
| Quebra-Feitiço | quebra-feitico | A muscular young warrior in torn simple clothes and light armor, gripping a huge rough sword wreathed in black, shredding anti-magic energy, cracked magic runes and broken spell circles shattering around him. |
| Carcereiro do Abismo | carcereiro-do-abismo | A sinister robed summoner with a hood and a chained grimoire, standing inside a burning ritual circle, holding a heavy chain that binds a snarling horned demon hound, small imps hiding in the smoke behind. |
| Malvidente | malvidente | A hunched seer-witch with milky white eyes, casting bones from one hand, a raven on the shoulder and a bubbling cauldron behind. |

## Dicas

- **Fundo.** Se vier com fundo bege ou cinza, peça: "Make the background pure flat white #FFFFFF." O site cuida do resto: no tema claro o branco vira pergaminho; no escuro a arte inverte e vira traço claro.
- **Rosto e corpo.** Para variar ancestralidade e gênero, acrescente na linha, por exemplo, "a dwarf woman" ou "an orc man".
- **Formato.** Mantenha sempre 3:4 vertical, para todas as páginas terem o mesmo tamanho de arte.

## Ancestralidades

Retratos pequenos para os cartões de Ancestralidades: **dois rostos da mesma ancestralidade, um masculino e um feminino, lado a lado**. Escolha a proporção **4:3** no Gemini. Use uma conversa nova só para eles, com o prompt abaixo na primeira e depois "Same style, same rules. Next:" + a linha.

Salve como `docs/assets/images/ancestralidades/<arquivo>.webp` (mesmo tratamento das classes). No cartão, ponha a arte logo depois da epígrafe; ela vai para o canto direito, ao lado do título:

```markdown
![Humano e humana](../assets/images/ancestralidades/humano.webp){ .fj-arte-ancestral loading=lazy }
```

```text
Black and white pen-and-ink portraits for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, crosshatching for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: two head-and-shoulders portraits of the same fantasy people side by side, a man on the left and a woman on the right, both in three-quarter view turned slightly toward each other. Same scale, same style, same eye level, a little empty space between and around them. Horizontal 4:3 format. Simple, strong shapes that still read clearly when printed small (about 5 cm wide): big shadows, few fine details.

Background: pure flat white (#FFFFFF) everywhere outside the drawing. No paper texture, no beige, no gradient, no vignette, no frame, no border, no circles or panels behind the heads.

No text, no letters, no logo, no signature, no watermark.

People: [ANCESTRALIDADE]
```

| Ancestralidade | Arquivo | Linha para [ANCESTRALIDADE] |
|---|---|---|
| Humano | humano | Humans: weathered adventurers with determined, ambitious stares; one has a scar on the cheek, the other a traveler's hood. |
| Anão | anao | Dwarves: stern and stocky; he has a long beard braided with metal rings, she has thick braided hair with metal rings; heavy iron helm or fur collar. |
| Elfo | elfo | Elves: elegant, with long pointed ears, long straight hair and calm, ageless faces; thin circlets on the brow. |
| Drow | drow | Drow: skin rendered in solid black ink and hatching, long white hair, long pointed ears, cruel and elegant expressions, spider-shaped jewelry. |
| Meio-elfo | meio-elfo | Half-elves: slightly pointed ears, a mix of human and elven features, friendly half-smiles, traveling cloaks. |
| Halfling | halfling | Halflings: small folk with curly hair, round cheeks and cheerful, confident faces; one holds a long pipe. |
| Draconato | draconato | Dragonborn: reptilian heads with swept-back horns and scaled skin, smoke curling from the nostrils; she has a slightly slimmer snout and a frill. |
| Gnomo | gnomo | Gnomes: big noses, wild hair, mischievous grins, brass goggles pushed up on the forehead. |
| Orc | orc | Orcs: fierce faces with big tusks, heavy brows, war paint and fur collars. |
| Meio-orc | meio-orc | Half-orcs: small tusks, strong jaws and stoic expressions; one has a broken nose, the other a worn hood. |
| Tiefling | tiefling | Tieflings: large curved horns, blank pupil-less eyes and sly smiles, tail tips curling over the shoulders. |
| Goblin | goblin | Goblins: huge ears, sharp crooked teeth, wide nervous eyes; one holds a dagger close to the face. |
| Autômato | automato | Automatons: faces of riveted metal plates, glowing eye slits, visible gears and cables at the neck; one with a broad, heavy build, the other with a slender, graceful build. |

## Símbolos de Divindades

Símbolos sagrados para os cartões de divindade das campanhas. Escolha a proporção **1:1** no Gemini. Salve como `docs/assets/images/<campanha>/<arquivo>.webp` (mesmo tratamento das classes). No cartão, ponha a arte logo depois da epígrafe; ela vai para o canto direito, ao lado do título:

```markdown
![Símbolo de Woltander](../assets/images/aethelgard/woltander.webp){ .fj-arte-ancestral loading=lazy }
```

```text
Black and white pen-and-ink holy symbol for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: a single emblem, centered, square 1:1 format, with empty space around it. Simple, strong, symmetrical shapes that still read clearly when printed small (about 4 cm wide), like a symbol carved on a shield or stamped on a medallion.

Background: pure flat white (#FFFFFF) everywhere outside the drawing. No paper texture, no beige, no gradient, no vignette, no frame, no border, no circle behind the emblem.

No text, no letters, no logo, no signature, no watermark.

Symbol: [SÍMBOLO]
```

| Divindade | Arquivo | Linha para [SÍMBOLO] |
|---|---|---|
| Woltander (Aethelgard) | aethelgard/woltander | A straight longsword pointing down, its blade driven into a flat horizon line; a half sun rises from the horizon behind the crossguard, with straight rays fanning out. The crossguard and the horizon together suggest a cross, but it must not look like a Christian cross. |

## NPCs de Campanha

Retratos para as folhas de "Quem É Quem" que o Mestre mostra aos jogadores. Escolha a proporção **1:1** no Gemini. Use uma conversa nova para cada vila, com o prompt abaixo na primeira e depois "Same style, same rules. Next:" + a linha.

Salve do jeito que vier (png ou jpg) em `campanhas/<campanha>/retratos/<arquivo>.png`, com o nome da tabela. Rode `python campanhas/aethelgard/gerar.py`: o retrato entra no cartão sozinho. Quem ainda não tem arte sai com um quadro vazio.

**Vários numa imagem só.** Dá para pedir todos numa grade (14 em 4 × 4 deu certo para Torre Vermelha, mas cada retrato sai com uns 250 pixels). Para cortar a grade em um arquivo por NPC, na ordem de leitura:

```bash
python campanhas/aethelgard/recortar_retratos.py grade.png broz roch ariadna-ambrozy agniezka cecylia norneth konrad eva gabe cibor remy-mags witek tobiasz zula
```

```text
Black and white pen-and-ink portrait for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, crosshatching for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: one head-and-shoulders portrait in three-quarter view, centered, square 1:1 format, with a little empty space around it. If the line describes two people, draw them side by side at the same scale and eye level, turned slightly toward each other. Simple, strong shapes and a clear, memorable face that still read clearly when printed small (about 4 cm wide): big shadows, few fine details.

Background: pure flat white (#FFFFFF) everywhere outside the drawing. No paper texture, no beige, no gradient, no vignette, no frame, no border, no circle or panel behind the head.

No text, no letters, no logo, no signature, no watermark.

Person: [NPC]
```

### Torre Vermelha (Aethelgard)

Pasta: `campanhas/aethelgard/retratos/`.

| NPC | Arquivo | Linha para [NPC] |
|---|---|---|
| Wislaw Broz | broz | A plump, rosy-cheeked human mayor in his fifties, in fine city clothes with a fur collar and a heavy chain of office, smiling a too-friendly salesman's smile. |
| Roch | roch | A stern middle-aged human constable with a short beard and narrowed, suspicious eyes, a long pipe in his mouth, a padded jerkin over a chain shirt. |
| Ariadna e Ambrozy | ariadna-ambrozy | A human sister and brother in their forties, innkeepers and retired scouts, in leather vests: she has braided hair and a scar on her cheek; he is broad with a thick mustache. Both cheerful, ready to tell a story. |
| Agniezka | agniezka | A stocky human woman blacksmith in her fifties, short gray hair, muscular scarred arms, leather apron, a hammer on her shoulder and a grumpy frown. |
| Cecylia | cecylia | A serious, studious human priestess with short hair and a plain robe, holding an open book; on her chest, a holy symbol of a sword driven point-down into the horizon with a half sun rising behind the crossguard. |
| Norneth | norneth | A young half-elf acolyte woman with slightly pointed ears, in a plain hooded robe, quiet and watchful, her sharp eyes glancing sideways at the viewer's belongings. |
| Konrad | konrad | An old, wealthy human battlemage with a neat white beard, an embroidered robe with military medals and a jeweled ring, smiling warmly but with calculating eyes. |
| Eva | eva | A cheerful human woman in her forties with a headscarf, holding an apple pie, leaning in with a curious, gossiping smile. |
| Gabe | gabe | A human teenage boy with messy hair and a cocky grin, but deep dark circles under his eyes, rubbing his temple. |
| Cibor | cibor | A quiet, weathered human farmer in a wide straw hat, holding a basket of enormous apples, with a calm, distant gaze. |
| Remy e Mags | remy-mags | A halfling husband and wife, merry brewers in aprons, both a little tipsy, with rosy noses and foaming mugs raised in a toast. |
| Witek | witek | A wiry, nervous human tanner with many charms, amulets and rabbit's feet hanging from his neck, a stained leather apron and darting eyes. |
| Tobiasz | tobiasz | An old human hermit carpenter with wild white hair and beard, patched clothes and a carpenter's hammer, shouting angrily with a pointing finger. |
| Zula | zula | A pale human witch with long dark hair and tattoos on her face, small dead animals hanging behind her shoulder, smiling as if she knows a secret. |

### Aethelgard: grades prontas

Duas grades para colar inteiras no Gemini (1:1). Salve cada uma em `campanhas/aethelgard/retratos/` e corte com o comando embaixo dela. Se algum sair errado, refaça só ele com o prompt de retrato único acima.

**Grade 1: Java e a estrada** (16 retratos, 4 × 4).

```text
Black and white pen-and-ink portraits for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, crosshatching for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: a sheet of 16 separate head-and-shoulders portraits in a strict grid of 4 columns and 4 rows, square 1:1 format. Every cell is the same size, with wide white gutters between cells; portraits must not touch each other. Fill the cells in reading order (left to right, top to bottom). Each portrait is in three-quarter view, centered in its cell, with a clear, memorable face and simple, strong shapes. Each person must look clearly different from the others. Cells with two or three people show them side by side at the same scale. All humans have round human ears; only the drow and the goblin have pointed ears.

Background: pure flat white (#FFFFFF) everywhere. No paper texture, no frames, no borders, no lines between cells, no circles behind the heads.

No text, no letters, no numbers, no labels, no signature, no watermark.

1. A dignified human baron in his sixties, neat gray beard, fur-trimmed coat, signet ring, holding a small cup of coffee.
2. A sturdy human warehouse foreman in his thirties, rolled sleeves, a sack of coffee beans on his shoulder, stubborn defiant look.
3. An elegant, cold human woman in her forties, fine dark dress with a lace collar, rings on her fingers, a sealed letter in her hand, thin calculating smile.
4. A burly human miller covered in flour, half of his face weeping and the other half grinning madly, the shadow of a small horned imp behind his shoulder.
5. A drow woman, skin rendered in solid black ink with hatching, long white hair, a spiky crown, a fresh wound across her cheek, cruel proud gaze, holding a chain.
6. A cheerful gnome peddler with a big nose and wild hair, pots and pans hanging from his pack, a mule's head peeking in beside him.
7. An old weathered human boatman, white stubble, wool cap, an oar on his shoulder, skeptical grin.
8. Three people: burly human woodcutters with axes on their shoulders; one bearded, one young, one bald.
9. A young, nervous human soldier, round helmet, chain mail, holding a spear and a shield, wide scared eyes.
10. A young, stubborn human shepherdess, wind-blown hair, a crook staff, a goat beside her.
11. A thin, starving human villager in rags, a broken chain hanging from an iron collar, terrified eyes.
12. A grizzled human bandit captain, reddish-gray hair and beard, chain mail, a scar across the nose, hard smirk.
13. A goblin chief with huge ears and a crooked grin, wearing a torn tabard with a castle crest, a heavy club on his shoulder.
14. Three people: tired human hunters in leather and fur with bows, dark circles under their eyes; an older leader with a scruffy beard and two young brothers.
15. A drow overseer, skin rendered in solid black ink with hatching, short white hair, chain shirt, a coiled whip, cold sneer.
16. A gaunt human mother in her forties, torn clothes, shackle marks on her wrists, fierce, determined eyes.
```

```bash
python campanhas/aethelgard/recortar_retratos.py grade-java.png barao-java tonho maren odo velistra pipo tadeu lenhadores lauro ilsa bento ruco gorgo cacadores zarek marta
```

| Nº | NPC | Onde aparece |
|---|---|---|
| 1 | Barão de Java | guia de Aethelgard |
| 2 | Tonho | sessão 1 (Centro de Distribuição) |
| 3 | Maren Dovel | sessão 1, Viagem (o retrato falado) |
| 4 | Odo, o moleiro | sessão 1 |
| 5 | Velistra | sessão 1, Mina da Treva |
| 6 | Pipo Latão | Viagem, bom 1 |
| 7 | Tadeu, o barqueiro | Viagem, bom 3 |
| 8 | Borys, Janek e Olek | Viagem, bom 4 |
| 9 | Lauro | Viagem, bom 6 |
| 10 | Ilsa, a pastora | Viagem, ruim 4 |
| 11 | Bento | Viagem, ruim 6; Mina da Treva |
| 12 | Capitão Ruço | Viagem, ruim 1 |
| 13 | Gorgo, chefe goblin | Viagem, ruim 3 |
| 14 | Dobek e os irmãos Wilk | Mãe dos Morros |
| 15 | Zarek, o feitor | Mina da Treva |
| 16 | Marta | Mina da Treva |

**Grade 2: Torre Vermelha, os que faltam** (5 retratos, 3 × 2).

```text
Black and white pen-and-ink portraits for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, crosshatching for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: a sheet of 5 separate head-and-shoulders portraits in a strict grid of 3 columns and 2 rows, horizontal 3:2 format. Every cell is the same size, with wide white gutters between cells; portraits must not touch each other. Fill the cells in reading order (left to right, top to bottom); the last cell stays empty white. Each portrait is in three-quarter view, centered in its cell, with a clear, memorable face. Each person must look clearly different from the others. All humans have round human ears.

Background: pure flat white (#FFFFFF) everywhere. No paper texture, no frames, no borders, no lines between cells.

No text, no letters, no numbers, no labels, no signature, no watermark.

1. A halfling naturalist with curly hair and round spectacles, exhausted and bruised, holding sample jars and a small shovel.
2. A human merchant woman in her forties, practical travel coat, a ledger under her arm, exhausted but sharp-eyed.
3. A battered human knight bodyguard with a red stag on his tabard and an antler crest on his helmet, bandaged face, stern and loyal.
4. A portly human merchant with a fur hat and a big mustache, holding a ledger and a coin purse, shrewd smile.
5. A clumsy young human apprentice tanner in an apron, dropping a stack of hides, embarrassed grin.
```

```bash
python campanhas/aethelgard/recortar_retratos.py grade-torre-2.png ichbon dugan barrett kazimierz hubert
```

| Nº | NPC | Onde aparece |
|---|---|---|
| 1 | Ichbon | Torre Vermelha, presos na Cidadela |
| 2 | Dugan Lovay | Torre Vermelha, presos na Cidadela |
| 3 | Barrett, o Cervo Vermelho | Torre Vermelha, presos na Cidadela |
| 4 | Kazimierz | Torre Vermelha, comitê de mercadores (sugestão) |
| 5 | Hubert | Torre Vermelha, aprendiz de Witek |

## Cenas de Sessão

Uma arte por sessão para o Diário de cada campanha, feita a partir das miniaturas da mesa. Proporção **3:2** horizontal no Gemini. Mande primeiro o prompt completo; se ele embolar os personagens, peça ajustes um por vez ("Make the dwarf bald with a grey beard", "Remove the extra drow"). Salve como `docs/assets/images/<campanha>/sessao-<n>.webp`. No Diário, logo depois do título da sessão:

```markdown
![Descrição curta da cena](../assets/images/aethelgard/sessao-1.webp){ .fj-arte .fj-arte-cena loading=lazy }
```

### Aethelgard, Sessão 1: a luta na cripta maior

```text
Black and white pen-and-ink illustration for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, heavy solid blacks, crosshatching and stippling for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: one wide action scene, horizontal 3:2 format. Four heroes on the left fight a band of dark elves on the right, in an ancient underground crypt. The edges of the scene fade into pure flat white (#FFFFFF): no paper texture, no beige, no frame, no border.

No text, no letters, no logo, no signature, no watermark.

Setting: a large stone crypt under an abandoned chapel. Broken sarcophagi, scattered skeleton bones on the floor, a thick bell rope hanging from a hole in the vaulted ceiling. At the back, a jagged crack in the floor glows like a portal into the darkness below. Light comes only from a fireball and a glowing staff, casting hard black shadows.

The heroes:
1. A dragonborn paladin in front: a reptilian dragon head with swept-back horns and fierce eyes, heavy plate armor with a scale pattern, a long cloak, a tall kite shield raised on one arm, a broad longsword in the other hand.
2. A tiny gnome wizard behind the paladin: a huge floppy pointed wizard hat with a bent tip, layered robes, hurling a ball of fire from both hands.
3. An old, gaunt human priest: long grey beard, a hood, ragged robes wrapped in cloth strips, prayer beads at the belt, raising a tall metal-capped staff that shines with holy light. A holy symbol on the chest: a sword pointing down in front of a rising sun.
4. A stocky bald dwarf smith: thick grey beard, bare muscular arms, a heavy leather blacksmith's apron, a forge hammer in one hand and a heavy tool in the other.

The enemies (drow, dark elves): skin rendered in solid black ink, wild white hair, glowing eyes, spiked dark armor and tattered cloaks.
- One drow soldier charges with two curved swords.
- One drow soldier kneels, aiming a hand crossbow.
- Behind them, the drow sorceress Velistra, wounded, retreats toward the glowing crack in the floor, holding a staff topped with a spiked iron ring. Above her, a demon with huge ragged feathered wings swoops down to carry her away.
```
