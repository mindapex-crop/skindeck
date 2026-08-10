import { app, Tray, Menu, nativeImage, dialog, shell, BrowserWindow, ipcMain, screen } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { SkinManager, isApplied } from '@skins/skin-manager';
import type { ApplyOptions } from '@skins/skin-manager';
import { loadAllPets, type LoadedPet } from '@skins/pet-engine';
import workbuddyConfig from '@skins/target-workbuddy';
import cursorConfig from '@skins/target-cursor';
import traeWorkConfig from '@skins/target-trae-work';
import claudeDesktopConfig from '@skins/target-claude-desktop';
import vscodeConfig from '@skins/target-vscode';
import windsruffConfig from '@skins/target-windsruff';
import zcodeConfig from '@skins/target-zcode';
import codexConfig from '@skins/target-codex';
import qoderworkConfig from '@skins/target-qoderwork';
import traeSoloConfig from '@skins/target-trae-solo';
import type { TargetConfig } from '@skins/shared';
import { setLanguage, getLanguage, getLocale, detectSystemLanguage, SUPPORTED_LANGUAGES } from '@skins/shared';
import type { LanguageCode, I18nStrings } from '@skins/shared';

// __dirname is a CJS global; in ESM builds we derive it from import.meta.url.
// This keeps the same source working both as native ESM and as an esbuild CJS bundle.
declare const __dirname: string | undefined;
const moduleDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const PRESETS_DIR = path.resolve(moduleDir, '../../../presets');
const PETS_DIR = path.resolve(moduleDir, '../../../pets');

const TARGETS: TargetConfig[] = [
  cursorConfig,
  vscodeConfig,
  windsruffConfig,
  codexConfig,
  traeWorkConfig,
  traeSoloConfig,
  workbuddyConfig,
  zcodeConfig,
  qoderworkConfig,
  claudeDesktopConfig,
];

const TRAY_ICON_PATH = path.resolve(__dirname, '../assets/tray-fox.png');
const TRAY_ICON_TEMPLATE_PATH = path.resolve(__dirname, '../assets/tray-fox-Template.png');
const PET_WINDOW_WIDTH = 200;
const PET_WINDOW_HEIGHT = 220;

let tray: Tray | null = null;
let skinManager: SkinManager | null = null;
let currentTargetId: string = cursorConfig.id;
let currentOpacity: number = 1;
let customImagePath: string | null = null;
let currentBackgroundMode: 'cover' | 'repeat' | 'contain' = 'cover';
let currentFontFamily: string = 'follow'; // 'follow' = use active skin's font (or region default); otherwise a CSS font-family stack

let appVersion = '0.1.0';
let latestVersion: string | null = null;

// ── 品牌 & 自更新（GitHub Releases） ──
const BRAND = 'SkinDeck';
const GITHUB_REPO = 'mindapex-crop/skindeck';
const UPDATE_ASSET_NAME = 'skindeck-update.zip';
// 项目根目录：apps/unified/dist → 上溯三级
const PROJECT_ROOT = path.resolve(moduleDir, '../../..');

// ── 状态持久化（记住上次选择的皮肤 / 目标 / 选项，重启后自动重新注入最新代码） ──
interface PersistedState {
  themeId: string | null;
  targetId: string;
  opacity: number;
  backgroundMode: 'cover' | 'repeat' | 'contain';
  fontFamily: string;
  customImagePath: string | null;
  /** 状态 schema 版本；低于 2 时做一次向后迁移（旧默认 repeat → cover）。 */
  schemaVersion?: number;
}

function stateFilePath(): string {
  return path.join(app.getPath('userData'), 'skindeck-state.json');
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = readFileSync(stateFilePath(), 'utf-8');
    const s = JSON.parse(raw);
    if (s && typeof s === 'object') {
      // 向后迁移：v0.1.4 及更早把 backgroundMode 默认写成 repeat（背景图只盖中间、
      // 不铺满窗口的元凶）。升级到 v0.1.5 时把旧默认 repeat 纠正为 cover。
      // 用 schemaVersion 保证只迁移一次——用户之后若主动选 repeat 不会被覆盖。
      if ((s.schemaVersion ?? 1) < 2 && s.backgroundMode === 'repeat') {
        s.backgroundMode = 'cover';
      }
      s.schemaVersion = 2;
      return s as PersistedState;
    }
  } catch {
    /* 尚无持久化状态 */
  }
  return null;
}

