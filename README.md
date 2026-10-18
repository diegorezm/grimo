# Grimo

Rede social para leitores: registre o que está lendo, organize suas estantes, escreva resenhas,
acompanhe outros leitores e compartilhe o resumo do seu mês de leitura.

> O foco é ser **simples, bonito e pessoal**: perfil, estantes, resenhas, feed e compartilhamento
> de métricas. Não é um catálogo gigante de livros nem um app complexo de estatísticas.

## 🏠 Seu Grimo, no seu servidor

**Self-hosting é um dos pilares do Grimo, não um extra.** Seus registros de leitura são seus: você
pode usar a instância oficial ou rodar o seu próprio Grimo, com o mesmo app web e mobile.

- **Modo pessoal**: um diário de leitura só seu. Uma conta, cadastro fechado, sem nada social, e
  ainda com estantes, resenhas, estatísticas e o card do mês.
- **Modo comunidade**: a rede social completa, para você, sua família, seu clube do livro…
- **Um comando**: `docker compose up -d`. Um container (API + web), um volume com um arquivo
  SQLite. Roda em VPS, NAS ou Raspberry Pi (imagens amd64 e arm64).
- **O app mobile conecta em qualquer servidor**: é só trocar o servidor na tela de login.
- **O mesmo código** roda na Cloudflare e no seu servidor. Self-host não é uma versão de segunda.

```bash
curl -O https://raw.githubusercontent.com/diegorezm/grimo/main/docker-compose.yml
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d   # → http://localhost:3000
```

Guia completo (variáveis, backup, HTTPS, atualização): **[docs/self-hosting.md](docs/self-hosting.md)**.

## Stack

