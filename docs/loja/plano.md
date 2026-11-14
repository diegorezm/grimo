# Lojinha: plano de implementação

Status: plano aprovado para implementação (2026-11-14). Nada disto está no código ainda.
Quem implementa: leia o [AGENTS.md](../../AGENTS.md) inteiro antes, em especial "Cache",
"Pagamentos (Stripe)" e "Dados pessoais e termos (LGPD)".

## O que é

Uma loja **só de produtos digitais**: cosméticos para personalizar o perfil, no modelo do que o
Discord faz (decoração de avatar, efeito e tema de perfil, coleções). O leitor compra uma vez e
guarda para sempre; há também a assinatura **Grimo Plus**. Nada físico, nada com entrega. Pagamento por **Stripe na
web** e por **compra no app (IAP) no mobile**, via RevenueCat: App Store no iOS, Google Play no
Android. Quem não
é dev (admin e "lojista") monta e publica os itens por um painel.

Hoje: `SHOP_ITEMS` é uma constante em `packages/core/src/billing/catalog.ts` com um item de
exemplo, a compra só existe na web (`/settings/plan`), `requireItem` existe mas nada o usa, e
todos os estilos de `shelves/style.ts` são grátis.

## Princípios (não negociáveis)

1. **Só cosmético na lojinha.** Função (recurso, estatística) é do Plus.
2. **Ninguém perde o que já tinha.** Parte das opções de estante hoje grátis vira paga (ver
   [Estante](#estante-o-que-é-grátis-e-o-que-é-pago)), mas quem já tinha conta no dia da virada
   fica com todas elas. O conjunto grátis precisa, sozinho, render uma estante bonita.
3. **Ver não exige ter.** Qualquer um renderiza o item no perfil de quem tem; a posse só é
   checada ao salvar (`bookshelves.setStyle`).
4. **Perder o acesso não apaga a escolha.** Plus vencido ou reembolso: a estante mostra o padrão,
   o estilo salvo fica guardado e volta se o acesso voltar.
5. **Chave desconhecida cai no padrão.** Versão antiga do app que abre um perfil com um cosmético
   que não conhece renderiza o padrão, sem erro.
6. **Cosmético por dados sempre que der** (paleta, textura, enfeite como imagem), para item novo
   não depender de release nas lojas. Só o que exige desenho novo vira código.
7. **Uma fonte de verdade para posse.** `purchases` e `subscriptions` valem para as três origens
   (Stripe, Apple, Google); `hasPlus` e `ownedItems` não sabem de onde veio.
8. **O cliente nunca concede nada.** Posse só muda por webhook/notificação verificada ou por
   verificação no servidor de uma transação assinada pela loja.
9. Sem item aleatório (caixa surpresa), sem escassez falsa, sem contagem regressiva inventada. O
   app é 16+.

## Modelo

Duas coisas separadas:

- **Desbloqueável** (código, só dev): o cosmético em si, com uma chave estável. Registro
  `UNLOCKABLES` em `@grimo/core` (`shelves/style.ts` + tokens `shelfMaterials`), cada entrada
  marcada como grátis ou paga.
- **Item da loja** (banco, admin/lojista): a vitrine. Tabela `shopItems`:
  `key` (slug único e imutável), `name`, `description`, `category`
  (`molduras | capas | temas | selos | estantes | colecao`), `unlocks: string[]` (chaves de
  desbloqueáveis; coleção = várias), `priceTier` (ver abaixo), `includedInPlus: boolean`,
  `status` (`draft | published | archived`), `startsAt`/`endsAt` (opcionais), `featured`,
  `sortOrder`, `createdBy`, `updatedAt`. Índices: `by_key`, `by_status`.

### Espaços do perfil (slots)

Cada cosmético ocupa um **espaço**, e o leitor equipa um por espaço:

| Espaço | O que é | Onde aparece | Como é feito |
| ------ | ------- | ------------ | ------------ |
| `avatarFrame` | Moldura em volta da foto | Em todo lugar onde o avatar aparece (feed, comentários, listas, perfil) | Imagem (dados) |
| `profileCover` | Capa/fundo do perfil | Perfil | Imagem ou paleta (dados) |
| `profileTheme` | Cores do perfil (além das `PROFILE_COLORS` grátis) | Perfil | Paleta (dados) |
| `badge` | Selo ao lado do nome (ex-líbris, carimbo) | Perfil e cartões de leitor | Imagem (dados) |
| `shelf` | Estante: modelo, material, enfeites, estilo pronto | Perfil ("Todos os meus livros") | Código + tokens |

- O que está equipado fica em `users.equipped` (`{ avatarFrame?, profileCover?, … }`, chaves de
  desbloqueáveis), gravado por `profile.equip` com a mesma checagem de posse (`canUse`). O estilo
  da estante continua em `bookshelves.setStyle`.
- A moldura acompanha o avatar em listas: ela entra no resumo de leitor que as queries já
  devolvem (um campo a mais, sem leitura extra por item) e o componente de avatar dos dois apps a
  desenha. É o item mais visível, e por isso o que mais vende.
- **Cosmético por dados tem arquivo**: imagem enviada pelo lojista para o storage do Convex
  (`shopAssets`: `unlockKey`, `slot`, `storageId`, variantes claro/escuro). Isso substitui o
  "sem upload na v1" das telas de admin abaixo para esses espaços; o registro em código
  (`UNLOCKABLES`) fica só para o que é desenhado em código (estante). Formato, tamanho e peso
  máximos são validados no envio; só a equipe envia, então não passa pela fila de moderação.
- **Estático primeiro.** Animação (o "efeito de perfil" do Discord) fica para depois: pesa no
  mobile e em listas longas. Quando vier, respeita "reduzir movimento" e nunca roda em lista.
- Tudo precisa funcionar em claro e escuro e caber no visual "arquivo" (papel, tinta, oliva):
  molduras de ex-líbris, carimbos, marcadores, lombadas, não neon.
- Do modelo do Discord, **entra**: experimentar antes de comprar, coleções, item exclusivo ou
  incluso no Plus. **Não entra na v1**: presentear (complica IAP e reembolso), moeda própria
  (vira saldo pré-pago, com regra à parte) e item por tempo limitado como pressão de compra.

### Estante: o que é grátis e o que é pago

Hoje (`packages/core/src/shelves/style.ts`) tudo é grátis: 5 modelos, 7 materiais, 4 acabamentos
de lombada, 3 arrumações, 3 ordens, 6 enfeites, 3 luzes e 7 estilos prontos. Proposta de corte
(os valores finais são decisão do produto):

| Camada | Grátis | Pago |
| ------ | ------ | ---- |
| Modelo | Clássica, Flutuante | Arco, Nichos, Biblioteca |
| Material | Papel, Lilás, Carvalho | Rosa, Sálvia, Noite, Nogueira |
| Lombada | Capa do livro, Tons do móvel | Tecido, Couro e ouro |
| Enfeite | Planta, Estrela | Vela, Porta-retrato, Caneca, Globo |
| Luz | Luz do dia | Fim de tarde, Luminária |
| Arrumação | Em pé, Com pilhas, Capas | (nada) |
| Ordem | Como coloquei, Arco-íris, Altura | (nada) |

- **Arrumação e ordem ficam grátis**: são jeito de organizar os livros (função), não enfeite.
- **Os estilos prontos viram as coleções.** "Diário" e "Parede limpa" só usam peças grátis e
  continuam grátis. "Chalé", "Acervo", "Galeria", "Romance" e "Noite estrelada" são vendidos
  como coleção (o item libera todas as peças do estilo); as peças também são vendidas avulsas
  numa faixa menor. Coleções repetem peças entre si (a vela está em três, o arco em duas): o
  cartão da coleção mostra o que o leitor já tem, e o preço da coleção é fixo.
- A posse é da conta: peça comprada vale em todas as estantes do leitor.
- No editor (`customize-sheet` e o equivalente da web), peça paga aparece com cadeado e pode
  ser **experimentada** na prévia; salvar com peça que o leitor não tem é recusado no servidor.
- Conta nova nasce com "Diário", como hoje.

**Quem já tinha conta (obrigatório).** Uma migração marca todas as contas existentes na virada
com `users.legacyShelf: true`; `canUse` libera para elas a lista fixa `LEGACY_SHELF_UNLOCKS`
(tudo o que existia em `style.ts` nesse dia). Vale para sempre e não depende do que estava
aplicado na estante. Cosmético lançado depois não entra na lista. Motivo: tirar de alguém o que
já usava é o pior jeito de estrear uma loja, e com a base de hoje a receita perdida é pequena.
As contas do seed entram com e sem essa marca, para o mockup mostrar os dois casos.

Item que já foi vendido **nunca é apagado**, só arquivado (some da vitrine, quem comprou mantém).

### Faixas de preço (decisão central)

Apple e Google exigem que cada produto exista antes na loja deles e passe por revisão. Para o
lojista conseguir publicar item sem depender disso, o preço é uma **faixa** de uma lista fixa em
`@grimo/core` (`PRICE_TIERS`, ex.: `t1` R$ 4,90 · `t2` R$ 9,90 · `t3` R$ 14,90 · `t4` R$ 19,90 ·
`t5` R$ 29,90; valores a definir). Cada faixa tem:

- o valor da web (Stripe, via `ensurePrice` com `lookupKey` `grimo_tier_<id>_v<n>`);
- um produto **consumível** em cada loja (`com.morzen.grimo.item.<id>`), criado uma vez.

O app compra "a faixa" e o servidor concede o item escolhido. A loja não sabe qual item foi; quem
guarda é o nosso servidor, ligado à conta. Isso é o padrão para catálogos grandes.

- Risco: a revisão da Apple pode preferir um produto não consumível por item. Não achei texto
  oficial que proíba ou confirme a prática; **validar na primeira submissão**. Plano B: um produto
  não consumível por item, criado pela App Store Connect API, com revisão a cada item novo
  (o lojista deixa de publicar na hora no iOS).
- Piso de preço: a taxa do Stripe tem parte fixa por transação, então a menor faixa fica em
  torno de R$ 5.
- O preço mostrado no mobile é **o da loja** (vem do produto, já localizado), não o do catálogo.
  Pode ser maior que o da web para cobrir a comissão.

## Papéis

- Novo `role: "merchant"` (lojista) em `users.role`, ao lado de `admin` e `moderator`.
- Convite pelo admin no mesmo fluxo de `convex/moderators.ts` (24 h), ou
  `npx convex run shop:setMerchant`.
- `requireShopStaff(ctx)` aceita `admin` e `merchant`. Lojista **não** modera; moderador **não**
  mexe na loja.
- Toda ação (criar, publicar, arquivar, mudar faixa) vai para o log que a moderação já usa
  (`logAction`).

## Telas

### Web `/loja`

- Cabeçalho "Lojinha" + "meus itens · N".
- Faixa do Grimo Plus (assinar, ou estado atual).
- Filtros por categoria (chips): tudo, molduras, capas, temas, selos, estantes, coleções.
- Destaque (item ou coleção `featured`), depois grade de cartões: prévia, nome, e um de
  `R$ 9,90` · `você tem` · `incluso no Plus`.
- Clique abre **side peek** (`?item=<key>`, mesmo padrão de `?book=`): prévia ao vivo **na
  estante do próprio leitor**, descrição, botão "Comprar · R$ 9,90" (Stripe) e "Experimentar na
  estante" (aplica só na prévia, não salva).
- Container queries (`@container/main`), claro e escuro, só tokens.
- `/settings/plan` fica só com assinatura, faturas e portal; a lista de itens sai de lá.
- No perfil de outro leitor, um cosmético pago ganha um link discreto "ver na lojinha".

### Mobile

- Tela `loja` (entrada pelo perfil e pelo `customize-sheet`): mesma estrutura em uma coluna,
  chips, destaque, grade de 2 colunas.
- Sheet do item: prévia na própria estante, "Comprar · <preço da loja>" (IAP) ou "Usar na
  estante" se já tem.
- No `customize-sheet`, opção paga que o leitor não tem aparece com cadeado e abre o sheet do
  item.
- "Restaurar compras" em Ajustes (exigência da Apple).

### Web `/admin/loja` (admin e lojista)

- Lista: nome, faixa, status (rascunho, agendado, publicado, arquivado), vendas.
- Formulário: nome, descrição, categoria, "o que libera" (escolha no registro `UNLOCKABLES`),
  faixa de preço, "incluso no Plus", período de venda, destaque. Prévia ao lado.
- Ações: salvar rascunho, publicar, arquivar. Sem upload de imagem na v1: a vitrine usa a prévia
  renderizada do próprio cosmético.

## Backend

- `convex/shop.ts`: `list` (pública, só publicados e dentro do período; marca `owned` e
  `viaPlus` para o leitor logado), `detail`, e de gestão `adminList`, `save`, `publish`,
  `archive`, `setMerchant`.
- `model/shop.ts`: `requireShopStaff`, `canUse(ctx, userId, unlockKey)` (grátis, ou comprado, ou
  incluso no Plus com Plus ativo), leitura do item por `key`.
- `bookshelves.setStyle`: recusa desbloqueável que o leitor não pode usar (`FORBIDDEN`, pt-BR).
  A leitura do estilo (perfil) devolve o estilo **efetivo**: o salvo se o dono ainda pode usar,
  senão o padrão; o salvo fica intacto no banco.
- `billing.startCheckout` (Stripe) e `applyCheckout` passam a ler o item do banco em vez de
  `SHOP_ITEMS`; `checkoutRequestSchema` valida `key` como slug (a existência é checada no
  servidor). `SHOP_ITEMS` some do core.
- Generalizar as tabelas (com migração `@convex-dev/migrations` para as linhas atuais):
  - `purchases`: `source: "stripe" | "apple" | "google"`, `storeTransactionId` (único por
    origem; índice `by_source_transaction`). Os campos `stripe*` viram opcionais, e `itemKey`
    pode ser `null` (crédito de faixa ainda sem item escolhido, com `tier`).
  - `subscriptions`: `source`, `storeSubscriptionId` (nas lojas: o `original_transaction_id`
    do evento do RevenueCat), mantendo `status`, `interval`, `currentPeriodEnd`, `cancelAtPeriodEnd`,
    `eventCreated`.
  - `users.iapAccountToken`: UUID v4 gerado no servidor, usado como App User ID no
    RevenueCat. Nunca o id do usuário nem o email.
- `billing.status` ganha `subscription.source`, para as telas saberem onde gerenciar.
- **Uma assinatura por conta**: quem já é Plus por uma origem não vê botão de assinar nas
  outras; vê "Assinado pela App Store / Google Play / web: gerencie por lá".

## Client (`@grimo/client`)

- `shopQuery()`, `shopItemQuery(key)`, `useShop`, `useShopItem`; gestão: `useShopAdmin`,
  `useSaveShopItem`, `usePublishShopItem`, `useArchiveShopItem` (otimistas, com `patchQueries`).
- Subir `CACHE_VERSION` (formato de `billing.status` e do estilo muda).
- A compra por IAP não é otimista: o item só aparece como "você tem" quando o servidor confirma.

## IAP: como implementar (RevenueCat)

Decisão (2026-11-14): o mobile vende pelo **RevenueCat** (`react-native-purchases`), que fala com
a App Store e o Google Play e cuida da verificação e do ciclo de vida das assinaturas. A web
continua **direto no Stripe**, sem passar pelo RevenueCat. As duas origens gravam nas mesmas
tabelas; a posse continua sendo nossa. `expo-iap` com verificação própria foi descartado: é muito
código sensível a dinheiro (transação assinada da Apple, API do Google, Pub/Sub) para escrever
sem conseguir testar compra real.

Fontes e o que ficou por confirmar estão em [Pesquisa](#pesquisa-novembro-de-2026).

### Como as peças se ligam

```
app (react-native-purchases) ──compra──▶ App Store / Google Play
                                              │ notificações de servidor
                                              ▼
                                         RevenueCat ──webhook──▶ Convex /revenuecat/webhook
                                                                    │
web ──Stripe Checkout──▶ Stripe ──webhook──▶ Convex /stripe/webhook │
                                                                    ▼
                                              purchases · subscriptions (source: stripe|apple|google)
```

### App

- Instalar: `pnpm --filter @grimo/mobile exec expo install react-native-purchases`. Exige Expo
  SDK 54+ e development build (já usamos `expo-dev-client`); **não** precisa de config plugin.
  Não instalar `react-native-purchases-ui`: as telas são nossas. No Expo Go o SDK roda em modo
  de simulação e não compra de verdade. Depois de instalar é preciso um build completo.
- Chaves públicas do SDK (uma por plataforma): `EXPO_PUBLIC_REVENUECAT_IOS_KEY` e
  `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. Sem elas a compra no app fica desligada (botão some).
- **Identidade:** o App User ID é `users.iapAccountToken` (UUID v4 gerado no servidor, entregue
  por `me`). Nunca email, nunca o id do usuário. Configurar só **depois do login**, já com o id
  (`Purchases.configure({ apiKey, appUserID })`), para nunca existir id anônimo nem fusão de
  contas; ao trocar de conta, `Purchases.logIn(novoId)`. Não chamar `logOut()` (cria id anônimo).
- No painel do RevenueCat, o comportamento de restauração deve **manter a compra na conta
  original** (não transferir para quem restaurar em outra conta). O nome exato da opção está na
  página de restauração, que não li.
- Camadas: o estado de compra (pedido, "confirmando…", erros em pt-BR) mora em `@grimo/client`;
  só as chamadas ao SDK ficam em `apps/mobile/src/features/shop/`.
- "Restaurar compras" em Ajustes chama `Purchases.restorePurchases()` e depois `iap.sync`.

### Compra de um item (faixa de preço)

O RevenueCat registra que o leitor comprou o **produto da faixa**, mas não sabe qual item era.
Por isso existe o pedido:

```
1. app → mutation shop.startOrder({ itemKey })       cria shopOrders (pending) e devolve o productId da faixa
2. app → Purchases.getProducts([productId], NON_SUBSCRIPTION) → purchaseStoreProduct(produto)
3. loja cobra → RevenueCat → webhook NON_RENEWING_PURCHASE (app_user_id, product_id, transaction_id)
4. Convex: acha o pedido pending daquele leitor e produto → grava purchases → pedido fulfilled
5. o app vê "você tem" pela subscription do Convex (sem otimismo: só quando o servidor grava)
```

- Tabela `shopOrders`: `userId`, `itemKey`, `productId`, `status` (`pending | fulfilled |
  expired`), `createdAt`, `transactionId?`. **Um pedido pendente por leitor**; abrir outro expira
  o anterior. Pedido pendente expira sozinho em 24 h.
- O webhook costuma chegar em 5 a 60 s. Para não deixar o leitor esperando, logo após a compra o
  app chama a action `iap.sync`, que consulta `GET /subscribers/<id>` na API do RevenueCat e
  aplica o mesmo código do webhook. Quem chegar primeiro grava; o outro é ignorado
  (`storeTransactionId` único).
- **Compra sem pedido** (app fechou antes do passo 1 valer, pedido expirou): a compra vira um
  **crédito da faixa** (`purchases` com `itemKey: null`), e a loja mostra "Você tem um item de
  R$ X para escolher". Ninguém paga sem receber.
- Os produtos das faixas são **consumíveis** e **não** entram em nenhum entitlement do
  RevenueCat (consumível em entitlement fica liberado para sempre). O RevenueCat não controla o
  resgate de consumível: quem controla é o nosso banco.
- `purchases.source` vem de `event.store`: `APP_STORE` → `apple`, `PLAY_STORE` → `google`.

### Grimo Plus no app

- Um entitlement `plus` no RevenueCat, com os produtos de assinatura das duas lojas (mensal e
  anual), vendidos por um offering (`Purchases.getOfferings()` → `purchasePackage`).
- No servidor, **qualquer evento de assinatura** faz a mesma coisa: consulta
  `GET /subscribers/<id>` e espelha o entitlement `plus` em `subscriptions` (status, intervalo,
  fim do período, "não renova"). É o que o RevenueCat recomenda, e evita depender da ordem dos
  eventos. Eventos: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION` (`cancel_reason`
  `UNSUBSCRIBE` = não renova; `CUSTOMER_SUPPORT` = reembolso), `UNCANCELLATION`,
  `BILLING_ISSUE` (carência: o Plus continua), `EXPIRATION` (tira o Plus), `PRODUCT_CHANGE`,
  `SUBSCRIPTION_EXTENDED`, `TRANSFER`.
- Cancelar é na loja: o app abre a tela de assinaturas do sistema.
- **Excluir a conta não cancela assinatura da Apple nem do Google.** Antes de `account.purge`,
  se a assinatura ativa for de loja, a tela avisa e leva o leitor a cancelar lá. A exclusão
  também apaga o cliente no RevenueCat pela API (confirmar o endpoint).

### Servidor (Convex)

- Rota HTTP `/revenuecat/webhook` em `http.ts`, no molde de `/stripe/webhook`:
  1. confere o cabeçalho `Authorization` (segredo definido no painel) e, se ligada, a assinatura
     `X-RevenueCat-Webhook-Signature` (HMAC-SHA256 sobre `"<timestamp>.<corpo cru>"`);
  2. ignora eventos do ambiente errado (`event.environment`: `SANDBOX` em dev, `PRODUCTION` em
     produção) e o tipo `TEST`;
  3. mutation interna idempotente pelo `event.id` (reusar `stripeEvents`, renomeada para
     `billingEvents` com `source`);
  4. responde **200** rápido. Qualquer outra resposta faz o RevenueCat repetir (5 vezes em cerca
     de 80 minutos) e ele desiste se passar de 60 s.
- Entrega é "pelo menos uma vez": o mesmo evento pode chegar repetido.
- Reembolso de item: `CANCELLATION` com o `transaction_id` da compra → `status: "refunded"`.
  Só chega se as **notificações de servidor das lojas** estiverem apontadas para o RevenueCat
  (App Store Server Notifications e RTDN do Google, configuradas no painel dele).
  `REFUND_REVERSED` devolve o item.
- `convex/iap.ts`: `sync` (action, consulta a API e aplica) e as mutations internas;
  `model/iap.ts`: a função única que aplica um cliente do RevenueCat às tabelas.
- Variáveis em `model/env.ts`: `REVENUECAT_SECRET_KEY` (API REST), `REVENUECAT_WEBHOOK_AUTH`,
  `REVENUECAT_ENV`. Sem elas: `status.iap: false`, webhook responde 503.
- Testes (`packages/backend/test/`): webhook repetido, compra sem pedido vira crédito, pedido
  fechado pelo `sync` antes do webhook, reembolso tira o item, assinatura espelhada, ambiente
  errado ignorado, autorização inválida recusada.

### Contas e cadastros (fora do código, feito pelos donos da conta)

- App Store Connect: contrato de apps pagos, dados bancários e fiscais; criar os produtos das
  faixas (consumíveis) e do Plus (grupo de assinatura); a primeira compra no app vai para
  revisão junto com uma versão do app (confirmar); inscrição no **Small Business Program**.
- Google Play Console: perfil de pagamentos, produtos, conta de serviço para o RevenueCat.
- RevenueCat: projeto, apps iOS e Android, credenciais das lojas, entitlement `plus`, offering,
  webhook (produção e sandbox), notificações de servidor das lojas, regra de restauração.
- Testes: sandbox da Apple e TestFlight; testadores de licença no Google Play.
- Custo do RevenueCat: grátis até um teto de receita mensal, depois uma porcentagem (li 1% acima
  de US$ 2,5 mil/mês em fonte de terceiros; confirmar na página de preços).

### Custos e regras da Apple no Brasil

Desde junho de 2026 (acordo com o CADE, iOS 26.5+) a Apple permite, na loja brasileira, outro
processador dentro do app e link para a web. Para o Grimo **isso não muda a decisão de usar
IAP**: as alternativas ainda pagam comissão (21% com outro processador no app; 15% por link para
a web), exigem oferecer IAP ao lado com o mesmo destaque, relatório mensal à Apple, e link para
a web **não pode ser mostrado a menores de 18** (o app é 16+). Comissão do IAP segundo a página
da Apple: 21% + 5% de processamento, ou 10% + 5% no Small Business Program (a soma é leitura
minha das duas taxas; confirmar no contrato).

Consequência prática: no app iOS, **nada de link ou texto mandando comprar na web**; a web e o
app são dois caminhos que não se citam.

## Jurídico e LGPD

- Reembolso: compra online tem direito de arrependimento de 7 dias (CDC art. 49). Na web,
  pelo Stripe; nas lojas, o pedido é feito à Apple/Google e chega por notificação. A Política e
  os Termos explicam os dois caminhos.
- Vender muda os Termos: subir `TERMS_VERSION`. Apple, Google e RevenueCat (que recebe só o id anônimo e os dados da compra) entram como
  operadores na
  Política (`privacy.tsx`) e em `docs/legal/ropa.md`.
- `account.exportData` e `account.purge` passam a cobrir `users.iapAccountToken` e os campos
  novos; `purchases` continua ficando sem o leitor (registro de venda).
- Revisar com o `docs/legal/README.md` as regras para 16 e 17 anos comprando.

## Ordem de entrega

Cada fase termina com `pnpm check` verde, testes em `packages/backend/test/`, seed atualizado
e conferência do cold start pelo cache.

1. **Catálogo no banco + papéis + loja web (Stripe).** `UNLOCKABLES`, `PRICE_TIERS`,
   `shopItems`, `shop.ts`, papel `merchant`, `/loja`, `/admin/loja`, checkout lendo do banco,
   migração das tabelas para `source`.
2. **Trava e estilo efetivo.** `canUse` em `setStyle`, fallback ao padrão, chave desconhecida,
   "ver na lojinha" no perfil. Primeiros cosméticos pagos de verdade (6 a 10 itens e uma
   coleção).
3. **Mobile: vitrine e uso.** Tela `loja`, cadeado no `customize-sheet`, "usar na estante".
   Sem compra ainda.
4. **Compra no app (iOS), itens.** RevenueCat: SDK, identidade, `shop.startOrder`,
   `/revenuecat/webhook`, `iap.sync`, crédito de faixa, produtos das faixas, sandbox e submissão
   (valida a decisão das faixas).
5. **Compra no app (iOS), Grimo Plus.** Entitlement `plus`, espelho em `subscriptions`, uma
   assinatura por conta, aviso na exclusão de conta.
6. **Android.** Mesmos produtos e o mesmo webhook, com as credenciais do Google Play no
   RevenueCat.

## Decisões em aberto

- Valores das faixas e do Plus (hoje são provisórios em `PLUS_PLAN`).
- Preço no mobile igual ao da web ou maior para cobrir a comissão.
- Quais cosméticos entram como "incluso no Plus".
- Android junto com o iOS ou depois.
- Corte final do que é grátis e pago na estante.

## Pesquisa (novembro de 2026)

Confirmado em fonte primária:

- Guia do Expo lista `react-native-purchases` (primeiro) e `expo-iap`; ambos exigem development
  build: <https://docs.expo.dev/guides/in-app-purchases/>
- RevenueCat no Expo (SDK 54+, sem config plugin, `configure`, `logIn`, `getCustomerInfo`):
  <https://www.revenuecat.com/docs/getting-started/installation/expo>
- Webhooks do RevenueCat (autorização, HMAC, repetição, 200 em até 60 s, entrega repetida,
  recomendação de consultar `GET /subscribers`):
  <https://www.revenuecat.com/docs/integrations/webhooks>
- Tipos e campos dos eventos (`NON_RENEWING_PURCHASE`, `CANCELLATION` e `cancel_reason`,
  `store`, `environment`, `transaction_id`):
  <https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields>
- App User ID (UUID recomendado, até 100 caracteres, regras de fusão no `logIn`):
  <https://www.revenuecat.com/docs/customers/identifying-customers>
- Consumíveis e entitlements, resgate controlado fora do RevenueCat:
  <https://www.revenuecat.com/docs/platform-resources/non-subscriptions>
- Regras e taxas da Apple no Brasil:
  <https://www.apple.com/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/>,
  <https://developer.apple.com/support/app-distribution-in-brazil>,
  <https://developer.apple.com/support/payment-options-on-the-app-store-in-brazil/>

Não confirmado (conferir antes de implementar):

- Assinaturas exatas no SDK de `getProducts` para não assinatura, `purchaseStoreProduct`,
  `purchasePackage`, `getOfferings` e `restorePurchases` (as páginas lidas só citam parte).
- Formato da resposta de `GET /subscribers` para compras avulsas, e o endpoint que apaga um
  cliente.
- Nome da opção de restauração que mantém a compra na conta original.
- Se os eventos do webhook podem chegar fora de ordem (a documentação só fala de repetição).
- Preço atual do RevenueCat.
- Regras de revisão da Apple por produto e se a primeira compra no app precisa ir com uma
  versão do app.
- Aceitação, pela revisão da Apple, de produto consumível por faixa de preço.
