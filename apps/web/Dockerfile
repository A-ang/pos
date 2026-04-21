FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG PORT=3000
ARG BASE_PATH=/

ENV PORT=${PORT}
ENV BASE_PATH=${BASE_PATH}
ENV CI=true

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY lib/api-client-react ./lib/api-client-react
COPY lib/api-zod ./lib/api-zod
COPY attached_assets ./attached_assets

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/pos-rental exec vite build --config vite.config.ts

FROM nginx:1.27-alpine

COPY --from=builder /app/apps/web/dist/public /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
