# Grimo

Rede social para leitores: registre o que está lendo, organize suas estantes, escreva resenhas,
acompanhe outros leitores e compartilhe o resumo do seu mês de leitura.

> O foco é ser **simples, bonito e pessoal**: perfil, estantes, resenhas, feed e compartilhamento
> de métricas. Não é um catálogo gigante de livros nem um app complexo de estatísticas.

## Stack

| Camada       | Tecnologia                                                                         |
| ------------ | ---------------------------------------------------------------------------------- |
| Monorepo     | [pnpm workspaces](https://pnpm.io) + [Turborepo](https://turborepo.com)            |
| Backend      | [Convex](https://convex.dev): banco, funções, tempo real e arquivos                |
| Autenticação | [Better Auth](https://better-auth.com) no Convex (email/senha e Google)            |
| Web          | React 19 + Vite + TanStack Router/Query + Tailwind v4 (SPA estática)               |
| Mobile       | Expo (SDK 58) + Expo Router                                                        |
| Cache        | TanStack Query persistido (localStorage / MMKV), alimentado pelas subscriptions do Convex |
| Validação    | Zod (schemas compartilhados entre backend, web e mobile)                           |
| Lint/format  | [Biome](https://biomejs.dev)                                                       |

## Estrutura

```
apps/
  web/       App web (Vite + React), SPA estática (Cloudflare static assets ou qualquer host)
  mobile/    App mobile (Expo)
packages/
  backend/   Convex: schema, queries/mutations/actions, auth (Better Auth), seed e testes
  core/      Domínio puro: schemas Zod, constantes, regras (estantes, resumo do mês). Sem React.
  client/    Camada de dados compartilhada por web e mobile: ponte Convex ↔ TanStack Query,
             cache persistido e hooks (`useFeed`, `useShelf`, `useMe`…)
  tokens/    Design tokens (cores, espaçamento, fontes) → Tailwind (web) e StyleSheet (mobile)
  tsconfig/  Configs base de TypeScript
```

O que é compartilhado entre plataformas: schemas e regras (`@grimo/core`), os hooks e o cache
(`@grimo/client`) e os tokens visuais. Só a camada de UI é por plataforma.

**Offline primeiro:** o cache inteiro fica salvo no aparelho por 7 dias. Ao abrir, as telas
aparecem na hora a partir dele (mesmo sem internet) e o Convex atualiza em tempo real o que está
na tela. Curtir, seguir e atualizar progresso refletem na hora (otimista) e são desfeitos se o
servidor recusar.

## Desenvolvimento

Pré-requisitos: Node 22+, pnpm 12+. Para o mobile: um development build ou emulador.

```bash
pnpm install
pnpm dev:backend        # 1ª vez: cria o deployment Convex (login, ou local sem conta) e fica rodando
```

Na primeira vez, configure o deployment (em outro terminal):

```bash
cd packages/backend
npx convex env set SITE_URL http://localhost:5173
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

Entrar com Google (opcional): crie um OAuth Client ("Web application") no Google Cloud com o
redirect URI `<CONVEX_SITE_URL>/api/auth/callback/google` (local: `http://127.0.0.1:3211/...`) e:

```bash
npx convex env set GOOGLE_CLIENT_ID <id>
npx convex env set GOOGLE_CLIENT_SECRET <secret>
```

Sem essas variáveis o botão "Continuar com Google" aparece desabilitado, avisando que não está
disponível no momento.

Depois, no dia a dia:

```bash
pnpm dev                # Convex (convex dev) + web em http://localhost:5173
pnpm seed               # dados de exemplo: entre como rafa@grimo.test / grimo-demo
```

A web acha o deployment sozinha (lê `packages/backend/.env.local`, escrito pelo `convex dev`);
para apontar para outro, use `VITE_CONVEX_URL` (veja `apps/web/.env.example`).

Todas as contas de exemplo (`rafa`, `bia.lima`, `caio`, `lu.prado`, `theo`) usam a senha
`grimo-demo`.

### Mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env.local  # EXPO_PUBLIC_CONVEX_URL
pnpm dev:mobile
```

Com o deployment local, no celular físico use o IP da sua máquina (ex. `http://192.168.0.10:3210`);
no emulador Android, `http://10.0.2.2:3210`. Um deployment na nuvem funciona igual em todo lugar.

## Scripts

| Comando                  | O que faz                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `pnpm dev`               | Convex (`convex dev`) + web                                  |
| `pnpm dev:backend`       | Só o Convex (aplica schema/funções a cada mudança)           |
| `pnpm dev:mobile`        | Expo                                                         |
| `pnpm check`             | Lint + typecheck + testes (rode antes de abrir PR)           |
| `pnpm seed`              | Dados de exemplo no deployment de dev                        |
| `pnpm tokens:generate`   | Regenera o `theme.css` do Tailwind a partir dos tokens       |
| `pnpm deploy`            | Deploy do Convex (produção) e da web (Cloudflare)            |

## Deploy

1. Convex: `pnpm --filter @grimo/backend exec convex deploy` (pede login/projeto na primeira vez).
   No deployment de produção, defina `SITE_URL` (origem da web, ex. `https://grimo.app`),
   `BETTER_AUTH_SECRET` e, para o Google, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
2. Web: `VITE_CONVEX_URL=https://<prod>.convex.cloud pnpm --filter @grimo/web build`, depois
   `pnpm --filter @grimo/web deploy` (Cloudflare static assets, `apps/web/wrangler.jsonc`) ou
   qualquer host estático com fallback de SPA para `index.html`.
3. Mobile: `EXPO_PUBLIC_CONVEX_URL` do deployment de produção no build do EAS.

## Próximos passos do MVP

- Upload de avatar (Convex file storage: `ctx.storage` + URL de upload)
- Tela de post/resenha com comentários (backend e hooks já existem)
- Editar perfil no mobile (backend e `useUpdateMe` já existem)
- Exportar/importar dados (CSV do Goodreads, backup em JSON)
- Descoberta de leitores com gostos parecidos

## Licença

[GNU AGPL-3.0](LICENSE). Você pode usar, modificar e redistribuir o Grimo, inclusive
comercialmente, desde que qualquer versão modificada, **inclusive hospedada como serviço**,
tenha o código-fonte disponibilizado sob a mesma licença.

O nome "Grimo" e a identidade visual não estão cobertos pela licença do código.
