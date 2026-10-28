# Roadmap do Grimo (27/10/2026)

Tudo o que o Grimo pode ter, organizado por pilar. O que já existe está em
[features.md](features.md); bugs e detalhes técnicos em [melhorias.md](melhorias.md) (os códigos
`F1`, `S3`… apontam para lá).

## A visão, em uma linha

Uma **rede social de leitura simples, bonita e pessoal**: o leitor registra o que lê, conversa com
quem lê junto e mostra o mês de leitura para fora do app. Não é um catálogo gigante, nem um app de
números, nem uma loja.

Ao decidir se algo entra, pergunte:

1. **Aproxima leitores?** (conversa, leitura junto, descoberta por pessoas) → prioridade.
2. **Deixa o registro mais gostoso ou mais rápido?** → prioridade.
3. **Vira algo bonito para compartilhar fora do app?** → é o nosso canal de crescimento.
4. **Exige logística, dinheiro ou moderação pesada?** (trocas, sorteios, mensagens privadas) → só
   depois de a comunidade existir.

## Concorrentes: o que cada um faz bem

| App          | Ponto forte                                                                     | O que aprendemos                                                     |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Skoob**    | Maior base no Brasil; estantes, paginômetro, desafios com medalha, retrospectiva do ano, trocas por créditos (Skoob Plus), sorteios e lançamentos de editoras | O histórico do leitor brasileiro está lá → **importar do Skoob** é essencial. Visual e app datados: é aí que ganhamos. |
| **Maratona** | Leituras coletivas e maratonas literárias com outros leitores, registro de hábito | **Ler junto** é o diferencial social que o Skoob não tem bem resolvido. |
| Goodreads    | Catálogo, desafio anual, listas, grupos                                         | Desafio anual e listas funcionam; o resto é pesado e em inglês.      |
| StoryGraph   | Estatísticas por humor/ritmo, recomendações, buddy reads, cronômetro de leitura | Estatística pode ser bonita sem virar planilha.                      |
| Fable        | Clubes com discussão por capítulo, sem spoiler                                  | Spoiler por página/capítulo é o que faz um clube funcionar.          |
| Letterboxd   | (filmes) Diário, listas curadas, resenhas curtas, perfil como identidade        | A referência de "rede social de gosto" bem feita: listas e perfil.  |

## Legenda

- **Status:** ✓ feito · ◐ parcial (backend ou só uma plataforma) · — não existe
- **Quando:** **Agora** (próximas semanas) · **Próximo** (antes de abrir para o público) ·
  **Depois** (com a comunidade crescendo) · **Talvez** (avaliar quando chegar a hora)

---

## 1. Rede social (o núcleo)

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Perfil público com estatísticas, lendo agora e favoritos                 | Letterboxd        |   ◐    | Agora (falta no mobile, F3) |
| Seguir, seguidores e seguindo                                            | todos             |   ◐    | Agora (falta no mobile, F3) |
| Busca e sugestões de leitores                                            | todos             |   ◐    | Agora (falta no mobile, F3) |
| Feed da rede com agrupamento                                             | todos             |   ✓    | —       |
| Curtidas e comentários em posts                                          | todos             |   ✓    | —       |
| **Notificações** (seguidor, curtida, comentário) + push no iPhone (F6)   | todos             |   —    | Próximo |
| **Menções** com @ em posts e comentários (notifica o mencionado)         | Twitter/Letterboxd |  —    | Próximo |
| Respostas a comentários (um nível de thread)                             | Goodreads         |   —    | Depois  |
| "Leitores como você": gosto parecido por lidos e gêneros (F10)           | StoryGraph        |   —    | Depois (precisa de volume de dados para não sugerir ruído) |
| Convidar amigos (link de convite, contatos com consentimento)            | —                 |   —    | Próximo |
| Silenciar alguém (sem bloquear)                                          | Twitter           |   —    | Depois  |
| Perfil privado com pedido para seguir (F5)                               | Instagram         |   —    | Depois  |
| Filtro de spoiler no feed (esconde posts de livros que você está lendo)  | Fable             |   ◐    | Depois (hoje só a marcação) |
| Mensagens privadas                                                       | Skoob             |   —    | Talvez (exige moderação forte e cuidado com 16+) |

