import { app, BrowserWindow, ipcMain, Tray, Menu, screen, shell, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllPets, type LoadedPet } from '@skins/pet-engine';
import { setLanguage, getLocale, detectSystemLanguage } from '@skins/shared';
import type { I18nStrings } from '@skins/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function i18n(): I18nStrings {
  return getLocale();
}

function initLanguage() {
  setLanguage(detectSystemLanguage());
}

const PETS_DIR = path.resolve(__dirname, '../../../pets');

let petWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let pets: LoadedPet[] = [];
let currentPetIndex = 0;

const WINDOW_WIDTH = 200;
const WINDOW_HEIGHT = 220;

function createPetWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const x = workArea.width - WINDOW_WIDTH - 30;
  const y = workArea.height - WINDOW_HEIGHT - 30;

  petWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (process.env.NODE_ENV === 'development') {
    petWindow.loadURL('http://localhost:5173');
  } else {
    petWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }
}

function createTray() {
  if (!tray) {
    const iconPath = path.resolve(__dirname, '../assets/tray.png');
    const icon = nativeImage.createFromPath(iconPath);
    const trayIcon = icon.isEmpty()
      ? nativeImage.createEmpty()
      : icon.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip(i18n().desktopPet);
  }
  rebuildTrayMenu();
}

async function rebuildTrayMenu() {
  if (!tray) return;

  pets = await loadAllPets(PETS_DIR);

  const petItems: Electron.MenuItemConstructorOptions[] = pets.map((p, i) => ({
    label: p.config.name,
    type: 'radio',
    checked: i === currentPetIndex,
    click: () => {
      currentPetIndex = i;
      switchPet(p);
      rebuildTrayMenu();
    },
  }));

  const menu = Menu.buildFromTemplate([
    { label: i18n().desktopPet, enabled: false },
    { type: 'separator' },
    { label: i18n().selectPet, submenu: petItems },
    {
      label: i18n().togglePet,
      click: () => {
        if (petWindow?.isVisible()) petWindow.hide();
        else petWindow?.show();
      },
    },
    {
      label: i18n().resetPosition,
      click: () => {
        const { workArea } = screen.getPrimaryDisplay();
        petWindow?.setPosition(
          workArea.width - WINDOW_WIDTH - 30,
          workArea.height - WINDOW_HEIGHT - 30
        );
      },
    },
    { type: 'separator' },
    {
      label: i18n().openPetFolder,
      click: () => shell.openPath(PETS_DIR),
    },
    { label: i18n().quit, role: 'quit' },
  ]);

  tray.setContextMenu(menu);
}

function switchPet(pet: LoadedPet) {
  petWindow?.webContents.send('pet:switch', {
    config: pet.config,
    imgUrl: pet.imgUrl,
  });
}

ipcMain.handle('pets:getAll', async () => {
  pets = await loadAllPets(PETS_DIR);
  return pets.map((p) => ({ config: p.config, imgUrl: p.imgUrl }));
});

ipcMain.handle('pets:getCurrent', async () => {
  if (pets.length === 0) pets = await loadAllPets(PETS_DIR);
  const pet = pets[currentPetIndex];
  return pet ? { config: pet.config, imgUrl: pet.imgUrl } : null;
});

ipcMain.on('pet:drag-start', () => {
  petWindow?.webContents.send('pet:action', { action: 'drag' });
});

ipcMain.on('pet:drag-end', () => {
  petWindow?.webContents.send('pet:action', { action: 'idle' });
});

ipcMain.on('pet:move-by', (_e, dx: number, dy: number) => {
  if (!petWindow) return;
  const [x, y] = petWindow.getPosition();
  petWindow.setPosition(x + Math.round(dx), y + Math.round(dy));
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();

  initLanguage();
  pets = await loadAllPets(PETS_DIR);
  createPetWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 保持运行
});
