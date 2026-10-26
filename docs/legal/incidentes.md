# Roteiro de incidente de segurança

Base: LGPD art. 48 e Res. CD/ANPD 15/2024 (comunicação de incidente). Prazo para comunicar a
ANPD e os titulares: **3 dias úteis** a partir de quando se soube que o incidente afetou dados
pessoais e pode causar risco ou dano relevante. Agente de pequeno porte tem prazo em dobro, mas não
conte com isso.

## 1. Conter (primeiras horas)

- Revogar o que vazou: `BETTER_AUTH_SECRET` (derruba todas as sessões), chaves do Google/Apple,
  deploy key do Convex (`npx convex env set …`, painel do Convex).
- Se for bug no código: corrigir e fazer deploy; se for acesso indevido ao painel: trocar senhas e
  ativar 2FA.

## 2. Avaliar

Anote numa issue privada (com data e hora de cada passo):

- O que aconteceu, quando começou, quando foi descoberto.
- Quais dados (tabelas do Convex) e quantas contas foram afetadas.
- Há risco relevante? (senhas, emails expostos, conteúdo privado, dados de muitas pessoas…)

## 3. Comunicar (se houver risco ou dano relevante)

- **ANPD**: formulário de comunicação de incidente no site da ANPD (gov.br/anpd), em até 3 dias
  úteis, com o que se sabe; complementar depois.
- **Titulares**: email às contas afetadas, em linguagem simples: o que aconteceu, quais dados, o
  que fizemos, o que a pessoa deve fazer (ex.: trocar a senha), contato
  (`LEGAL_INFO.contactEmail`).

## 4. Registrar

Mesmo sem comunicação, guarde o registro do incidente por pelo menos 5 anos (Res. 15/2024).
