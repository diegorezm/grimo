# AGENTS.md

Guia para agentes trabalhando neste repositório. Leia inteiro antes de mudar código.
Contexto de produto e setup estão no [README.md](README.md).

## Mapa rápido

| Preciso mexer em…                        | Onde                                         |
| ---------------------------------------- | -------------------------------------------- |
| Regra de negócio, schema Zod, constante  | `packages/core/src/<domínio>/`               |
| Tabela / coluna                          | `packages/db/src/schema/` + `pnpm db:generate` |
| Endpoint                                 | `packages/api/src/features/<feature>/routes.ts` (+ `service.ts`) |
| Hook de dados (web **e** mobile)         | `packages/client/src/features/<feature>/hooks.ts` |
| Cor / espaçamento / fonte                | `packages/tokens/src/index.ts` + `pnpm tokens:generate` |
| Config de auth                           | `packages/auth/src/server.ts` (servidor), `client.ts` (compartilhado) |
| Tela web                                 | `apps/web/src/routes/` (fina) → `apps/web/src/features/` |
| Tela mobile                              | `apps/mobile/src/app/` (fina) → `apps/mobile/src/features/` |
| Bindings / deploy Cloudflare             | `apps/api`, `apps/web` (`wrangler.jsonc`)   |
| Runtime self-host (Node, Docker)         | `apps/server`, `Dockerfile`, `docker-compose.yml` |
| Variável de configuração da instância    | `packages/api/src/config.ts` + `docs/self-hosting.md` + `apps/api/wrangler.jsonc` |

## Self-hosting é requisito, não extra

O Grimo roda em **dois runtimes com o mesmo código**: Cloudflare (`apps/api`, D1, R2) e Node/Docker
(`apps/server`, SQLite/libSQL, disco). Toda mudança precisa funcionar nos dois.

- `packages/api` **não pode** importar nada de runtime: nada de bindings, `node:*`, `process.env`
  ou APIs da Cloudflare. Ele recebe `db`, `storage` e `config` prontos (`createServices`).
- Precisa de algo novo do runtime (fila, cache, e-mail…)? Defina uma interface em `packages/api`
  (como `Storage` em `src/storage.ts`) e implemente em `apps/api` **e** em `apps/server`.
- SQL: o banco é SQLite nos dois. Use só o que D1 e libSQL suportam; nada de `db.batch` sem
  checar os dois drivers. As migrações em `packages/db/migrations` são aplicadas pelo wrangler (D1)
  e pelo `migrate()` do libSQL na inicialização do servidor.
- Configuração nova da instância: adicione em `instanceConfigSchema` (`packages/api/src/config.ts`),
  em `apps/api/wrangler.jsonc`, no `docker-compose.yml` (se relevante) e em `docs/self-hosting.md`.
- Modos: `personal` (uma conta, sem social) e `community`. Recurso social novo? Proteja a rota com
  `requireSocial(c)` e esconda a UI com `useInstance().data?.social`.
- Clientes nunca assumem um servidor fixo: o mobile escolhe o servidor em runtime (`apps/mobile/src/lib/server.ts`).

## Regra de ouro: compartilhar o máximo possível

Antes de escrever código em `apps/web` ou `apps/mobile`, pergunte: **isso depende de DOM ou de
React Native?** Se não depende, o lugar é um package.

- Lógica pura (cálculo, validação, texto de UI compartilhado como `describeActivity`) → `@grimo/core`.
- Acesso a dados, cache, mutações, estado de UI compartilhado (zustand) → `@grimo/client`.
- Só componentes visuais e navegação ficam nos apps.

Se você está duplicando algo entre web e mobile que não é JSX, pare e mova para um package.

## Fluxo de dados

```
apps/web|mobile  →  @grimo/client (hooks TanStack Query)  →  hc<AppType> (Hono RPC)
                                                                   │
apps/api    (Worker: D1 + R2)       ┐
                                    ├→ createApp() @grimo/api (Hono) → features/*/routes.ts → service.ts
apps/server (Node: libSQL + disco)  ┘        → @grimo/db (Drizzle, SQLite)   ↘ @grimo/core (Zod + regras)
```

- Os tipos fluem da API para os clientes via `AppType`. **Não** crie tipos de resposta à mão:
  use `InferResponseType` (veja `packages/client/src/features/*/hooks.ts`).
- Web: mesma origem. Na Cloudflare, o Worker da web repassa `/api/*` para a API por service binding;
  no self-host, `apps/server` serve a web estática e a API no mesmo processo.
- Mobile: chama o servidor escolhido pelo usuário e envia o cookie do Better Auth no header.

## Convenções

### Estrutura (feature-driven, inspirada em Bulletproof React / FSD)

- Agrupe por **domínio**, não por tipo de arquivo. Cada feature tem um `index.ts` que é sua API
  pública — importe sempre por ele (`@/features/books`), nunca de arquivos internos de outra feature.
- `components/ui` e `components/layout` são genéricos: **nunca** importam features.
- Rotas/telas são finas: só compõem features.
- `lib/` = configuração de libs de terceiros (auth client, api client). `utils/` = funções puras.
- Estado de servidor = TanStack Query. Estado de cliente global = zustand, mínimo e dentro da feature.
- Detalhe de um item (livro, e futuramente resenha, leitor…) abre em **side peek**, estilo Notion:
  um parâmetro de busca na rota `/_app` (ex.: `?book=<openLibraryId>`) renderiza o painel ao lado
  da tela atual (`SidePeek` em `components/layout`), com botão para abrir como página cheia
  (`/books/$openLibraryId`). Links para abrir: `BookPeekLink`. As telas se adaptam ao espaço com
  container queries (`@container/main`, ex.: `@5xl/main:grid-cols-…`), não breakpoints de viewport.

