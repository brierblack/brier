# ============================================================
# Multi-stage Dockerfile for Hive
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
COPY packages/ui/package.json packages/ui/
COPY packages/cli/package.json packages/cli/

RUN pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

# Copy shared config and app source
COPY eslint.config.js .prettierrc.json .prettierignore tsconfig.json ./
COPY apps/web/ apps/web/
COPY packages/ui/ packages/ui/
COPY packages/cli/ packages/cli/

RUN pnpm run lint && pnpm run format:check

RUN pnpm run build

# ---- Stage 2: Build Backend ----
FROM rust:slim-bookworm AS backend-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential pkg-config libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY apps/server/ apps/server/
COPY crates/ crates/

RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/app/target,sharing=locked \
    cargo build --release && \
    cp /app/target/release/hive /app/hive

# ---- Stage 3: Runtime ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/hive /app/hive
COPY --from=frontend-builder /app/apps/web/dist /app/frontend/dist

ENV HOST=0.0.0.0
ENV PORT=8090
ENV FRONTEND_DIR=/app/frontend/dist

EXPOSE 8090

CMD ["./hive"]
