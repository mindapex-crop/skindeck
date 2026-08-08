import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PetConfig, PetRenderType, SpritesheetConfig } from '@skins/shared';

export interface LoadedPet {
  config: PetConfig;
  petDir: string;
  imgAbs?: string;
  imgUrl?: string;
  modelUrl?: string;
  modelAbs?: string;
  resourcesDir?: string;
}

const VALID_RENDER_TYPES: PetRenderType[] = ['image', 'live2d', 'spritesheet'];

const STANDARD_PET_HEIGHT = 150;
const MIN_PET_WIDTH = 80;
const MAX_PET_WIDTH = 200;

function normalizePetSize(config: PetConfig): PetConfig {
  if (config.renderType === 'spritesheet') {
    const spriteH = config.spritesheet?.frameHeight || 208;
    const spriteW = config.spritesheet?.frameWidth || 192;
    const scale = STANDARD_PET_HEIGHT / spriteH;
    return {
      ...config,
      width: Math.min(MAX_PET_WIDTH, Math.max(MIN_PET_WIDTH, Math.round(spriteW * scale))),
      height: STANDARD_PET_HEIGHT,
    };
  }

  if (config.width && config.height) {
    const scale = STANDARD_PET_HEIGHT / config.height;
    const newWidth = Math.min(MAX_PET_WIDTH, Math.max(MIN_PET_WIDTH, Math.round(config.width * scale)));
    return {
      ...config,
      width: newWidth,
      height: STANDARD_PET_HEIGHT,
    };
  }

  return {
    ...config,
    width: 150,
    height: STANDARD_PET_HEIGHT,
  };
}

const DEFAULT_SPRITESHEET_CONFIG: SpritesheetConfig = {
  spritesheetPath: 'spritesheet.webp',
  frameWidth: 192,
  frameHeight: 208,
  columns: 8,
  rows: 9,
  states: {
    idle: { row: 0, frames: 6, durationMs: 5500, iterations: 'infinite' },
    'running-right': { row: 1, frames: 8, durationMs: 1060, iterations: 'infinite' },
    'running-left': { row: 2, frames: 8, durationMs: 1060, iterations: 'infinite' },
    waving: { row: 3, frames: 4, durationMs: 700, iterations: 2 },
    jumping: { row: 4, frames: 5, durationMs: 840, iterations: 2 },
    failed: { row: 5, frames: 8, durationMs: 1220, iterations: 2 },
    waiting: { row: 6, frames: 6, durationMs: 1010, iterations: 'infinite' },
    running: { row: 7, frames: 6, durationMs: 820, iterations: 'infinite' },
    review: { row: 8, frames: 6, durationMs: 1030, iterations: 'infinite' },
  },
};

function normalizeOpenPetsFormat(raw: Record<string, unknown>): PetConfig {
  const hasSpritesheet = 'spritesheetPath' in raw;
  const hasRenderType = 'renderType' in raw;

  if (hasRenderType) {
    return raw as unknown as PetConfig;
  }

  const id = (raw.id as string) || 'unknown';
  const displayName = (raw.displayName as string) || (raw.name as string) || 'Unknown Pet';
  const description = (raw.description as string) || '';
  const category = (raw.category as string) || undefined;
  const spritesheetPath = (raw.spritesheetPath as string) || 'spritesheet.webp';

  return {
    id,
    name: displayName,
    displayName,
    description,
    category,
    renderType: hasSpritesheet ? 'spritesheet' : 'image',
    width: DEFAULT_SPRITESHEET_CONFIG.frameWidth,
    height: DEFAULT_SPRITESHEET_CONFIG.frameHeight + 22,
    image: hasSpritesheet ? undefined : spritesheetPath,
    spritesheet: hasSpritesheet
      ? {
          ...DEFAULT_SPRITESHEET_CONFIG,
          spritesheetPath,
          category,
        }
      : undefined,
    defaultMood: 'idle',
  };
}

export async function loadPet(petDir: string): Promise<LoadedPet> {
  const petPath = path.join(petDir, 'pet.json');
  const raw = await fs.readFile(petPath, 'utf8');
  const rawConfig = JSON.parse(raw) as Record<string, unknown>;

  let config = normalizeOpenPetsFormat(rawConfig);
  config = normalizePetSize(config);

  if (!VALID_RENDER_TYPES.includes(config.renderType)) {
    throw new Error(`不支持的 renderType: ${config.renderType}，支持: ${VALID_RENDER_TYPES.join(', ')}`);
  }

  const dirAbs = path.resolve(petDir);
  const result: LoadedPet = {
    config,
    petDir,
  };

  if (config.renderType === 'image') {
    if (!config.image) throw new Error('image 类型桌宠必须提供 image 字段');
    const imgAbs = path.resolve(petDir, config.image);
    if (!imgAbs.startsWith(dirAbs + path.sep)) {
      throw new Error(`image 字段必须指向 pet-dir 内的文件`);
    }
    try {
      await fs.access(imgAbs);
    } catch {
      throw new Error(`图片不存在: ${imgAbs}`);
    }
    result.imgAbs = imgAbs;
    result.imgUrl = pathToFileURL(imgAbs).href;
  }

  if (config.renderType === 'spritesheet') {
    const spritesheetPath = config.spritesheet?.spritesheetPath || 'spritesheet.webp';
    const imgAbs = path.resolve(petDir, spritesheetPath);
    if (!imgAbs.startsWith(dirAbs + path.sep)) {
      throw new Error(`spritesheetPath 必须指向 pet-dir 内的文件`);
    }
    try {
      await fs.access(imgAbs);
    } catch {
      throw new Error(`精灵图不存在: ${imgAbs}`);
    }
    result.imgAbs = imgAbs;
    result.imgUrl = pathToFileURL(imgAbs).href;
  }

  if (config.renderType === 'live2d') {
    if (!config.live2d?.modelFile) {
      throw new Error('live2d 类型桌宠必须提供 live2d.modelFile 字段');
    }
    const modelAbs = path.resolve(petDir, config.live2d.modelFile);
    if (!modelAbs.startsWith(dirAbs + path.sep)) {
      throw new Error(`modelFile 必须指向 pet-dir 内的文件`);
    }
    try {
      await fs.access(modelAbs);
    } catch {
      throw new Error(`Live2D 模型文件不存在: ${modelAbs}`);
    }
    result.modelAbs = modelAbs;
    result.modelUrl = pathToFileURL(modelAbs).href;
    result.resourcesDir = pathToFileURL(path.dirname(modelAbs)).href;
  }

  return result;
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