### Dados e cache (TanStack Query)

Todo dado do servidor passa pelo TanStack Query, com cache forte:

- Cada leitura tem uma fábrica `xxxQuery(api, …)` (`queryOptions`) em `packages/client/src/features/*/hooks.ts`;
  o hook `useXxx` só a envolve. Os loaders das rotas usam a mesma fábrica para pré-carregar
  (`queryClient.prefetchQuery(...)`, sem `await`). Com `defaultPreload: "intent"`, passar o mouse
  num link já aquece o cache.
- `staleTime` vem de `staleTimes` (`packages/client/src/lib/query.ts`): instância 1 h, busca de livros
  24 h, dados seus 10 min, dados sociais 1 min, meses fechados 24 h. Não invente números por hook.
- O cache inteiro é persistido (web: `localStorage`; mobile: AsyncStorage, um por servidor) por 7 dias
  e restaurado no próximo acesso. Mudou o formato de uma resposta? Suba `CACHE_VERSION`.
- Mutações atualizam o cache na hora (otimista + rollback em erro) e invalidam no `onSettled`.
  Veja `useUpdateShelfEntry`, `useToggleLike` e `useToggleFollow`.
- Login e logout chamam `clearCache()` (web: `@/lib/api`; mobile: `useClearCache()`). Um 401 em
  qualquer query faz a web limpar o cache e voltar para `/login`.
- A sessão (Better Auth) também fica em cache (`sessionQuery`, 5 min) para os guards de rota não
  irem ao servidor a cada navegação. Ela nunca é persistida em disco.

### API (`packages/api`)

- Toda feature nova: `features/<nome>/routes.ts` exportando um `new Hono<AppEnv>()` **encadeado**,
  e uma linha `.route()` em `src/app.ts`. Se quebrar a cadeia, o cliente perde os tipos.
- Valide entrada com `zValidator` + schema de `@grimo/core`. Defina o schema no core, não na rota.
- Rotas protegidas: `const user = requireUser(c)` na primeira linha do handler.
- Serviços (`db`, `auth`, `storage`, `config`) vêm de `c.get(...)`. Nunca de `c.env`.
- Erros: lance `HTTPException` (ou `notFound()`); o `errorHandler` formata `{ error }`.
- D1 não tem transações interativas. Use `db.batch([...])` quando precisar de atomicidade.
- Tipos da Cloudflare só em `packages/db/src/d1.ts` e em `apps/api`, importados explicitamente
  (`import type { D1Database } from "@cloudflare/workers-types"`), nunca via globais.

### Banco (`packages/db`)

- Altere o schema → `pnpm db:generate` → revise o SQL em `packages/db/migrations/` → `pnpm db:migrate`.
- Nunca edite uma migração já aplicada; gere outra.
- Tabelas do Better Auth (`schema/auth.ts`) seguem os nomes de campo que ele espera. Ao adicionar
  um plugin do Better Auth que cria campos/tabelas, atualize esse arquivo.
- Enums de colunas vêm de constantes do core (`SHELF_STATUSES`, `POST_KINDS`…).

### Auth

- Servidor: `createAuth()` em `@grimo/auth` (instanciado por isolate em `packages/api/src/lib/context.ts`).
- Clientes: cada app cria o seu `authClient` com `sharedAuthClientPlugins()` + plugins da plataforma
  (o mobile adiciona `expoClient`). Ao adicionar um plugin no servidor, adicione o client plugin em
  `packages/auth/src/client.ts`.
- `TRUSTED_ORIGINS` (wrangler) precisa conter toda origem web e o scheme do app (`grimo://`).

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
- Mobile: instale com `pnpm --filter @grimo/mobile exec expo install <pkg>` (versões compatíveis com o SDK).
- Packages internos exportam TypeScript direto (`"exports": { ".": "./src/index.ts" }`) — não há build.

## Antes de dizer que terminou

```bash
pnpm check        # biome + typecheck (todos os workspaces) + vitest
```

- Mudou o schema? Gere e aplique a migração e confira o SQL.
- Mudou `wrangler.jsonc`? `pnpm cf-typegen`.
- Mudou tokens? `pnpm tokens:generate`.
- Mudou regra no core? Adicione/ajuste teste `*.test.ts` ao lado.
- Mudou API, banco ou auth? Teste também o runtime self-host: `pnpm dev:server` (Node + SQLite).
- Mudou algo no mobile? `pnpm --filter @grimo/mobile exec expo-doctor`. Leia também `apps/mobile/AGENTS.md`.
- Mudou UI web? Rode `pnpm dev` e confira no navegador (`pnpm db:seed` cria dados de exemplo).
- Novo recurso com dados (endpoint, tabela)? Atualize `scripts/seed.ts` para ele aparecer no mockup.

## Armadilhas conhecidas

- `pnpm` usa `nodeLinker: hoisted` por causa do Metro/React Native. Não mude sem testar o mobile.
- React é fixado em uma versão (`catalog`) igual à exigida pelo Expo; web e mobile precisam da mesma.
- `routeTree.gen.ts` (web) e `worker-configuration.d.ts` são gerados — não edite.
- O dev da web roda a API como worker auxiliar e compartilha o estado local em `apps/api/.wrangler`.
- `apps/server` é empacotado com esbuild (`scripts/build.mjs`). Só `@libsql/client` (nativo) fica
  fora do bundle; nova dependência nativa no servidor? Adicione-a em `external` e em `dependencies`.
- A web tem dois builds: `build` (Cloudflare) e `build:static` (SPA servida pelo `apps/server`).
