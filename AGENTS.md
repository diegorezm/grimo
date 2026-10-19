# AGENTS.md

Guia para agentes trabalhando neste repositório. Leia inteiro antes de mudar código.
Contexto de produto e setup estão no [README.md](README.md).

## Mapa rápido

| Preciso mexer em…                        | Onde                                         |
| ---------------------------------------- | -------------------------------------------- |
| Regra de negócio, schema Zod, constante  | `packages/core/src/<domínio>/`               |
| Tabela / índice                          | `packages/backend/convex/schema.ts`          |
| Query / mutation / action                | `packages/backend/convex/<feature>.ts` (+ `convex/model/`) |
| Auth (servidor)                          | `packages/backend/convex/auth.ts`, `http.ts`, `auth.config.ts` |
| Hook de dados (web **e** mobile)         | `packages/client/src/features/<feature>/hooks.ts` |
| Cache (persistência, ponte Convex)       | `packages/client/src/lib/` (`query.ts`, `convex-cache.ts`, `provider.tsx`) |
| Cor / espaçamento / fonte                | `packages/tokens/src/index.ts` + `pnpm tokens:generate` |
| Tela web                                 | `apps/web/src/routes/` (fina) → `apps/web/src/features/` |
| Tela mobile                              | `apps/mobile/src/app/` (fina) → `apps/mobile/src/features/` |
| Dados de exemplo                         | `packages/backend/convex/seed.ts` + `model/seedData.ts` |
| Variável do deployment (SITE_URL…)       | `packages/backend/convex/model/env.ts` + `npx convex env set` |

## Arquitetura

```
apps/web|mobile → @grimo/client (hooks TanStack Query) → ConvexCache (ponte) → Convex (WebSocket)
                        │                                                         │
                        └─ cache persistido (localStorage / MMKV)                  ├─ convex/*.ts (queries, mutations, actions)
                                                                                  ├─ convex/model/* (regras de acesso a dados)
                                                                                  ├─ @grimo/core (Zod + regras puras)
                                                                                  └─ componente Better Auth (/api/auth no site URL)
```

- Backend: **Convex Cloud** (`packages/backend`). Não há mais Hono, Drizzle, migrações, D1/R2 nem
  runtime self-host. O schema do Convex é a fonte de verdade; mudou o schema, o `convex dev`
  aplica (dados novos precisam de default ou de migração com `@convex-dev/migrations`).
- Os tipos fluem do backend para os clientes via `api` (`@grimo/backend`) e `FunctionReturnType`.
  **Não** crie tipos de resposta à mão.
- Auth: Better Auth rodando dentro do Convex (componente `@convex-dev/better-auth`), email/senha +
  username. A web usa o plugin cross-domain (cookie no localStorage); o mobile usa `expoClient`
  (cookie no SecureStore, scheme `grimo://`). O JWT do Better Auth autentica o cliente Convex.
- Não há mais modos de instância (pessoal/comunidade): é uma instância só, social, com cadastro
  aberto.

## Cache: a regra mais importante

O cache forte e persistido é parte central da experiência. **Nenhuma mudança pode regredir isto:**

- **Todo dado de tela passa pelo TanStack Query.** Nunca use `useQuery` de `convex/react` em
  telas: use os hooks de `@grimo/client`. Cada leitura tem uma fábrica (`shelfQuery()`,
  `bookQuery(id)`…) feita com `convexQuery(fn, args, auth)`; o hook só a envolve, e os loaders
  das rotas web usam a mesma fábrica para pré-carregar (`queryClient.prefetchQuery(...)`, sem
  `await`).
- **O cache inteiro é persistido** (web: `localStorage`; mobile: MMKV, um por deployment) por 7
  dias e restaurado no próximo acesso: as telas renderizam do cache **antes de qualquer rede**,
  inclusive sem conexão. Mudou o formato de uma resposta? Suba `CACHE_VERSION`
  (`packages/client/src/lib/query.ts`).
