// verify-skin-readiness.mjs
// 校验所有 preset 是否为 WorkBuddy(workbuddy) 与 Codex(vscode-fork) 两个目标
// 都生成了合法、且命中正确 DOM 选择器的主题 CSS。
// 无需目标 App 开启 CDP 即可运行 —— 它只验证"皮肤本身已准备好可注入"。
//
// 用法: node scripts/verify-skin-readiness.mjs

import { loadAllPresets } from '../packages/skin-manager/dist/theme-loader.js';
import { buildThemeCss } from '../packages/cdp-injector/dist/theme-injector.js';

const PRESETS_DIR = new URL('../presets', import.meta.url).pathname;

// 每个目标类型期望在生成的 CSS 中出现的特征选择器
const TARGET_CHECK = {
  workbuddy: '#root > .teams-container',
  'vscode-fork': '.monaco-workbench',
};

async function main() {
  const presets = await loadAllPresets(PRESETS_DIR);
  if (presets.length === 0) {
    console.error('未找到任何 preset，检查 presets/ 目录。');
    process.exit(1);
  }

  const report = {};
  let allOk = true;

  for (const target of Object.keys(TARGET_CHECK)) {
    const needle = TARGET_CHECK[target];
    let ok = 0;
    const failures = [];
    for (const p of presets) {
      try {
        const css = buildThemeCss(p.theme, p.imgUrl, target, { backgroundMode: 'cover' });
        const nonEmpty = typeof css === 'string' && css.trim().length > 0;
        const hitsSelector = nonEmpty && css.includes(needle);
        if (nonEmpty && hitsSelector) {
          ok++;
        } else {
          failures.push({ id: p.theme.id, nonEmpty, hitsSelector });
        }
      } catch (e) {
        failures.push({ id: p.theme.id, error: e.message });
      }
    }
    report[target] = { total: presets.length, ready: ok, failures };
    if (ok !== presets.length) allOk = false;
  }

  console.log('=== 皮肤就绪度校验 ===');
  console.log(`预设总数: ${presets.length}`);
  for (const target of Object.keys(TARGET_CHECK)) {
    const r = report[target];
    const status = r.ready === r.total ? '✓' : '✗';
    console.log(`${status} ${target}: ${r.ready}/${r.total} 个预设已就绪 (命中选择器 "${TARGET_CHECK[target]}")`);
    if (r.failures.length > 0) {
      console.log('   失败项:');
      for (const f of r.failures.slice(0, 10)) {
        console.log(`     - ${f.id}: ${f.error || JSON.stringify(f)}`);
      }
      if (r.failures.length > 10) console.log(`     ... 其余 ${r.failures.length - 10} 项`);
    }
  }

  console.log('\n=== 结论 ===');
  if (allOk) {
    console.log('✓ 全部预设对 WorkBuddy 与 Codex 均生成合法且目标匹配的主题 CSS。');
    console.log('  实时注入的唯一前置条件: 目标 App 以 --remote-debugging-port 启动 (WorkBuddy=9342, Codex=9336)。');
    process.exit(0);
  } else {
    console.log('✗ 存在未就绪的预设，详见上方失败项。');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('校验脚本异常:', e);
  process.exit(1);
});
