# Features do Grimo (estado em 25/10/2026)

Inventário do que já existe no código, por área. "Web" e "Mobile" indicam onde há tela; "Backend"
indica que a função existe no Convex mesmo sem tela. Sugestões e problemas encontrados estão em
[melhorias.md](melhorias.md); o que ainda pode vir, em [roadmap.md](roadmap.md).

## Visão geral

| Área                    | Backend | Web | Mobile |
| ----------------------- | :-----: | :-: | :----: |
| Conta e login           |    ✓    |  ✓  |   ✓    |
| Onboarding              |    ✓    |  ✓  |   ✓    |
| Estantes e progresso    |    ✓    |  ✓  |   ✓    |
| Busca e página do livro |    ✓    |  ✓  |   ✓    |
| Resenhas e notas        |    ✓    |  ✓  |   ✓    |
| Curtidas                |    ✓    |  ✓  |   ✓    |
| Comentários             |    ✓    |  —  |   —    |
| Feed                    |    ✓    |  ✓  |   ✓    |
| Leitores (seguir, busca, sugestões, perfil público) | ✓ | ✓ | ✓ |
| Estatísticas e metas    |    ✓    |  ✓  |   ✓    |
| Card do mês (Stories)   |    ✓    |  ✓  |   —    |
| Moderação (denúncia, bloqueio, suspensão) | ✓ | ✓ | ✓ |
| LGPD (termos, idade, exportar, excluir)   | ✓ | ✓ | ✓ |
| Landing page            |    —    |  ✓  |   —    |
| Cache offline-first     |    —    |  ✓  |   ✓    |

## Conta e autenticação

- **Email e senha num formulário só** (`continueWithEmail`, `packages/client/src/lib/auth.ts`): tenta
  entrar; se não for uma conta, cria. Senha mínima de 8 caracteres.
- **Entrar com Google** (liga com `GOOGLE_CLIENT_ID`/`SECRET`; sem eles o botão aparece desabilitado).
- **Sign in with Apple** no servidor (`APPLE_*`), ainda sem botão nos apps.
- `auth.providers` diz aos clientes quais métodos estão ligados.
- Sessão: web via plugin cross-domain (token no localStorage), mobile via `expoClient` (SecureStore,
  scheme `grimo://`). O JWT do Better Auth autentica o cliente Convex.
- Sessão rejeitada pelo servidor (401 / `UNAUTHENTICATED`) limpa o cache e volta ao login; erro de
  rede não desloga.
- Redirecionamento pós-login para o link de origem (`/login?redirect=`), só caminhos do próprio site.

## Onboarding e primeiro acesso

- Conta nova nasce com `setupDone: false`; `/onboarding` (web) e a tela `setup` (mobile) pedem
  **nome**, **@** (com checagem ao vivo de disponibilidade, `users.usernameAvailable`), **data de
  nascimento (16+)** e **aceite dos Termos e da Política**.
- Depois: escolher o livro que está lendo → marcar a página → meta do ano (12 pré-selecionado).
- **"Primeiros passos"** no painel (`useOnboardingChecklist`): criar conta, adicionar livro, definir
  meta, seguir um leitor. Some quando tudo está feito.

## Estantes e progresso de leitura

- Quatro estantes: **Quero ler, Lendo, Lidos, Abandonei** (`SHELF_STATUSES`).
- Adicionar livro a partir da busca, mudar de estante, **registrar página atual**, nota de 1 a 5,
  datas de início/fim.
- Regras puras em `planShelfTransition` (core): data de início automática, ao marcar "Lido" fecha a
  data de fim e vai para a última página; calcula páginas lidas e qual atividade gerar.
- **Log de leitura** (`readingLogs`, append-only) é a fonte das "páginas lidas".
- Web: quadro de estantes (`ShelfBoard`), carrossel no painel, logger de páginas (`page-logger`),
  capa 3D. Mobile: abas de estante, sheet de progresso (`progress/[id]`).
- **Tirar da estante** (`shelves.remove`: tira o livro e o log de páginas, as resenhas ficam) na página do livro, web e mobile, com confirmação.

## Livros

- **Busca no Open Library** via action (`books.search`), com cache de 24 h no servidor
  (`bookSearchCache`) e no aparelho.
- **Página do livro** (`books.detail`): dados locais + página da obra no Open Library (sinopse, capa,
  autores; cache de 30 dias em `workCache`, carregada sob demanda por `books.loadWork`), sua entrada
  na estante, números da comunidade (leitores, avaliações, média) e as 20 resenhas mais novas.
- Web: abre em **side peek** (`?book=<id>`) ao lado da tela atual, com botão para página cheia
  (`/books/$openLibraryId`).

## Posts: resenhas e notas

