#!/usr/bin/env node
/**
 * make-release-asset.mjs
 *
 * 打包 SkinDeck 更新资源（dist / presets / pets / assets / package.json）
 * 为 GitHub Release 生成 skindeck-update.zip。
 *
 * 用法: node scripts/make-release-asset.mjs [output]
 * 默认输出: ./skindeck-update.zip
 */
import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(ROOT, '..');
const OUTPUT = process.argv[2] || join(PROJECT_ROOT, 'skindeck-update.zip');

// 需要打包进更新包的目录/文件（相对于项目根）
const ENTRIES = [
  'apps/unified/dist',
  'apps/unified/assets',
  'apps/unified/package.json',
  'presets',
  'pets',
];

console.log('SkinDeck Release Asset Builder');
console.log('================================');
console.log(`Project root : ${PROJECT_ROOT}`);
console.log(`Output       : ${OUTPUT}`);

// 验证所有条目存在
for (const entry of ENTRIES) {
  const abs = join(PROJECT_ROOT, entry);
  try {
    const { statSync } = await import('node:fs');
    statSync(abs);
  } catch {
    console.error(`❌ Missing entry: ${entry} (${abs})`);
    process.exit(1);
  }
}

// 用 zip 命令打包（macOS/Linux 自带 zip，跨平台兼容）
// -r 递归, -q 安静, -j 不存储路径前缀（保留相对结构）
try {
  const args = ['-rq', OUTPUT];
  for (const entry of ENTRIES) {
    args.push(join(PROJECT_ROOT, entry));
  }
  console.log('\nPacking entries:');
  for (const e of ENTRIES) console.log(`  ${e}`);
  console.log('\nZipping...');
  execFileSync('zip', args, { cwd: PROJECT_ROOT });
  const { statSync } = await import('node:fs');
  const size = statSync(OUTPUT).size;
  const mb = (size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Done: ${OUTPUT} (${mb} MB)`);
} catch (e) {
  // fallback: 如果没有 zip 命令（Windows），用 node archiver 或报错
  console.error('❌ zip command failed:', e.message);
  console.error('   On macOS/Linux ensure `zip` is installed.');
  process.exit(1);
}
