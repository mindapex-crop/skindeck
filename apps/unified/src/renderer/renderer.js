import { createImagePet } from './renderers/image-pet.js';
import { createSpritesheetPet } from './renderers/spritesheet-pet.js';

const bubbleEl = document.getElementById('pet-bubble');
const container = document.getElementById('pet-container');

let currentPet = null;
let currentConfig = null;
let bubbleTimer = null;

let i18nStrings = null;

async function loadI18n() {
  i18nStrings = await window.petAPI.getI18n();
}

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

  if (petData.config.renderType === 'spritesheet') {
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

  let petHappiness = 50;
  let petHunger = 50;
  let petAffection = 0;

  const contextMenu = document.createElement('div');
  contextMenu.className = 'pet-context-menu';
  contextMenu.style.display = 'none';
  document.body.appendChild(contextMenu);

  function showContextMenu(x, y) {
    const pm = (i18nStrings && i18nStrings.petMenu) || {};
    const moodText = petHappiness > 70 ? (pm.moodGreat || 'Very Happy') : petHappiness > 40 ? (pm.moodGood || 'Good') : (pm.moodBored || 'Bored');
    const menuItems = [
      { id: 'play', label: pm.play || 'Play', action: () => {
        petHappiness = Math.min(100, petHappiness + 15);
        petAffection += 7;
        triggerInteraction('click');
        showBubble(pm.playMsg || 'So happy~', 1500);
        currentPet?.setAction?.('click');
        setTimeout(() => currentPet?.setAction?.('idle'), 800);
      }},
      { id: 'feed', label: pm.feed || 'Feed', action: () => {
        petHunger = Math.min(100, petHunger + 20);
        petAffection += 5;
        currentPet?.setMood?.('happy');
        showBubble(pm.feedMsg || 'Yummy!', 1500);
        currentPet?.setAction?.('talk');
        setTimeout(() => {
          currentPet?.setAction?.('idle');
          currentPet?.setMood?.('idle');
        }, 2000);
      }},
      { id: 'pet', label: pm.pet || 'Pet', action: () => {
        petAffection += 10;
        petHappiness = Math.min(100, petHappiness + 10);
        currentPet?.setMood?.('happy');
        showBubble(pm.petMsg || 'Purr purr~', 1500);
        currentPet?.handleInteraction?.('hover');
        setTimeout(() => {
          currentPet?.setAction?.('idle');
          currentPet?.setMood?.('idle');
        }, 2000);
      }},
      { id: 'status', label: (pm.affection || 'Affection') + ': ' + petAffection, action: () => {
        showBubble((pm.affection || 'Affection') + ': ' + petAffection + '\n' + moodText, 2500);
      }},
      { type: 'separator' },
      { id: 'hide', label: pm.hide || 'Hide Pet', action: () => {
        window.petAPI.hidePet?.();
      }},
      { id: 'quit', label: pm.exit || 'Quit', action: () => {
        window.petAPI.quitApp?.();
      }},
    ];

    contextMenu.innerHTML = '';
    menuItems.forEach((item) => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'pet-context-menu-separator';
        contextMenu.appendChild(sep);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'pet-context-menu-item';
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action?.();
          hideContextMenu();
        });
        contextMenu.appendChild(menuItem);
      }
    });

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';

    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      contextMenu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      contextMenu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
    }
  }

  function hideContextMenu() {
    contextMenu.style.display = 'none';
  }

  document.addEventListener('click', hideContextMenu);
  document.addEventListener('scroll', hideContextMenu);
  window.addEventListener('blur', hideContextMenu);

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let didDrag = false;

  stage.addEventListener('mousedown', (e) => {
    if (e.button === 2) return;
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
    showContextMenu(e.clientX, e.clientY);
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
  await loadI18n();
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
