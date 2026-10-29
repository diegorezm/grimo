# Registro das operações de tratamento (LGPD art. 37)

Versão simplificada para agente de tratamento de pequeno porte (Res. CD/ANPD 2/2022).
Atualize quando surgir um dado, finalidade ou fornecedor novo, e ajuste a Política de Privacidade
(`apps/web/src/features/legal/components/privacy.tsx`) junto.

Controlador e encarregado: veja "Dados do controlador" em [README.md](README.md).

| Operação | Dados | Titulares | Finalidade | Base legal | Onde fica | Retenção |
| --- | --- | --- | --- | --- | --- | --- |
| Conta e login | email, hash da senha, nome, foto (Google/Apple), sessões (IP, user agent) | usuários | criar e manter a conta, autenticar | execução de contrato (art. 7º V) | Convex (componente Better Auth) | até excluir a conta; sessões até expirar |
| Idade | só a data da confirmação de 16+ (`users.ageConfirmedAt`) ou da recusa (`ageRejectedAt`) | usuários | cumprir a idade mínima (ECA Digital) | obrigação legal (art. 7º II) | Convex `users` | até excluir a conta |
| Perfil | @, nome, bio, gêneros, meta, fuso horário (`users.timeZone`, enviado pelo app para contar meses e anos de leitura) | usuários | perfil público | execução de contrato | Convex `users`, `readingGoals` | até excluir a conta |
| Leitura | estantes, páginas, avaliações, datas | usuários | estantes, estatísticas, feed | execução de contrato | Convex `shelfEntries`, `readingLogs`, `activities` | até excluir a conta |
| Conteúdo social | posts, comentários, curtidas, follows, menções e notificações | usuários | rede social | execução de contrato | Convex `posts`, `postComments`, `postLikes`, `follows`, `activities`, `notifications` | até o usuário apagar ou excluir a conta |
| Livros cadastrados à mão | título, autores, páginas, ano e quem cadastrou | usuários | catálogo de livros que o Open Library não tem (com revisão) | execução de contrato | Convex `books` (`createdBy`, `reviewStatus`) | não aprovados: até excluir a conta; aprovados ficam no catálogo, sem o autor do cadastro |
| Importação de estantes | livros do arquivo do Goodreads (título, autores, ISBN, estante, nota, data de leitura, páginas); resumo e títulos não encontrados | usuários | trazer a biblioteca de outro app | execução de contrato | Convex `imports`, `importRows` (linhas apagadas conforme são processadas) | resumo até excluir a conta |
| Juntos (leitura em grupo) | grupos em que participa, data de entrada, mensagens com o % do livro em que estava | usuários | ler em grupo, conversa sem spoiler | execução de contrato | Convex `groups`, `groupMembers`, `groupMessages` | até sair do grupo, apagar a mensagem ou excluir a conta (o último a sair apaga o grupo) |
| Bloqueios | quem bloqueou quem | usuários | segurança | legítimo interesse (art. 7º IX) | Convex `blocks` | até desbloquear ou excluir a conta |
| Denúncias | denunciante, alvo, motivo, cópia do conteúdo | usuários e terceiros | moderação, defesa | legítimo interesse; exercício regular de direitos (art. 7º VI) | Convex `reports` | mantidas após exclusão, sem o denunciante |
| Aceites | documento, versão, data, origem | usuários | prova do aceite | exercício regular de direitos | Convex `legalAcceptances` | até excluir a conta |
| Armazenamento local | sessão, cache, tema, aviso de cookies | visitantes e usuários | funcionamento | legítimo interesse / execução de contrato | navegador / aparelho | ver Política, seção 7 |

## Operadores e transferência internacional

| Fornecedor | Papel | País | Observação |
| --- | --- | --- | --- |
| Convex, Inc. | banco de dados e servidor | EUA | conferir DPA e localização do deployment de produção |
| Hospedagem da web (a definir: Cloudflare ou outro) | entrega das páginas | — | recebe IP dos visitantes |
| Google / Apple | login social (só se o usuário escolher) | EUA | controladores independentes dos próprios dados |
| Resend (a definir) | envio de email de confirmação e de recuperação de senha (só o endereço do usuário e o link) | EUA | só liga com `RESEND_API_KEY`; citar na Política (seção de terceiros) antes de ligar e conferir o DPA |
| Open Library (Internet Archive) | catálogo e capas | EUA | buscas via servidor; capas carregadas pelo navegador |

## Pendências

- [ ] Conferir o DPA do Convex e se oferece cláusulas compatíveis com a Res. CD/ANPD 19/2024.
- [ ] Definir e registrar o provedor de hospedagem da web.
