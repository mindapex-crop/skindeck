#!/usr/bin/env bash
# PoC: 验证 CDP 能否连上目标 Electron 桌面端并注入 JS
#
# 用法:
#   ./poc/cdp-inject-poc.sh trae-work     # 测 TRAE SOLO CN (TRAE Work)
#   ./poc/cdp-inject-poc.sh workbuddy     # 测 WorkBuddy
#   ./poc/cdp-inject-poc.sh cursor        # 测 Cursor (基于 VS Code fork)
#
# 行为:
#   1. 优雅退出目标 app (osascript tell to quit, 5s 超时后 pkill)
#   2. 用 --remote-debugging-port=<port> 重启
#   3. 等 CDP HTTP 端点就绪
#   4. 调用 cdp-inject-poc.mjs 注入 console.log('hello from skins')
#
# 注意: 会中断目标 app 的当前会话! 跑前请确认没有未保存的工作.

set -euo pipefail

TARGET="${1:?用法: $0 <trae-work|workbuddy|cursor>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${TARGET}" in
  trae-work)
    APP_NAME="TRAE SOLO CN"
    APP_PATH="/Applications/TRAE SOLO CN.app"
    PORT=9341
    USER_DATA_DIR="${HOME}/Library/Application Support/TRAE SOLO CN"
    BUNDLE_ID="cn.trae.solo.app"
    EXPECTED_TEAM_ID="CG2SCM6AV5"
    ;;
  workbuddy)
    APP_NAME="WorkBuddy"
    APP_PATH="/Applications/WorkBuddy.app"
    PORT=9342
    USER_DATA_DIR="${HOME}/Library/Application Support/WorkBuddy"
    BUNDLE_ID="com.workbuddy.workbuddy"
    EXPECTED_TEAM_ID="FN2V63AD2J"
    ;;
  cursor)
    # Cursor 是基于 VS Code fork 的 AI IDE, 由 Anysphere 用 todesktop 打包.
    # bundle id 来自 Cursor 公开 Info.plist; Team ID 待用户本机实测后填入.
    APP_NAME="Cursor"
    APP_PATH="/Applications/Cursor.app"
    PORT=9343
    USER_DATA_DIR="${HOME}/Library/Application Support/Cursor"
    BUNDLE_ID="com.todesktop.230313mzl4w4u92"
    EXPECTED_TEAM_ID=""  # TODO: 安装 Cursor 后跑 `codesign -dv --verbose=4 /Applications/Cursor.app` 拿 Team ID
    ;;
  *)
    echo "未知 target: ${TARGET} (支持: trae-work | workbuddy | cursor)"
    exit 2
    ;;
esac

# todesktop 打包的 Cursor 可执行文件名可能是 `Cursor` 而不是 `Electron`,
# 直接从 Info.plist 拿 CFBundleExecutable 最稳.
EXE_NAME="$(defaults read "${APP_PATH}/Contents/Info.plist" CFBundleExecutable 2>/dev/null || echo "Electron")"
ELECTRON_BIN="${APP_PATH}/Contents/MacOS/${EXE_NAME}"

echo "============================================================"
echo " PoC: CDP 注入验证"
echo "============================================================"
echo " 目标:        ${APP_NAME}"
echo " Bundle ID:   ${BUNDLE_ID}"
echo " App 路径:    ${APP_PATH}"
echo " CDP 端口:    ${PORT}"
echo " User Data:   ${USER_DATA_DIR}"
echo " 期望 TeamID: ${EXPECTED_TEAM_ID}"
echo "============================================================"

# ---- 0. 签名 + Bundle ID 校验 (与 Codex-Dream-Skin 同思路) ----
echo "[0] 校验签名与 Bundle ID..."
if [[ ! -d "${APP_PATH}" ]]; then
  echo "  !! 未找到 ${APP_PATH}"
  echo "     请先安装 ${APP_NAME}"
  exit 1
