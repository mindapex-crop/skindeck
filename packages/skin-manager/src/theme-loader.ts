import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Theme } from '@skins/shared';

export interface LoadedTheme {
  theme: Theme;
  themeDir: string;
  imgAbs: string;
  imgUrl: string;
  imgSize: number;
}

export async function loadTheme(themeDir: string): Promise<LoadedTheme> {
  const themePath = path.join(themeDir, 'theme.json');
  const raw = await fs.readFile(themePath, 'utf8');
  const theme = JSON.parse(raw) as Theme;

  const required: (keyof Theme)[] = ['id', 'name', 'image'];
  for (const k of required) {
    if (!theme[k]) throw new Error(`theme.json 缺少字段: ${String(k)}`);
  }

  const imgAbs = path.resolve(themeDir, theme.image);
  const dirAbs = path.resolve(themeDir);
  if (!imgAbs.startsWith(dirAbs + path.sep)) {
    throw new Error(`image 字段必须指向 theme-dir 内的文件`);
  }

  try {
    await fs.access(imgAbs);
  } catch {
    throw new Error(`图片不存在: ${imgAbs}`);
  }

  const stat = await fs.stat(imgAbs);
  const imgUrl = pathToFileURL(imgAbs).href;

  return { theme, themeDir, imgAbs, imgUrl, imgSize: stat.size };
}

export async function listPresets(presetsDir: string): Promise<string[]> {
  const entries = await fs.readdir(presetsDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('preset-'))
    .map((e) => e.name);
  return dirs.sort();
}

export async function loadAllPresets(presetsDir: string): Promise<LoadedTheme[]> {
  const names = await listPresets(presetsDir);
  const results: LoadedTheme[] = [];
  for (const name of names) {
    try {
      const loaded = await loadTheme(path.join(presetsDir, name));
      results.push(loaded);
    } catch (e) {
      console.warn(`跳过预设 ${name}: ${(e as Error).message}`);
    }
  }
  return results;
}
