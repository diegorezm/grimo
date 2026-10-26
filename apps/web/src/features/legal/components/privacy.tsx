import { LEGAL_INFO, MIN_AGE, PRIVACY_VERSION } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LegalPage, List, Mail, Section } from "./legal-page";
import { COOKIE_NOTICE_KEY } from "./storage-notice";

/**
 * Privacy Policy (LGPD art. 9). Keep it true to the code: what is stored, who receives it, for
 * how long. Material changes bump `PRIVACY_VERSION` in @grimo/core (docs/legal/README.md).
 */
export function PrivacyPage() {
  const { contactEmail, controllerName } = LEGAL_INFO;
  return (
    <LegalPage
      title="Política de Privacidade"
      version={PRIVACY_VERSION}
      intro={
        <p>
          Esta política explica quais dados pessoais o Grimo usa, por quê, com quem eles são
          compartilhados e como você controla tudo isso, conforme a Lei Geral de Proteção de Dados
          (LGPD, Lei 13.709/2018). Resumo: usamos só o necessário para o app funcionar, não vendemos
          dados e não usamos rastreadores de publicidade.
        </p>
      }
    >
      <Section title="1. Quem é o responsável">
        <p>
          O controlador dos seus dados é {controllerName}, pessoa física, responsável pelo Grimo. O
          encarregado pelo tratamento de dados (DPO) é a mesma pessoa. Para qualquer assunto de
          privacidade, escreva para <Mail email={contactEmail} />.
        </p>
      </Section>

      <Section title="2. Que dados usamos">
        <List>
          <li>
            <strong>Conta:</strong> email, senha (guardada só como hash, nunca em texto), nome, @ e,
            se você entrar com Google ou Apple, o nome, email e foto que esses serviços nos enviam.
          </li>
          <li>
            <strong>Idade:</strong> no cadastro você informa a data de nascimento; guardamos apenas
            a data em que você confirmou ter {MIN_AGE} anos ou mais, não a data de nascimento.
          </li>
          <li>
            <strong>Perfil:</strong> foto, bio, gêneros favoritos, meta de leitura e o fuso horário
            do seu aparelho (para contar seus meses e anos de leitura).
          </li>
          <li>
            <strong>Leitura:</strong> livros nas suas estantes, páginas marcadas, avaliações, datas
            de início e fim.
          </li>
          <li>
            <strong>Social:</strong> resenhas, notas, comentários, curtidas, quem você segue,
            bloqueios e denúncias que você faz.
          </li>
          <li>
            <strong>Aceites:</strong> versão e data em que você aceitou os Termos e esta Política, e
            se foi pela web ou pelo app.
          </li>
          <li>
            <strong>Dados técnicos:</strong> ao entrar, o sistema de login registra o endereço IP e
            o navegador/aparelho da sessão, para manter você conectado e proteger a conta.
          </li>
        </List>
        <p>Não usamos dados sensíveis (saúde, religião, biometria etc.) nem localização.</p>
      </Section>

      <Section title="3. Para que usamos e com qual base legal">
        <Table
          rows={[
            [
              "Criar e manter sua conta, mostrar seu perfil, estantes, feed e estatísticas",
              "Execução do contrato (os Termos de Uso), art. 7º, V",
            ],
            [
              "Verificar a idade mínima de 16 anos",
              "Cumprimento de obrigação legal (ECA Digital, Lei 15.211/2025), art. 7º, II",
            ],
            [
              "Segurança da conta, prevenção de fraudes e abusos, moderação de denúncias",
              "Legítimo interesse (art. 7º, IX) e cumprimento de obrigação legal",
            ],
            [
              "Guardar o registro dos aceites e das denúncias",
              "Exercício regular de direitos (art. 7º, VI)",
            ],
          ]}
        />
        <p>
          Não usamos seus dados para publicidade, não traçamos perfil comportamental para fins
          comerciais e não vendemos dados.
        </p>
      </Section>

      <Section title="4. O que é público">
        <p>
          O Grimo é uma rede social aberta. <strong>Qualquer pessoa, mesmo sem conta</strong>, pode
          ver seu nome, @, foto, bio, gêneros favoritos, livros que você está lendo e já leu,
          avaliações, resenhas, notas, comentários, quem você segue e quem segue você, e suas
          estatísticas de leitura. Seu email e os dados técnicos nunca são públicos.
        </p>
      </Section>

      <Section title="5. Com quem compartilhamos">
        <p>Só com quem precisamos para o serviço funcionar:</p>
        <List>
          <li>
            <strong>Convex</strong> (Convex, Inc., Estados Unidos): hospeda o banco de dados e o
            servidor do Grimo; todos os dados da conta ficam lá.
          </li>
          <li>
            <strong>Provedor de hospedagem do site</strong>: entrega as páginas do Grimo e recebe,
            como qualquer site, o seu IP ao acessá-las.
          </li>
          <li>
            <strong>Google e Apple</strong>: apenas se você escolher entrar com eles. Eles confirmam
            sua identidade e nos enviam nome, email e foto.
          </li>
          <li>
            <strong>Open Library</strong> (Internet Archive, Estados Unidos): as buscas de livros
            são feitas pelo nosso servidor, sem dados seus. As capas são carregadas pelo seu
            navegador direto de covers.openlibrary.org, que recebe seu IP como qualquer site.
          </li>
          <li>
            <strong>Autoridades</strong>: quando houver ordem judicial ou obrigação legal.
          </li>
        </List>
      </Section>

      <Section title="6. Transferência internacional">
        <p>
          Como o Convex e o Open Library ficam nos Estados Unidos, seus dados são tratados fora do
          Brasil. Essa transferência é necessária para executar o contrato com você (art. 33, IX, da
          LGPD) e se apoia nas garantias contratuais e de segurança desses fornecedores.
        </p>
      </Section>

      <Section title="7. Cookies e armazenamento no aparelho">
        <span id="armazenamento" className="-mt-24 block pt-24" />
        <p>
          O Grimo <strong>não usa cookies de publicidade, analytics ou rastreamento</strong>. Usa
          apenas armazenamento estritamente necessário para funcionar, no seu próprio navegador ou
          aparelho:
        </p>
        <Table
          head={["O quê", "Para quê", "Por quanto tempo"]}
          rows={[
            [
              "better-auth_cookie e better-auth_session_data (web) / SecureStore (app)",
              "Manter você conectado",
              "Até você sair",
            ],
            [
              "grimo.cache.* (web) / MMKV (app)",
              "Abrir as telas na hora e funcionar sem internet",
              "Até 7 dias; apagado ao sair",
            ],
            ["grimo.theme", "Lembrar o tema claro/escuro", "Até você mudar"],
            [COOKIE_NOTICE_KEY, "Lembrar que você viu o aviso de cookies", "Permanente"],
          ]}
        />
        <p>
          Como são indispensáveis, esses itens não dependem de consentimento (base: legítimo
          interesse e execução do contrato), mas você pode apagá-los nas configurações do navegador;
          nesse caso, precisará entrar de novo. Se um dia usarmos algo não essencial, pediremos sua
          permissão antes.
        </p>
      </Section>

      <Section title="8. Por quanto tempo guardamos">
        <List>
          <li>Enquanto sua conta existir.</li>
          <li>
            Ao excluir a conta, apagamos perfil, estantes, leituras, resenhas, notas, comentários,
            curtidas, seguidores, bloqueios e aceites em poucos minutos. Cópias de segurança
            mantidas pelo provedor podem guardar esses dados por um período limitado, até serem
            substituídas.
          </li>
          <li>
            Denúncias feitas sobre você ou seu conteúdo são mantidas como registro de moderação pelo
            tempo necessário para cumprir a lei ou defender direitos; as denúncias que você fez
            continuam existindo, mas sem identificar você.
          </li>
        </List>
      </Section>

      <Section title={`9. Menores de ${MIN_AGE} anos`}>
        <p>
          O Grimo não é destinado a menores de {MIN_AGE} anos. Se alguém informa uma idade menor, a
          conta fica bloqueada e só pode ser excluída. Se você é responsável por um menor que criou
          uma conta, escreva para <Mail email={contactEmail} /> e a excluiremos.
        </p>
      </Section>

      <Section title="10. Seus direitos">
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <List>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos ou errados (pelo “Editar perfil”);</li>
          <li>
            receber uma cópia dos seus dados em formato aberto (portabilidade): “Baixar meus dados”
            nas configurações da conta;
          </li>
          <li>
            excluir sua conta e seus dados: “Excluir conta” nas configurações (veja{" "}
            <Link to="/excluir-conta" className="text-accent underline underline-offset-4">
              como excluir
            </Link>
            );
          </li>
          <li>
            saber com quem compartilhamos, pedir anonimização ou bloqueio de dados desnecessários,
            se opor a um tratamento e revisar decisões;
          </li>
          <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </List>
        <p>
          O que não estiver disponível no app, peça por <Mail email={contactEmail} />. Respondemos
          em até 15 dias.
        </p>
      </Section>

      <Section title="11. Segurança">
        <p>
          Senhas são guardadas com hash, a comunicação é criptografada (HTTPS) e o acesso aos dados
          é restrito. Se houver um incidente de segurança que possa causar risco ou dano relevante,
          avisaremos você e a ANPD, como manda a lei.
        </p>
      </Section>

      <Section title="12. Mudanças nesta política">
        <p>
          Quando houver mudança relevante, avisaremos no app e pediremos que você leia e aceite a
          nova versão. A data no topo indica a versão em vigor.
        </p>
      </Section>
    </LegalPage>
  );
}

function Table({ head, rows }: { head?: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        {head && (
          <thead className="bg-surface-muted font-mono text-[11px] uppercase tracking-wider text-text-muted">
            <tr>
              {head.map((cell) => (
                <th key={cell} className="px-3 py-2 font-medium">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border first:border-t-0 align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
