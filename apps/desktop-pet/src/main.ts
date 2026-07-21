import { app, BrowserWindow, ipcMain, Tray, Menu, screen, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllPets, type LoadedPet } from '@skins/pet-engine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PETS_DIR = path.resolve(__dirname, '../../pets');

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
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
    tray = new Tray(
      // 用空图标先占位，实际可以换成 pet 缩略图
      require('electron').nativeImage.createEmpty()
    );
    tray.setToolTip('Desktop Pet - 桌宠');
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
    { label: '桌宠', enabled: false },
    { type: 'separator' },
    { label: '选择桌宠', submenu: petItems },
    {
      label: '显示/隐藏',
      click: () => {
        if (petWindow?.isVisible()) petWindow.hide();
        else petWindow?.show();
      },
    },
    {
      label: '重置位置',
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
      label: '在 Finder 中打开桌宠目录',
      click: () => shell.openPath(PETS_DIR),
    },
    { label: '退出', role: 'quit' },
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

  pets = await loadAllPets(PETS_DIR);
  createPetWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 保持运行
});
