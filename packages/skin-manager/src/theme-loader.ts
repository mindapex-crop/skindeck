import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Theme } from '@skins/shared';

export interface LoadedTheme {
  theme: Theme;
  themeDir: string;
  imgAbs: string;
  /** file:// URL（仅作元数据/调试用） */
  imgUrl: string;
  /** base64 data URI —— 注入 CSS 背景图时使用，绕开跨源 file:// 拦截 */
  imgDataUri: string;
  imgSize: number;
}

function mimeOf(p: string): string {
  const ext = path.extname(p).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/png';
}

/** 读取图片文件并转为 base64 data URI（内联进 CSS，避免 Chromium 跨源 file:// 拦截） */
export async function fileToDataUri(absPath: string): Promise<string> {
  const buf = await fs.readFile(absPath);
  const mime = mimeOf(absPath);
  return `data:${mime};base64,${buf.toString('base64')}`;
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
  // 关键修复：注入用 data URI，Chromium 才会真正加载背景图
  const imgDataUri = await fileToDataUri(imgAbs);

  return { theme, themeDir, imgAbs, imgUrl, imgDataUri, imgSize: stat.size };
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
