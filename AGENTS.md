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
| Bindings / deploy                        | `apps/*/wrangler.jsonc`                      |

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
apps/api (Worker) → @grimo/api (Hono) → features/*/routes.ts → service.ts → @grimo/db (Drizzle/D1)
                                    ↘ @grimo/core (Zod + regras puras)
```

- Os tipos fluem da API para os clientes via `AppType`. **Não** crie tipos de resposta à mão:
  use `InferResponseType` (veja `packages/client/src/features/*/hooks.ts`).
- Web: mesma origem; o Worker da web repassa `/api/*` para a API por service binding.
- Mobile: chama a API direto (`EXPO_PUBLIC_API_URL`) e envia o cookie do Better Auth no header.

## Convenções

### Estrutura (feature-driven, inspirada em Bulletproof React / FSD)

- Agrupe por **domínio**, não por tipo de arquivo. Cada feature tem um `index.ts` que é sua API
  pública — importe sempre por ele (`@/features/books`), nunca de arquivos internos de outra feature.
- `components/ui` e `components/layout` são genéricos: **nunca** importam features.
- Rotas/telas são finas: só compõem features.
- `lib/` = configuração de libs de terceiros (auth client, api client). `utils/` = funções puras.
- Estado de servidor = TanStack Query. Estado de cliente global = zustand, mínimo e dentro da feature.

### API (`packages/api`)

- Toda feature nova: `features/<nome>/routes.ts` exportando um `new Hono<AppEnv>()` **encadeado**,
  e uma linha `.route()` em `src/app.ts`. Se quebrar a cadeia, o cliente perde os tipos.
- Valide entrada com `zValidator` + schema de `@grimo/core`. Defina o schema no core, não na rota.
- Rotas protegidas: `const user = requireUser(c)` na primeira linha do handler.
- Erros: lance `HTTPException` (ou `notFound()`); o `errorHandler` formata `{ error }`.
- D1 não tem transações interativas. Use `db.batch([...])` quando precisar de atomicidade.
- Importe tipos da Cloudflare explicitamente (`import type { D1Database } from "@cloudflare/workers-types"`),
  nunca via globais — os packages são checados também pelos apps.

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
- Mudou algo no mobile? `pnpm --filter @grimo/mobile exec expo-doctor`. Leia também `apps/mobile/AGENTS.md`.
- Mudou UI web? Rode `pnpm dev` e confira no navegador.

## Armadilhas conhecidas

- `pnpm` usa `nodeLinker: hoisted` por causa do Metro/React Native. Não mude sem testar o mobile.
- React é fixado em uma versão (`catalog`) igual à exigida pelo Expo; web e mobile precisam da mesma.
- `routeTree.gen.ts` (web) e `worker-configuration.d.ts` são gerados — não edite.
- O dev da web roda a API como worker auxiliar e compartilha o estado local em `apps/api/.wrangler`.
