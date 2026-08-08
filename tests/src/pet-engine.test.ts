import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PetEngine, loadPet, listPets, loadAllPets } from '@skins/pet-engine';
import type { PetConfig } from '@skins/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const petsDir = path.resolve(__dirname, '../../pets');

const testConfig: PetConfig = {
  id: 'test-pet',
  name: 'Test Pet',
  renderType: 'image',
  image: 'test.png',
  width: 100,
  height: 100,
  defaultMood: 'idle',
};

test('PetEngine: 初始状态正确', () => {
  const engine = new PetEngine(testConfig, { x: 200, y: 300 });
  const state = engine.getState();
  assert.equal(state.mood, 'idle');
  assert.equal(state.action, 'idle');
  assert.equal(state.position.x, 200);
  assert.equal(state.position.y, 300);
  engine.destroy();
});

test('PetEngine: trigger click 改变 action 和 mood', () => {
  const engine = new PetEngine(testConfig);
  const result = engine.trigger('click');
  assert.equal(result.action, 'click');
  assert.equal(engine.getState().action, 'click');
  engine.destroy();
});

test('PetEngine: trigger hover 改变 action', () => {
  const engine = new PetEngine(testConfig);
  engine.trigger('hover');
  assert.equal(engine.getState().action, 'hover');
  engine.destroy();
});

test('PetEngine: setPosition 更新位置', () => {
  const engine = new PetEngine(testConfig);
  engine.setPosition(500, 600);
  assert.deepEqual(engine.getState().position, { x: 500, y: 600 });
  engine.destroy();
});

test('PetEngine: setMood 更新心情', () => {
  const engine = new PetEngine(testConfig);
  engine.setMood('happy');
  assert.equal(engine.getState().mood, 'happy');
  engine.destroy();
});

test('PetEngine: subscribe 订阅状态变化', () => {
  const engine = new PetEngine(testConfig);
  let received: unknown = null;
  const unsub = engine.subscribe((s) => { received = s; });
  engine.setMood('excited');
  assert.ok(received !== null, '应收到状态更新');
  assert.equal((received as { mood: string }).mood, 'excited');
  unsub();
  engine.destroy();
});

test('PetEngine: 自定义 interaction 配置生效', () => {
  const config: PetConfig = {
    ...testConfig,
    interactions: [
      { trigger: 'click', action: 'talk', duration: 100, moodChange: 'happy', message: '你好！' },
    ],
  };
  const engine = new PetEngine(config);
  const result = engine.trigger('click');
  assert.equal(result.action, 'talk');
  assert.equal(result.message, '你好！');
  assert.equal(engine.getState().mood, 'happy');
  engine.destroy();
});

test('loadPet: 能加载一个真实桌宠并解析完整配置', async () => {
  const names = await listPets(petsDir);
  assert.ok(names.length >= 1, '应至少有一个桌宠');
  const loaded = await loadPet(path.join(petsDir, names[0]));
  assert.ok(loaded.config.id && loaded.config.id.length > 0, 'id 应非空');
  assert.ok(loaded.config.name && loaded.config.name.length > 0, 'name 应非空');
  assert.ok(loaded.config.width > 0 && loaded.config.height > 0, '尺寸应有效');
  assert.ok(
    loaded.imgUrl?.startsWith('file://') || loaded.modelUrl?.startsWith('file://'),
    '应有 file:// 资源 URL',
  );
});

test('loadPet: 桌宠配置字段合法（renderType 受支持、interactions 为数组）', async () => {
  const names = await listPets(petsDir);
  assert.ok(names.length >= 1);
  const loaded = await loadPet(path.join(petsDir, names[0]));
  assert.ok(
    ['image', 'live2d', 'spritesheet'].includes(loaded.config.renderType),
    `renderType 应受支持, 实际: ${loaded.config.renderType}`,
  );
  assert.ok(Array.isArray(loaded.config.interactions ?? []), 'interactions 应为数组');
});

test('loadPet: 拒绝无效的 renderType', async () => {
  const tmpDir = path.join(process.cwd(), 'tmp', 'pet-invalid-type');
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'pet.json'), JSON.stringify({
    id: 'test-bad',
    name: 'Bad',
    renderType: 'unsupported',
    width: 100,
    height: 100,
  }));
  await assert.rejects(loadPet(tmpDir), /不支持的 renderType/);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('loadPet: image 类型缺少 image 字段会报错', async () => {
  const tmpDir = path.join(process.cwd(), 'tmp', 'pet-no-img');
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'pet.json'), JSON.stringify({
    id: 'test-noimg',
    name: 'No Img',
    renderType: 'image',
    width: 100,
    height: 100,
  }));
  await assert.rejects(loadPet(tmpDir), /image 字段/);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('loadPet: live2d 类型缺少 modelFile 会报错', async () => {
  const tmpDir = path.join(process.cwd(), 'tmp', 'pet-live2d-bad');
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'pet.json'), JSON.stringify({
    id: 'test-l2d-bad',
    name: 'L2D Bad',
    renderType: 'live2d',
    width: 200,
    height: 300,
    live2d: { version: 'cubism4' },
  }));
  await assert.rejects(loadPet(tmpDir), /modelFile/);
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('listPets: 能列出所有 pet- 开头的目录', async () => {
  const pets = await listPets(petsDir);
  assert.ok(pets.length >= 2, `应至少有 2 个桌宠, 实际 ${pets.length}`);
  for (const p of pets) assert.ok(p.startsWith('pet-'), `${p} 应以 pet- 开头`);
});

test('loadAllPets: 批量加载所有桌宠', async () => {
  const all = await loadAllPets(petsDir);
  assert.ok(all.length >= 2, `应加载到至少 2 个桌宠, 实际 ${all.length}`);
  for (const p of all) {
    assert.ok(p.config.id && p.config.id.length > 0, 'id 应非空');
    assert.ok(
      p.imgUrl?.startsWith('file://') || p.modelUrl?.startsWith('file://'),
      '应有 file:// 资源',
    );
  }
});
