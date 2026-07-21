import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PetEngine, loadPet, listPets, loadAllPets } from '@skins/pet-engine';
import type { PetConfig } from '@skins/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const petsDir = path.resolve(__dirname, '../../pets');

const testConfig: PetConfig = {
  id: 'test-pet',
  name: 'Test Pet',
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

test('loadPet: 能加载麻薯猫桌宠', async () => {
  const loaded = await loadPet(path.join(petsDir, 'pet-mochi-cat'));
  assert.equal(loaded.config.id, 'pet-mochi-cat');
  assert.equal(loaded.config.name, '麻薯猫');
  assert.equal(loaded.config.width, 150);
  assert.equal(loaded.config.height, 150);
  assert.ok(loaded.imgUrl.startsWith('file://'));
});

test('loadPet: 能加载赛博狐桌宠', async () => {
  const loaded = await loadPet(path.join(petsDir, 'pet-cyber-fox'));
  assert.equal(loaded.config.id, 'pet-cyber-fox');
  assert.equal(loaded.config.name, '赛博狐');
  assert.ok(loaded.config.interactions && loaded.config.interactions.length > 0);
});

test('listPets: 能列出所有 pet- 开头的目录', async () => {
  const pets = await listPets(petsDir);
  assert.ok(pets.length >= 2);
  assert.ok(pets.includes('pet-mochi-cat'));
  assert.ok(pets.includes('pet-cyber-fox'));
});

test('loadAllPets: 批量加载所有桌宠', async () => {
  const all = await loadAllPets(petsDir);
  assert.ok(all.length >= 2);
  for (const p of all) {
    assert.ok(p.config.id.startsWith('pet-'));
    assert.ok(p.imgUrl.startsWith('file://'));
  }
});