- Dois tipos: **resenha** (livro obrigatório, nota opcional) e **nota de leitura** (livre).
- Marcação de **spoiler**, até 5000 caracteres.
- Criados no painel/feed (web), na página do livro (web) e no compositor de resenha (mobile).
- **Curtir** com atualização otimista (`useToggleLike`).
- **Comentários**: `posts.comment`, `posts.get` e os hooks `usePost`/`useAddComment` existem, **sem
  tela** (nem web nem mobile). Também não há tela para apagar um post (`posts.remove` existe).

## Feed

- Fan-out na leitura: suas atividades + as de quem você segue (`feed.list`).
- Tipos: adicionou à estante, progresso, terminou, publicou, começou a seguir.
- **Agrupamento** no cliente (`groupActivities`): vários livros adicionados na mesma noite viram uma
  linha; progresso no mesmo livro mostra só a última página.
- Lista que cresce por `limit` (20, 40, 60…), reativa.
- Deixar de seguir apaga a linha "começou a seguir".

## Leitores e rede social

- **Perfil público** `/u/$username`, abre deslogado (links compartilháveis): estatísticas do ano,
  lendo agora, favoritos (melhor avaliados), capas, atividade.
- **Seguir / deixar de seguir** otimista, contadores denormalizados, "segue você".
- **Seguidores / seguindo** (`/u/$username/followers|following`).
- **Busca de leitores** por nome ou @ (índice de busca) e **sugestões** ranqueadas por amigos em
  comum, se segue você e popularidade (`/people`).
- **Compartilhar perfil** (Web Share API no celular, copiar link no desktop).
- Editar perfil (foto, nome, bio, até 5 gêneros favoritos): web em side peek / página, mobile em
  `profile-edit`; a meta, nos primeiros passos.
- Mobile: perfil de outros leitores (`u/[username]`), seguir, seguidores/seguindo
  (`u/[username]/[kind]`), busca e sugestões de leitores na aba Buscar ("Livros | Leitores"); nome
  e foto no feed, nos posts, nos comentários e nas resenhas abrem o perfil.

## Estatísticas e metas

- **Visão do ano** (`stats.overview`): livros lidos, páginas, gênero mais lido, progresso da meta.
- **Resumo do mês** (`stats.monthly` + `computeMonthlySummary`): livros, páginas, gênero mais lido,
  livro favorito do mês, progresso da meta (o card compara com o mês anterior).
- Web: herói da meta, lista do mês, ritmo de leitura, distribuição por gênero.
- **Card do mês** (web, `/card`): estúdio com 4 modelos (`fita`, `diario`, `estante`, `recibo`),
  paletas, mostrar capa / variações; exporta PNG 9:16 com `html-to-image` e compartilha (Web Share
  com arquivo) ou baixa. Mobile mostra o card do mês, sem o estúdio.

## Moderação e segurança entre usuários

- **Denunciar** post, comentário ou leitor (`moderation.report`), com motivo, detalhes e cópia do
  conteúdo; uma denúncia aberta por item e por pessoa.
- **Bloquear / desbloquear** (até 1000): desfaz follows nos dois sentidos e esconde o conteúdo de um
  para o outro; lista de bloqueados nas configurações.
- Ferramentas internas (dashboard/CLI): `moderation.resolve`, `removeContent`, `suspend`.
- Contas suspensas, excluídas ou menores de 16 ficam ocultas (`isHidden`).

## LGPD, termos e idade

- Termos de Uso e Política de Privacidade versionados (`TERMS_VERSION`/`PRIVACY_VERSION`); aceite
  registrado com versão, data e origem (`legalAcceptances`); mudança de versão pede aceite de novo.
- **16+**: data de nascimento declarada (só "é 16+" é guardado); menor de 16 fica oculto e só pode
  excluir a conta.
- **Baixar meus dados** (JSON, `account.exportData`) na web e no mobile.
- **Excluir conta** (Better Auth `/delete-user` + `account.purge` em lotes, corrigindo contadores de
  todos); página pública `/excluir-conta` para as lojas.
- Aviso de armazenamento local (`CookieNotice`); sem analytics nem scripts de terceiros.
- Documentação em `docs/legal/` (ROPA, incidentes, proporcionalidade).

## Experiência e plataforma

- **Offline-first**: cache inteiro do TanStack Query persistido por 7 dias (localStorage / MMKV),
  telas renderizam do cache antes da rede; subscriptions do Convex mantêm o que está na tela vivo.
- **Mutações otimistas** com rollback (estante, curtir, seguir).
- Tema **claro / escuro / sistema** nos dois apps, aplicado antes do primeiro paint na web.
- Visual "arquivo" com design tokens compartilhados (`@grimo/tokens`) → Tailwind e StyleSheet.
- Web: **landing page** (`/welcome`) com demos interativas (painel e iPhone); container queries.
- Mobile: Expo SDK 58, Expo Router, abas (Início, Buscar, Estantes, Perfil), componentes "glass".
- **Seed** com 5 contas de exemplo (`pnpm seed`).
- CI no GitHub Actions: Biome + typecheck + Vitest (core e `convex-test`).
