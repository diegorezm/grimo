# Self-hosted Grimo: API + web in one container, data (SQLite + uploads) in /data.
# Build: docker build -t grimo .   Run: see docker-compose.yml and docs/self-hosting.md

FROM node:24-slim AS build
WORKDIR /repo
RUN npm install -g pnpm@12.5.1
COPY . .
RUN pnpm install --frozen-lockfile --filter "@grimo/server..." --filter "@grimo/web..."
RUN pnpm --filter @grimo/web build:static && pnpm --filter @grimo/server build

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data
WORKDIR /app
COPY --from=build /repo/apps/server/dist ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /repo/apps/web/dist/static ./public
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "index.mjs"]
