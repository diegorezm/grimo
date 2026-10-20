import { LEGAL_INFO, MIN_AGE, TERMS_VERSION } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { LegalPage, List, Mail, Section } from "./legal-page";

/**
 * Terms of Use. Changing something readers must agree to again? Bump `TERMS_VERSION` in
 * @grimo/core (docs/legal/README.md).
 */
export function TermsPage() {
  const { contactEmail, controllerName, forum } = LEGAL_INFO;
  return (
    <LegalPage
      title="Termos de Uso"
      version={TERMS_VERSION}
      intro={
        <p>
          Estes termos são o acordo entre você e o Grimo. Eles dizem o que você pode esperar da
          gente e o que esperamos de você. Escrevemos do jeito mais direto possível; se algo não
          ficar claro, fale com a gente em <Mail email={contactEmail} />.
        </p>
      }
    >
      <Section title="1. Quem somos e o aceite">
        <p>
          O Grimo é mantido por {controllerName}, pessoa física, no Brasil (“Grimo”, “nós”). Ao
          criar uma conta e marcar que concorda, você aceita estes Termos e declara ter lido a{" "}
          <Link to="/privacidade" className="text-accent underline underline-offset-4">
            Política de Privacidade
          </Link>
          . Se não concordar, não use o serviço.
        </p>
      </Section>

      <Section title="2. O serviço">
        <p>
          O Grimo é uma rede social para leitores: você registra o que está lendo, organiza
          estantes, marca páginas, escreve resenhas e notas, segue outros leitores e compartilha
          resumos da sua leitura. O uso é gratuito.
        </p>
        <p>
          Os dados de livros (títulos, autores, capas) vêm do Open Library, um catálogo aberto
          mantido pelo Internet Archive, e podem ter erros que não controlamos. Podemos mudar,
          melhorar ou encerrar funcionalidades; mudanças relevantes serão avisadas no app.
        </p>
      </Section>

      <Section title={`3. Idade mínima: ${MIN_AGE} anos`}>
        <p>
          O Grimo é só para pessoas com {MIN_AGE} anos ou mais. No cadastro pedimos sua data de
          nascimento e guardamos apenas a confirmação de que você tem a idade mínima (não a data).
          Se soubermos ou houver indícios fundados de que uma conta pertence a alguém com menos de{" "}
          {MIN_AGE} anos, ela pode ser suspensa e excluída. Quem quiser contestar pode escrever para{" "}
          <Mail email={contactEmail} />.
        </p>
      </Section>

      <Section title="4. Sua conta">
        <List>
          <li>Use informações verdadeiras e mantenha uma conta por pessoa.</li>
          <li>
            Guarde sua senha com cuidado: o que acontecer na sua conta é responsabilidade sua, salvo
            falha nossa.
          </li>
          <li>
            Seu @ precisa ser único e não pode se passar por outra pessoa, marca ou instituição.
          </li>
          <li>
            Você pode excluir sua conta quando quiser, nas configurações do app (veja{" "}
            <Link to="/excluir-conta" className="text-accent underline underline-offset-4">
              como excluir
            </Link>
            ).
          </li>
        </List>
      </Section>

      <Section title="5. O que você publica">
        <p>
          Resenhas, notas, comentários, estantes e o seu perfil continuam sendo seus. Para que o
          Grimo funcione, você nos dá uma licença gratuita, não exclusiva e mundial para guardar,
          exibir, adaptar ao formato das telas e distribuir esse conteúdo dentro do serviço (por
          exemplo, no feed de quem segue você e no seu perfil público). A licença termina quando
          você apaga o conteúdo ou a conta, exceto por cópias que precisemos manter por obrigação
          legal ou como registro de uma denúncia.
        </p>
        <p>
          <strong>Seu perfil e o que você publica são públicos</strong>: qualquer pessoa, mesmo sem
          conta, pode ver seu nome, @, foto, bio, livros, resenhas, notas, comentários e quem você
          segue. Não publique nada que não queira mostrar a todos.
        </p>
      </Section>

      <Section title="6. Regras de convivência">
        <p>Não é permitido usar o Grimo para:</p>
        <List>
          <li>publicar conteúdo ilegal ou que incentive crimes;</li>
          <li>
            assediar, ameaçar, humilhar ou discriminar pessoas (raça, etnia, religião, gênero,
            orientação sexual, deficiência, origem ou qualquer outra característica);
          </li>
          <li>publicar conteúdo sexual explícito, violento ou que explore menores de idade;</li>
          <li>fazer spam, golpes, propaganda enganosa ou correntes;</li>
          <li>se passar por outra pessoa ou expor dados pessoais de terceiros sem autorização;</li>
          <li>
            copiar obras protegidas: citar trechos curtos de um livro numa resenha é permitido;
            reproduzir capítulos ou obras inteiras não é;
          </li>
          <li>
            revelar o final ou reviravoltas de um livro sem marcar a publicação como “contém
            spoilers”;
          </li>
          <li>
            coletar dados de outros usuários de forma automatizada, sobrecarregar ou tentar burlar a
            segurança do serviço.
          </li>
        </List>
      </Section>

      <Section title="7. Denúncias, bloqueios e moderação">
        <p>
          Você pode denunciar posts, comentários e perfis pelo próprio app e bloquear leitores: quem
          você bloqueia deixa de seguir você e não vê nem interage com o que você publica, e
          vice-versa. Também é possível denunciar por <Mail email={contactEmail} />.
        </p>
        <p>
          Analisamos as denúncias e podemos remover conteúdo, limitar ou suspender contas que violem
          estes Termos ou a lei, guardando o registro da denúncia e do que foi feito. Quando
          possível e seguro, avisamos a pessoa afetada e explicamos o motivo; quem discordar pode
          pedir revisão pelo mesmo email.
        </p>
      </Section>

      <Section title="8. Direitos autorais e marcas">
        <p>
          O nome Grimo, a marca e o visual do app são nossos. Capas, títulos e descrições de livros
          pertencem aos seus titulares e são exibidos a partir do Open Library apenas para
          identificar as obras. Se você acredita que algum conteúdo no Grimo viola um direito seu,
          escreva para <Mail email={contactEmail} /> indicando o conteúdo (link) e o direito
          violado: analisaremos e responderemos.
        </p>
      </Section>

      <Section title="9. Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos de forma grave ou repetida,
          ou quando a lei exigir. Você pode encerrar sua conta a qualquer momento, excluindo-a no
          app.
        </p>
      </Section>

      <Section title="10. Responsabilidades">
        <p>
          Fazemos o possível para manter o Grimo funcionando e seguro, mas ele é oferecido como
          está: pode ter falhas, ficar fora do ar ou perder funcionalidades. Cada pessoa responde
          pelo que publica. Respondemos por conteúdo de terceiros nos limites do Marco Civil da
          Internet e da legislação aplicável. Nada nestes Termos limita os direitos que o Código de
          Defesa do Consumidor e a LGPD garantem a você.
        </p>
      </Section>

      <Section title="11. Mudanças nestes Termos">
        <p>
          Se mudarmos algo importante, avisaremos no app e pediremos que você aceite a nova versão
          antes de continuar. A data no topo desta página indica a versão em vigor.
        </p>
      </Section>

      <Section title="12. Lei aplicável e foro">
        <p>
          Estes Termos seguem as leis brasileiras. Fica eleito o foro da comarca de {forum}, sem
          prejuízo do direito de você, como consumidor, propor ações no foro do seu domicílio.
        </p>
      </Section>

      <Section title="13. Contato">
        <p>
          Dúvidas, pedidos ou reclamações: <Mail email={contactEmail} />.
        </p>
      </Section>
    </LegalPage>
  );
}
