import { createImagePet } from './renderers/image-pet.js';
import { createSpritesheetPet } from './renderers/spritesheet-pet.js';

async function createLive2DPet(stage, petData, options) {
  const mod = await import('./renderers/live2d-pet.js');
  return mod.createLive2DPet(stage, petData, options);
}

const bubbleEl = document.getElementById('pet-bubble');
const container = document.getElementById('pet-container');

let currentPet = null;
let currentConfig = null;
let bubbleTimer = null;

function showBubble(text, duration = 2000) {
  if (!bubbleEl) return;
  bubbleEl.textContent = text;
  bubbleEl.classList.remove('hidden');
  requestAnimationFrame(() => bubbleEl.classList.add('visible'));
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    bubbleEl.classList.remove('visible');
    setTimeout(() => bubbleEl.classList.add('hidden'), 300);
  }, duration);
}

async function switchPet(petData) {
  if (currentPet?.destroy) {
    currentPet.destroy();
    currentPet = null;
  }

  currentConfig = petData.config;

  const stageEl = document.getElementById('pet-stage');
  if (stageEl) stageEl.remove();

  const stage = document.createElement('div');
  stage.id = 'pet-stage';
  stage.className = 'pet-stage';
  container?.insertBefore(stage, bubbleEl);

  if (petData.config.renderType === 'live2d') {
    currentPet = await createLive2DPet(stage, petData, {
      onAction: (action) => console.log('[pet] action:', action),
    });
  } else if (petData.config.renderType === 'spritesheet') {
    currentPet = await createSpritesheetPet(stage, petData);
  } else {
    currentPet = await createImagePet(stage, petData);
  }

  setupInteractions(stage);
}

function setupInteractions(stage) {
  const triggerInteraction = (trigger) => {
    const interaction = currentConfig?.interactions?.find(
      (i) => i.trigger === trigger
    );
    if (!interaction) return;

    if (interaction.message) {
      showBubble(interaction.message, interaction.duration ?? 2000);
    }

    currentPet?.setAction?.(interaction.action);

    if (interaction.moodChange) {
      currentPet?.setMood?.(interaction.moodChange);
    }

    if (interaction.expression) {
      currentPet?.setExpression?.(interaction.expression);
    }

    if (interaction.motion) {
      currentPet?.playMotion?.(interaction.motion);
    }

    if ((interaction.duration ?? 0) > 0) {
      setTimeout(() => {
        currentPet?.setAction?.('idle');
      }, interaction.duration);
    }
  };

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let didDrag = false;

  stage.addEventListener('mousedown', (e) => {
    isDragging = true;
    didDrag = false;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    currentPet?.setAction?.('drag');
    window.petAPI.dragStart();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    if (dx !== 0 || dy !== 0) {
      window.petAPI.moveBy?.(dx, dy);
      dragStartX = e.screenX;
      dragStartY = e.screenY;
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    currentPet?.setAction?.('idle');
    window.petAPI.dragEnd();
  });

  stage.addEventListener('click', () => {
    if (didDrag) return;
    triggerInteraction('click');
    currentPet?.handleInteraction?.('click');
  });

  stage.addEventListener('dblclick', () => {
    if (didDrag) return;
    triggerInteraction('double-click');
    currentPet?.handleInteraction?.('double-click');
  });

  stage.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (didDrag) return;
    triggerInteraction('right-click');
  });

  stage.addEventListener('mouseenter', () => {
    if (isDragging) return;
    currentPet?.setAction?.('hover');
    triggerInteraction('hover');
    currentPet?.handleInteraction?.('hover');
  });

  stage.addEventListener('mouseleave', () => {
    if (isDragging) return;
    currentPet?.setAction?.('idle');
  });
}

async function init() {
  const pet = await window.petAPI.getCurrentPet();
  if (pet) await switchPet(pet);

  window.petAPI.onPetSwitch(async (data) => {
    await switchPet(data);
  });

  window.petAPI.onPetAction((data) => {
    currentPet?.setAction?.(data.action);
  });
}

init();
