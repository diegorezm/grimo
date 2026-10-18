# Self-hosting do Grimo

Rodar o seu próprio Grimo é um caso de uso de primeira classe. A instância self-hosted roda **o mesmo
código** da instância oficial: mesma API, mesmas migrações, mesmo app web e mobile.

## Escolha um modo

| Modo        | Para quem                                       | Comportamento                                                                 |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `personal`  | Você quer um diário de leitura só seu           | Uma conta. O cadastro fecha depois dela. Sem seguir pessoas; o feed vira "Diário". |
| `community` | Família, amigos, clube do livro, sua comunidade | Rede social completa. O cadastro segue `GRIMO_REGISTRATION` (`open`/`closed`). |

O padrão do `docker-compose.yml` é `personal`.

## Docker (recomendado)

Requisitos: Docker com Compose. Funciona em x86_64 e ARM64 (Raspberry Pi 4/5, Macs M1+).

```bash
mkdir grimo && cd grimo
curl -O https://raw.githubusercontent.com/diegorezm/grimo/main/docker-compose.yml
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d
```

Abra `http://localhost:3000` e crie a sua conta. No modo `personal`, ela é a única.

Para compilar a imagem a partir do código em vez de baixar a publicada:

```bash
git clone https://github.com/diegorezm/grimo && cd grimo
docker compose up -d --build
```

## Variáveis

Valem para o Docker (`.env` ou `environment:`) e para a Cloudflare (`vars` no `wrangler.jsonc`).

| Variável              | Padrão                   | Descrição                                                                   |
| --------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`  | (obrigatória)            | Segredo da sessão, com 32+ caracteres. `openssl rand -base64 32`. Não troque depois. |
| `GRIMO_URL`           | `http://localhost:3000`  | URL pública do seu Grimo (no compose vira `BETTER_AUTH_URL`).               |
| `GRIMO_MODE`          | `personal` (compose)     | `personal` ou `community`.                                                  |
| `GRIMO_REGISTRATION`  | `closed` (compose)       | Só no modo `community`: `open` ou `closed`.                                 |
| `GRIMO_INSTANCE_NAME` | `Grimo`                  | Nome exibido no app.                                                        |
| `TRUSTED_ORIGINS`     | `grimo://`               | Origens extras permitidas, separadas por vírgula (outro domínio web, o app mobile). |

Só no servidor Node/Docker:

| Variável              | Padrão                     | Descrição                                             |
| --------------------- | -------------------------- | ----------------------------------------------------- |
| `PORT`                | `3000`                     | Porta HTTP.                                           |
| `DATA_DIR`            | `/data`                    | Onde ficam o banco e os uploads.                      |
| `DATABASE_URL`        | `file:$DATA_DIR/grimo.db`  | Outro arquivo SQLite ou um libSQL/Turso remoto.       |
| `DATABASE_AUTH_TOKEN` | —                          | Token do libSQL remoto.                               |

## HTTPS e domínio

O container fala HTTP na porta 3000. Coloque um proxy reverso na frente, por exemplo o
[Caddy](https://caddyserver.com), que gera o certificado sozinho:

```
grimo.seudominio.com {
  reverse_proxy localhost:3000
}
```

Depois defina `GRIMO_URL=https://grimo.seudominio.com` no `.env` e rode `docker compose up -d`.

## App mobile

Na tela de login, toque em **Servidor → Trocar** e informe o endereço do seu Grimo
(ex. `grimo.seudominio.com`). O app guarda uma sessão por servidor.

O seu servidor precisa estar acessível pelo celular: na mesma rede (IP local) ou pela internet
(domínio com HTTPS).

## Backup

Tudo fica no volume `grimo-data`: `grimo.db` (SQLite) e `media/` (uploads).

```bash
docker compose stop
docker run --rm -v grimo_grimo-data:/data -v "$PWD":/backup alpine tar czf /backup/grimo-backup.tgz -C /data .
docker compose start
```

## Atualizar

```bash
docker compose pull && docker compose up -d
```

As migrações do banco rodam sozinhas na inicialização.

## Self-host na Cloudflare

Também dá para rodar o Grimo na **sua** conta da Cloudflare (o plano gratuito basta para uso pessoal),
sem servidor para manter. Veja [Deploy na Cloudflare](../README.md#deploy-na-cloudflare-instância-oficial-ou-self-host-na-sua-conta)
e defina `GRIMO_MODE=personal` em `apps/api/wrangler.jsonc`.