- **A ponte (`ConvexCache`, `lib/convex-cache.ts`)** grava os resultados das subscriptions do Convex
  no cache do TanStack. Uma query só é assinada enquanto algum componente a usa (+60 s) e só
  depois que a auth permite: `"required"` (precisa estar logado; espera a auth do Convex) ou
  `"optional"` (pública mas personalizada, espera a auth se resolver). Assim o cache restaurado
  nunca é trocado por um resultado "deslogado" nem gera erro falso de sessão.
- Queries do Convex têm `staleTime: Infinity`: quem as mantém frescas é a subscription. Não
  invalide queries do Convex em mutations. `staleTimes` só vale para o que não é Convex (busca de
  livros via action: 24 h; sessão: 5 min).
- **Mutações são otimistas**: `onMutate` aplica a mudança no cache com `patchQueries` (funciona
  offline e em queries que não estão na tela) e devolve o rollback; `onError` desfaz. Enquanto há
  mutação pendente a ponte segura os resultados do servidor e aplica tudo quando ela termina (sem
  "piscar" o valor antigo). Veja `useUpdateShelfEntry`, `useToggleLike`, `useToggleFollow`.
- Listas crescem por `limit` (`useGrowingList`: 20, 40, 60…), não por cursor: uma query reativa
  por lista, e a primeira página fica no cache persistido.
- Login e logout limpam o cache (web: `clearCache()` de `@/lib/api`; mobile: `useClearCache()`).
  Sessão rejeitada pelo servidor (401 do Better Auth ou `UNAUTHENTICATED` de uma query) limpa o
  cache e volta ao login. **Erro de rede não é logout**: offline o app segue no cache (web: o
  guard usa a última sessão salva pelo plugin cross-domain; mobile: o `expoClient` restaura a
  sessão do SecureStore).
- A sessão fica em cache em memória (`sessionQuery`, 5 min) e **nunca** é persistida no cache de
  queries.

## Regra de ouro: compartilhar o máximo possível

Antes de escrever código em `apps/web` ou `apps/mobile`, pergunte: **isso depende de DOM ou de
React Native?** Se não depende, o lugar é um package.

- Lógica pura (cálculo, validação, texto de UI compartilhado como `describeActivity`) → `@grimo/core`.
- Acesso a dados, cache, mutações, estado de UI compartilhado (zustand) → `@grimo/client`.
- Só componentes visuais e navegação ficam nos apps.

Se você está duplicando algo entre web e mobile que não é JSX, pare e mova para um package.

## Convenções

### Backend (`packages/backend/convex`)

- Um arquivo por feature (`shelves.ts`, `posts.ts`, `users.ts`, `books.ts`, `feed.ts`,
  `stats.ts`) com as funções públicas, finas. Regras e acesso a dados reutilizáveis ficam em
  `convex/model/` (usados também pelo seed).
- Funções protegidas: `const viewer = await requireViewer(ctx)` na primeira linha. Públicas
  personalizadas: `getViewer(ctx)` (pode ser null). Nunca receba o id do usuário logado como arg.
- Valide args com `v` e as regras de negócio com o schema Zod do core: `parse(schema, args)`.
  Defina o schema no core, não na função.
- Erros esperados: `appError(code, mensagem)` / `notFound()` (ConvexError `{ code, message }`,
  mensagem em pt-BR). No cliente: `errorMessage(error)` e `isUnauthorized(error)`.
- Datas são epoch ms (`number`). Ids saem como `id` (não `_id`) nas respostas.
- Contadores (seguidores, curtidas, comentários, livros) são denormalizados e mantidos pelas
  mutations: mexeu em follow/like/comment/estante, atualize o contador.
- Rede externa (Open Library) só em **actions**, com tabela de cache (`bookSearchCache` 24 h,
  `workCache` 30 dias). Queries não fazem fetch.
- Variáveis do deployment via `model/env.ts` (não `process.env` direto: os clientes typecheckam
  esses arquivos). Retornos não declaram `returns:`; os tipos são inferidos para os clientes.

### Estrutura dos apps (feature-driven, inspirada em Bulletproof React / FSD)

- Agrupe por **domínio**, não por tipo de arquivo. Cada feature tem um `index.ts` que é sua API
  pública — importe sempre por ele (`@/features/books`), nunca de arquivos internos de outra feature.
