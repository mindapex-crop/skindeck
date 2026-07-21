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
