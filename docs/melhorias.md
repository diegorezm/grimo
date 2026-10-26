# Melhorias sugeridas (análise de 25/10/2026)

Bugs, segurança, performance e novas features encontrados lendo o código. O que já existe está em
[features.md](features.md). Severidade: **Alta** (afeta segurança, dados ou moderação),
**Média** (comportamento errado visível), **Baixa** (borda ou polimento).

## Prioridades

Se for fazer só dez coisas, nesta ordem:

1. [S1] Validar no servidor o livro enviado por `shelves.add` (envenenamento do catálogo e capa
   apontando para servidor de terceiros).
2. [B1] Esconder resenhas de leitores bloqueados, suspensos ou ocultos na página do livro.
3. [S2] Rate limit em cadastro, login, posts, comentários, denúncias e nas actions do Open Library.
4. [S3] Recuperação de senha e verificação de email (hoje quem esquece a senha perde a conta).
5. [S4] Cabeçalhos de segurança na web (CSP etc.): o token de sessão fica no localStorage.
6. [B2] Datas no fuso do leitor: livros terminados à noite caem no mês/ano errado.
7. [F1] Tela de post com comentários e apagar post/comentário (backend já existe).
8. [P1] `users.suggestions` e `feed.list` com custo limitado antes de a rede crescer.
9. [F2] Remover livro da estante (backend e hook prontos, falta botão).
10. [F3] Paridade do mobile: perfil de outros leitores, seguir, busca de leitores, editar perfil.

---

## Bugs

### B1 · Página do livro mostra resenhas de quem não deveria aparecer — Alta

