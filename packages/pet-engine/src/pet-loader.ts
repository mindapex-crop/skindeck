import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PetConfig } from '@skins/shared';

export interface LoadedPet {
  config: PetConfig;
  petDir: string;
  imgAbs: string;
  imgUrl: string;
}

export async function loadPet(petDir: string): Promise<LoadedPet> {
  const petPath = path.join(petDir, 'pet.json');
  const raw = await fs.readFile(petPath, 'utf8');
  const config = JSON.parse(raw) as PetConfig;

  const required: (keyof PetConfig)[] = ['id', 'name', 'image', 'width', 'height'];
  for (const k of required) {
    if (config[k] === undefined || config[k] === null) {
      throw new Error(`pet.json 缺少字段: ${String(k)}`);
    }
  }

  const imgAbs = path.resolve(petDir, config.image);
  const dirAbs = path.resolve(petDir);
  if (!imgAbs.startsWith(dirAbs + path.sep)) {
    throw new Error(`image 字段必须指向 pet-dir 内的文件`);
  }

  try {
    await fs.access(imgAbs);
  } catch {
    throw new Error(`图片不存在: ${imgAbs}`);
  }

  const imgUrl = pathToFileURL(imgAbs).href;
  return { config, petDir, imgAbs, imgUrl };
}

export async function listPets(petsDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(petsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith('pet-'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export async function loadAllPets(petsDir: string): Promise<LoadedPet[]> {
  const names = await listPets(petsDir);
  const results: LoadedPet[] = [];
  for (const name of names) {
    try {
      results.push(await loadPet(path.join(petsDir, name)));
    } catch (e) {
      console.warn(`跳过桌宠 ${name}: ${(e as Error).message}`);
    }
  }
  return results;
}
