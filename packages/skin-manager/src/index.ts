import { injectTheme, restoreTheme, detectTarget } from '@skins/cdp-injector';
import { loadTheme, loadAllPresets, type LoadedTheme } from './theme-loader.js';
import type { TargetConfig, InjectResult, RestoreResult } from '@skins/shared';

export class SkinManager {
  private presetsDir: string;
  private currentTheme: LoadedTheme | null = null;
  private currentTarget: TargetConfig | null = null;

  constructor(presetsDir: string) {
    this.presetsDir = presetsDir;
  }

  async listPresets(): Promise<LoadedTheme[]> {
    return loadAllPresets(this.presetsDir);
  }

  async applyTheme(themeId: string, target: TargetConfig): Promise<InjectResult[]> {
    const themeDir = `${this.presetsDir}/${themeId}`;
    const loaded = await loadTheme(themeDir);
    const results = await injectTheme(target.cdpPort, loaded.theme, loaded.imgUrl);
    this.currentTheme = loaded;
    this.currentTarget = target;
    return results;
  }

  async restore(target: TargetConfig): Promise<RestoreResult[]> {
    const results = await restoreTheme(target.cdpPort);
    this.currentTheme = null;
    this.currentTarget = null;
    return results;
  }

  async detect(port: number) {
    return detectTarget(port);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

export { loadTheme, loadAllPresets, listPresets } from './theme-loader.js';