fi
ACTUAL_ID="$(defaults read "${APP_PATH}/Contents/Info.plist" CFBundleIdentifier 2>/dev/null || true)"
if [[ "${ACTUAL_ID}" != "${BUNDLE_ID}" ]]; then
  echo "  !! Bundle ID 不匹配: 期望 ${BUNDLE_ID}, 实际 ${ACTUAL_ID}"
  exit 1
fi
ACTUAL_TEAM_ID="$(codesign -dv --verbose=4 "${APP_PATH}" 2>&1 | grep -E '^Authority=Developer ID Application' | sed -E 's/.*\(([^)]+)\).*/\1/' || true)"
if [[ -z "${EXPECTED_TEAM_ID}" ]]; then
  echo "  WARN: EXPECTED_TEAM_ID 未填, 跳过 Team ID 校验 (实际 Team: ${ACTUAL_TEAM_ID})"
  echo "        装好后请把上面的 Team ID 回填到 case 分支里"
elif [[ "${ACTUAL_TEAM_ID}" != "${EXPECTED_TEAM_ID}" ]]; then
  echo "  !! Team ID 不匹配: 期望 ${EXPECTED_TEAM_ID}, 实际 ${ACTUAL_TEAM_ID}"
  exit 1
else
  echo "  OK: 签名与 Bundle ID 一致 (Team ${ACTUAL_TEAM_ID})"
fi

# ---- 1. 优雅退出 ----
echo
echo "[1] 退出当前 ${APP_NAME} 进程..."
if pgrep -f "${APP_PATH}/Contents/MacOS/Electron" >/dev/null 2>&1; then
  echo "  检测到运行中, 发送 quit..."
  osascript -e "tell application \"${APP_NAME}\" to quit" 2>/dev/null || true
  for _ in {1..10}; do
    pgrep -f "${APP_PATH}/Contents/MacOS/Electron" >/dev/null 2>&1 || break
    sleep 0.5
  done
  if pgrep -f "${APP_PATH}/Contents/MacOS/Electron" >/dev/null 2>&1; then
    echo "  5s 内未退出, pkill -f..."
    pkill -f "${APP_PATH}/Contents/MacOS/Electron" || true
    sleep 1
  fi
  echo "  OK: 已退出"
else
  echo "  OK: 未在运行"
fi

# ---- 2. 带 CDP 启动 ----
echo
echo "[2] 启动 ${APP_NAME} with --remote-debugging-port=${PORT} ..."
LOG_FILE="/tmp/skins-poc-${TARGET}.log"
"${ELECTRON_BIN}" \
  --remote-debugging-port="${PORT}" \
  --user-data-dir="${USER_DATA_DIR}" \
  >/dev/null 2>"${LOG_FILE}" &
APP_PID=$!
disown 2>/dev/null || true
echo "  PID: ${APP_PID}, stderr 日志: ${LOG_FILE}"

# ---- 3. 等 CDP 就绪 ----
echo
echo "[3] 等待 CDP HTTP 端点 http://127.0.0.1:${PORT}/json/version ..."
READY=0
for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.5
done

if [[ ${READY} -ne 1 ]]; then
  echo "  !! CDP 60s 内未就绪"
  echo "  ---- stderr 日志 (尾部) ----"
  tail -n 30 "${LOG_FILE}" 2>/dev/null || true
  exit 1
fi

echo "  OK: CDP 就绪"
echo "  ---- /json/version ----"
curl -fsS "http://127.0.0.1:${PORT}/json/version" | python3 -m json.tool 2>/dev/null || curl -fsS "http://127.0.0.1:${PORT}/json/version"
echo

# ---- 4. 通过 Node (内置 WebSocket) 注入 console.log ----
echo
echo "[4] 注入 console.log('hello from skins') ..."
node "${SCRIPT_DIR}/cdp-inject-poc.mjs" "${PORT}"

echo
echo "============================================================"
echo " PoC 完成: ${APP_NAME} 已被 CDP 注入"
echo " 现在可以打开 ${APP_NAME} 的 DevTools (View > Toggle Developer Tools)"
echo " 或在 Console 里看到 'hello from skins' 的输出痕迹"
echo "============================================================"
