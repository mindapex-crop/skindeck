import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import { Live2DModel as Live2DModelV2 } from 'pixi-live2d-display/cubism2';

window.PIXI = PIXI;

export async function createLive2DPet(container, petData, options = {}) {
  const { config, modelUrl, resourcesDir } = petData;
  const live2d = config.live2d ?? {};

  const width = config.width;
  const height = config.height;

  const app = new PIXI.Application({
    width,
    height,
    transparent: true,
    antialias: true,
    autoStart: true,
    backgroundAlpha: 0,
  });

  container.appendChild(app.view);
  app.view.style.display = 'block';
  app.view.style.width = '100%';
  app.view.style.height = '100%';

  const ModelClass = live2d.version === 'cubism2' ? Live2DModelV2 : Live2DModel;

  let model = null;
  let currentExpression = null;
  let targetX = 0;
  let targetY = 0;

  try {
    model = await ModelClass.from(modelUrl);

    const scale = live2d.scale ?? calculateFitScale(model, width, height);
    model.scale.set(scale);

    const posX = live2d.positionX ?? width / 2;
    const posY = live2d.positionY ?? height * 0.9;
    model.x = posX;
    model.y = posY;

    app.stage.addChild(model);

    if (live2d.autoBlink !== false) {
      startAutoBlink(model);
    }

    if (live2d.eyeTracking !== false) {
      startEyeTracking(container, model);
    }

    model.on('hit', (hitAreas) => {
      if (hitAreas.includes('body') || hitAreas.includes('head')) {
        options.onHit?.(hitAreas);
      }
    });
  } catch (err) {
    console.error('[live2d] 模型加载失败:', err);
    const errEl = document.createElement('div');
    errEl.style.cssText = 'color:#f66;font-size:12px;padding:10px;text-align:center;';
    errEl.textContent = `模型加载失败: ${err.message}`;
    container.appendChild(errEl);
  }

  function calculateFitScale(m, w, h) {
    const modelW = m.width;
    const modelH = m.height;
    const scaleX = w / modelW;
    const scaleY = h / modelH;
    return Math.min(scaleX, scaleY) * 0.9;
  }

  function startAutoBlink(m) {
    const blink = () => {
      if (m.expressionManager) {
        m.expressionManager.setExpression('blink');
      }
      setTimeout(() => {
        if (m.expressionManager && currentExpression) {
          m.expressionManager.setExpression(currentExpression);
        } else if (m.expressionManager) {
          m.expressionManager.setExpression('');
        }
      }, 150);
    };

    const schedule = () => {
      const delay = 3000 + Math.random() * 5000;
      setTimeout(() => {
        blink();
        schedule();
      }, delay);
    };
    schedule();
  }

  function startEyeTracking(el, m) {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      targetX = (x - 0.5) * 2;
      targetY = (y - 0.5) * 2;
      if (m.internalModel?.eyeState) {
        m.internalModel.eyeState.X = targetX;
        m.internalModel.eyeState.Y = targetY;
      }
    });
  }

  function setAction(action) {
    if (!model) return;
    const motionMap = {
      idle: 'idle',
      click: 'tap_body',
      hover: 'flick_head',
      drag: 'shake',
      talk: 'tap_body',
      sleep: 'sleep',
    };
    const motionName = motionMap[action];
    if (motionName && model.motionManager?.isAvailableMotion(motionName)) {
      model.motion(motionName);
    }
  }

  function setMood(mood) {
    if (!model) return;
    const exprMap = {
      happy: 'f01',
      sad: 'f02',
      angry: 'f03',
      sleepy: 'f04',
      surprised: 'f05',
      excited: 'f06',
      curious: 'f07',
      idle: '',
    };
    const exprName = exprMap[mood];
    if (exprName !== undefined && model.expressionManager) {
      currentExpression = exprName;
      model.expressionManager.setExpression(exprName);
    }
  }

  function setExpression(exprName) {
    if (!model?.expressionManager) return;
    currentExpression = exprName;
    model.expressionManager.setExpression(exprName);
  }

  function playMotion(groupName, index = 0) {
    if (!model?.motionManager) return;
    model.motion(groupName, index);
  }

  function destroy() {
    if (model) {
      model.destroy();
      model = null;
    }
    app.destroy(true, { children: true, texture: true, baseTexture: true });
  }

  return {
    setAction,
    setMood,
    setExpression,
    playMotion,
    destroy,
  };
}