## 2. Registro de leitura (o diário)

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Quatro estantes, progresso por página, nota, datas                       | Skoob             |   ✓    | —       |
| Remover livro da estante (F2)                                            | —                 |   ◐    | Agora (falta no mobile) |
| Paginômetro / páginas lidas no ano                                       | Skoob             |   ✓    | —       |
| **Sessão de leitura com cronômetro** (tempo + páginas por sessão)        | StoryGraph/Maratona | —    | Próximo |
| **Live Activity / Dynamic Island** durante a sessão de leitura           | —                 |   —    | Próximo (precisa de build EAS) |
| **Ofensiva**: dias seguidos lendo, com lembrete gentil                   | Duolingo/Maratona |   —    | Próximo |
| Formato do exemplar (físico, ebook, audiobook) e progresso em % ou minutos | StoryGraph      |   —    | Depois  |
| Releituras com histórico de cada leitura (F8)                            | Goodreads         |   —    | Depois  |
| Estantes personalizadas / tags ("favoritos", "emprestei", "2026")        | Skoob/Goodreads   |   —    | Depois  |
| Motivo ao abandonar ("não me prendeu", "pausa")                          | StoryGraph        |   —    | Depois  |
| Notas privadas por livro (só você vê)                                    | Skoob             |   —    | Depois  |
| **Citações** com página: post tipo `quote`, card no estúdio, e dá para citar dentro da conversa do Juntos (F11) | Skoob/Kindle | — | Próximo |
| Número de páginas **da sua edição** (`pageCount` por entrada): progresso e meta certos (F13) | StoryGraph | — | Próximo (base para o Juntos) |
| Meta mensal e meta por páginas (F9)                                      | Goodreads         |   —    | Depois  |
| Escanear o código de barras (ISBN) para adicionar (F14)                  | Skoob/Goodreads   |   —    | Próximo |
| Cadastrar livro que o Open Library não tem: começa visível só para quem cadastrou, vira público depois de revisado (F13) | Skoob | — | Próximo (nacionais e independentes faltam muito) |

## 3. Juntos: a 5ª aba (o diferencial social, F12)

Uma aba só para ler com outras pessoas: **Início · Buscar · Juntos · Estantes · Perfil**. É o pilar
que mais diferencia o Grimo do Skoob e o que tem crescimento embutido: **todo grupo precisa de
convite**, e o convite é um link que traz gente nova.

### Por que pode ser viral

- **Convite como porta de entrada:** o link `grimo.app/j/<código>` abre deslogado com a capa, quem
  está lendo e o progresso do grupo. Quem cria conta por ele **pula a escolha de livro** no
  onboarding: o livro é o do grupo, já entra em "Lendo" (a ativação acontece no primeiro minuto).
