#!/usr/bin/env bash
# E2E 浏览器动态测试一键入口
#
# 自动处理 Android + proot 双层环境：
#   - dev server 在宿主起（vite），playwright 在 proot 里跑（浏览器装在那里）
#   - 宿主 Android node 不支持 playwright，必须在 proot 内执行
#
# 用法：
#   bash scripts/e2e.sh              # 自动起 dev server + 跑完整 E2E
#   bash scripts/e2e.sh --no-server  # 假设 dev server 已在 5173 跑着
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

DEV_CMD='npm run dev'
PORT=5173
E2E_URL="http://localhost:${PORT}/"

# playwright 包在 proot 的 npx 缓存里，用 NODE_PATH 指向它
PW_NODE_PATH="/root/.npm/_npx/e41f203b7505f1fb/node_modules"

start_server() {
  echo "▶ 启动 dev server ..."
  (cd "$ROOT" && env -u NODE_OPTIONS $DEV_CMD --host > $HOME/.hxc_tmp/e2e_vite.log 2>&1 & echo $! > $HOME/.hxc_tmp/e2e_vite.pid)
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:${PORT}/"; then
      echo "  dev server 就绪 (http://localhost:${PORT}/)"
      return 0
    fi
    sleep 1
  done
  echo "✗ dev server 启动超时，看 $HOME/.hxc_tmp/e2e_vite.log" >&2
  return 1
}

stop_server() {
  echo "▶ 关闭 dev server ..."
  # 精确杀本项目路径下的 vite（避免误杀其他项目的）
  pkill -f "wuwa-gacha-simulator.*/node_modules/.bin/vite" 2>/dev/null || true
  sleep 1
}

run_in_proot() {
  proot-distro login ubuntu -- bash -c "
    export NODE_PATH='${PW_NODE_PATH}'
    cd '${ROOT}'
    E2E_URL='${E2E_URL}' node scripts/e2e-browser.cjs
  "
}

# 判断当前是否已在 proot 内
if [ -n "${PROOT_INSIDE:-}" ]; then
  node scripts/e2e-browser.cjs
  exit $?
fi

SERVER_STARTED=0
if [ "${1:-}" != "--no-server" ]; then
  # 端口已被占用（如已有 dev server 在跑）就直接复用
  if curl -s -o /dev/null "http://localhost:${PORT}/"; then
    echo "  检测到已有 dev server 在 ${PORT}，直接复用"
  else
    start_server
    SERVER_STARTED=1
  fi
fi

run_in_proot
RC=$?

if [ "$SERVER_STARTED" = "1" ]; then
  stop_server
fi
exit $RC
