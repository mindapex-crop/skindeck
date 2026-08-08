import { injectTheme, restoreTheme, detectTarget } from '@skins/cdp-injector';
import { loadTheme, loadAllPresets, type LoadedTheme } from './theme-loader.js';
import type { TargetConfig, InjectResult, RestoreResult } from '@skins/shared';

export type {
  UserPaths,
  AppConfig,
  RegionCode,
} from './user-dirs.js';

export {
  getUserPaths,
  ensureUserDirs,
  loadConfig,
  saveConfig,
  updateConfig,
  detectRegion,
  REGION_DEFAULT_SKINS,
  REGION_DEFAULT_PETS,
  copyBundleSkinToUser,
  copyBundlePetToUser,
  installSkinFromUrl,
  installPetFromUrl,
} from './user-dirs.js';

export interface ApplyOptions {
  opacity?: number;
  customImagePath?: string;
  backgroundMode?: 'cover' | 'repeat' | 'contain';
  /** Optional UI font-family CSS stack to override the target app's font. */
  fontFamily?: string;
  /**
   * 自动贴合：注入运行时脚本分析背景图，自动算焦点/安全区/主题色并贴合。
   * 不传时回退到 theme.art.autoFit（预设可声明开启）。
   */
  autoFit?: boolean;
}

export class SkinManager {
  private presetsDir: string;
  private currentTheme: LoadedTheme | null = null;
  private currentTarget: TargetConfig | null = null;
  private currentOptions: ApplyOptions = {};

  constructor(presetsDir: string) {
    this.presetsDir = presetsDir;
  }

  async listPresets(): Promise<LoadedTheme[]> {
    return loadAllPresets(this.presetsDir);
  }

  async applyTheme(themeId: string, target: TargetConfig, options: ApplyOptions = {}): Promise<InjectResult[]> {
    const themeDir = `${this.presetsDir}/${themeId}`;
    const loaded = await loadTheme(themeDir);
    
    const injectOptions = {
      opacity: options.opacity,
      customImageUrl: options.customImagePath 
        ? `file://${options.customImagePath}`
        : undefined,
      backgroundMode: options.backgroundMode,
      fontFamily: options.fontFamily,
      autoFit: options.autoFit ?? loaded.theme.art?.autoFit ?? false,
    };
    
    const results = await injectTheme(target.cdpPort, loaded.theme, loaded.imgUrl, injectOptions);
    this.currentTheme = loaded;
    this.currentTarget = target;
    this.currentOptions = options;
    return results;
  }

  async restore(target: TargetConfig): Promise<RestoreResult[]> {
    const results = await restoreTheme(target.cdpPort);
    this.currentTheme = null;
    this.currentTarget = null;
    this.currentOptions = {};
    return results;
  }

  async detect(port: number) {
    return detectTarget(port);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getCurrentOptions() {
    return this.currentOptions;
  }
}

export { loadTheme, loadAllPresets, listPresets } from './theme-loader.js';