- `components/ui` e `components/layout` são genéricos: **nunca** importam features.
- Rotas/telas são finas: só compõem features.
- `lib/` = configuração de libs de terceiros (auth client, Convex, cache). `utils/` = funções puras.
- Estado de servidor = TanStack Query. Estado de cliente global = zustand, mínimo e dentro da feature.
- Detalhe de um item (livro, e futuramente resenha, leitor…) abre em **side peek**, estilo Notion:
  um parâmetro de busca na rota `/_app` (ex.: `?book=<openLibraryId>`) renderiza o painel ao lado
  da tela atual (`SidePeek` em `components/layout`), com botão para abrir como página cheia
  (`/books/$openLibraryId`). Links para abrir: `BookPeekLink`. As telas se adaptam ao espaço com
  container queries (`@container/main`, ex.: `@5xl/main:grid-cols-…`), não breakpoints de viewport.

### Estilo

- Cores e medidas só via tokens. Web: classes Tailwind (`bg-surface`, `text-text-muted`,
  `bg-primary`…). Mobile: `useTheme()` + `spacing`/`radius` de `@/constants/theme`.
- Visual "arquivo": papel + tinta carvão, bordas finas, cantos retos, um único acento oliva.
  Tipografia: serif (Fraunces) em títulos, **mono (IBM Plex Mono) em rótulos, números, botões e
  navegação** (web: `font-mono`; mobile: `<Text variant="label" | "number">`), sans no texto corrido.
- Claro e escuro são obrigatórios: use só tokens (nunca cor fixa) e confira os dois temas.
  Preferência do usuário (Sistema/Claro/Escuro): `apps/web/src/lib/theme.ts` e `apps/mobile/src/lib/theme.ts`.
- Textos de UI em português (pt-BR). Código, nomes e comentários em inglês.
- Biome formata tudo (`pnpm format`). Aspas duplas, ponto e vírgula, 2 espaços, 100 colunas.

### Dependências

- Versões compartilhadas ficam no `catalog:` de `pnpm-workspace.yaml`. Use `"catalog:"` no package.json.
- `better-auth`, `@better-auth/expo` e `@convex-dev/better-auth` andam juntos: o componente só
  aceita a faixa de versão do Better Auth que declara em `peerDependencies`.
- Mobile: instale com `pnpm --filter @grimo/mobile exec expo install <pkg>` (versões compatíveis com o SDK).
- Packages internos exportam TypeScript direto (`"exports": { ".": "./src/index.ts" }`) — não há build.

## Antes de dizer que terminou

```bash
pnpm check        # biome + typecheck (todos os workspaces) + vitest (core e convex-test)
```

- Mudou o schema ou funções? Rode com `pnpm dev` (o `convex dev` aplica e regenera
  `convex/_generated`, que é versionado) e adicione/ajuste teste em `packages/backend/test/`.
- Mudou regra no core? Adicione/ajuste teste `*.test.ts` ao lado.
- Mudou dados ou cache? Confira o **cold start pelo cache**: carregue as telas, derrube a rede (ou
  o backend local) e recarregue — tudo tem que aparecer.
- Mudou algo no mobile? `cd apps/mobile && npx expo-doctor`. Leia também `apps/mobile/AGENTS.md`.
- Mudou UI web? Rode `pnpm dev` e confira no navegador, claro e escuro (`pnpm seed` cria dados).
- Novo recurso com dados? Atualize `convex/seed.ts` para ele aparecer no mockup.

## Armadilhas conhecidas

- `pnpm` usa `nodeLinker: hoisted` por causa do Metro/React Native. Não mude sem testar o mobile.
- React é fixado em uma versão (`catalog`) igual à exigida pelo Expo; web e mobile precisam da mesma.
- `routeTree.gen.ts` (web) e `convex/_generated` são gerados — não edite.
- `@convex-dev/react-query` **não** é usado de propósito: o `ConvexQueryClient` dele assina todo o
  cache restaurado e roda queries antes da auth (veja o topo de `convex-cache.ts`).
- O SITE_URL do deployment precisa ser a origem da web (auth cross-domain + CORS). Dev:
  `http://localhost:5173`.
