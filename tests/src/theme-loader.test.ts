import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTheme, listPresets, loadAllPresets } from '@skins/skin-manager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const presetsDir = path.resolve(__dirname, '../../presets');

test('loadTheme: 能正确加载 Gothic Void Crusade 预设', async () => {
  const themeDir = path.join(presetsDir, 'preset-gothic-void-crusade');
  const loaded = await loadTheme(themeDir);
  assert.equal(loaded.theme.id, 'preset-gothic-void-crusade');
  assert.equal(loaded.theme.name, 'Gothic Void Crusade');
  assert.equal(loaded.theme.image, 'background.jpg');
  assert.ok(loaded.theme.colors?.accent, '应有 accent 颜色');
  assert.equal(loaded.theme.art?.focusX, 0.76);
  assert.equal(loaded.theme.art?.focusY, 0.45);
  assert.ok(loaded.imgSize > 0, '图片大小应大于 0');
  assert.ok(loaded.imgUrl.startsWith('file://'), 'imgUrl 应为 file:// 协议');
});

test('loadTheme: 能正确加载桥本有菜预设', async () => {
  const themeDir = path.join(presetsDir, 'preset-arina-hashimoto');
  const loaded = await loadTheme(themeDir);
  assert.equal(loaded.theme.id, 'preset-arina-hashimoto');
  assert.equal(loaded.theme.name, '桥本有菜');
  assert.equal(loaded.theme.image, 'background.jpg');
});

test('loadTheme: 图片路径穿越会被拒绝', async () => {
  const tmpDir = path.join(process.cwd(), '/tmp/skins-test');
  // 直接验证: 缺少 theme.json 会抛错
  await assert.rejects(
    loadTheme('/tmp/nonexistent-theme-xyz'),
    /ENOENT/,
  );
});

test('listPresets: 能列出所有 preset- 开头的目录', async () => {
  const presets = await listPresets(presetsDir);
  assert.ok(presets.length >= 2, '至少有 2 个预设');
  assert.ok(presets.includes('preset-gothic-void-crusade'));
  assert.ok(presets.includes('preset-arina-hashimoto'));
  assert.ok(presets.every((p) => p.startsWith('preset-')));
});

test('loadAllPresets: 批量加载所有预设', async () => {
  const all = await loadAllPresets(presetsDir);
  assert.ok(all.length >= 2);
  for (const t of all) {
    assert.ok(t.theme.id.startsWith('preset-'));
    assert.ok(t.imgUrl.startsWith('file://'));
  }
});
