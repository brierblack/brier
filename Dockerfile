# ============================================================
# Multi-stage Dockerfile for Brier
# Stage 1: Build Frontend (React 19 + Vite + Tailwind CSS 4)
# Stage 2: Build Backend (Rust + axum, slim image + cargo cache)
# Stage 3: Runtime (debian-slim, single binary serves API + static files)
# ============================================================

# ---- Stage 1: Build Frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# Copy workspace root files for dependency install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/brier-ui/package.json packages/brier-ui/
COPY packages/brier-cli/package.json packages/brier-cli/

RUN pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

# Copy shared config and app source
COPY eslint.config.js .prettierrc.json .prettierignore tsconfig.json ./
COPY apps/web/ apps/web/
COPY packages/brier-ui/ packages/brier-ui/

RUN pnpm --filter @brierb/brier-ui build

RUN pnpm run lint && pnpm run format:check

RUN pnpm --filter @brierb/web build

# ---- Stage 2: Build Backend ----
FROM rust:slim-bookworm AS backend-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential pkg-config libssl-dev ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY apps/server/ apps/server/
COPY crates/ crates/

# utoipa-swagger-ui 构建期需下载 swagger-ui 资源，GitHub 直连不稳定：
# 预置 zip 到镜像内，用 file:// 指向，绕开构建期外网依赖。
COPY vendor/swagger-ui/swagger-ui-v5.17.14.zip /app/vendor/swagger-ui/
ENV SWAGGER_UI_DOWNLOAD_URL=file:///app/vendor/swagger-ui/swagger-ui-v5.17.14.zip

RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/app/target,sharing=locked \
    cargo build --release && \
    cp /app/target/release/brier /app/brier

# ---- Stage 3: Runtime ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/brier /app/brier
COPY --from=frontend-builder /app/apps/web/dist /app/frontend/dist

ENV HOST=0.0.0.0
ENV PORT=8090
ENV FRONTEND_DIR=/app/frontend/dist

EXPOSE 8090

CMD ["./brier"]
