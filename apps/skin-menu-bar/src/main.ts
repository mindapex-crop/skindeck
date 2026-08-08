import { app, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkinManager } from '@skins/skin-manager';
import workbuddyConfig from '@skins/target-workbuddy';
import cursorConfig from '@skins/target-cursor';
import traeWorkConfig from '@skins/target-trae-work';
import claudeDesktopConfig from '@skins/target-claude-desktop';
import type { TargetConfig, I18nStrings } from '@skins/shared';
import { setLanguage, getLocale, detectSystemLanguage } from '@skins/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function i18n(): I18nStrings {
  return getLocale();
}

function initLanguage() {
  setLanguage(detectSystemLanguage());
}

const PRESETS_DIR = path.resolve(__dirname, '../../../presets');

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
          i18n().applySkinFailed,
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
    { label: i18n().appName, enabled: false },
    { type: 'separator' },
    { label: i18n().targetApp, submenu: targetItems },
    { type: 'separator' },
    { label: i18n().selectSkin, submenu: themeItems },
    {
      label: i18n().restoreDefault,
      click: async () => {
        try {
          await skinManager!.restore(target);
          rebuildMenu();
        } catch (e) {
          dialog.showErrorBox(
            i18n().restoreFailed,
            `无法恢复 ${target.name}：\n${(e as Error).message}`,
          );
        }
      },
    },
    { type: 'separator' },
    { label: `${i18n().current}: ${target.name}`, enabled: false },
    {
      label: currentTheme
        ? `${i18n().skin}: ${currentTheme.theme.name}`
        : `${i18n().skin}: -`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: i18n().openSkinFolder,
      click: () => shell.openPath(PRESETS_DIR),
    },
    { label: i18n().quit, role: 'quit' },
  ];

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}

function createTrayIcon() {
  const iconPath = path.resolve(__dirname, '../assets/tray.png');
  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip(i18n().appName);
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();

  initLanguage();
  createTrayIcon();
  skinManager = new SkinManager(PRESETS_DIR);

  await rebuildMenu();
});

app.on('window-all-closed', () => {
  // 菜单栏应用保持运行
});