> **Corrigido:** `books.detail` agora filtra com `isHidden` + `blockedIds` (teste "hides reviews
> of blocked and hidden readers"). A média da comunidade ainda conta todas as notas.

[books.ts:157-164](../packages/backend/convex/books.ts) só confere se o autor existe. Resenhas de
leitores **bloqueados** (nos dois sentidos), **suspensos**, **menores de 16** ou com exclusão em
andamento aparecem para todos. O resto do app usa `isHidden` + `blockedIds` (feed, `posts.get`).

- **Cenário:** A bloqueia B; A abre um livro que B resenhou e vê a resenha (curtir é barrado pelo
  `interactablePost`, mas o texto aparece). Uma conta suspensa por discurso de ódio continua com as
  resenhas visíveis.
- **Correção:** aplicar `isHidden(author)` e `blockedIds(ctx, viewer?._id)` no filtro; considerar
  também excluir essas contas da média da comunidade. Adicionar teste em `grimo.test.ts`.

### B2 · Mês e ano calculados em UTC — Média

> **Corrigido:** `users.timeZone` (padrão `America/Sao_Paulo`, enviado pelos apps com `useSyncTimeZone`); `monthRange`/`yearRange`/`toMonthKey` aceitam o fuso e `model/stats.ts` conta no fuso do leitor.

`monthRange`, `yearRange` e `toMonthKey` ([core/lib/date.ts](../packages/core/src/lib/date.ts)) e o
ano da meta ([users.ts:94](../packages/backend/convex/users.ts), [readers.ts:85](../packages/backend/convex/model/readers.ts))
usam UTC. No Brasil (UTC−3), entre 21h e meia-noite o "hoje" do servidor já é o dia seguinte.

- **Cenário:** terminar um livro em 31/10 às 22h conta para novembro; definir a meta em 31/12 às 22h
  grava a meta de 2027. Na web, `/me` usa `getFullYear()` local enquanto o servidor usa UTC.
- **Correção:** guardar o fuso do leitor (`users.timeZone`, padrão `America/Sao_Paulo`, enviado pelo
  app) e calcular os intervalos nele; ou o cliente manda o intervalo/offset. Testar a virada de mês.

### B3 · "Páginas lidas" pode ser inflado — Média

> **Corrigido:** `currentPage` é limitado a `pageCount` (ou 20000) e `shelfEntries.maxPage` evita contar a mesma página duas vezes.

[planShelfTransition](../packages/core/src/shelves/transition.ts) soma `nova página − página
anterior` sempre que sobe. Voltar a página e avançar de novo conta duas vezes, e `currentPage` não
tem limite (pode passar de `pageCount`, ou ser 999999999 e aparecer no feed).

- **Correção:** limitar `currentPage` a `pageCount` quando conhecido (e um teto sensato quando não);
  contar só avanço acima do maior ponto já registrado na entrada (`maxPage` na `shelfEntries`).

### B4 · Botão "Seguir" aparece no seu próprio card nas listas — Baixa

As rotas de seguidores/seguindo passam `session.user.id` (id do Better Auth) como `viewerId`
([u.$username_.followers.tsx:17](../apps/web/src/routes/_app/u.$username_.followers.tsx)), e
[connections-list.tsx:36](../apps/web/src/features/readers/components/connections-list.tsx) compara
com `reader.id` (id da tabela `users`). Nunca são iguais, então você aparece como "seguível" e o
clique dá erro "Você não pode seguir a si mesmo".

- **Correção:** usar `useMe().data?.id` (como já faz `u.$username.tsx` para `isMe`).

### B5 · Releitura apaga a data da primeira leitura — Baixa

Voltar um livro de "Lido" para "Lendo" mantém `finishedAt`; marcar "Lido" de novo sobrescreve a data
e gera outro "terminou de ler" no feed. A estatística do ano anterior perde o livro.

- **Correção:** tratar releitura explicitamente (veja [F8](#f8--releituras)).

### B6 · Denúncia duplicada quando já houve uma resolvida — Baixa

[moderation.ts:48-54](../packages/backend/convex/moderation.ts) usa `.first()` no índice
`by_reporter_target`, que devolve a denúncia **mais antiga**. Se a antiga foi resolvida e existe uma
aberta mais nova, uma terceira é criada. Use `.order("desc").first()`.

### B7 · Busca do Open Library sem timeout — Baixa

[openLibrary.ts:27](../packages/backend/convex/model/openLibrary.ts): `searchOpenLibrary` não tem
`AbortSignal.timeout` (o `fetchWork` tem). Com o Open Library lento, a action fica pendurada até o
limite do Convex e o usuário vê o spinner o tempo todo.

### B8 · Email digitado errado cria uma conta nova em silêncio — Média (UX)

> **Corrigido:** quando o login não bate com nenhuma conta, o formulário pergunta "Criar conta nova com x@y.com?" (`confirm-new` em `continueWithEmail`) antes de criar.

[continueWithEmail](../packages/client/src/lib/auth.ts) cria conta quando o login falha e o email não
existe. Quem erra uma letra do email (`gmial.com`) cai no onboarding de uma conta vazia, achando que
perdeu os dados. **Correção:** quando o sign-in falha, perguntar "Criar uma conta nova com
x@y.com?" antes do sign-up (um passo a mais só para contas novas).

### B9 · Outros detalhes

- `useBook` ([books/hooks.ts](../packages/client/src/features/books/hooks.ts)): o estado `failed` não
  é zerado ao trocar de `openLibraryId` no mesmo componente (side peek trocando de livro).
- `posts.create` aceita `bookId` de um livro inexistente (o validador só confere o formato do id).
- No perfil `/u/$username`, enquanto `me` carrega, `isMe` é falso e o botão "Seguir" pisca no seu
  próprio perfil.

---

## Segurança

### S1 · Livro vindo do cliente vira o livro de todo mundo — Alta

> **Corrigido:** `bookInputSchema` exige id `OL…W`, capa só de `https://covers.openlibrary.org/`
> e limita tamanhos; quando um livro é criado, `shelves.add` agenda `books.refreshBook`, que troca
> os dados pelos do Open Library. Se o Open Library não conhece o id ou está fora, ficam os dados
> enviados (já validados).

`shelves.add` recebe o livro inteiro do cliente (`bookInput`) e `upsertBook`
([model/shelves.ts:51](../packages/backend/convex/model/shelves.ts)) grava na primeira vez; depois
só preenche campos vazios. O schema ([books/schemas.ts](../packages/core/src/books/schemas.ts)) não
limita tamanho de `title`/`authors`/`genres`, não valida o formato de `openLibraryId` e aceita
qualquer URL em `coverUrl`.

- **Ataque:** chamar a mutation direto com o id real de um livro popular, título ofensivo e capa
  `https://servidor-do-atacante/pixel.png`. Todo leitor que abrir o feed, o livro ou um perfil
  carrega a imagem do servidor do atacante (vaza IP e user agent: problema de LGPD) e vê o título
  falso, para sempre.
- **Correção:**
  1. `openLibraryId` com `/^OL\d+W$/`; limites de tamanho (título 300, até 10 autores/gêneros de 100).
  2. `coverUrl` só de `https://covers.openlibrary.org/`.
  3. Melhor: `shelves.add` recebe só o `openLibraryId` e o servidor resolve os dados pelo
     `bookSearchCache`/`workCache` (ou busca no Open Library numa action) em vez de confiar no cliente.

### S2 · Nenhum rate limit — Alta

> **Corrigido:** `@convex-dev/rate-limiter` (`model/rateLimit.ts`) limita posts 10/h, comentários 30/h, denúncias 10/dia, livros novos na estante 120/h e buscas do Open Library 60/min por leitor; `books.search` e `books.loadWork` exigem login. Login (10 por 15 min, por email) e cadastro (5/h por IP, mais um teto de 300/h) são limitados num hook do Better Auth (`limitAuthAttempts`); o limitador próprio do Better Auth fica desligado porque, sem IP do cliente, ele cai num balde único para todo mundo.

Não há limite de taxa em nenhuma função. Better Auth tem rate limit embutido, mas com armazenamento
em memória ele não vale entre execuções do Convex.

- **Riscos:** força bruta de senha; criação em massa de contas (cadastro aberto, sem verificação);
  spam de posts, comentários e denúncias; uso de `books.search` e `books.loadWork` (públicas, **sem
  login**) como proxy gratuito, o que pode fazer o Open Library bloquear o User-Agent do Grimo e faz
  as tabelas de cache crescerem sem limite.
- **Correção:** componente [`@convex-dev/rate-limiter`](https://www.convex.dev/components/rate-limiter)
  nas mutations e actions; `rateLimit: { storage: "database" }` (ou `customStorage`) no Better Auth;
  exigir login em `books.search`/`loadWork` (ou limitar por IP no HTTP).

### S3 · Sem recuperação de senha e sem verificação de email — Alta

`requireEmailVerification: false` ([auth.ts:113](../packages/backend/convex/auth.ts)) e não há fluxo
de "esqueci a senha" (nenhum envio de email configurado).

- **Riscos:** quem esquece a senha perde a conta (e os dados, porque nem consegue pedir a exclusão);
  qualquer pessoa pode cadastrar o email de outra; **pré-sequestro de conta**: o atacante cria conta
  com `vitima@gmail.com` + senha; quando a vítima entra com Google, se o Better Auth vincular as
  contas pelo email, o atacante continua com acesso pela senha. Vale testar e, se for o caso, só
  vincular contas com email verificado (`account.accountLinking`).
- **Correção:** provedor de email (Resend tem componente Convex), `sendResetPassword` e
  `emailVerification` no Better Auth, tela "Esqueci minha senha" nos dois apps. Atualizar o ROPA.

### S4 · Web sem cabeçalhos de segurança — Média

A web é estática no Cloudflare sem `_headers`. Como o token de sessão do plugin cross-domain fica no
localStorage, um XSS vira roubo de conta.

- **Correção:** `apps/web/public/_headers` com `Content-Security-Policy` (`script-src 'self'` + hash
  do script de tema do `index.html`; `img-src` com `covers.openlibrary.org`; `connect-src` com o
  Convex), `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`.

### S5 · Outras medidas

- **Enumeração de emails:** o fluxo único responde "Senha incorreta para esse email", o que revela
  que o email tem conta. É uma troca consciente de UX; com rate limit (S2) o risco cai bastante.
- **Redirect do login:** `validateSearch` aceita qualquer caminho que comece com `/` e não `//`. Hoje
  vai para `navigate` do router (seguro), mas vale também recusar `/\` caso um dia vire
  `window.location`.
- **Dev server exposto na rede** (`server.host: true` no Vite): ok em casa, arriscado em Wi-Fi
  público. Deixe opt-in (`pnpm dev --host`).
- **Perfis e atividade públicos sem login:** o progresso de leitura de todo mundo é aberto. Combine
  com [F5 perfil privado](#f5--perfil-privado) (já listado como opcional em `docs/legal`).
- **Denúncias guardam snapshot** com nome/bio/texto mesmo após a exclusão da conta: documentar o
  prazo de retenção no ROPA e apagar após N meses (cron).
- **Logs de acesso (Marco Civil art. 15)** ainda pendentes (`docs/legal/README.md`).

---

## Performance e escala

### P1 · `users.suggestions` é a query mais cara — Alta (quando crescer)

[users.ts:239-297](../packages/backend/convex/users.ts):

- percorre todos os seus follows e, para cada um, **todos** os follows dele (`collect`);
- lê 500 usuários (`take(SUGGESTION_POOL)`) e faz um `isFollowing` por candidato (~500 leituras);
- é reativa e lê 500 documentos `users` cujos contadores mudam o tempo todo, então reexecuta a cada
  follow/livro adicionado de qualquer um desses 500.
- **Bug junto:** `take(500)` sem ordem pega sempre os 500 **mais antigos**; quem entrou depois nunca
  é sugerido.
- **Correção:** limitar os follows percorridos (ex.: 50 mais recentes, `take`), candidatos vindos de
  um índice por popularidade (`by_followers`) + amigos de amigos, `followsYou` via um único
  `by_following` do viewer em `Set`; ou pré-calcular sugestões num cron.

### P2 · Feed com fan-out na leitura — Média

[feed.ts](../packages/backend/convex/feed.ts) faz `collect` de todos os follows e `take(limit + 1)`
por pessoa seguida. Com 300 follows e `limit` 200 são ~60 mil documentos: estoura o limite de
leitura do Convex. O AGENTS.md já aponta isso.

- **Agora:** limitar o número de pessoas consideradas e o `limit` por pessoa (ex.: `min(limit, 40)`).
- **Depois:** tabela `feedItems` (fan-out na escrita, via scheduler) ou feed por `activities` com
  índice global por data filtrando por quem você segue em lotes.

### P3 · Leituras sem limite (`collect`) em dados que crescem — Média

> **Corrigido:** `books.detail` usa os contadores `readerCount`/`ratingSum`/`ratingCount` (mantidos em `model/bookStats.ts`, preenchidos por `migrations:runAll`). Falta `profileBooks`, `posts.get`, exclusão em lotes de posts e `exportData`.

- `shelves.list` e `profileBooks` ([users.ts:124](../packages/backend/convex/users.ts)) leem a estante
  inteira + um `get` por livro, a cada visita a um perfil. Leitores com 2000 livros pesam.
  `profileBooks` pode usar os índices por status com `take`, e `total` já existe em `bookCount`.
- `books.detail` lê **todas** as entradas do livro para contar leitores e média: guarde
  `readerCount`, `ratingSum`, `ratingCount` no documento `books` (contadores, como já é feito em
  posts).
- `posts.get` lê todos os comentários: paginar por `limit` quando a tela existir.
- `posts.remove`, `moderation.removeContent` e o passo de posts do `account.purge` apagam curtidas e
  comentários de um post numa transação só: um post viral passa do limite. Apagar em lotes pelo
  scheduler, como o `purge` já faz no resto.
- `account.exportData` é uma query que lê tudo do leitor: vai falhar para contas grandes. Fazer uma
  action que junta páginas de queries internas (ou gera o arquivo no file storage).

### P4 · Invalidação reativa por contadores no documento `users` — Baixa

`followers`, `following` e `bookCount` ficam no `users`. Toda query que lê um usuário (feed, cards,
sugestões, perfis) reexecuta quando qualquer contador dele muda. Se virar gargalo, mover contadores
para uma tabela `userStats` lida só onde são exibidos.

### P5 · Caches e tabelas que só crescem — Baixa

- `bookSearchCache` e `workCache` nunca são limpos: cron diário apagando o que passou do TTL.
- `activities` de progresso: uma linha por registro de página; o agrupamento é só visual. Atualizar a
  última atividade de progresso do mesmo livro em até 24 h em vez de inserir outra.

### P6 · Web — Baixa

- Code splitting por rota já está ligado (`autoCodeSplitting`). Conferir que `html-to-image` e a
  landing ficam fora do bundle inicial (`vite build` + `rollup-plugin-visualizer`).
- Capas do Open Library em `-L.jpg` (grandes) mesmo em miniaturas: usar `-M`/`-S` em listas e
  `loading="lazy"` + `width/height` para evitar layout shift.

---

## Novas features

### Completar o que já existe (pouco esforço)

#### F1 · Tela de post com comentários

> **Feito:** side peek `?post=<id>` e página `/posts/$id` na web, tela `post/[id]` no mobile, apagar o próprio post, apagar comentário (`posts.removeComment`: autor do comentário ou do post) e denunciar comentário. Falta a notificação ao autor (F6).
Backend (`posts.get`, `posts.comment`) e hooks (`usePost`, `useAddComment`) prontos e sem uso.
Falta: página/side peek `?post=<id>` na web e tela no mobile, contador clicável no feed, **apagar o
próprio post** (`posts.remove` existe) e **apagar o próprio comentário** (não existe no backend; é
também um direito do titular). Notificar o autor (ver F6).

#### F2 · Remover livro da estante
`shelves.remove` + `useRemoveFromShelf` existem; nenhum app tem o botão. Adicionar no detalhe do
livro com confirmação (some o histórico de páginas).

#### F3 · Paridade do mobile
Faltam no app: perfil de outros leitores (`u/[username]`), seguir, seguidores/seguindo, busca e
sugestões de leitores, editar perfil completo (nome, bio, gêneros), estúdio do card do mês com
compartilhamento nativo (`react-native-view-shot` + `expo-sharing`), botão de Apple.

#### F4 · Upload de avatar
Convex file storage (`generateUploadUrl` + `storageId` no `users`), recorte quadrado no cliente,
limite de tamanho e tipo no servidor. Entrar em `exportData`/`purge` e no ROPA.

### Produto

#### F5 · Perfil privado
Opção "só seguidores veem minhas leituras", com pedidos de follow. Já está como opcional no checklist
de `docs/legal`. Impacta `byUsername`, `activity`, `connections`, feed e busca.

#### F6 · Notificações
Novo seguidor, curtida, comentário, alguém começou o mesmo livro. Tabela `notifications` (fan-out na
escrita), sininho na web e push no mobile (`expo-notifications`). Preferências por tipo.

#### F7 · Importar do Goodreads / Skoob
Upload do CSV do Goodreads (e do export do Skoob, muito usado no Brasil), casamento por ISBN no Open
Library, prévia antes de importar. É a feature que mais tira atrito de quem já tem histórico. Já está
nos próximos passos do README.

#### F8 · Releituras
Tabela `readings` (uma por leitura da mesma entrada: início, fim, nota) em vez de um único
`startedAt/finishedAt`. Resolve o [B5](#b5--releitura-apaga-a-data-da-primeira-leitura--baixa) e
deixa a estatística correta.

#### F9 · Mais estatísticas, sem virar app de números
Sequência de dias lendo, meta mensal/por páginas, "Retrospectiva do ano" (card de dezembro com os
mesmos modelos), tempo médio para terminar um livro.

#### F10 · Descoberta pela comunidade
"Leitores com gosto parecido" (interseção de lidos/gêneros), "em alta entre quem você segue",
livros que seus amigos querem ler também. Já está nos próximos passos do README.

#### F11 · Citações e marcações
Post tipo `quote` (trecho + página) com card compartilhável no mesmo estúdio do resumo do mês.

#### F12 · Clubes / leituras conjuntas
Grupo pequeno lendo o mesmo livro com meta de páginas por semana e conversa por capítulo (com
spoiler por página). Diferencial forte para uma rede social de leitura.

#### F13 · Edição manual de livro
Livros que o Open Library não tem (nacionais, independentes): cadastro manual com moderação, ou
correção de número de páginas por leitor (`pageCount` por entrada).

#### F14 · ISBN pelo código de barras
No mobile, escanear o ISBN (`expo-camera`) e buscar no Open Library por `isbn:`.

### Moderação e operação

#### F15 · Painel de moderação
Hoje é pelo dashboard do Convex. Uma rota `/admin` protegida por papel (`users.role`) com a fila de
denúncias, ações (remover, suspender, dispensar) e histórico. Avisar o denunciante do resultado.

#### F16 · Filtro automático de conteúdo
Lista de termos bloqueados / OpenAI Moderation ou similar (com cuidado com LGPD e transferência
internacional) antes de publicar post, comentário e bio.

---

## Qualidade e infraestrutura

- **Error boundaries:** nenhuma rota define `errorComponent`; um erro de render derruba a tela
  inteira. Adicionar no `__root` e no `_app` (web) e `ErrorBoundary` do Expo Router.
- **Monitoramento de erros:** sem Sentry ou similar (precisa entrar na Política, por ser terceiro).
  No mínimo, `convex logs` + alertas do dashboard.
- **Testes:**
  - backend: casos de B1, B3, B6, `books.detail`, `users.suggestions`, `posts.remove` e limites de
    tamanho;
  - client: `ConvexCache` (auth pendente, mutação pendente segurando resultados, `onUnauthorized`) é
    a peça mais crítica e não tem teste;
  - web: smoke e2e com Playwright (login → onboarding → adicionar livro → card) no CI.
- **CI:** rodar `expo-doctor` e `vite build` no CI; Dependabot/Renovate para atualizações de segurança.
- **Backups:** agendar export do Convex (snapshot) antes do lançamento; testar restauração.
- **Ambientes:** deployment de preview/staging separado da produção para testar mudanças de schema.
- **Acessibilidade:** auditar contraste dos dois temas, foco visível no side peek (trap de foco e
  `Esc`), `aria-live` nas atualizações otimistas, rótulos nos ícones.
- **PWA:** manifest + ícones para "Adicionar à tela inicial" (o cache offline já existe; falta o
  service worker para abrir sem rede).
