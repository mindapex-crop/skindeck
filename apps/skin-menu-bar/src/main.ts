import { app, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkinManager } from '@skins/skin-manager';
import workbuddyConfig from '@skins/target-workbuddy';
import cursorConfig from '@skins/target-cursor';
import traeWorkConfig from '@skins/target-trae-work';
import claudeDesktopConfig from '@skins/target-claude-desktop';
import type { TargetConfig } from '@skins/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRESETS_DIR = path.resolve(__dirname, '../../presets');

const TARGETS: TargetConfig[] = [
  workbuddyConfig,
  traeWorkConfig,
  cursorConfig,
  claudeDesktopConfig,
];

let tray: Tray | null = null;
let skinManager: SkinManager | null = null;
let currentTargetId: string = workbuddyConfig.id;

function getCurrentTarget(): TargetConfig {
  return TARGETS.find((t) => t.id === currentTargetId) ?? workbuddyConfig;
}

async function rebuildMenu() {
  if (!tray || !skinManager) return;

  const presets = await skinManager.listPresets();
  const currentTheme = skinManager.getCurrentTheme();
  const target = getCurrentTarget();

  const themeItems: MenuItemConstructorOptions[] = presets.map((p) => ({
    label: p.theme.name,
    type: 'radio',
    checked: currentTheme?.theme.id === p.theme.id,
    click: async () => {
      try {
        await skinManager!.applyTheme(p.theme.id, target);
        rebuildMenu();
      } catch (e) {
        dialog.showErrorBox(
          '应用皮肤失败',
          `无法应用「${p.theme.name}」到 ${target.name}：\n${(e as Error).message}`,
        );
      }
    },
  }));

  const targetItems: MenuItemConstructorOptions[] = TARGETS.map((t) => ({
    label: t.name,
    type: 'radio',
    checked: currentTargetId === t.id,
    click: () => {
      currentTargetId = t.id;
      rebuildMenu();
    },
  }));

  const template: MenuItemConstructorOptions[] = [
    { label: 'Skins Menu Bar', enabled: false },
    { type: 'separator' },
    { label: '目标应用', submenu: targetItems },
    { type: 'separator' },
    { label: '选择皮肤', submenu: themeItems },
    {
      label: '恢复默认',
      click: async () => {
        try {
          await skinManager!.restore(target);
          rebuildMenu();
        } catch (e) {
          dialog.showErrorBox(
            '恢复失败',
            `无法恢复 ${target.name}：\n${(e as Error).message}`,
          );
        }
      },
    },
    { type: 'separator' },
    { label: `当前: ${target.name}`, enabled: false },
    {
      label: currentTheme
        ? `皮肤: ${currentTheme.theme.name}`
        : '皮肤: 默认',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '在 Finder 中打开预设',
      click: () => shell.openPath(PRESETS_DIR),
    },
    { label: '退出', role: 'quit' },
  ];

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}

function createTrayIcon() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Skins - 主题皮肤管理器');
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();

  createTrayIcon();
  skinManager = new SkinManager(PRESETS_DIR);

  await rebuildMenu();
});

app.on('window-all-closed', () => {
  // 菜单栏应用保持运行
});
