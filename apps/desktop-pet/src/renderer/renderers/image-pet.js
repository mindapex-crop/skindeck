export async function createImagePet(container, petData) {
  const { config, imgUrl } = petData;

  const petEl = document.createElement('div');
  petEl.className = 'pet idle';
  petEl.style.width = `${config.width}px`;
  petEl.style.height = `${config.height}px`;

  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = config.name;
  img.draggable = false;
  petEl.appendChild(img);

  container.appendChild(petEl);

  let currentAction = 'idle';
  let currentMood = config.defaultMood ?? 'idle';
  let blinkTimer = null;

  const scheduleBlink = () => {
    const nextBlink = 3000 + Math.random() * 5000;
    blinkTimer = setTimeout(() => {
      if (currentAction === 'idle') {
        setAction('blink');
        setTimeout(() => {
          if (currentAction === 'blink') setAction('idle');
        }, 150);
      }
      scheduleBlink();
    }, nextBlink);
  };
  scheduleBlink();

  function setAction(action) {
    currentAction = action;
    petEl.className = `pet ${action}`;
  }

  function setMood(mood) {
    currentMood = mood;
    petEl.dataset.mood = mood;
  }

  function destroy() {
    if (blinkTimer) clearTimeout(blinkTimer);
    petEl.remove();
  }

  return {
    setAction,
    setMood,
    destroy,
  };
}
