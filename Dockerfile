# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
RUN npm install --global pnpm@10.33.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz', {signal: AbortSignal.timeout(4000)}).then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
