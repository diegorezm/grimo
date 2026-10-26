# Por que as medidas de idade e moderação são proporcionais

Registro interno (ECA Digital, Lei 15.211/2025, art. 24 §1º: medidas "adequadas e proporcionais";
LGPD art. 6º III: minimização). Revise quando a ANPD publicar os padrões técnicos de verificação
de idade ou quando o Grimo crescer.

## Contexto

- Rede social de leitura, gratuita, sem publicidade, sem venda de dados e sem conteúdo
  impróprio para menores por natureza.
- Mantida por uma pessoa física, sem receita; base de usuários pequena.
- Público provável: adultos e adolescentes leitores.

## Decisões

1. **Idade mínima de 16 anos.** Evita a obrigação de vincular contas de menores de 16 a um
   responsável (art. 24), que exigiria supervisão parental que não temos como oferecer com
   segurança.
2. **Declaração da data de nascimento no cadastro**, guardando só "16+" e a data da
   confirmação. Uma declaração falsa não é desfeita tentando de novo: a conta marcada como menor
   fica bloqueada e só pode ser excluída.
3. **Indícios de menoridade**: denúncia "Parece ter menos de 16 anos" no perfil; a análise pode
   suspender a conta (`moderation:suspend`), com contestação por email (art. 24 §4º).
4. **Sem verificação documental ou biométrica** por enquanto: custaria caro, criaria dado
   sensível (biometria) e trataria mais dados de todos os usuários do que o risco justifica.
5. **Aprimoramento contínuo**: avaliar os sinais de idade das lojas (Apple Declared Age Range,
   Google Play Age Signals) quando o app estiver publicado, e revisar ao sair a regulamentação.

## Moderação

- Denúncia de post, comentário e perfil dentro do app, com cópia do conteúdo guardada.
- Bloqueio de usuários (atende também a App Store, guideline 1.2).
- Fila revisada no painel do Convex (veja "Moderação" em [README.md](README.md)).