- **Compartilhamento natural:** card do grupo para Stories ("4 amigas lendo *Torto Arado*, faltam
  120 páginas") e card de "terminamos juntos" no fim.
- **Volta ao app:** "a Bia passou de você", "o grupo chegou ao capítulo 5": motivos reais para
  abrir, sem gamificação forçada.
- **Do desejo ao grupo:** "3 amigos querem ler este livro → ler juntos?" (vem do F10).

### Como fazer, em etapas

| Etapa | Recurso | Inspiração | Status | Quando |
| ----- | ------- | ---------- | :----: | ------ |
| 1 | **Leitura conjunta**: 2 a 20 pessoas, um livro, link de convite, progresso de todos lado a lado | Maratona/StoryGraph | — | Próximo |
| 1 | Conversa por trecho, **liberada conforme o seu progresso** (sem spoiler) | Fable | — | Próximo |
| 1 | Ritmo do grupo: data para terminar → meta de páginas por semana calculada | Bookclubs | — | Próximo |
| 1 | Botão **"Ler com alguém"** na página do livro e nos livros de "Quero ler" | — | — | Próximo |
| 1 | Card do grupo e card de "terminamos juntos" | Spotify Wrapped | — | Próximo |
| 2 | **Clubes**: grupo fixo que lê um livro depois do outro, enquete para o próximo | Bookclubs/Fable | — | Depois |
| 2 | Encontros do clube com data (lembrete, link da chamada ou local) | Bookclubs | — | Depois |
| 3 | **Leituras abertas**: grupos públicos por livro, qualquer um entra (resolve a aba vazia de quem não tem amigos no app) | Maratona | — | Depois |
| 3 | **Maratonas literárias**: evento com prazo e meta; o Grimo pode lançar uma por mês ("Maratona de Halloween") | Maratona | — | Depois |
| 3 | Clube público de criador (booktuber, BookTok) com página própria | Fable | — | Talvez |

### Cuidados

- **Edições diferentes têm números de página diferentes:** a conversa sem spoiler e o "lado a
  lado" usam **porcentagem** (ou capítulo), não a página crua. Ver o F13 (páginas por leitor).
- **Aba vazia:** quem não está em nenhum grupo vê sugestões (livros que amigos querem ler, leituras
  abertas) e um botão de criar, nunca uma tela em branco.
- **Moderação e LGPD:** a conversa reusa comentários, denúncia e bloqueio; quem bloqueou alguém
  não cai no mesmo grupo sem aviso. Participação em grupo entra em `exportData`/`purge` e no ROPA.
- **Notificação com limite:** um resumo por dia por grupo, desligável.
- **Depende de:** seguir e perfis no mobile (F3) e notificações com push (F6).

### Como saber se deu certo

- % dos leitores ativos em pelo menos um grupo.
- Convites enviados por grupo e quantos viram conta (o "viral" de verdade).
- Retenção em 30 dias de quem está num grupo comparada com quem não está.
- Grupos que chegam ao fim do livro.

## 4. Desafios e conquistas (gamificação leve)

Motivar sem transformar leitura em competição: nada de ranking global, só você e seus amigos.

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Meta do ano                                                              | Goodreads         |   ✓    | —       |
| **Desafios temáticos** ("um clássico", "autora brasileira", "mais de 500 páginas") com medalha no perfil | Skoob | — | Depois |
| Medalhas por marcos (primeiro livro, 10 livros, 30 dias de ofensiva)     | Skoob/Duolingo    |   —    | Depois  |
| Desafio entre amigos (quem lê mais páginas no mês, opt-in)               | Maratona          |   —    | Talvez  |

## 5. Descoberta de livros

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Busca e página do livro com resenhas da comunidade                       | todos             |   ✓    | —       |
| **Listas curadas por leitores** ("terror para começar", "melhores de 2026"), públicas e seguíveis | Letterboxd | — | Próximo |
| Em alta entre quem você segue (F10)                                      | Letterboxd        |   —    | Próximo |
| Amigos que querem ler o mesmo livro → "ler juntos?" (F10)                | —                 |   —    | Próximo (porta de entrada do Juntos) |
| Livros parecidos na página do livro                                      | StoryGraph        |   —    | Depois  |
| Explorar por gênero / humor                                              | StoryGraph        |   —    | Depois  |
| Lançamentos de editoras parceiras                                        | Skoob             |   —    | Talvez  |

## 6. Compartilhar fora do app (o canal de crescimento)

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Card do mês para Stories (4 modelos) na web                              | Spotify Wrapped   |   ✓    | —       |
| **Estúdio do card do mês no mobile** com compartilhamento nativo (F3)    | —                 |   ◐    | Agora   |
| **Retrospectiva do ano** (dezembro, mesmos modelos) (F9)                 | Skoob/Spotify     |   —    | Agora (tem prazo: dezembro) |
| Card de resenha e card de citação                                        | Letterboxd        |   —    | Próximo |
| Card de "terminei de ler" (capa + nota + frase)                          | —                 |   —    | Próximo |
| Link do perfil bonito (preview com OG image)                             | Letterboxd        |   —    | Próximo |
| Widget na tela inicial (livro atual, meta, ofensiva)                     | —                 |   —    | Depois (precisa de build EAS) |

## 7. Comunidade além do app

Exigem logística, endereço ou parceiros: só fazem sentido com uma base grande de leitores.

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Empréstimo entre amigos (quem está com meu livro)                        | —                 |   —    | Talvez  |
| Trocas de livros entre leitores                                          | Skoob Plus        |   —    | Talvez (endereço = dado pessoal sensível na LGPD) |
| Sorteios e cortesias de editoras                                         | Skoob             |   —    | Talvez  |
| Perfil verificado de autor, autor responde resenhas                      | Goodreads         |   —    | Talvez  |
| "Onde comprar" com links (sebo, loja, biblioteca)                        | Skoob             |   —    | Talvez (afiliados mudam a política de privacidade) |

## 8. Conta, segurança e dados

| Recurso                                                                  | Inspiração        | Status | Quando  |
| ------------------------------------------------------------------------ | ----------------- | :----: | ------- |
| Email/senha, Google, termos, 16+, exportar e excluir conta               | —                 |   ✓    | —       |
| **Recuperar senha e verificar email** (S3)                               | —                 |   —    | Próximo (trava o lançamento) |
| **Botão "Entrar com Apple"** no mobile (exigido pela App Store)          | —                 |   ◐    | Próximo (trava a App Store) |
| **Importar do Skoob e do Goodreads** (F7)                                | —                 |   —    | Próximo |
| Exportar em CSV (além do JSON)                                           | Goodreads         |   —    | Depois  |
| Painel de moderação `/admin` (F15)                                       | —                 |   —    | Próximo (antes de abrir para o público) |
| Filtro automático de conteúdo (F16)                                      | —                 |   —    | Depois  |
| Preferências de notificação por tipo                                     | —                 |   —    | Junto com as notificações |

## Fora da visão (de propósito)

- **Leitor de ebooks** ou loja própria: o Grimo registra a leitura, não vende nem hospeda livros.
- **Catálogo wiki editável** por todos: usamos o Open Library e só cadastramos o que falta.
- **Estatísticas pesadas** (dezenas de gráficos): poucas, bonitas e compartilháveis.
- **Ranking global** de quem lê mais: compara com amigos, nunca com o país inteiro.
- **IA escrevendo resenhas**: a resenha é a voz do leitor. Recomendação por IA, talvez, um dia.
- **Analytics e pixels de terceiros** sem consentimento de verdade (veja `docs/legal`).

---

## Ordem sugerida

1. **Paridade do mobile** (F3, F2): perfil de outros leitores, seguir, busca de leitores, editar
   perfil, remover da estante. Sem isso o app não é social, e o Juntos depende disso.
2. **Estúdio do card no mobile + Retrospectiva do ano**: crescimento, e dezembro está perto.
3. **Notificações com push** (F6) e **menções**: o que traz o leitor de volta (e o Juntos precisa).
4. **Juntos, etapa 1**: leitura conjunta com convite por link, progresso em %, conversa sem
   spoiler, ritmo e cards. Antes: páginas da sua edição (F13) e "amigos querem ler" (F10).
5. **Antes de abrir ao público:** recuperar senha (S3), Entrar com Apple, painel de moderação
   (F15), importar do Skoob/Goodreads (F7), cadastro manual de livro (F13).
6. **Hábito:** sessão de leitura com cronômetro, ofensiva, citações (F11), Live Activity e widget
   (pede build EAS).
7. **Juntos, etapas 2 e 3:** clubes, leituras abertas, maratonas do mês.
8. **Descoberta:** listas curadas, "leitores como você" (F10), cards de resenha.
