---
name: de-slop-ui
description: Tira a "cara de IA" de uma tela do Grimo (web ou mobile) em 5 passadas em ordem (espaçamento, cor, ícones, tipo, estrutura), cada uma com checklist e valores. Use quando pedirem para "deslop", "desslopar", "tirar a cara de IA", "deixar mais bonito/profissional" ou para revisar o visual de uma tela.
---

# de-slop UI

Método tirado de dois vídeos de antes/depois (uma tela de estudos e uma de corrida feitas por
IA): a tela não é redesenhada do zero; ela passa por **cinco passadas, sempre nesta ordem**, e
cada passada fecha uma checklist com o valor escolhido ao lado (`Gap 24 pt ✓`). Uma passada só
mexe no que é dela. No fim, a tela parece feita por uma pessoa com um sistema, não sorteada.

Sinais de "slop" que o método caça: gradiente em tudo, cada card de uma cor, sombra difusa,
emoji no lugar de ícone (🔥 🚀 🎯 👋), 3 tamanhos de fonte quase iguais, números em fonte de texto,
espaços "mais ou menos" (19 pt aqui, 22 pt ali), botões cinza sem peso, tudo com o mesmo destaque.

## Antes de começar

1. Leia `AGENTS.md` (Estilo) e os tokens em `packages/tokens/src/index.ts`. No Grimo **não se
   inventa valor**: toda cor, espaço e raio sai dos tokens (web: classes Tailwind; mobile:
   `useTheme()`, `spacing`, `radius`). Se um valor necessário não existe, proponha o token.
2. Identifique a tela (rota fina → componentes da feature) e liste os componentes que ela usa.
3. Tire o "antes": screenshot claro e escuro (web: navegador; mobile: descreva ou peça print).
4. O usuário quer ver o resultado no **canvas (Claude Design)** antes de aplicar UI: monte o
   antes/depois lá, com a checklist das passadas ao lado de cada estágio, e só aplique no código
   depois do "Aprovado".

## As cinco passadas

### 01 · Espaçamento (uma grade só)

- Grade de 4/8 pt: só `spacing[1..12]` (4, 8, 12, 16, 20, 24, 32, 40, 48). Nada de 19, 22, 7.
- Escolha e anote 4 valores e use-os na tela toda: **Gap** entre seções, **Gutter** lateral,
  **Padding** dentro de card, **Radius**. Tela típica do Grimo: gap 24, gutter 20, padding 16,
  radius `md`.
- Cards irmãos têm a mesma largura e alinham as bordas; texto alinha ao mesmo eixo esquerdo.
- Espaço vazio é intencional: separe grupos com espaço, não com mais bordas/cards.

### 02 · Cor (canvas, um acento, zero sombra)

- Canvas é o fundo do tema (branco no claro), sem gradiente de fundo.
- **Sombra 0%**: separe com borda fina (`border`/`edge`) ou um tom de superfície
  (`surfaceMuted`), nunca com sombra difusa.
- **Um acento** (oliva/lilás do tema) para a ação principal e o estado ativo; o resto em tinta
  e cinzas. Cor forte entra em **um** bloco por tela, e por um motivo (ex.: o card do que importa
  agora). Cards não recebem cada um uma cor.
- Botão principal com peso (preenchido, contraste alto); secundários claros. No tema claro, nada
  de preenchimento escuro: lavagens lilás claras (memória `grimo-design-light-buttons`).
- Gradiente só se for o do sistema (botão primário), nunca em card ou fundo.
- Confira contraste e os **dois temas**.

### 03 · Ícones (emoji → traço)

- Emoji sai da UI (rótulos, botões, abas, chips). Troque por ícone de traço único, mesmo peso
  (≈1,5–1,6 pt) e mesmo tamanho em toda a tela (mobile: SF Symbols via `expo-symbols`/`IconSymbol`
  com o mesmo `weight`; web: o pacote de ícones já usado no app).
- Ícone só onde ajuda a ler (abas, ações, chips de estado); título não precisa de ícone.
- Ícones de ação ficam dentro do botão, alinhados ao texto; um círculo de toque ≥ 44 pt.
- Emoji só sobrevive como **conteúdo do usuário** (post, reação escolhida), nunca como enfeite.

### 04 · Tipo (escala curta, números em mono)

- Famílias do Grimo: **Fraunces** (serif) em títulos, **IBM Plex Mono** em rótulos, números,
  botões e navegação, **Nunito/sans** no texto corrido. Nada de outra fonte.
- Escala com saltos claros: Título 28 · Seção 20–22 · Corpo 15–16 · Rótulo 12–13 (mono, caixa
  alta ou espaçado). Se dois tamanhos diferem em 1–2 pt, junte em um.
- Números (páginas, metas, contagens, tempo) em mono e alinhados (`tabular-nums` na web).
  Um número-herói por tela pode ser grande.
- Peso faz hierarquia: um negrito por bloco; não deixe tudo bold.
- Textos de UI curtos, em pt-BR, sem emoji, sem exclamação.

### 05 · Estrutura (hierarquia e ritmo)

- Responda: **qual é a uma coisa desta tela?** Ela vira o bloco-herói (maior, primeiro, o único
  com cor forte). O resto desce de nível.
- Agrupe por assunto com um título de seção (Fraunces) e espaço, não com card dentro de card.
- Remova o que repete informação ou não leva a uma ação.
- Barra de abas/ações flutuante em vidro (como as abas nativas do app), não uma barra opaca.
- Estado vazio e carregando com a mesma estrutura (sem pular layout).

## Como reportar

Para cada passada, uma checklist com o valor ao lado, como nos vídeos:

```
01 ESPAÇAMENTO   Gap 24 ✓  Gutter 20 ✓  Padding 16 ✓  Radius md ✓
02 COR           Canvas background ✓  Sombra 0% ✓  Botão primary ✓  Destaque: card "Lendo agora" ✓
03 ÍCONES        Abas SF 1.5 ✓  Ações ▶ ✓  Chips ✓  Emoji removidos: 🔔 ⏱ ♥
04 TIPO          Título Fraunces 28 ✓  Seção 20 ✓  Corpo 15 ✓  Números Plex Mono ✓
05 ESTRUTURA     Herói: … ✓  Removido: … ✓
```

Depois: canvas com antes → 01 → … → 05 (um quadro por passada), "Aprovado" do usuário,
aplicar, `pnpm check`, conferir claro/escuro e só então commitar.

## Achados conhecidos no mobile (ponto de partida)

- `features/notifications/components/notification-bell.tsx`: fallback 🔔 (Android/web).
- `features/books/components/session-control.tsx` e `progress-sheet.tsx`: "⏱" no texto.
- `features/feed/components/feed-item.tsx` e `posts/components/post-thread.tsx`: "♥/♡" como
  texto no lugar de ícone de curtida.
