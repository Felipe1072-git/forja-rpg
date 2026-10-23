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
| Malvidente | malvidente | A hunched seer-witch with milky white eyes, casting bones from one hand, a raven on the shoulder and a bubbling cauldron behind. |

## Dicas

- **Fundo.** Se vier com fundo bege ou cinza, peça: "Make the background pure flat white #FFFFFF." O site cuida do resto: no tema claro o branco vira pergaminho; no escuro a arte inverte e vira traço claro.
- **Rosto e corpo.** Para variar ancestralidade e gênero, acrescente na linha, por exemplo, "a dwarf woman" ou "an orc man".
- **Formato.** Mantenha sempre 3:4 vertical, para todas as páginas terem o mesmo tamanho de arte.

## Ancestralidades

Retratos pequenos (cabeça e ombros) para os cartões de Ancestralidades. Use uma conversa nova só para eles, com o prompt abaixo na primeira e depois "Same style, same rules. Next:" + a linha.

Salve como `docs/assets/images/ancestralidades/<arquivo>.webp` (mesmo tratamento das classes). No cartão, ponha a arte logo depois da epígrafe; ela vai para o canto direito, ao lado do título:

```markdown
![Humano](../assets/images/ancestralidades/humano.webp){ .fj-arte-ancestral loading=lazy }
```

```text
Black and white pen-and-ink portrait for an old-school fantasy RPG rulebook, in the gritty OSR style of books like Shadowdark: bold black ink lines, solid blacks, crosshatching for shadows, rough hand-drawn texture, high contrast, no gray tones, no color.

Composition: head and shoulders only, three-quarter view, centered, square 1:1 format, with empty space around the head. Simple, strong shapes that still read clearly when printed very small (about 3 cm wide): big shadows, few fine details.

Background: pure flat white (#FFFFFF) everywhere outside the drawing. No paper texture, no beige, no gradient, no vignette, no frame, no border, no circle behind the head.

No text, no letters, no logo, no signature, no watermark.

Character: [ANCESTRALIDADE]
```

| Ancestralidade | Arquivo | Linha para [ANCESTRALIDADE] |
|---|---|---|
| Humano | humano | A determined human woman with a scar on her cheek and a traveler's hood, ambitious stare. |
| Anão | anao | A stern dwarf man with a long braided beard tied with metal rings and a heavy iron helm. |
| Elfo | elfo | An elegant elf woman with long pointed ears, long straight hair and a calm, ageless face, a thin circlet on her brow. |
| Drow | drow | A drow man with skin rendered in solid black ink and hatching, long white hair, long pointed ears and a cruel, elegant smile, a spider-shaped earring. |
| Meio-elfo | meio-elfo | A half-elf man with slightly pointed ears, mixed human and elven features and a friendly half-smile, a traveling cloak. |
| Halfling | halfling | A cheerful halfling woman with curly hair, round cheeks and a long pipe in her mouth, small and confident. |
| Draconato | draconato | A dragonborn with a reptilian head, swept-back horns and scaled skin, smoke curling from the nostrils. |
| Gnomo | gnomo | A gnome man with a big nose, wild hair and brass goggles pushed up on his forehead, mischievous grin. |
| Orc | orc | A fierce orc woman with big tusks, a heavy brow, war paint and a fur collar. |
| Meio-orc | meio-orc | A half-orc man with small tusks, a broken nose and a stoic expression, a worn hood. |
| Tiefling | tiefling | A tiefling woman with large curved horns, blank pupil-less eyes and a sly smile, the tip of her tail curling over the shoulder. |
| Goblin | goblin | A nervous goblin with huge ears, sharp crooked teeth and wide eyes, holding a dagger close to the face. |
| Autômato | automato | An automaton with a face of riveted metal plates, glowing eye slits and visible gears and cables at the neck. |
