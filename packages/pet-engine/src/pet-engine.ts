import type { PetConfig, PetState, PetMood, PetAction, PetInteractionConfig } from '@skins/shared';

type InteractionTrigger = PetInteractionConfig['trigger'];

export class PetEngine {
  private config: PetConfig;
  private state: PetState;
  private listeners: Set<(state: PetState) => void> = new Set();
  private actionTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PetConfig, initialPosition = { x: 100, y: 100 }) {
    this.config = config;
    this.state = {
      mood: config.defaultMood ?? 'idle',
      action: 'idle',
      position: initialPosition,
      lastInteraction: Date.now(),
    };
    this.startIdleBehaviors();
  }

  getState(): Readonly<PetState> {
    return { ...this.state };
  }

  getConfig(): Readonly<PetConfig> {
    return { ...this.config };
  }

  subscribe(listener: (state: PetState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l({ ...this.state });
  }

  private setState(partial: Partial<PetState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  trigger(trigger: InteractionTrigger): { action: PetAction; message?: string } {
    const interaction = this.config.interactions?.find((i) => i.trigger === trigger);
    const action = interaction?.action ?? this.defaultActionForTrigger(trigger);
    const duration = interaction?.duration ?? this.defaultDuration(action);
    const message = interaction?.message;

    if (interaction?.moodChange) {
      this.setState({ mood: interaction.moodChange });
    }

    this.setAction(action, duration);
    this.setState({ lastInteraction: Date.now() });

    return { action, message };
  }

  private defaultActionForTrigger(trigger: InteractionTrigger): PetAction {
    switch (trigger) {
      case 'click': return 'click';
      case 'hover': return 'hover';
      case 'double-click': return 'excited' as PetAction;
      case 'right-click': return 'curious' as PetAction;
      case 'drag-start': return 'drag';
      case 'drag-end': return 'idle';
      default: return 'idle';
    }
  }

  private defaultDuration(action: PetAction): number {
    switch (action) {
      case 'click': return 500;
      case 'hover': return 0;
      case 'drag': return 0;
      case 'talk': return 2000;
      case 'sleep': return 0;
      default: return 800;
    }
  }

  setAction(action: PetAction, duration = 800) {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }

    this.setState({ action });

    if (duration > 0) {
      this.actionTimer = setTimeout(() => {
        this.setState({ action: 'idle' });
        this.actionTimer = null;
      }, duration);
    }
  }

  setMood(mood: PetMood) {
    this.setState({ mood });
  }

  setPosition(x: number, y: number) {
    this.setState({ position: { x, y } });
  }

  private startIdleBehaviors() {
    this.scheduleBlink();

    const checkIdle = () => {
      const elapsed = Date.now() - this.state.lastInteraction;
      if (elapsed > 60_000 && this.state.mood !== 'sleepy') {
        this.setMood('sleepy');
      }
      if (elapsed > 120_000 && this.state.action !== 'sleep') {
        this.setAction('sleep', 0);
      }
      this.idleTimer = setTimeout(checkIdle, 30_000);
    };
    this.idleTimer = setTimeout(checkIdle, 30_000);
  }

  private scheduleBlink() {
    const nextBlink = 3000 + Math.random() * 5000;
    this.blinkTimer = setTimeout(() => {
      if (this.state.action === 'idle') {
        this.setAction('blink', 150);
      }
      this.scheduleBlink();
    }, nextBlink);
  }

  destroy() {
    if (this.actionTimer) clearTimeout(this.actionTimer);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    this.listeners.clear();
  }
}

export default PetEngine;
