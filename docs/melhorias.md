# Melhorias sugeridas

Análise de 25/10/2026, revista em 08/11/2026. Bugs, segurança, performance e features encontrados
lendo o código. O que já existe está em [features.md](features.md). Severidade: **Alta** (afeta
segurança, dados ou moderação), **Média** (comportamento errado visível), **Baixa** (borda ou
polimento).

## O que falta

Em ordem de prioridade:

1. **[S3] Ativar o email.** O código está pronto e desligado: falta escolher o provedor (hoje
   Resend), definir `RESEND_API_KEY` e `EMAIL_FROM` no deployment e citar o provedor na Política
   e no ROPA. Até lá, ninguém recupera a senha.
2. **[S5] Logs de acesso (Marco Civil art. 15)**, pendentes em `docs/legal/README.md`.
3. **[Q] Testes do `ConvexCache`** (auth pendente, mutação pendente segurando resultados,
   `onUnauthorized`) e smoke e2e com Playwright no CI.
4. **[Q] Backups:** agendar export do Convex antes do lançamento e testar a restauração; deployment
   de staging separado da produção.
5. **[P2] Feed com fan-out na escrita** (`feedItems`) quando a rede crescer.
6. Features de produto ainda abertas: [F9](#f9--mais-estatísticas-sem-virar-app-de-números),
   [F10](#f10--descoberta-pela-comunidade), [F16](#f16--filtro-automático-de-conteúdo), PWA com
   service worker, monitoramento de erros.

---

## Bugs

Todos resolvidos.

| Item | Situação |
| ---- | -------- |
| B1 · Resenhas de bloqueados, suspensos ou ocultos na página do livro | Corrigido: `books.detail` filtra com `isHidden` + `blockedIds` (e perfil privado). A média da comunidade ainda conta todas as notas. |
| B2 · Mês e ano em UTC | Corrigido: `users.timeZone` (padrão `America/Sao_Paulo`, enviado por `useSyncTimeZone`); `model/stats.ts` conta no fuso do leitor. |
| B3 · "Páginas lidas" inflado | Corrigido: `currentPage` limitado a `pageCount` (ou 20000) e `shelfEntries.maxPage`. |
| B4 · "Seguir" no próprio card | Corrigido: as listas comparam com `useMe().data?.id`. |
| B5 · Releitura apagava a primeira leitura | Corrigido com [F8](#f8--releituras). |
| B6 · Denúncia duplicada | Corrigido: `.order("desc").first()` no índice `by_reporter_target`. |
| B7 · Busca do Open Library sem timeout | Corrigido: `AbortSignal.timeout(8000)`. |
| B8 · Email digitado errado criava conta | Corrigido: o formulário pergunta antes de criar (`confirm-new`). |
| B9 · `useBook` ao trocar de livro, `posts.create` com livro inexistente, "Seguir" piscando | Corrigidos. |

---

## Segurança

### S1 · Livro vindo do cliente vira o livro de todo mundo — Alta

**Corrigido:** `bookInputSchema` exige id `OL…W`, capa só de `https://covers.openlibrary.org/` e
limita tamanhos; um livro novo agenda `books.refreshBook`, que troca os dados pelos do Open Library.

### S2 · Nenhum rate limit — Alta

**Corrigido:** `@convex-dev/rate-limiter` (`model/rateLimit.ts`) em posts, comentários, denúncias,
livros novos e buscas do Open Library; `books.search` e `books.loadWork` exigem login; login e
cadastro limitados num hook do Better Auth (`limitAuthAttempts`).

### S3 · Recuperação de senha e verificação de email — Alta

**Código pronto, desligado de propósito.** `model/email.ts` + `email.send` (Resend por `fetch`; sem
chave só loga o link), `sendResetPassword` e `emailVerification` no Better Auth,
`users.emailVerified` e `requireVerifiedViewer` (post, comentário, curtida e seguir só exigem email
confirmado quando o email está configurado). Telas "Esqueci minha senha" e `/redefinir-senha` na
web e no mobile.

- **Pré-sequestro de conta resolvido:** Google/Apple só se juntam a uma conta de email já
  confirmado (`account.accountLinking.requireLocalEmailVerified`, explícito em `auth.ts`). Caso
  contrário a volta traz `error=account_not_linked` e o login explica o que fazer
  (`socialSignInError`). Efeito colateral enquanto o email estiver desligado: quem criou conta com
  senha não consegue entrar com Google no mesmo email.
- **Para ativar:** decidir o provedor, `npx convex env set RESEND_API_KEY …` e `EMAIL_FROM`, citar
  o provedor na Política (`privacy.tsx`) e no `docs/legal/ropa.md`.

### S4 · Cabeçalhos de segurança na web — Média

**Corrigido:** `apps/web/public/_headers` (CSP, `frame-ancestors`, `Referrer-Policy`,
`Permissions-Policy`, `nosniff`).

### S5 · Outras medidas

- **Enumeração de emails:** troca consciente de UX; com o rate limit o risco cai bastante.
- **Redirect do login:** recusa `//` e `/\` (`validateSearch` em `routes/login.tsx`).
- **Dev server na rede:** opt-in (`pnpm --filter @grimo/web dev --host`).
- **Perfis e atividade públicos sem login:** resolvido com [F5](#f5--perfil-privado).
- **Snapshot das denúncias:** a cópia do conteúdo e os detalhes são apagados 180 dias depois de a
  denúncia ser fechada (cron `moderation.eraseOldReportText`; ROPA e Política atualizados).
- **Logs de acesso (Marco Civil art. 15):** pendente (`docs/legal/README.md`).

---

## Performance e escala

### P1 · `users.suggestions` — Alta (quando crescer)

**Corrigido:** follows percorridos e candidatos limitados (`take`), populares pelo índice
`by_followers`.

### P2 · Feed com fan-out na leitura — Média

**Mitigado:** até 100 pessoas seguidas e 40 atividades por pessoa (`FEED_MAX_ACTORS`,
`FEED_PER_ACTOR`). **Depois:** tabela `feedItems` (fan-out na escrita, via scheduler).

### P3 · Leituras sem limite em dados que crescem — Média

**Corrigido:**

- `books.detail` usa contadores no livro (`readerCount`, `ratingSum`, `ratingCount`).
- `profileBooks` lê "Lendo" e os últimos 300 lidos pelos índices de status; o total vem de
  `bookCount`.
- `posts.get` mostra os 200 comentários mais recentes (`olderComments` diz se há mais).
- Apagar um post (`posts.remove`, moderação, exclusão da conta) apaga o post na hora e as curtidas,
  comentários e notificações em lotes (`posts.purgeChildren`).
- `account.exportData` virou action que lê seção por seção, paginada (`exportPage`).

### P4 · Contadores no documento `users` — Baixa

Aberto. Se virar gargalo, mover `followers`/`following`/`bookCount` para uma tabela `userStats`.

### P5 · Tabelas que só crescem — Baixa

**Corrigido:** cron diário limpa `bookSearchCache` e `workCache`; marcações de página no mesmo livro
em até 24 h movem a mesma linha de progresso no feed em vez de criar outra (sem nota, sentimentos,
sessão ou reações).

### P6 · Web — Baixa

**Corrigido:** capas em tamanho por uso (`coverUrl(src, "M")`) com `loading="lazy"`; code
splitting por rota ligado.

---

## Novas features

### Completar o que já existe

| Item | Situação |
| ---- | -------- |
| F1 · Tela de post com comentários | Feito (side peek, página, mobile, apagar post e comentário, denunciar comentário, notificações). |
| F2 · Remover livro da estante | Feito (web e mobile). |
| F3 · Paridade do mobile | Feito: perfil de outros leitores, seguir, conexões, busca, editar perfil, notificações, cards. |
| F4 · Upload de avatar | Feito (`users.avatarStorageId`). |

### Produto

#### F5 · Perfil privado

**Feito.** `users.isPrivate` ("Perfil privado" em Conta e privacidade, web e mobile). Quem não
segue vê só o cabeçalho (nome, @, foto, bio, contagens); estantes, estatísticas, atividade, posts,
resenhas na página do livro e listas ficam só para seguidores (`canSeeReader` /
`readerVisibility` em `model/safety.ts`), e a atividade sai da "Comunidade". Seguir vira pedido
(`followRequests`), aceito ou recusado nas notificações (`follow_request`, `follow_accepted`).
Voltar a público aceita os pedidos pendentes. Seed: `lu.prado` é privada.

#### F6 · Notificações

Feito (tabela `notifications`, sininho na web, tela no mobile). Falta push (`expo-notifications`) e
preferências por tipo.

#### F7 · Importar do Goodreads / Skoob

Goodreads feito (`/importar`). Falta o export do Skoob.

#### F8 · Releituras

**Feito.** Voltar um livro de "Lido" para "Lendo" guarda a leitura terminada em `pastReadings`
(início, fim, nota) e recomeça a entrada da página 0; as páginas relidas contam de novo. As
estatísticas contam cada leitura no ano em que terminou; a página do livro mostra "2ª leitura".
Entra no export e na exclusão da conta.

#### F9 · Mais estatísticas, sem virar app de números

Aberto: sequência de dias lendo, meta mensal/por páginas, retrospectiva do ano, tempo médio para
terminar um livro.

#### F10 · Descoberta pela comunidade

Parcial: "em alta entre quem você segue", "em alta no Grimo" e "amigos que querem ler" existem.
Falta "leitores com gosto parecido".

#### F11 · Citações

Feito (posts `quote` com página e card compartilhável).

#### F12 · Leituras conjuntas

Feito (Juntos).

#### F13 · Edição manual de livro

Feito: cadastro manual com moderação e páginas da edição por leitor (`shelfEntries.pageCount`).

#### F14 · ISBN pelo código de barras

**Feito.** No mobile, "ISBN ▦" na busca abre a câmera (`expo-camera`, só EAN-13 de livro,
`isbnFromBarcode` no core) e busca pelo ISBN. Precisa de um novo build nativo.

### Moderação e operação

#### F15 · Painel de moderação

Feito (`/admin`, papéis, suspensão com prazo, histórico, aviso ao denunciante).

#### F16 · Filtro automático de conteúdo

Aberto: lista de termos bloqueados ou API de moderação (cuidado com LGPD e transferência
internacional) antes de publicar post, comentário e bio.

---

## Qualidade e infraestrutura

- **Error boundaries:** feito (`errorComponent` no `__root` e no `_app`).
- **Monitoramento de erros:** aberto (Sentry ou similar precisa entrar na Política).
- **Testes:** backend cobre B1, B3, B6, releituras, perfil privado, retenção das denúncias, apagar
  post em lotes. Faltam o `ConvexCache` (client) e um smoke e2e com Playwright.
- **CI:** `pnpm check`, `vite build` e `expo-doctor`; Dependabot semanal (Expo e React ficam de
  fora: atualize com `expo install`).
- **Backups e staging:** abertos.
- **Acessibilidade:** auditar contraste, foco no side peek (trap e `Esc`), `aria-live` nas
  atualizações otimistas, rótulos nos ícones.
- **PWA:** manifest feito; falta o service worker para abrir sem rede.