function saveState(): void {
  if (!skinManager) return;
  try {
    const theme = skinManager.getCurrentTheme();
    const s: PersistedState = {
      themeId: theme?.theme.id ?? null,
      targetId: currentTargetId,
      opacity: currentOpacity,
      backgroundMode: currentBackgroundMode,
      fontFamily: currentFontFamily,
      customImagePath,
      schemaVersion: 2,
    };
    writeFileSync(stateFilePath(), JSON.stringify(s, null, 2));
  } catch (e) {
    console.warn('保存 SkinDeck 状态失败:', (e as Error).message);
  }
}

let petWindow: BrowserWindow | null = null;
let pets: LoadedPet[] = [];
let currentPetIndex = 0;
let petEnabled = true;

// ── Font catalog (region-themed UI fonts) ──
interface FontOption { label: string; stack: string; }
interface FontGroup { regionKey: 'regionCn' | 'regionJpKr' | 'regionEu' | 'regionSea' | 'regionMe'; fonts: FontOption[]; }

const FONT_GROUPS: FontGroup[] = [
  {
    regionKey: 'regionCn',
    fonts: [
      { label: '苹方 PingFang SC', stack: "'PingFang SC', 'Microsoft YaHei', sans-serif" },
      { label: '微软雅黑 Microsoft YaHei', stack: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
      { label: '思源黑体 Noto Sans CJK', stack: "'Noto Sans CJK SC', 'Source Han Sans SC', sans-serif" },
    ],
  },
  {
    regionKey: 'regionJpKr',
    fonts: [
      { label: 'Hiragino Sans', stack: "'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif" },
      { label: 'Yu Gothic', stack: "'Yu Gothic', 'Hiragino Sans', 'Meiryo', sans-serif" },
      { label: '思源黑体 JP Noto Sans CJK', stack: "'Noto Sans CJK JP', 'Hiragino Sans', sans-serif" },
    ],
  },
  {
    regionKey: 'regionEu',
    fonts: [
      { label: '系统默认 -apple-system', stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
      { label: 'Inter', stack: "'Inter', -apple-system, 'Segoe UI', sans-serif" },
      { label: 'Helvetica', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
      { label: 'Georgia (衬线)', stack: "Georgia, 'Times New Roman', serif" },
    ],
  },
  {
    regionKey: 'regionSea',
    fonts: [
      { label: 'Noto Sans Thai', stack: "'Noto Sans Thai', 'Leelawadee UI', sans-serif" },
      { label: 'Noto Sans (Vietnamese)', stack: "'Noto Sans', 'Arial', sans-serif" },
    ],
  },
  {
    regionKey: 'regionMe',
    fonts: [
      { label: 'Geeza Pro', stack: "'Geeza Pro', 'Noto Naskh Arabic', sans-serif" },
      { label: 'Noto Naskh Arabic', stack: "'Noto Naskh Arabic', 'Geeza Pro', sans-serif" },
    ],
  },
];

// Region default font stacks used when "follow skin" is selected and the active
// skin has no explicit fontFamily. Keyed by the theme id's region prefix.
const REGION_FONT_DEFAULTS: Record<string, string> = {
  cn: "'PingFang SC', 'Microsoft YaHei', sans-serif",
  'jp-kr': "'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif",
  eu: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sea: "'Noto Sans', 'Arial', sans-serif",
  me: "'Geeza Pro', 'Noto Naskh Arabic', sans-serif",
};

function regionOfTheme(id?: string): string {
  return id?.split('-')[1] ?? '';
}

/** 按当前语言解析皮肤显示名（复用 codex-dream-skin 的多语言皮肤名）。 */
function localizedSkinName(theme: { name: string; nameEn?: string; names?: Record<string, string> }): string {
  const lang = getLanguage();
  return theme.names?.[lang] || theme.nameEn || theme.name;
}

/** Resolve the CSS font-family stack to inject, based on currentFontFamily + active theme. */
function currentFontStack(theme?: { id?: string; fontFamily?: string; region?: string }): string | undefined {
  if (currentFontFamily !== 'follow') return currentFontFamily;
  if (theme?.fontFamily) return theme.fontFamily;
  const region = (theme?.region as string) || regionOfTheme(theme?.id);
  return REGION_FONT_DEFAULTS[region]; // undefined -> no font injection
}

function getCurrentTarget(): TargetConfig {
  return TARGETS.find((t) => t.id === currentTargetId) ?? cursorConfig;
}

// 用 Node 原生 net 做 TCP 端口探测 —— CDP 端口探测本来只需确认端口是否监听，
// 不需要走 HTTP 协议；走 fetch() 会经过 Chromium 的 network service，在受限网络
// 环境（例如沙箱 shell、某些代理/VPN）下会触发 network_service_instance_impl 崩溃
// 并连带整个 Electron App 退出。TCP 探测则完全绕开 Chromium 网络栈。
async function probeCdpPort(port: number, timeoutMs = 1500): Promise<boolean> {
  const netModule = await import('node:net');
  return new Promise<boolean>((resolve) => {
    const sock = netModule.connect({ port, host: '127.0.0.1' });
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      try { sock.destroy(); } catch { /* ignore */ }
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
    sock.once('timeout', () => done(false));
  });
}

// 从 /Applications/Xxx.app 推导 open -a 用的应用展示名（去掉 .app 后缀）
function appNameFromPath(appPath: string): string {
  return path.basename(appPath).replace(/\.app$/i, '');
}

// 通过 bundleId 检测目标 App 是否正在运行（macOS 用 System Events，回退到进程名探测）。
// 这里只关心"进程在不在"，不关心端口——端口由 probeCdpPort 负责。
async function isAppRunning(appPath: string, bundleId?: string): Promise<boolean> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  if (process.platform === 'darwin' && bundleId) {
    try {
      const { stdout } = await execFileAsync('osascript', [
        '-e',
        `tell application "System Events" to (exists process whose bundle identifier is "${bundleId}")`,
      ]);
      const v = stdout.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    } catch {
      /* 回退到进程名探测 */
    }
  }

  // 回退：用进程路径片段探测（对所有平台通用）
  try {
    const name = appNameFromPath(appPath);
    const { stdout } = await execFileAsync('pgrep', ['-f', `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.app/Contents`]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// 优雅退出目标 App：优先用 bundleId 发 AppleEvent quit（让 App 有机会保存），
// 失败则回退到 pkill 强杀。
async function quitApp(bundleId: string | undefined, appName: string): Promise<void> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  if (process.platform === 'darwin' && bundleId) {
    try {
      await execFileAsync('osascript', ['-e', `tell application id "${bundleId}" to quit`]);
      return;
    } catch {
      /* 回退 pkill */
    }
  }
  try {
    await execFileAsync('pkill', ['-f', `${appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.app/Contents`]);
  } catch {
    /* 进程可能已退出 */
  }
}

// 用带调试端口的方式拉起目标 App。macOS 用 open -a <名称> --args，让 LaunchServices
// 正确透传 --remote-debugging-port（直接调二进制会被某些 IDE 的瘦启动器白名单拦截）。
async function launchWithDebugPort(target: TargetConfig): Promise<void> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const appName = appNameFromPath(target.appPath);

  if (process.platform === 'darwin') {
    try {
      await execFileAsync('open', [
        '-a', appName,
        '--args',
        `--remote-debugging-port=${target.cdpPort}`,
        '--no-sandbox',
      ]);
    } catch {
      // 回退：直接用 appPath 拉起
      await execFileAsync('open', [
        target.appPath,
        '--args',
        `--remote-debugging-port=${target.cdpPort}`,
        '--no-sandbox',
      ]).catch(() => {});
    }
  } else if (process.platform === 'linux') {
    execFileAsync(target.appPath, [
      `--remote-debugging-port=${target.cdpPort}`,
      '--no-sandbox',
    ]).catch(() => {});
  } else {
    // Windows
    execFileAsync('cmd', ['/c', 'start', '', target.appPath,
      `--remote-debugging-port=${target.cdpPort}`,
      '--no-sandbox',
    ]).catch(() => {});
  }
}

async function ensureTargetRunning(target: TargetConfig): Promise<boolean> {
  // Step 1: Check if app is installed
  const fsSync = await import('node:fs');
  if (target.appPath) {
    try {
      fsSync.accessSync(target.appPath);
    } catch {
      // App not installed - show i18n dialog
      const msg = i18n().appNotInstalled.replace('{app}', target.name);
      dialog.showMessageBox({
        type: 'warning',
        title: target.name,
        message: msg,
        buttons: [i18n().ok],
      });
      return false;
    }
  }

  // Step 2: 端口已开（已带调试端口在跑）→ 直接返回，无需任何操作
  if (await probeCdpPort(target.cdpPort, 1500)) return true;

  // Step 3: 应用在跑但没带端口 → 先优雅退出，再带端口重拉。
  // 否则 open --args 只会把已运行实例提到前台、加不上端口（Cursor/部分 IDE 的
  // 瘦启动器会在无 GUI LaunchServices 会话下剥掉参数），皮肤永远注不进去。
  if (target.appPath && (await isAppRunning(target.appPath, target.bundleId))) {
    try {
      await quitApp(target.bundleId, target.name);
      // 等进程退出、端口彻底关闭
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (!(await isAppRunning(target.appPath, target.bundleId))) break;
      }
    } catch (e) {
      console.warn(`退出 ${target.name} 失败:`, (e as Error).message);
    }
  }

  // Step 4: 用带调试端口的方式拉起
  if (target.appPath) {
    await launchWithDebugPort(target);
    // 等 App 启动、CDP 可用（最多 20s，TCP 探测）
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await probeCdpPort(target.cdpPort, 800)) return true;
    }
  }

  return true;
}

