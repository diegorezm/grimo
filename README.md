<p align="center">
  <img src="apps/web/public/icon-192.png" width="96" alt="Grimo" />
</p>

<h1 align="center">Grimo</h1>

<p align="center">
  <strong>Uma rede social pequena e bonita para quem lê.</strong><br />
  Anote o que está lendo, organize suas estantes e veja o que seus amigos estão lendo.
</p>

<p align="center">
  <img src="apps/web/public/og.png" width="720" alt="Grimo" />
</p>

## Por que o Grimo?

A maioria dos apps de leitura é um catálogo gigante ou uma planilha de estatísticas. O Grimo é o
contrário: **simples, bonito e pessoal**. Abre rápido, funciona sem internet e não tem anúncio.

## O que dá para fazer

- 📚 **Estantes**: Quero ler, Lendo, Lidos e Abandonei.
- 📖 **Marcar a página**: "estou na 142 de 320" e o Grimo acompanha seu ritmo.
- ✍️ **Resenhas e notas**: de uma frase a um texto longo, com nota de 1 a 5.
- 👥 **Seguir leitores**: um feed com o que seus amigos leram, terminaram e acharam.
- 🎯 **Meta do ano**: "12 livros em 2026", com o progresso sempre à vista.
- 🗓️ **Resumo do mês**: um card pronto para postar nos Stories.
- 🤝 **Juntos**: leia o mesmo livro com um grupo, convite por link.
- 📥 **Importar do Goodreads**: traga suas estantes com o CSV de exportação.

## Como é usar

> **Rafa** terminou *O Senhor dos Anéis* ★★★★★
> "Demorei três meses, valeu cada página."
>
> **Bia** começou *Torto Arado* · página 12 de 264
>
> **Você** · 9 de 12 livros em 2026

Um dia típico: você abre o app, marca que chegou na página 180, curte a resenha de um amigo e
fecha. Leva dez segundos.

## Rodar no seu computador

Precisa de **Node 22+** e **pnpm**.

```bash
pnpm install
pnpm dev:backend   # na primeira vez, cria o backend (Convex) e pede login
```

Em outro terminal, uma vez só:

```bash
cd packages/backend
npx convex env set SITE_URL http://localhost:5173
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

Pronto. A partir daí:

```bash
pnpm dev    # abre em http://localhost:5173
pnpm seed   # cria leitores de exemplo
```

Entre com **`rafa@grimo.test`** e senha **`grimo-demo`** para ver o app cheio de dados.

Quer o app de celular, login com Google, emails ou fazer deploy? Está tudo no
[AGENTS.md](AGENTS.md#setup-e-deploy).

## Contribuir

1. Leia o [AGENTS.md](AGENTS.md) (como o código é organizado).
2. Rode `pnpm check` antes de abrir o PR.
3. Ideias e o que vem por aí: [roadmap](docs/roadmap.md) · [o que já existe](docs/features.md) ·
   [melhorias](docs/melhorias.md).

## Licença

[AGPL-3.0](LICENSE): pode usar, mudar e redistribuir, inclusive comercialmente, desde que o código
de qualquer versão modificada (mesmo hospedada como serviço) fique aberto sob a mesma licença.
O nome "Grimo" e a identidade visual não fazem parte da licença.
