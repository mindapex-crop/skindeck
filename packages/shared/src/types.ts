export interface ThemeArt {
  focusX: number;
  focusY: number;
  safeArea?: 'left' | 'right' | 'top' | 'bottom';
  taskMode?: 'ambient' | 'focus' | 'immersive';
  /**
   * 自动贴合：应用皮肤时注入运行时脚本分析背景图，自动算焦点/安全区/主题色。
   * 开启后无需手工写死 focus/accent，换图即自动贴合 + 自动配色。
   */
  autoFit?: boolean;
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
  /** English / fallback display name. */
  nameEn?: string;
  /** Localized display names keyed by language code (multilingual skin names). Falls back to nameEn/name. */
  names?: Record<string, string>;
  /** Region grouping code used for menu grouping & default-skin selection. */
  region?: string;
  image: string;
  appearance?: 'light' | 'dark' | 'auto';
  art?: ThemeArt;
  colors?: ThemeColors;
  /** Optional default UI font stack for this skin (CSS font-family value). When the user picks "follow skin", this (or a region default) is applied. */
  fontFamily?: string;
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
export type PetRenderType = 'image' | 'live2d' | 'spritesheet';
export type Live2DVersion = 'cubism2' | 'cubism4';

export type SpriteAnimationState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review';

export interface SpriteStateDefinition {
  row: number;
  frames: number;
  durationMs: number;
  iterations?: number | 'infinite';
}

export interface SpritesheetConfig {
  spritesheetPath: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  states: Record<SpriteAnimationState, SpriteStateDefinition>;
  category?: string;
}

export interface PetState {
  mood: PetMood;
  action: PetAction;
  position: { x: number; y: number };
  lastInteraction: number;
}

export interface Live2DModelConfig {
  modelFile: string;
  version: Live2DVersion;
  scale?: number;
  positionX?: number;
  positionY?: number;
  eyeTracking?: boolean;
  autoBlink?: boolean;
  expressions?: Record<string, string>;
  motions?: Record<string, string>;
}

export interface PetConfig {
  id: string;
  name: string;
  description?: string;
  renderType: PetRenderType;
  image?: string;
  width: number;
  height: number;
  defaultMood?: PetMood;
  interactions?: PetInteractionConfig[];
  live2d?: Live2DModelConfig;
  spritesheet?: SpritesheetConfig;
  displayName?: string;
  category?: string;
}

export interface PetInteractionConfig {
  trigger: 'click' | 'hover' | 'double-click' | 'right-click' | 'drag-start' | 'drag-end';
  action: PetAction;
  duration?: number;
  message?: string;
  moodChange?: PetMood;
  expression?: string;
  motion?: string;
}