async function applyCurrentTheme() {
  if (!skinManager) return;
  const target = getCurrentTarget();
  const running = await ensureTargetRunning(target);
  if (!running) return; // App not installed, skip applying
  const options: ApplyOptions = {
    opacity: currentOpacity,
    backgroundMode: currentBackgroundMode,
  };
  if (customImagePath) {
    options.customImagePath = customImagePath;
  }
  options.fontFamily = currentFontStack(skinManager.getCurrentTheme()?.theme);
  const currentTheme = skinManager.getCurrentTheme();
  if (currentTheme) {
    await skinManager.applyTheme(currentTheme.theme.id, target, options);
  }
  saveState();
}

// 自动补回：每隔几秒检查当前目标的皮肤样式是否还在（IDE 整页重载会冲掉注入的
// <style>），丢了就自动重注。配合注入器内的页面内自修复，覆盖“无重载”与“整页重载”两种掉皮肤场景。
let autoHealTimer: ReturnType<typeof setInterval> | null = null;
function startAutoHeal() {
  if (autoHealTimer) return;
  autoHealTimer = setInterval(async () => {
    if (!skinManager) return;
    const target = getCurrentTarget();
    // 端口没开就不探测；只在端口开时重注，避免干扰未启动的 IDE
    if (!(await probeCdpPort(target.cdpPort, 800))) return;
    try {
      const applied = await isApplied(target.cdpPort);
      if (!applied) {
        console.log(`[autoHeal] ${target.name} 皮肤样式丢失，自动重注`);
        await applyCurrentTheme();
      }
    } catch {
      // 单次探测异常忽略
    }
  }, 5000);
}

