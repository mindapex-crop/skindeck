import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildThemeCss } from '@skins/cdp-injector';
import type { Theme } from '@skins/shared';

const testTheme: Theme = {
  schemaVersion: 1,
  id: 'test-theme',
  name: 'Test Theme',
  image: 'test.jpg',
  appearance: 'auto',
  art: { focusX: 0.5, focusY: 0.5, safeArea: 'left', taskMode: 'ambient' },
  colors: {
    accent: '#ff0000',
    accentAlt: '#cc0000',
    panel: 'rgba(255,255,255,0.5)',
    panelAlt: 'rgba(0,0,0,0.5)',
    text: '#333',
    muted: '#666',
  },
};

const testImgUrl = 'file:///tmp/test.jpg';

test('buildThemeCss: workbuddy target 包含 .teams-container 相关样式', () => {
  const css = buildThemeCss(testTheme, testImgUrl, 'workbuddy');
  assert.ok(css.includes('#root > .teams-container'), '应包含 .teams-container 选择器');
  assert.ok(css.includes('gridViewItem_'), '应包含 gridViewItem_ 哈希布局透明化');
  assert.ok(css.includes('backdrop-filter: blur(16px)'), '应有 backdrop-filter 模糊');
  assert.ok(css.includes(testImgUrl), '背景图 URL 应正确注入');
  assert.ok(css.includes('50.00%'), 'focus 0.5 对应 50%');
});

test('buildThemeCss: vscode-fork target 包含 .monaco-workbench 相关样式', () => {
  const css = buildThemeCss(testTheme, testImgUrl, 'vscode-fork');
  assert.ok(css.includes('.monaco-workbench'), '应包含 .monaco-workbench');
  assert.ok(css.includes('.part.background'), '应包含 .part.background 选择器');
  assert.ok(css.includes(testImgUrl), '背景图 URL 应正确注入');
});

test('buildThemeCss: generic target 只设 body 背景', () => {
  const css = buildThemeCss(testTheme, testImgUrl, 'generic');
  assert.ok(css.includes('body {'), '应包含 body 选择器');
  assert.ok(css.includes(testImgUrl), '背景图 URL 应正确注入');
});

test('buildThemeCss: 所有 target 都包含 VS Code 变量覆盖', () => {
  for (const target of ['workbuddy', 'vscode-fork', 'generic'] as const) {
    const css = buildThemeCss(testTheme, testImgUrl, target);
    assert.ok(css.includes('--vscode-button-background'), `${target}: 应有 --vscode-button-background 覆盖`);
    assert.ok(css.includes('#ff0000'), `${target}: 应有 accent 色注入`);
  }
});

test('buildThemeCss: focus 位置正确计算', () => {
  const theme: Theme = { ...testTheme, art: { focusX: 0.76, focusY: 0.45 } };
  const css = buildThemeCss(theme, testImgUrl, 'workbuddy');
  assert.ok(css.includes('76.00%'), 'focusX 0.76 -> 76%');
  assert.ok(css.includes('45.00%'), 'focusY 0.45 -> 45%');
});
