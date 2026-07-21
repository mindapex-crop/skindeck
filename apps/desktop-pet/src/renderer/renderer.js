const petEl = document.getElementById('pet');
const petImg = document.getElementById('pet-img');
const bubbleEl = document.getElementById('pet-bubble');
const container = document.getElementById('pet-container');

let currentConfig = null;
let bubbleTimer = null;
let idleTimer = null;
let currentAction = 'idle';
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let winStartX = 0;
let winStartY = 0;

function setAction(action) {
  if (!petEl) return;
  petEl.className = `pet ${action}`;
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

function scheduleBlink() {
  const nextBlink = 3000 + Math.random() * 5000;
  idleTimer = setTimeout(() => {
    if (currentAction === 'idle') {
      setAction('blink');
      setTimeout(() => {
        if (currentAction === 'blink') {
          currentAction = 'idle';
          setAction('idle');
        }
      }, 150);
    }
    scheduleBlink();
  }, nextBlink);
}

async function init() {
  const pet = await window.petAPI.getCurrentPet();
  if (pet) {
    currentConfig = pet.config;
    if (petImg) petImg.src = pet.imgUrl;
  }

  setAction('idle');
  scheduleBlink();

  window.petAPI.onPetSwitch((data) => {
    currentConfig = data.config;
    if (petImg) petImg.src = data.imgUrl;
    setAction('idle');
  });

  window.petAPI.onPetAction((data) => {
    currentAction = data.action;
    setAction(data.action);
  });
}

function triggerInteraction(trigger) {
  const interaction =
    currentConfig?.interactions?.find((i) => i.trigger === trigger);
  const action = interaction?.action ?? 'idle';
  const duration = interaction?.duration ?? 800;
  const message = interaction?.message;

  currentAction = action;
  setAction(action);

  if (message) showBubble(message, duration);

  if (duration > 0) {
    setTimeout(() => {
      if (currentAction === action) {
        currentAction = 'idle';
        setAction('idle');
      }
    }, duration);
  }
}

container?.addEventListener('click', () => {
  if (isDragging) return;
  triggerInteraction('click');
});

container?.addEventListener('dblclick', () => {
  triggerInteraction('double-click');
});

container?.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  triggerInteraction('right-click');
});

container?.addEventListener('mouseenter', () => {
  if (currentAction === 'idle' || currentAction === 'blink') {
    currentAction = 'hover';
    setAction('hover');
  }
});

container?.addEventListener('mouseleave', () => {
  if (currentAction === 'hover') {
    currentAction = 'idle';
    setAction('idle');
  }
});

container?.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  currentAction = 'drag';
  setAction('drag');
  window.petAPI.dragStart();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.screenX - dragStartX;
  const dy = e.screenY - dragStartY;
  if (dx !== 0 || dy !== 0) {
    window.petAPI.moveBy?.(dx, dy);
    dragStartX = e.screenX;
    dragStartY = e.screenY;
  }
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  currentAction = 'idle';
  setAction('idle');
  window.petAPI.dragEnd();
});

init();
