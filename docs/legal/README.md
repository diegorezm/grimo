# Conformidade legal (LGPD, ECA Digital, Marco Civil, App Store)

Fonte de verdade das decisões e do plano para o Grimo operar sem risco jurídico evitável.
Leia antes de mexer em cadastro, dados pessoais, conteúdo de usuário ou publicação nas lojas.

> Este documento não é parecer jurídico. Os textos legais devem passar por uma revisão pontual
> de advogado antes do lançamento.

## Decisões

| Decisão | Motivo |
| ------- | ------ |
| **App para 16+.** Menores de 16 não podem criar conta. | O ECA Digital (Lei 15.211/2025, art. 24) exige vincular contas de menores de 16 a um responsável. Não vamos construir supervisão parental. |
| **Verificação de idade proporcional, sem custo:** data de nascimento no onboarding + denúncia "parece menor de idade" (suspensão + recurso) + sinais de idade das lojas no mobile. | A lei pede medidas "adequadas e proporcionais" e aprimoramento contínuo (art. 24 §§1º e 4º). Verificação por documento ou biometria é cara e cria dado sensível. Revisar quando a ANPD publicar os padrões técnicos (fiscalização a partir de jan/2027). |
| **Guardar só "tem 16+", não a data de nascimento.** | Minimização de dados (LGPD art. 6º III). |
| **Publicar na App Store** (e depois Play Store). | Traz requisitos próprios: veja [App Store](#app-store). |
| **Sem banner de consentimento de cookies, só aviso informativo.** | Não há analytics nem rastreadores: só armazenamento necessário (sessão, cache, tema). O guia da ANPD aceita legítimo interesse para isso, desde que haja transparência. Se entrar analytics, vira consentimento real com botão "Rejeitar" de mesmo destaque. |
| **Base legal principal: execução de contrato** (LGPD art. 7º V). | Aceitar os termos é aceitar o contrato, não "consentir" com cada tratamento. Segurança e logs usam legítimo interesse ou obrigação legal. |
| **Aceite registrado com versão.** | Prova em caso de disputa e base para pedir um novo aceite quando os termos mudarem. |

## O que o app trata hoje

- **Conta:** email, senha (hash, no Better Auth), nome, @, foto (Google), sessão (IP e user agent no Better Auth).
- **Perfil e atividade:** bio, gêneros, estantes, páginas lidas, metas, resenhas, comentários, curtidas, seguidores. Perfil e atividade são **públicos** (visíveis sem login).
- **Terceiros:**
  - Convex: banco e funções, servidores nos EUA, então há **transferência internacional**.
  - Google: login OAuth e hoje também Google Fonts, que manda o IP do visitante ao Google. **Remover**.
  - Open Library: busca pelo servidor; as capas são carregadas direto pelo navegador em `covers.openlibrary.org`.
- **Armazenamento local:** localStorage na web e MMKV/SecureStore no mobile, para sessão, cache de queries (7 dias) e tema.


## Plano de implementação

Status: `[ ]` a fazer · `[x]` feito.

### 1. Fontes no próprio app
- [x] Google Fonts trocado por `@fontsource` (importado em `apps/web/src/main.tsx`).

### 2. Documentos legais
- [x] Versões em `packages/core/src/legal/documents.ts` (`TERMS_VERSION`, `PRIVACY_VERSION`) e dados do controlador em `LEGAL_INFO`.
- [x] Rotas públicas na web: `/termos`, `/privacidade` (seção de cookies em `#armazenamento`), `/excluir-conta`. Textos em `apps/web/src/features/legal/components/`.
- [x] Links no rodapé da landing, no login, em "Conta e privacidade" (web e mobile) e no aceite. O mobile abre a web (`EXPO_PUBLIC_SITE_URL`).
- [ ] URLs cadastradas na tela de consentimento do Google OAuth e na App Store Connect (depende do domínio).

### 3. Aceite e idade
- [x] Tabela `legalAcceptances` (só inserções): `userId`, `document`, `version`, `acceptedAt`, `source`.
- [x] Onboarding (web e tela `setup` do mobile): data de nascimento + caixa desmarcada. `users.completeSetup` valida com os schemas do core, grava o aceite e `users.ageConfirmedAt`. Abaixo de 16 grava `ageRejectedAt` (conta oculta, só pode ser excluída; tentar de novo não desfaz).
- [x] Frase sob o botão de login.
- [x] `me.legal` (`needsAcceptance`, `needsAge`, `underage`): web mostra um modal sobre o app (`LegalGate`); mobile mostra a tela `legal` antes das abas. Contas antigas passam por ele (com idade).

### 4. Direitos do titular (LGPD art. 18)
- [x] **Excluir conta** em "Conta e privacidade" (web e mobile): Better Auth `/delete-user` (senha, ou sessão de menos de 24 h para Google/Apple). O trigger `onDelete` oculta o leitor na hora e `account.purge` apaga tudo em lotes, corrigindo contadores.
- [x] Página pública `/excluir-conta`.
- [x] **Baixar meus dados**: `account.exportData` (JSON; web baixa, mobile compartilha).
- [ ] Outros pedidos pelo email do encarregado (processo manual, prazo de 15 dias).

### 5. Conteúdo de usuários
- [x] **Denunciar** post e perfil (web e mobile) e comentário (API pronta; os apps ainda não mostram comentários). Tabela `reports` com cópia do conteúdo.
- [x] **Bloquear**: desfaz follows, impede seguir, curtir e comentar, e esconde conteúdo nos dois sentidos (feed, perfil, busca, sugestões, listas, comentários). Desbloquear em "Conta e privacidade" ou no perfil (web).
- [x] Moderação pelo painel do Convex (abaixo) e suspensão de conta.
- [ ] Opcional: perfil privado.

### 6. Aviso de cookies
- [x] Aviso informativo na primeira visita (`CookieNotice`, chave `grimo.cookie-notice`).

### 7. Registros e operação
- [ ] **Logs de acesso por 6 meses** (Marco Civil art. 15), adiados até haver CNPJ.
- [x] [ropa.md](ropa.md), [incidentes.md](incidentes.md), [proporcionalidade.md](proporcionalidade.md).
- [ ] Conferir o DPA do Convex e as cláusulas de transferência internacional (Res. CD/ANPD 19/2024).

## Moderação

- Painel na web (`/admin`) para admins e moderadores: fila de denúncias, livros cadastrados, suspensão com prazo (1, 7 ou 30 dias; permanente só admin) e motivo obrigatório. Admins veem também a equipe e o histórico (`moderationLog`).
- Moderador: admin convida uma conta (`/admin` → Equipe), que tem 24 h para aceitar. Sem convite, pela CLI: `npx convex run moderation:setModerator '{"username":"x","moderator":true}'`. Admin: `moderation:setAdmin`.
- Moderadores não agem sobre a equipe nem sobre si mesmos, e não veem denúncias sobre a equipe.

### Pela CLI / painel do Convex

- Fila: tabela `reports`, filtro `status = "open"` (índice `by_status_created`). `snapshot` guarda o texto denunciado.
- Remover conteúdo: `moderation:removeContent` `{ "target": "post" | "comment", "targetId": "…" }`.
- Suspender (ou reativar) uma conta: `moderation:suspend` `{ "username": "…", "suspend": true }`.
- Fechar a denúncia: `moderation:resolve` `{ "reportId": "…", "status": "actioned" | "dismissed" }`.
- Pela CLI: `npx convex run moderation:suspend '{"username":"x","suspend":true}'` (em `packages/backend`).

## App Store

Requisitos das App Review Guidelines que nos afetam:

- [ ] **Sign in with Apple** (4.8): o servidor já aceita o provider `apple` quando `APPLE_CLIENT_ID` e `APPLE_CLIENT_SECRET` estão no deployment (`auth.providers.apple`). Falta criar o Services ID/chave no Apple Developer e o botão nos apps (no iOS, `expo-apple-authentication` + `APPLE_BUNDLE_ID`).
- [x] **Excluir conta dentro do app** (5.1.1(v)).
- [x] **Conteúdo gerado por usuários** (1.2): denunciar, bloquear e contato publicado (Termos).
- [ ] **URL da política de privacidade** e rótulos "App Privacy" preenchidos conforme [O que o app trata hoje](#o-que-o-app-trata-hoje). Não há rastreamento, então não há prompt de ATT.
- [ ] **Classificação etária 16+** no questionário da App Store Connect.
- [ ] Avaliar a **Declared Age Range API** (iOS) e a **Play Age Signals API** (Android) como sinal adicional de idade.
- [ ] Conta de demonstração para o revisor (seed: já aceita os termos).
## Dados do controlador

| Item | Hoje | Futuro |
| ---- | ---- | ------ |
| Controlador | **Pessoa física** (sem CNPJ). Os logs da etapa 7 não são obrigatórios. | Ao abrir CNPJ: atualizar os textos (nova versão, novo aceite) e implementar os logs de acesso. |
| Email de contato e do encarregado | `contato.morzen@gmail.com` (**provisório**) | Trocar por `privacidade@<domínio>` ao comprar o domínio. |
| Domínio | Não comprado. Os textos usam o endereço atual do deploy. | Atualizar textos, `SITE_URL`, Google OAuth e App Store Connect. |
| Nome do controlador | **A definir.** Os textos usam o placeholder `[NOME COMPLETO DO RESPONSÁVEL]`. | Preencher antes do lançamento (LGPD art. 9º). |
| Foro | **Taubaté/SP**, "sem prejuízo do foro do domicílio do consumidor" (CDC). | Sede do CNPJ, quando houver. |

Sempre que um item mudar, suba `TERMS_VERSION`/`PRIVACY_VERSION` e atualize esta tabela.

## Pendências do responsável

- [ ] Nome completo do responsável (identificação do controlador, LGPD art. 9º): trocar o placeholder nos textos.
- [ ] **Futuro:** trocar o email provisório, comprar o domínio, avaliar CNPJ (veja a tabela acima).
- [ ] Revisão dos textos por advogado antes do lançamento.

## Referências

- LGPD, Lei 13.709/2018
- ECA Digital, Lei 15.211/2025 (vigência em 17/03/2026; Decreto 12.880/2026)
- Marco Civil da Internet, Lei 12.965/2014 (arts. 15 e 19)
- ANPD: Guia orientativo de cookies (2022); Res. CD/ANPD 2/2022 (agentes de pequeno porte), 15/2024 (incidentes), 19/2024 (transferência internacional)
- Apple App Review Guidelines 1.2, 4.8 e 5.1.1
