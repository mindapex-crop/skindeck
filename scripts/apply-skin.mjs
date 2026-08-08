// apply-skin.mjs
// 通过 CDP 把指定预设实时注入到 WorkBuddy 或 Codex 的渲染进程。
//
// 前置条件 (重要):
//   目标 App 必须以 --remote-debugging-port 启动:
//     WorkBuddy: /Applications/WorkBuddy.app/Contents/MacOS/Electron --remote-debugging-port=9342
//     Codex:     /Applications/Codex.app/Contents/MacOS/Electron --remote-debugging-port=9336
//   端口未监听时脚本会给出明确提示而不会静默失败。
//
// 用法:
//   node scripts/apply-skin.mjs --target workbuddy --theme preset-arctic-frost
//   node scripts/apply-skin.mjs --target codex --theme preset-arctic-frost --opacity 0.85 --bg-mode cover
//   node scripts/apply-skin.mjs --target workbuddy --restore   # 还原默认皮肤

import { SkinManager } from '../packages/skin-manager/dist/index.js';
import workbuddyConfig from '../targets/workbuddy/dist/index.js';
import codexConfig from '../targets/codex/dist/index.js';

const PRESETS_DIR = new URL('../presets', import.meta.url).pathname;

const TARGETS = {
  workbuddy: workbuddyConfig,
  codex: codexConfig,
};

function parseArgs(argv) {
  const out = { target: null, theme: null, opacity: undefined, bgMode: 'cover', restore: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target') out.target = argv[++i];
    else if (a === '--theme') out.theme = argv[++i];
    else if (a === '--opacity') out.opacity = parseFloat(argv[++i]);
    else if (a === '--bg-mode') out.bgMode = argv[++i];
    else if (a === '--restore') out.restore = true;
  }
  return out;
}

async function portOpen(port) {
  // 尝试 CDP 的 /json/version 端点判断远端调试是否开启
  const { execSync } = await import('node:child_process');
  try {
    execSync(`curl -s --max-time 2 http://127.0.0.1:${port}/json/version >/dev/null`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.target || !TARGETS[args.target]) {
    console.error('用法: node scripts/apply-skin.mjs --target <workbuddy|codex> [--theme <preset-id>] [--opacity 0..1] [--bg-mode cover|repeat|contain] [--restore]');
    process.exit(1);
  }
  const target = TARGETS[args.target];

  // 端口预检
  const open = await portOpen(target.cdpPort);
  if (!open) {
    console.error(`\n✗ 目标 App "${args.target}" 的 CDP 端口 ${target.cdpPort} 未开启。`);
    console.error('  请先以远程调试端口启动该 App, 例如:');
    console.error(`    ${target.appPath}/Contents/MacOS/Electron --remote-debugging-port=${target.cdpPort}`);
    console.error('  (macOS 上 WorkBuddy.app 为打包的 Electron; 需先退出当前实例再以上述参数启动。)\n');
    process.exit(2);
  }

  const mgr = new SkinManager(PRESETS_DIR);

  if (args.restore) {
    const res = await mgr.restore(target);
    console.log(`✓ 已向 ${args.target} 发送还原指令, 影响 ${res.length} 个页面。`);
    process.exit(0);
  }

  if (!args.theme) {
    console.error('请通过 --theme <preset-id> 指定要应用的预设 (可用 node scripts/verify-skin-readiness.mjs 查看全部预设)。');
    process.exit(1);
  }

  const options = {};
  if (args.opacity !== undefined) options.opacity = args.opacity;
  options.backgroundMode = args.bgMode;

  try {
    const results = await mgr.applyTheme(args.theme, target, options);
    console.log(`✓ 已向 ${args.target} 注入预设 "${args.theme}", 影响 ${results.length} 个页面:`);
    for (const r of results) {
      console.log(`   - target=${r.target} detected=${r.detected} styleInjected=${r.styleInjected} bgEl=${r.bgEl}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(`✗ 注入失败: ${e.message}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('脚本异常:', e);
  process.exit(1);
});
