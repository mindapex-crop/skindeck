import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { detectSystemLanguage } from '@skins/shared';

export type RegionCode = 'cn' | 'jp-kr' | 'eu' | 'sea' | 'me';

export interface UserPaths {
  appDataDir: string;
  skinsDir: string;
  petsDir: string;
  configFile: string;
}

export interface AppConfig {
  version: number;
  region?: RegionCode;
  language?: string;
  currentSkinId?: string;
  currentPetId?: string;
  settings: {
    opacity: number;
    backgroundMode: 'cover' | 'repeat' | 'contain';
    petEnabled: boolean;
    autoUpdate: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  settings: {
    opacity: 1,
    backgroundMode: 'repeat',
    petEnabled: true,
    autoUpdate: true,
  },
};

function getAppDataDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Skins');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Skins');
  }
  return path.join(home, '.local', 'share', 'skins');
}

export function getUserPaths(): UserPaths {
  const appDataDir = getAppDataDir();
  return {
    appDataDir,
    skinsDir: path.join(appDataDir, 'skins'),
    petsDir: path.join(appDataDir, 'pets'),
    configFile: path.join(appDataDir, 'config.json'),
  };
}

export function detectRegion(): RegionCode {
  const lang = detectSystemLanguage();
  const langLower = lang.toLowerCase();

  if (langLower.startsWith('zh')) return 'cn';
  if (langLower.startsWith('ja') || langLower.startsWith('ko')) return 'jp-kr';
  if (langLower.startsWith('ar') || langLower.startsWith('he') || langLower.startsWith('fa')) return 'me';
  return 'eu';
}

export const REGION_DEFAULT_SKINS: Record<RegionCode, string[]> = {
  cn: ['preset-forbidden-city-vermilion', 'preset-guilin-ink-mountains', 'preset-jiangnan-misty-town'],
  'jp-kr': ['preset-sakura-blizzard', 'preset-kyoto-autumn-maple', 'preset-seoul-han-river-night'],
  eu: ['preset-paris-eiffel-night', 'preset-nyc-skyline-dusk', 'preset-nordic-aurora'],
  sea: ['preset-angkor-wat-dawn', 'preset-bali-rice-terraces', 'preset-singapore-marina-bay'],
  me: ['preset-burj-khalifa-night', 'preset-petra-rose-city', 'preset-desert-stargazing'],
};

export const REGION_DEFAULT_PETS: Record<RegionCode, string[]> = {
  cn: ['pet-panda', 'pet-red-panda', 'pet-fennec-fox'],
  'jp-kr': ['pet-shiba-inu', 'pet-calico-cat', 'pet-fennec-fox'],
  eu: ['pet-golden-retriever', 'pet-orange-cat', 'pet-fennec-fox'],
  sea: ['pet-fennec-fox', 'pet-orange-cat', 'pet-shiba-inu'],
  me: ['pet-camel', 'pet-fennec-fox', 'pet-arctic-fox'],
};

export async function ensureUserDirs(): Promise<UserPaths> {
  const paths = getUserPaths();

  await fs.mkdir(paths.appDataDir, { recursive: true });
  await fs.mkdir(paths.skinsDir, { recursive: true });
  await fs.mkdir(paths.petsDir, { recursive: true });

  if (!existsSync(paths.configFile)) {
    const region = detectRegion();
    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      region,
      language: detectSystemLanguage(),
    };
    await fs.writeFile(paths.configFile, JSON.stringify(config, null, 2));
  }

  return paths;
}

export async function loadConfig(): Promise<AppConfig> {
  const paths = getUserPaths();
  try {
    const raw = await fs.readFile(paths.configFile, 'utf8');
    const config = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...config,
      settings: {
        ...DEFAULT_CONFIG.settings,
        ...config.settings,
      },
    };
  } catch {
    const region = detectRegion();
    return {
      ...DEFAULT_CONFIG,
      region,
      language: detectSystemLanguage(),
    };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const paths = getUserPaths();
  await fs.mkdir(paths.appDataDir, { recursive: true });
  await fs.writeFile(paths.configFile, JSON.stringify(config, null, 2));
}

export async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const config = await loadConfig();
  const updated = {
    ...config,
    ...partial,
    settings: {
      ...config.settings,
      ...partial.settings,
    },
  };
  await saveConfig(updated);
  return updated;
}

export async function copyBundleSkinToUser(skinId: string, bundleSkinsDir: string): Promise<string> {
  const paths = await ensureUserDirs();
  const sourceDir = path.join(bundleSkinsDir, skinId);
  const targetDir = path.join(paths.skinsDir, skinId);

  if (existsSync(targetDir)) {
    return targetDir;
  }

  await fs.mkdir(targetDir, { recursive: true });

  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const src = path.join(sourceDir, entry.name);
      const dst = path.join(targetDir, entry.name);
      if (entry.isFile()) {
        await fs.copyFile(src, dst);
      } else if (entry.isDirectory()) {
        await fs.cp(src, dst, { recursive: true });
      }
    }
  } catch (e) {
    console.warn(`复制皮肤 ${skinId} 失败: ${(e as Error).message}`);
  }

  return targetDir;
}

export async function copyBundlePetToUser(petId: string, bundlePetsDir: string): Promise<string> {
  const paths = await ensureUserDirs();
  const sourceDir = path.join(bundlePetsDir, petId);
  const targetDir = path.join(paths.petsDir, petId);

  if (existsSync(targetDir)) {
    return targetDir;
  }

  await fs.mkdir(targetDir, { recursive: true });

  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const src = path.join(sourceDir, entry.name);
      const dst = path.join(targetDir, entry.name);
      if (entry.isFile()) {
        await fs.copyFile(src, dst);
      } else if (entry.isDirectory()) {
        await fs.cp(src, dst, { recursive: true });
      }
    }
  } catch (e) {
    console.warn(`复制宠物 ${petId} 失败: ${(e as Error).message}`);
  }

  return targetDir;
}

export async function installSkinFromUrl(url: string, skinId: string): Promise<string> {
  const paths = await ensureUserDirs();
  const targetDir = path.join(paths.skinsDir, skinId);

  if (existsSync(targetDir)) {
    return targetDir;
  }

  throw new Error('从 URL 安装皮肤功能尚未实现');
}

export async function installPetFromUrl(url: string, petId: string): Promise<string> {
  const paths = await ensureUserDirs();
  const targetDir = path.join(paths.petsDir, petId);

  if (existsSync(targetDir)) {
    return targetDir;
  }

  throw new Error('从 URL 安装宠物功能尚未实现');
}
