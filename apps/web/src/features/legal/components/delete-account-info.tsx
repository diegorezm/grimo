import { LEGAL_INFO } from "@grimo/core";
import { LegalPage, List, Mail, Section } from "./legal-page";

/**
 * Public "how to delete your account" page (required by Google Play, useful for everyone).
 * Keep the steps in sync with the settings screens of web and mobile.
 */
export function DeleteAccountInfoPage() {
  const { contactEmail } = LEGAL_INFO;
  return (
    <LegalPage
      title="Excluir sua conta"
      intro={
        <p>
          Você pode excluir sua conta do Grimo a qualquer momento, sem precisar falar com ninguém. A
          exclusão é definitiva.
        </p>
      }
    >
      <Section title="No site">
        <List>
          <li>Entre na sua conta e abra seu Perfil.</li>
          <li>Toque em “Conta e privacidade”.</li>
          <li>Em “Excluir conta”, digite seu @ e, se entrar com email, sua senha.</li>
        </List>
      </Section>
      <Section title="No app (iPhone e Android)">
        <List>
          <li>Abra a aba Perfil e toque em “Conta e privacidade”.</li>
          <li>Toque em “Excluir conta” e confirme.</li>
        </List>
        <p>
          Se você entrou com Google ou Apple há mais de um dia, o app pede que você saia e entre de
          novo antes de excluir, para confirmar que é você.
        </p>
      </Section>
      <Section title="O que é apagado">
        <p>
          Perfil, estantes, páginas marcadas, metas, resenhas, notas, comentários, curtidas,
          seguidores, bloqueios e aceites dos termos são apagados em poucos minutos, e seu @ fica
          livre. Denúncias feitas sobre o seu conteúdo são mantidas como registro de moderação, como
          explica a Política de Privacidade.
        </p>
        <p>Quer uma cópia antes? Use “Baixar meus dados” na mesma tela.</p>
      </Section>
      <Section title="Sem acesso à conta?">
        <p>
          Escreva para <Mail email={contactEmail} /> a partir do email da conta pedindo a exclusão.
          Respondemos em até 15 dias.
        </p>
      </Section>
    </LegalPage>
  );
}
