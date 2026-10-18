# Grimo

Rede social para leitores: registre o que está lendo, organize suas estantes, escreva resenhas,
acompanhe outros leitores e compartilhe o resumo do seu mês de leitura.

> O foco é ser **simples, bonito e pessoal**: perfil, estantes, resenhas, feed e compartilhamento
> de métricas. Não é um catálogo gigante de livros nem um app complexo de estatísticas.

## Stack

| Camada          | Tecnologia                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Monorepo        | [pnpm workspaces](https://pnpm.io) + [Turborepo](https://turborepo.com)    |
| API             | [Hono](https://hono.dev) em **Cloudflare Workers**                         |
| Banco           | **Cloudflare D1** (SQLite) + [Drizzle ORM](https://orm.drizzle.team)       |
| Arquivos        | **Cloudflare R2** (avatares — binding `MEDIA`)                             |
| Autenticação    | [Better Auth](https://better-auth.com) (email/senha + username)            |
| Web             | React 19 + Vite + TanStack Router/Query + Tailwind v4, servido por Workers |
| Mobile          | Expo (SDK 58) + Expo Router                                                |
| Validação       | Zod (schemas compartilhados entre API, web e mobile)                       |
| Lint/format     | [Biome](https://biomejs.dev)                                               |

## Estrutura

```
apps/
  api/       Worker da API (só config/deploy — as rotas ficam em packages/api)
  web/       App web (Vite + React). Também é um Worker que repassa /api/* para a API
  mobile/    App mobile (Expo)
packages/
  core/      Domínio puro: schemas Zod, constantes, regras (estantes, resumo do mês). Sem React.
  db/        Schema Drizzle + migrações SQL
  auth/      Config do Better Auth (servidor) + peças compartilhadas do cliente
  api/       App Hono (rotas por feature) — exporta o tipo `AppType`
  client/    Camada de dados compartilhada por web e mobile: cliente RPC tipado + hooks TanStack Query
  tokens/    Design tokens (cores, espaçamento, fontes) → Tailwind (web) e StyleSheet (mobile)
  tsconfig/  Configs base de TypeScript
```

O que é compartilhado entre as plataformas:

- **Tipos e validação**: os schemas de `@grimo/core` validam a API e tipam formulários no web/mobile.
- **Cliente da API**: `@grimo/client` usa o RPC do Hono — os tipos de request/response vêm direto
  das rotas, sem codegen. Os hooks (`useFeed`, `useShelf`, `useAddToShelf`…) são os mesmos no web e no mobile.
- **Regras de negócio**: ex. `planShelfTransition` (o que acontece ao mover um livro de estante) e
  `computeMonthlySummary` (dados do card do mês) rodam na API e podem rodar nos clientes.
- **Visual**: `@grimo/tokens` é a fonte única de cores/espaçamentos.

Só a camada de UI é por plataforma (DOM no web, React Native no mobile).

## Começando

Pré-requisitos: Node 22+, pnpm 12+. Para o mobile: app Expo Go ou um emulador.

```bash
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # e troque o BETTER_AUTH_SECRET
pnpm db:migrate                                    # cria o D1 local
pnpm dev                                           # web + API em http://localhost:5173
```

`pnpm dev` sobe o Vite com o plugin da Cloudflare: o Worker da web **e** o Worker da API rodam no
mesmo processo, com D1/R2 locais (Miniflare). Não precisa de conta Cloudflare para desenvolver.

### Mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env.local  # ajuste EXPO_PUBLIC_API_URL
pnpm dev:mobile
```

No celular físico, use o IP da sua máquina na rede (ex. `http://192.168.0.10:5173`). No emulador
Android, `http://10.0.2.2:5173`.

## Scripts

| Comando                  | O que faz                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `pnpm dev`               | Web + API locais                                             |
| `pnpm dev:api`           | Só a API (`wrangler dev`, porta 8787)                        |
| `pnpm dev:mobile`        | Expo                                                         |
| `pnpm check`             | Lint + typecheck + testes (rode antes de abrir PR)           |
| `pnpm db:generate`       | Gera migração SQL a partir do schema Drizzle                 |
| `pnpm db:migrate`        | Aplica migrações no D1 local                                 |
| `pnpm db:migrate:remote` | Aplica migrações no D1 de produção                           |
| `pnpm db:studio`         | Drizzle Studio                                               |
| `pnpm tokens:generate`   | Regenera o `theme.css` do Tailwind a partir dos tokens       |
| `pnpm deploy`            | Deploy da API e da web na Cloudflare                         |

## Deploy (Cloudflare)

Uma vez:

```bash
pnpm --filter @grimo/api-worker exec wrangler d1 create grimo-db   # cole o id em apps/api/wrangler.jsonc
pnpm --filter @grimo/api-worker exec wrangler r2 bucket create grimo-media
pnpm --filter @grimo/api-worker exec wrangler secret put BETTER_AUTH_SECRET
```

Ajuste `BETTER_AUTH_URL` e `TRUSTED_ORIGINS` em `apps/api/wrangler.jsonc` para o domínio real. Depois:

```bash
pnpm db:migrate:remote
pnpm deploy
```

A web (`grimo-web`) chama a API (`grimo-api`) por **service binding**: o navegador só fala com um
domínio, então os cookies de sessão são first-party. O mobile pode apontar para o mesmo domínio.

## Próximos passos do MVP

- Upload de avatar (rota que grava no R2 + `user.image`)
- Tela de post/resenha com comentários (API e hooks já existem)
- Editar perfil (gêneros favoritos, bio, meta anual) — API e `useUpdateMe` já existem
- Descoberta de leitores com gostos parecidos
- Fontes (Fraunces/Inter) no mobile via `expo-font`
