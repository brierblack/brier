# ============================================================
# Multi-stage Dockerfile for Hive
# Builds frontend (React 19 + Vite + Tailwind CSS 4)
# Serves static files with nginx
# ============================================================

# ---- Stage 1: Build Frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

# corepack prepare 独立成层：pnpm 二进制仅在版本号变化时重新下载，
# 不会因 package.json/pnpm-lock.yaml 变更而触发重复下载。
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./

# 对齐 npm 默认值：fetch-timeout 5min、fetch-retries 5 次
RUN pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

COPY frontend/ ./

# 代码质量检查：ESLint（错误阻断）+ Prettier 格式检查（不一致阻断）
RUN pnpm run lint && pnpm run format:check

# 构建生产产物
RUN pnpm run build

# ---- Stage 2: Runtime (nginx) ----
FROM nginx:alpine

# 复制前端构建产物
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# 复制 nginx 配置（SPA 路由支持）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
