const DEFAULT_SPRITE_CONFIG = {
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

export async function createSpritesheetPet(container, petData) {
  const { config, imgUrl } = petData;
  const spriteConfig = config.spritesheet || DEFAULT_SPRITE_CONFIG;
  const frameWidth = spriteConfig.frameWidth || DEFAULT_SPRITE_CONFIG.frameWidth;
  const frameHeight = spriteConfig.frameHeight || DEFAULT_SPRITE_CONFIG.frameHeight;
  const states = { ...DEFAULT_SPRITE_CONFIG.states, ...spriteConfig.states };

  const petEl = document.createElement('div');
  petEl.className = 'pet spritesheet-pet idle';
  petEl.style.width = `${config.width}px`;
  petEl.style.height = `${config.height}px`;
  petEl.style.position = 'relative';
  petEl.style.overflow = 'hidden';

  const spriteEl = document.createElement('div');
  spriteEl.style.position = 'absolute';
  spriteEl.style.width = `${frameWidth}px`;
  spriteEl.style.height = `${frameHeight}px`;
  spriteEl.style.backgroundImage = `url(${imgUrl})`;
  spriteEl.style.backgroundRepeat = 'no-repeat';
  spriteEl.style.backgroundSize = `${spriteConfig.columns * frameWidth}px ${spriteConfig.rows * frameHeight}px`;
  spriteEl.style.left = `${(config.width - frameWidth) / 2}px`;
  spriteEl.style.bottom = '0px';
  spriteEl.style.imageRendering = 'pixelated';
  petEl.appendChild(spriteEl);

  container.appendChild(petEl);

  let currentState = 'idle';
  let currentFrame = 0;
  let animationFrameId = null;
  let lastTime = 0;
  let frameDuration = 0;
  let iterationCount = 0;
  let returnToIdle = false;

  function setState(state, opts = {}) {
    const stateDef = states[state];
    if (!stateDef) return;

    currentState = state;
    currentFrame = 0;
    iterationCount = 0;
    returnToIdle = opts.returnToIdle || false;

    const iterations = stateDef.iterations ?? 1;
    frameDuration = stateDef.durationMs / stateDef.frames;
    lastTime = performance.now();

    petEl.className = `pet spritesheet-pet ${state}`;

    if (!animationFrameId) {
      requestAnimationFrame(animate);
    }
  }

  function animate(timestamp) {
    const elapsed = timestamp - lastTime;

    if (elapsed >= frameDuration) {
      const stateDef = states[currentState];
      const frames = stateDef?.frames || 1;
      const iterations = stateDef?.iterations ?? 1;

      currentFrame++;
      lastTime = timestamp;

      if (currentFrame >= frames) {
        currentFrame = 0;
        iterationCount++;

        if (iterations !== 'infinite' && iterationCount >= iterations) {
          if (returnToIdle) {
            setState('idle');
          } else {
            stopAnimation();
            return;
          }
        }
      }

      updateSpriteFrame();
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function updateSpriteFrame() {
    const stateDef = states[currentState];
    if (!stateDef) return;

    const row = stateDef.row;
    const col = currentFrame;
    const x = -col * frameWidth;
    const y = -row * frameHeight;

    spriteEl.style.backgroundPosition = `${x}px ${y}px`;
  }

  function stopAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function setMood(mood) {
    petEl.dataset.mood = mood;

    const moodToState = {
      idle: 'idle',
      happy: 'waving',
      excited: 'jumping',
      sleepy: 'waiting',
      curious: 'review',
      sad: 'failed',
    };

    const targetState = moodToState[mood] || 'idle';
    if (targetState !== currentState) {
      setState(targetState, { returnToIdle: mood !== 'idle' && mood !== 'sleepy' });
    }
  }

  function handleInteraction(trigger) {
    switch (trigger) {
      case 'click':
        setState('waving', { returnToIdle: true });
        break;
      case 'hover':
        setState('review', { returnToIdle: true });
        break;
      case 'double-click':
        setState('jumping', { returnToIdle: true });
        break;
      default:
        break;
    }
  }

  function destroy() {
    stopAnimation();
    petEl.remove();
  }

  setState('idle');

  return {
    setState,
    setMood,
    handleInteraction,
    destroy,
  };
}