function createPetWindow() {
  if (petWindow) return;

  const { workArea } = screen.getPrimaryDisplay();
  const x = workArea.width - PET_WINDOW_WIDTH - 30;
  const y = workArea.height - PET_WINDOW_HEIGHT - 30;

  petWindow = new BrowserWindow({
    width: PET_WINDOW_WIDTH,
    height: PET_WINDOW_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'pet-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  petWindow.loadFile(path.join(__dirname, 'pet-renderer/index.html'));

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

function destroyPetWindow() {
  if (petWindow) {
    petWindow.close();
    petWindow = null;
  }
}

function switchPet(pet: LoadedPet) {
  petWindow?.webContents.send('pet:switch', {
    config: pet.config,
    imgUrl: pet.imgUrl,
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function checkForUpdates(showNoUpdate = false): Promise<void> {
  try {
    const api = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const res = await fetch(api, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rel = (await res.json()) as {
      tag_name?: string;
      body?: string;
      assets?: { name: string; browser_download_url: string }[];
    };
    const tag = (rel.tag_name || '').replace(/^v/, '');
    latestVersion = tag || null;

    if (tag && compareVersions(tag, appVersion) > 0) {
      const asset = (rel.assets || []).find((a) => a.name === UPDATE_ASSET_NAME);
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: i18n().updateAvailable,
        message: `${i18n().updateAvailable} v${tag} (当前 v${appVersion})`,
        detail: rel.body || '',
        buttons: [i18n().goDownload, i18n().later],
        defaultId: 0,
      });
      if (response === 0) {
        if (asset) {
          await downloadAndApplyUpdate(asset.browser_download_url);
        } else {
          shell.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`);
        }
      }
    } else if (showNoUpdate) {
      dialog.showMessageBox({
        type: 'info',
        title: i18n().updateLatest,
        message: `v${appVersion} - ${i18n().updateLatest}`,
        buttons: [i18n().ok],
      });
    }
    rebuildMenu();
  } catch (e) {
    if (showNoUpdate) {
      dialog.showErrorBox(i18n().updateFailed, (e as Error).message);
    }
  }
}

// 下载 GitHub Release 里的更新包，解压覆盖项目根目录，然后自动重启完成更新
async function downloadAndApplyUpdate(url: string): Promise<void> {
  const tmpZip = path.join(app.getPath('temp'), `skindeck-update-${Date.now()}.zip`);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(tmpZip, buf);

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: i18n().updateAvailable,
      message: i18n().updateLatest,
      detail: '即将重启以完成更新',
      buttons: [i18n().ok, i18n().later],
      defaultId: 0,
    });
    if (response !== 0) return;

    // 覆盖 dist / presets / pets / assets / package.json（相对项目根）
    execFileSync('unzip', ['-o', tmpZip, '-d', PROJECT_ROOT]);
    await fs.rm(tmpZip, { force: true });
    app.relaunch();
    app.quit();
  } catch (e) {
    dialog.showErrorBox(i18n().updateFailed, (e as Error).message);
    try {
      await fs.rm(tmpZip, { force: true });
    } catch {
      /* ignore */
    }
  }
}

async function loadAppVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    if (pkg.version) appVersion = pkg.version;
  } catch (_) {
    // 读取失败就用默认版本
  }
}

function i18n(): I18nStrings {
  return getLocale();
}

function initLanguage() {
  const sysLang = detectSystemLanguage();
  setLanguage(sysLang);
}

function changeLanguage(lang: LanguageCode) {
  setLanguage(lang);
  rebuildMenu();
  petWindow?.webContents.send('pet:i18n-update', getLocale());
}

async function rebuildMenu() {
  if (!tray || !skinManager) return;

  const presets = await skinManager.listPresets();
  const currentTheme = skinManager.getCurrentTheme();
  const target = getCurrentTarget();

  // 单个皮肤的菜单项（多语言名 + 换肤逻辑）
  const makeSkinItem = (p: (typeof presets)[number]): MenuItemConstructorOptions => ({
    label: localizedSkinName(p.theme),
    type: 'radio',
    checked: currentTheme?.theme.id === p.theme.id,
    click: async () => {
      try {
        // 先确保目标在运行（探测端口 / 自动启动，未安装则弹友好提示），
        // 否则直接注入会在目标 CDP 端口未开时抛原始 ECONNREFUSED 报错。
        const running = await ensureTargetRunning(target);
        if (!running) {
          rebuildMenu();
          return;
        }
        const options: ApplyOptions = { opacity: currentOpacity, backgroundMode: currentBackgroundMode };
        if (customImagePath) options.customImagePath = customImagePath;
        options.fontFamily = currentFontStack(p.theme);
        await skinManager!.applyTheme(p.theme.id, target, options);
        saveState();
        rebuildMenu();
      } catch (e) {
        dialog.showErrorBox(
          i18n().applySkinFailed,
          `${i18n().applySkinFailed}: ${localizedSkinName(p.theme)} → ${target.name}\n${(e as Error).message}`,
        );
      }
    },
  });

  // 皮肤按区域分组，区域名随语言切换（复用 codex-dream-skin 多语言皮肤名）
  const REGION_ORDER = ['cn', 'jp-kr', 'eu', 'sea', 'me'];
  const regionLabel: Record<string, string> = {
    cn: i18n().regionCn,
    'jp-kr': i18n().regionJpKr,
    eu: i18n().regionEu,
    sea: i18n().regionSea,
    me: i18n().regionMe,
  };
  const byRegion = new Map<string, (typeof presets)[number][]>();
  for (const p of presets) {
    const r = (p.theme.region as string) || 'cn';
    if (!byRegion.has(r)) byRegion.set(r, []);
    byRegion.get(r)!.push(p);
  }
  const themeItems: MenuItemConstructorOptions[] = REGION_ORDER
    .filter((r) => byRegion.has(r))
    .map((r) => ({
      label: regionLabel[r] || r,
      submenu: (byRegion.get(r)!)
        .slice()
        .sort((a, b) => localizedSkinName(a.theme).localeCompare(localizedSkinName(b.theme), getLanguage()))
        .map((p) => makeSkinItem(p)),
    }));
  // 兜底：不在已知区域的皮肤平铺到一个分组
  const knownRegions = new Set(REGION_ORDER);
  const others = presets.filter((p) => !knownRegions.has((p.theme.region as string) || 'cn'));
  if (others.length) {
    themeItems.push({
      label: i18n().skin,
      submenu: others.map((p) => makeSkinItem(p)),
    });
  }

  const targetItems: MenuItemConstructorOptions[] = TARGETS.map((t) => ({
    label: t.name,
    type: 'radio',
    checked: currentTargetId === t.id,
    click: async () => {
      currentTargetId = t.id;
      await applyCurrentTheme();
      rebuildMenu();
    },
  }));

  const opacityItems: MenuItemConstructorOptions[] = [
    { label: '100%', type: 'radio', checked: currentOpacity === 1, click: async () => { currentOpacity = 1; await applyCurrentTheme(); rebuildMenu(); } },
    { label: '80%', type: 'radio', checked: currentOpacity === 0.8, click: async () => { currentOpacity = 0.8; await applyCurrentTheme(); rebuildMenu(); } },
    { label: '60%', type: 'radio', checked: currentOpacity === 0.6, click: async () => { currentOpacity = 0.6; await applyCurrentTheme(); rebuildMenu(); } },
    { label: '40%', type: 'radio', checked: currentOpacity === 0.4, click: async () => { currentOpacity = 0.4; await applyCurrentTheme(); rebuildMenu(); } },
    { label: '20%', type: 'radio', checked: currentOpacity === 0.2, click: async () => { currentOpacity = 0.2; await applyCurrentTheme(); rebuildMenu(); } },
  ];

  const backgroundModeItems: MenuItemConstructorOptions[] = [
    { label: i18n().backgroundModeCover, type: 'radio', checked: currentBackgroundMode === 'cover', click: async () => { currentBackgroundMode = 'cover'; await applyCurrentTheme(); rebuildMenu(); } },
    { label: i18n().backgroundModeRepeat, type: 'radio', checked: currentBackgroundMode === 'repeat', click: async () => { currentBackgroundMode = 'repeat'; await applyCurrentTheme(); rebuildMenu(); } },
    { label: i18n().backgroundModeContain, type: 'radio', checked: currentBackgroundMode === 'contain', click: async () => { currentBackgroundMode = 'contain'; await applyCurrentTheme(); rebuildMenu(); } },
  ];

  const petItems: MenuItemConstructorOptions[] = pets.map((p, i) => ({
    label: p.config.name,
    type: 'radio',
    checked: i === currentPetIndex,
    click: () => {
      currentPetIndex = i;
      switchPet(p);
      rebuildMenu();
    },
  }));

  const languageItems: MenuItemConstructorOptions[] = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang.nativeName,
    type: 'radio',
    checked: getLanguage() === lang.code,
    click: () => changeLanguage(lang.code),
  }));

  const fontItems: MenuItemConstructorOptions[] = [
    {
      label: i18n().fontFollow,
      type: 'radio',
      checked: currentFontFamily === 'follow',
      click: async () => {
        currentFontFamily = 'follow';
        await applyCurrentTheme();
        rebuildMenu();
      },
    },
    { type: 'separator' },
    ...FONT_GROUPS.map((g) => ({
      label: i18n()[g.regionKey],
      submenu: g.fonts.map((f) => ({
        label: f.label,
        type: 'radio' as const,
        checked: currentFontFamily === f.stack,
        click: async () => {
          currentFontFamily = f.stack;
          await applyCurrentTheme();
          rebuildMenu();
        },
      })),
    })),
  ];

  const template: MenuItemConstructorOptions[] = [
    // ── Header ──
    { label: BRAND, enabled: false },
    { type: 'separator' },

    // ── Target App ──
    { label: i18n().targetApp, submenu: targetItems },

    // ── Skin (all skin settings grouped) ──
    {
      label: i18n().selectSkin,
      submenu: [
        ...themeItems,
        { type: 'separator' },
        { label: i18n().panelOpacity, submenu: opacityItems },
        { label: i18n().backgroundMode, submenu: backgroundModeItems },
        { type: 'separator' },
        {
          label: i18n().customBackground,
          click: async () => {
            const result = await dialog.showOpenDialog({
              title: i18n().selectImage,
              filters: [
                { name: i18n().imageFilter, extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
              ],
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              customImagePath = result.filePaths[0];
              await applyCurrentTheme();
              rebuildMenu();
            }
          },
        },
        {
          label: i18n().clearCustomImage,
          click: async () => {
            customImagePath = null;
            await applyCurrentTheme();
            rebuildMenu();
          },
        },
        {
          label: i18n().restoreDefault,
          click: async () => {
            try {
              await skinManager!.restore(target);
              customImagePath = null;
              currentOpacity = 1;
              currentBackgroundMode = 'cover';
              saveState();
              rebuildMenu();
            } catch (e) {
              dialog.showErrorBox(
                i18n().restoreFailed,
                `${(e as Error).message}`,
              );
            }
          },
        },
      ],
    },

    // ── Desktop Pet (all pet settings grouped) ──
    {
      label: i18n().desktopPet,
      submenu: [
        {
          label: petEnabled ? i18n().hidePet : i18n().showPet,
          click: () => {
            petEnabled = !petEnabled;
            if (petEnabled) {
              createPetWindow();
              if (pets[currentPetIndex]) switchPet(pets[currentPetIndex]);
            } else {
              destroyPetWindow();
            }
            rebuildMenu();
          },
        },
        { label: i18n().selectPet, submenu: petItems },
        {
          label: i18n().resetPosition,
          click: () => {
            const { workArea } = screen.getPrimaryDisplay();
            petWindow?.setPosition(
              workArea.width - PET_WINDOW_WIDTH - 30,
              workArea.height - PET_WINDOW_HEIGHT - 30,
            );
          },
        },
      ],
    },

    // ── Language ──
    { label: i18n().language, submenu: languageItems },
    // ── Font ──
    { label: i18n().font, submenu: fontItems },
    { type: 'separator' },

    // ── Status info ──
    { label: `${i18n().current}: ${target.name}`, enabled: false },
    {
      label: currentTheme
        ? `${i18n().skin}: ${currentTheme.theme.name} (${Math.round(currentOpacity * 100)}%)`
        : `${i18n().skin}: -`,
      enabled: false,
    },
    { type: 'separator' },

    // ── Folders & tools ──
    {
      label: i18n().openSkinFolder,
      click: () => shell.openPath(PRESETS_DIR),
    },
    {
      label: i18n().openPetFolder,
      click: () => shell.openPath(PETS_DIR),
    },
    { type: 'separator' },
    {
      label: latestVersion && compareVersions(latestVersion, appVersion) > 0
        ? `${i18n().newVersion} v${latestVersion}`
        : i18n().checkUpdate,
      click: () => checkForUpdates(true),
    },
    { label: `${i18n().version} v${appVersion}`, enabled: false },
    { label: i18n().quit, role: 'quit' },
  ];

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}

function createTrayIcon() {
  // macOS: prefer Template icon (auto-inverts for dark/light mode)
  // Other platforms: use normal PNG, fallback to SVG
  let icon: Electron.NativeImage;
  if (process.platform === 'darwin') {
    // Use the COLORFUL fox on macOS. A template image is rendered by macOS
    // using ONLY its alpha channel (flat monochrome silhouette), which turns
    // the pixel-art fox into a featureless gray blob — eyes/fur detail vanish.
    // The colorful PNG keeps the orange fur + eyes visible. The fox fills
    // ~86% of the canvas, so the standard click highlight behind it is
    // negligible (no "whole-icon shadow" like the old tiny camel had).
    icon = nativeImage.createFromPath(TRAY_ICON_PATH);
    if (icon.isEmpty()) icon = nativeImage.createFromPath(TRAY_ICON_TEMPLATE_PATH);
  } else {
    icon = nativeImage.createFromPath(TRAY_ICON_PATH);
  }
  if (icon.isEmpty()) {
    icon = nativeImage.createFromPath(path.resolve(__dirname, '../assets/tray-fox.svg'));
  }
  let trayIcon: Electron.NativeImage;
  if (icon.isEmpty()) {
    trayIcon = nativeImage.createEmpty();
  } else if (process.platform === 'darwin') {
    // Colorful icon: NOT marked as template, so macOS shows the real colors
    // (orange fur + eyes) instead of a flat monochrome silhouette.
    trayIcon = icon.resize({ width: 22, height: 22 });
  } else {
    trayIcon = icon.resize({ width: 18, height: 18 });
  }
  tray = new Tray(trayIcon);
  tray.setToolTip(BRAND);
  // 在菜单栏显示文字标题，确保在一堆 IDE 托盘图标里也能一眼找到本项目
  tray.setTitle(BRAND);
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

ipcMain.handle('pets:getI18n', async () => {
  return getLocale();
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

ipcMain.on('pet:hide', () => {
  petEnabled = false;
  destroyPetWindow();
  rebuildMenu();
});

ipcMain.on('app:quit', () => {
  app.quit();
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock.hide();

  initLanguage();
  await loadAppVersion();
  createTrayIcon();
  skinManager = new SkinManager(PRESETS_DIR);
  pets = await loadAllPets(PETS_DIR);

  const foxIndex = pets.findIndex(p => p.config.id === 'fox' || p.config.id === 'pet-openpets-fox');
  if (foxIndex >= 0) currentPetIndex = foxIndex;

  if (petEnabled) {
    createPetWindow();
  }

  await rebuildMenu();

  try {
    // 恢复上次持久化的选择（皮肤 / 目标 / 选项），重启后无需手动重切即可重新注入最新代码
    const persisted = loadPersistedState();
    if (persisted) {
      currentTargetId = persisted.targetId ?? currentTargetId;
      currentOpacity = persisted.opacity ?? currentOpacity;
      currentBackgroundMode = persisted.backgroundMode ?? currentBackgroundMode;
      currentFontFamily = persisted.fontFamily ?? currentFontFamily;
      customImagePath = persisted.customImagePath ?? null;
    }
    const target = getCurrentTarget();
    // 启动期只做"目标已在运行"的探测；未运行则不注入（也不自动拉起 IDE），
    // 避免直接注入抛 ECONNREFUSED 或干扰正在使用的 IDE。手动换肤走菜单项的
    // ensureTargetRunning（会按需启动）。
    if (await probeCdpPort(target.cdpPort, 1500)) {
      const applyId = persisted?.themeId ?? 'preset-guilin-ink-mountains';
      await skinManager.applyTheme(applyId, target, {
        opacity: currentOpacity,
        backgroundMode: currentBackgroundMode,
        fontFamily: currentFontStack(skinManager.getCurrentTheme()?.theme),
        ...(customImagePath ? { customImagePath } : {}),
      });
      // 把（可能已迁移的）状态落盘，使 skindeck-state.json 反映真实生效值，
      // 并写入 schemaVersion，避免每次重启都重复迁移。
      saveState();
    }
    rebuildMenu();
  } catch (e) {
    console.warn('默认主题应用失败:', (e as Error).message);
  }

  // 启动自动补回：IDE 整页重载后自动恢复皮肤
  startAutoHeal();

  // 启动时不再自动联网检查更新 —— 联网 fetch 在受限网络环境下会触发 Chromium
  // network service 崩溃并导致整个 App 退出。如需手动检查更新，使用托盘菜单里的
  // "Check for updates" 项（checkForUpdates 函数已保留）。
});

app.on('window-all-closed', () => {
  // 保持运行
});