| Camada       | Tecnologia                                                                         |
| ------------ | ---------------------------------------------------------------------------------- |
| Monorepo     | [pnpm workspaces](https://pnpm.io) + [Turborepo](https://turborepo.com)            |
| API          | [Hono](https://hono.dev), independente de runtime                                  |
| Runtimes     | **Cloudflare Workers** (instância oficial) ou **Node + Docker** (self-host)        |
| Banco        | SQLite em ambos: **Cloudflare D1** ou arquivo via libSQL. [Drizzle ORM](https://orm.drizzle.team) |
| Arquivos     | **Cloudflare R2** ou disco local                                                   |
| Autenticação | [Better Auth](https://better-auth.com) (email/senha + username)                    |
| Web          | React 19 + Vite + TanStack Router/Query + Tailwind v4                              |
| Mobile       | Expo (SDK 58) + Expo Router                                                        |
| Validação    | Zod (schemas compartilhados entre API, web e mobile)                               |
| Lint/format  | [Biome](https://biomejs.dev)                                                       |

## Estrutura

```
apps/
  api/       Runtime Cloudflare: Worker que liga D1 + R2 ao app Hono
  server/    Runtime self-host: Node + SQLite + disco, serve API e web (Docker)
  web/       App web (Vite + React). Na Cloudflare, é um Worker que repassa /api/* para a API
  mobile/    App mobile (Expo), com escolha de servidor
packages/
  core/      Domínio puro: schemas Zod, constantes, regras (estantes, resumo do mês, modos). Sem React.
  db/        Schema Drizzle + migrações SQL + drivers (D1 e libSQL)
  auth/      Config do Better Auth (servidor) + peças compartilhadas do cliente
  api/       App Hono (rotas por feature), sem depender de runtime. Exporta `createApp` e `AppType`
  client/    Camada de dados compartilhada por web e mobile: cliente RPC tipado + hooks TanStack Query
  tokens/    Design tokens (cores, espaçamento, fontes) → Tailwind (web) e StyleSheet (mobile)
  tsconfig/  Configs base de TypeScript
```

O que é compartilhado:

- **Entre runtimes**: toda a API (`@grimo/api`), o schema e as **mesmas migrações SQL**. Cada runtime
  só fornece o banco, o storage e as variáveis de ambiente.
- **Entre plataformas**: schemas e regras (`@grimo/core`), o cliente da API e os hooks
  (`useFeed`, `useShelf`, `useInstance`…) de `@grimo/client`, e os tokens visuais.
  Só a camada de UI é por plataforma (DOM no web, React Native no mobile).

## Desenvolvimento

Pré-requisitos: Node 22+, pnpm 12+. Para o mobile: app Expo Go ou um emulador.

```bash
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # e troque o BETTER_AUTH_SECRET
pnpm db:migrate                                    # cria o D1 local
pnpm dev                                           # web + API (runtime Cloudflare) em http://localhost:5173
```

`pnpm dev` sobe o Vite com o plugin da Cloudflare: o Worker da web **e** o Worker da API rodam no
mesmo processo, com D1/R2 locais (Miniflare). Não precisa de conta Cloudflare.

Para testar o runtime de self-host (Node + SQLite):

```bash
cp apps/server/.env.example apps/server/.env
pnpm dev:server                                    # http://localhost:3000
```

### Mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env.local  # servidor padrão
pnpm dev:mobile
```

No celular físico, use o IP da sua máquina na rede (ex. `http://192.168.0.10:5173`). No emulador
Android, `http://10.0.2.2:5173`. O servidor também pode ser trocado na tela de login do app.

## Scripts

| Comando                  | O que faz                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `pnpm dev`               | Web + API locais (runtime Cloudflare)                        |
| `pnpm dev:server`        | Servidor self-host local (Node + SQLite), porta 3000         |
| `pnpm dev:api`           | Só a API na Cloudflare local (`wrangler dev`, porta 8787)    |
| `pnpm dev:mobile`        | Expo                                                         |
| `pnpm check`             | Lint + typecheck + testes (rode antes de abrir PR)           |
| `pnpm db:generate`       | Gera migração SQL a partir do schema Drizzle                 |
| `pnpm db:migrate`        | Aplica migrações no D1 local                                 |
| `pnpm db:migrate:remote` | Aplica migrações no D1 de produção                           |
| `pnpm db:studio`         | Drizzle Studio                                               |
| `pnpm tokens:generate`   | Regenera o `theme.css` do Tailwind a partir dos tokens       |
| `pnpm deploy`            | Deploy da API e da web na Cloudflare                         |

## Deploy na Cloudflare (instância oficial ou self-host na sua conta)

Uma vez:

```bash
pnpm --filter @grimo/api-worker exec wrangler d1 create grimo-db   # cole o id em apps/api/wrangler.jsonc
pnpm --filter @grimo/api-worker exec wrangler r2 bucket create grimo-media
pnpm --filter @grimo/api-worker exec wrangler secret put BETTER_AUTH_SECRET
```

Ajuste as variáveis em `apps/api/wrangler.jsonc` (`GRIMO_MODE`, `BETTER_AUTH_URL`,
`TRUSTED_ORIGINS`…; as mesmas do [guia de self-host](docs/self-hosting.md#variáveis)). Depois:

```bash
pnpm db:migrate:remote
pnpm deploy
```

A web (`grimo-web`) chama a API (`grimo-api`) por **service binding**: o navegador só fala com um
domínio, então os cookies de sessão são first-party. O mobile pode apontar para o mesmo domínio.

## Próximos passos do MVP

- Upload de avatar (a porta `Storage` já existe: R2 na Cloudflare, disco no self-host)
- Tela de post/resenha com comentários (API e hooks já existem)
- Editar perfil (gêneros favoritos, bio, meta anual): API e `useUpdateMe` já existem
- Cadastro por convite (modo comunidade fechado para família e amigos)
- Exportar/importar dados (CSV do Goodreads, backup em JSON)
- Descoberta de leitores com gostos parecidos

## Licença

[GNU AGPL-3.0](LICENSE). Você pode usar, modificar e redistribuir o Grimo, inclusive
comercialmente, desde que qualquer versão modificada, **inclusive hospedada como serviço**,
tenha o código-fonte disponibilizado sob a mesma licença.

O nome "Grimo" e a identidade visual não estão cobertos pela licença do código.
