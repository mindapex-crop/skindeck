import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import type { PetConfig, PetRenderType } from '@skins/shared';
import { pathToFileURL } from 'node:url';
import { t } from '@skins/shared';

export type PetSource = 'local' | 'openpets' | 'live2d' | 'bongocat' | 'marketplace';

export interface PetSourceConfig {
  source: PetSource;
  baseUrl?: string;
  apiEndpoint?: string;
  enabled: boolean;
}

export interface PetCatalogItem {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  source: PetSource;
  renderType: PetRenderType;
  thumbnailUrl?: string;
  downloadUrl?: string;
  installed: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  version?: string;
  likes?: number;
  downloads?: number;
}

export interface MarketCategory {
  id: string;
  name: string;
  icon?: string;
  count: number;
}

export interface MarketFilter {
  source?: PetSource;
  category?: string;
  search?: string;
  sort?: 'popular' | 'newest' | 'name';
  page?: number;
  pageSize?: number;
}

export interface MarketResult {
  items: PetCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: MarketCategory[];
}

export const DEFAULT_SOURCES: Record<PetSource, PetSourceConfig> = {
  local: { source: 'local', enabled: true },
  openpets: {
    source: 'openpets',
    baseUrl: 'https://openpets.dev',
    apiEndpoint: 'https://api.openpets.dev/v1',
    enabled: true,
  },
  live2d: {
    source: 'live2d',
    enabled: true,
  },
  bongocat: {
    source: 'bongocat',
    baseUrl: 'https://github.com/ayangweb/bongocat',
    enabled: true,
  },
  marketplace: {
    source: 'marketplace',
    baseUrl: 'https://market.skins.app',
    apiEndpoint: 'https://api.market.skins.app/v1',
    enabled: false,
  },
};

export interface PetPackage {
  config: PetConfig;
  petDir: string;
  source: PetSource;
}

export async function scanLocalPets(petsDir: string): Promise<PetPackage[]> {
  const results: PetPackage[] = [];

  if (!existsSync(petsDir)) return results;

  try {
    const entries = await fs.readdir(petsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const petDir = path.join(petsDir, entry.name);
      const petJsonPath = path.join(petDir, 'pet.json');

      if (!existsSync(petJsonPath)) continue;

      try {
        const raw = await fs.readFile(petJsonPath, 'utf8');
        const config = JSON.parse(raw) as PetConfig;
        results.push({ config, petDir, source: 'local' });
      } catch (e) {
        console.warn(`[pet-market] skipping ${entry.name}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    console.warn(`[pet-market] scanLocalPets failed: ${(e as Error).message}`);
  }

  return results.sort((a, b) => a.config.name.localeCompare(b.config.name));
}

export async function fetchOpenPetsCatalog(filter: MarketFilter = {}): Promise<MarketResult> {
  const categories: MarketCategory[] = [
    { id: 'all', name: t('categoryAll'), count: 0 },
    { id: 'animal', name: t('categoryAnimal'), count: 0 },
    { id: 'character', name: t('categoryCharacter'), count: 0 },
    { id: 'robot', name: t('categoryRobot'), count: 0 },
    { id: 'fantasy', name: t('categoryFantasy'), count: 0 },
  ];

  return {
    items: [],
    total: 0,
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
    categories,
  };
}

export async function fetchMarketCatalog(filter: MarketFilter = {}): Promise<MarketResult> {
  const categories: MarketCategory[] = [
    { id: 'all', name: t('categoryAll'), count: 0 },
    { id: 'cute', name: t('categoryCute'), count: 0 },
    { id: 'cool', name: t('categoryCool'), count: 0 },
    { id: 'anime', name: t('categoryAnime'), count: 0 },
    { id: 'minimal', name: t('categoryMinimal'), count: 0 },
  ];

  return {
    items: [],
    total: 0,
    page: filter.page || 1,
    pageSize: filter.pageSize || 20,
    categories,
  };
}

export async function installPetFromMarket(petId: string, petsDir: string): Promise<string> {
  const targetDir = path.join(petsDir, petId);

  if (existsSync(targetDir)) {
    return targetDir;
  }

  throw new Error(t('marketDownloadNotImplemented', { petId }));
}

export async function uninstallPet(petId: string, petsDir: string): Promise<boolean> {
  const targetDir = path.join(petsDir, petId);

  if (!existsSync(targetDir)) {
    return false;
  }

  try {
    await fs.rm(targetDir, { recursive: true, force: true });
    return true;
  } catch (e) {
    console.warn(`[pet-market] uninstallPet failed: ${(e as Error).message}`);
    return false;
  }
}

export async function exportPet(petId: string, petsDir: string, exportPath: string): Promise<boolean> {
  const sourceDir = path.join(petsDir, petId);

  if (!existsSync(sourceDir)) {
    return false;
  }

  try {
    await fs.cp(sourceDir, exportPath, { recursive: true });
    return true;
  } catch (e) {
    console.warn(`[pet-market] exportPet failed: ${(e as Error).message}`);
    return false;
  }
}

export async function validatePetPackage(petDir: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const petJsonPath = path.join(petDir, 'pet.json');
  if (!existsSync(petJsonPath)) {
    errors.push(t('missingPetJson'));
    return { valid: false, errors };
  }

  try {
    const raw = await fs.readFile(petJsonPath, 'utf8');
    const config = JSON.parse(raw) as Partial<PetConfig>;

    if (!config.id) errors.push(t('missingField', { field: 'id' }));
    if (!config.name) errors.push(t('missingField', { field: 'name' }));
    if (!config.renderType) errors.push(t('missingField', { field: 'renderType' }));

    if (config.renderType === 'image' && config.image) {
      const imgPath = path.join(petDir, config.image);
      if (!existsSync(imgPath)) errors.push(t('imageFileNotFound', { path: config.image }));
    }

    if (config.renderType === 'spritesheet' && config.spritesheet?.spritesheetPath) {
      const imgPath = path.join(petDir, config.spritesheet.spritesheetPath);
      if (!existsSync(imgPath)) errors.push(t('spritesheetNotFound', { path: config.spritesheet.spritesheetPath }));
    }

    if (config.renderType === 'live2d' && config.live2d?.modelFile) {
      const modelPath = path.join(petDir, config.live2d.modelFile);
      if (!existsSync(modelPath)) errors.push(t('live2dModelNotFound', { path: config.live2d.modelFile }));
    }
  } catch (e) {
    errors.push(t('petJsonParseError', { error: (e as Error).message }));
  }

  return { valid: errors.length === 0, errors };
}

export function petToCatalogItem(pet: PetPackage, installed = true): PetCatalogItem {
  return {
    id: pet.config.id,
    name: pet.config.name,
    displayName: pet.config.displayName || pet.config.name,
    description: pet.config.description,
    source: pet.source,
    renderType: pet.config.renderType,
    installed,
    category: pet.config.category,
  };
}

export function getDataUrlForPetImage(petDir: string, imageFile: string): string {
  const imgPath = path.resolve(petDir, imageFile);
  if (!existsSync(imgPath)) return '';
  return pathToFileURL(imgPath).href;
}
