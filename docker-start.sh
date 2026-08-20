#!/usr/bin/env bash
# ============================================================
# Hive 一键启动脚本
#
# 用法：
#   ./docker-start.sh             构建并启动（后台）
#   ./docker-start.sh up          构建并启动（前台）
#   ./docker-start.sh stop        停止服务
#   ./docker-start.sh restart     重启服务
#   ./docker-start.sh logs        查看日志
#   ./docker-start.sh down        停止并删除容器、网络
#   ./docker-start.sh clean       停止、删除容器及数据卷（危险！）
#   ./docker-start.sh status      查看状态
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- 颜色 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- 检查 Docker ----
if ! command -v docker &>/dev/null; then
  error "未找到 docker，请先安装 Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  error "未找到 docker compose 插件，请升级 Docker 或安装 docker-compose"
  exit 1
fi

# ---- 确保 .env 存在 ----
ensure_env() {
  local env_file="$SCRIPT_DIR/.env"
  local example_file="$SCRIPT_DIR/.env.example"

  if [[ ! -f "$env_file" ]]; then
    if [[ ! -f "$example_file" ]]; then
      warn ".env 和 .env.example 均不存在，使用默认配置启动"
    else
      info ".env 不存在，从 .env.example 生成..."
      cp "$example_file" "$env_file"
      chmod 600 "$env_file"
      info ".env 已生成，请按需修改其中的配置项"
    fi
  else
    info ".env 已存在"
  fi
}

# ---- 构建并后台启动 ----
start() {
  ensure_env
  info "构建并启动 Docker 服务..."
  docker compose up --build -d
  echo ""
  info "服务已启动"
  show_status
}

# ---- 构建并前台启动 ----
start_foreground() {
  ensure_env
  info "构建并启动 Docker 服务（前台模式）..."
  docker compose up --build
}

# ---- 停止 ----
stop() {
  info "停止 Docker 服务..."
  docker compose stop
}

# ---- 重启 ----
restart() {
  info "重启 Docker 服务..."
  docker compose restart
}

# ---- 日志 ----
logs() {
  docker compose logs -f --tail=100
}

# ---- 销毁容器与网络 ----
down() {
  warn "停止并删除容器、网络..."
  docker compose down
}

# ---- 清理（含数据卷） ----
clean() {
  warn "即将删除所有容器、网络及数据卷（数据将丢失！）"
  read -rp "确认删除？输入 yes 继续: " confirm
  if [[ "$confirm" == "yes" ]]; then
    docker compose down -v
    info "已清理"
  else
    info "已取消"
  fi
}

# ---- 状态 ----
show_status() {
  echo ""
  echo -e "${CYAN}========== Hive 服务状态 ==========${NC}"
  docker compose ps
  echo ""
  local web_port
  web_port=$(grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || echo "8080")
  web_port="${web_port:-8080}"
  echo -e "${GREEN}访问地址:${NC} http://localhost:${web_port}"
  echo -e "${CYAN}====================================${NC}"
  echo ""
  echo -e "常用命令:"
  echo -e "  ${CYAN}./docker-start.sh logs${NC}     查看日志"
  echo -e "  ${CYAN}./docker-start.sh stop${NC}     停止服务"
  echo -e "  ${CYAN}./docker-start.sh restart${NC}  重启服务"
  echo -e "  ${CYAN}./docker-start.sh down${NC}     销毁容器"
}

# ---- 帮助 ----
usage() {
  echo "Hive Docker 一键启动脚本"
  echo ""
  echo "用法: ./docker-start.sh [命令]"
  echo ""
  echo "命令:"
  echo "  (无) / -d   构建并后台启动"
  echo "  up           构建并前台启动"
  echo "  stop         停止服务"
  echo "  restart      重启服务"
  echo "  logs         查看日志"
  echo "  down         停止并删除容器"
  echo "  clean        删除容器及数据卷（危险！）"
  echo "  status       查看状态"
  echo "  help         显示帮助"
}

# ---- 主逻辑 ----
case "${1:-up-d}" in
  up-d|""|-d) start ;;
  up)         start_foreground ;;
  stop)       stop ;;
  restart)    restart ;;
  logs)       logs ;;
  down)       down ;;
  clean)      clean ;;
  status|ps)  show_status ;;
  help|-h|--help) usage ;;
  *)
    error "未知命令: $1"
    usage
    exit 1
    ;;
esac
