export interface ThemeArt {
  focusX: number;
  focusY: number;
  safeArea?: 'left' | 'right' | 'top' | 'bottom';
  taskMode?: 'ambient' | 'focus' | 'immersive';
}

export interface ThemeColors {
  background?: string;
  panel?: string;
  panelAlt?: string;
  accent?: string;
  accentAlt?: string;
  secondary?: string;
  highlight?: string;
  text?: string;
  muted?: string;
  line?: string;
}

export interface Theme {
  schemaVersion: number;
  id: string;
  name: string;
  image: string;
  appearance?: 'light' | 'dark' | 'auto';
  art?: ThemeArt;
  colors?: ThemeColors;
  brandSubtitle?: string;
  tagline?: string;
  projectPrefix?: string;
  projectLabel?: string;
  statusText?: string;
  quote?: string;
  promoTitle?: string;
  promoSub?: string;
  promoUrl?: string;
}

export type TargetType = 'workbuddy' | 'vscode-fork' | 'trae-work' | 'claude-desktop' | 'generic';

export interface TargetConfig {
  id: string;
  name: string;
  bundleId: string;
  expectedTeamId?: string;
  appPath: string;
  userDataDir: string;
  cdpPort: number;
  type: TargetType;
}

export interface InjectResult {
  themeId: string;
  target: TargetType;
  detected: TargetType;
  htmlClass: string;
  bodyClass: string;
  styleInjected: boolean;
  bgEl: string;
  bgImage: string;
  bgColor: string;
}

export interface RestoreResult {
  wasInjected: boolean;
  before: {
    hadStyle: boolean;
    hadHtmlClass: boolean;
    hadActiveAttr: boolean;
    hadTargetAttr: boolean;
    hadObserver: boolean;
    bodyBg: string;
  };
  after: {
    hadStyle: boolean;
    hadHtmlClass: boolean;
    bodyBg: string;
  };
}

// 桌宠相关
export type PetMood = 'idle' | 'happy' | 'sleepy' | 'curious' | 'excited' | 'sad';
export type PetAction = 'idle' | 'blink' | 'breathe' | 'hover' | 'click' | 'drag' | 'talk' | 'sleep';

export interface PetState {
  mood: PetMood;
  action: PetAction;
  position: { x: number; y: number };
  lastInteraction: number;
}

export interface PetConfig {
  id: string;
  name: string;
  description?: string;
  image: string;
  width: number;
  height: number;
  defaultMood?: PetMood;
  interactions?: PetInteractionConfig[];
}

export interface PetInteractionConfig {
  trigger: 'click' | 'hover' | 'double-click' | 'right-click' | 'drag-start' | 'drag-end';
  action: PetAction;
  duration?: number;
  message?: string;
  moodChange?: PetMood;
}
