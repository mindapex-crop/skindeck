#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const petsDir = path.join(projectRoot, 'pets');
const tmpDir = '/tmp/third-party-pets/openpets-batch';

async function getPetsFromCatalog() {
  console.log('从 OpenPets catalog 获取宠物列表...');
  const response = await fetch('https://openpets.dev/pets/catalog.v2.json');
  const data = await response.json();
  console.log(`  找到 ${data.pets.length} 款宠物\n`);
  return data.pets;
}

async function downloadPet(pet) {
  const zipUrl = pet.zip;
  const zipPath = path.join(tmpDir, `${pet.id}.zip`);
  const extractDir = path.join(tmpDir, pet.id);

  try {
    await fs.access(extractDir);
    const petJsonPath = path.join(extractDir, 'pet.json');
    const spritesheetPath = path.join(extractDir, 'spritesheet.webp');
    try {
      await fs.access(petJsonPath);
      await fs.access(spritesheetPath);
      return extractDir;
    } catch {}
  } catch {}

  await fs.mkdir(tmpDir, { recursive: true });

  try {
    const response = await fetch(zipUrl, { redirect: 'follow' });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(zipPath, buffer);

    const { execSync } = await import('node:child_process');
    execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: 'pipe' });

    await fs.unlink(zipPath).catch(() => {});

    const petJsonPath = path.join(extractDir, 'pet.json');
    const spritesheetPath = path.join(extractDir, 'spritesheet.webp');
    try {
      await fs.access(petJsonPath);
      await fs.access(spritesheetPath);
      return extractDir;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function importPet(srcDir, pet) {
  const destDir = path.join(petsDir, `pet-openpets-${pet.id}`);
  const srcPetJson = path.join(srcDir, 'pet.json');
  const srcSpritesheet = path.join(srcDir, 'spritesheet.webp');

  try {
    await fs.access(destDir);
    return 'skipped';
  } catch {}

  const raw = await fs.readFile(srcPetJson, 'utf8');
  const petData = JSON.parse(raw);

  await fs.mkdir(destDir, { recursive: true });

  await fs.copyFile(srcSpritesheet, path.join(destDir, 'spritesheet.webp'));
  await fs.writeFile(path.join(destDir, 'pet.json'), JSON.stringify(petData, null, 2));

  return 'imported';
}

async function main() {
  const limit = parseInt(process.argv[2]) || 300;
  const allPets = await getPetsFromCatalog();
  const toImport = allPets.slice(0, limit);

  console.log(`开始导入 ${toImport.length} 款 OpenPets 宠物...\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < toImport.length; i++) {
    const pet = toImport[i];
    const srcDir = await downloadPet(pet);
    if (srcDir) {
      const result = await importPet(srcDir, pet);
      if (result === 'imported') {
        successCount++;
        console.log(`  ✓ ${pet.displayName || pet.id}`);
      } else {
        skipCount++;
      }
    } else {
      failCount++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  ... 进度: ${i + 1}/${toImport.length} (成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount})`);
    }
  }

  console.log(`\n完成！成功导入 ${successCount} 款新宠物，跳过 ${skipCount} 款已存在，失败 ${failCount} 款\n`);
}

main().catch(console.error);
