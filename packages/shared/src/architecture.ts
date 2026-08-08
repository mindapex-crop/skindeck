// ============================================================
// 系统架构类型定义 - 为未来皮肤/宠物市场与网站打通预留
// ============================================================
//
// 架构层次:
// ┌─────────────────────────────────────────────────────────┐
// │                    前端应用层 (App)                       │
// │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
// │  │ 托盘菜单  │  │ 宠物窗口  │  │ 未来: 市场 UI 窗口    │  │
// │  └──────────┘  └──────────┘  └──────────────────────┘  │
// └─────────────────────────────────────────────────────────┘
//                            │
// ┌─────────────────────────────────────────────────────────┐
// │                    服务层 (Services)                     │
// │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
// │  │ SkinManager  │  │ PetEngine    │  │ MarketService │ │
// │  └──────────────┘  └──────────────┘  └───────────────┘ │
// └─────────────────────────────────────────────────────────┘
//                            │
// ┌─────────────────────────────────────────────────────────┐
// │                    注入层 (Injectors)                    │
// │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
// │  │ CDP Injector │  │ 宠物渲染器    │  │ 主题 CSS 生成  │ │
// │  └──────────────┘  └──────────────┘  └───────────────┘ │
// └─────────────────────────────────────────────────────────┘
//                            │
// ┌─────────────────────────────────────────────────────────┐
// │                    数据层 (Data)                         │
// │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
// │  │ 用户目录管理  │  │ 配置存储      │  │ 资源缓存      │ │
// │  └──────────────┘  └──────────────┘  └───────────────┘ │
// └─────────────────────────────────────────────────────────┘
//                            │
// ┌─────────────────────────────────────────────────────────┐
// │                    外部集成 (Integrations)               │
// │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
// │  │Open Pets │  │ Live2D   │  │BongoCat  │  │皮肤市场  │ │
// │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
// └─────────────────────────────────────────────────────────┘

export type ArchitectureLayer =
  | 'app'
  | 'service'
  | 'injector'
  | 'data'
  | 'integration';

export interface ModuleInfo {
  id: string;
  name: string;
  layer: ArchitectureLayer;
  version: string;
  description?: string;
  dependencies: string[];
}

export type MarketItemType = 'skin' | 'pet';
export type MarketItemStatus = 'draft' | 'published' | 'archived';
export type MarketItemVisibility = 'public' | 'unlisted' | 'private';

export interface MarketItem {
  id: string;
  type: MarketItemType;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  version: string;
  status: MarketItemStatus;
  visibility: MarketItemVisibility;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  previewUrls: string[];
  downloadUrl: string;
  fileSize: number;
  downloads: number;
  likes: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  isInstalled?: boolean;
  isFavorite?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  registeredAt: string;
  stats: {
    uploads: number;
    downloads: number;
    likes: number;
    followers: number;
    following: number;
  };
}

export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  replies: Comment[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  items: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAPIClient {
  baseUrl: string;
  authToken?: string;

  searchItems(params: {
    type?: MarketItemType;
    query?: string;
    category?: string;
    tags?: string[];
    sort?: 'popular' | 'newest' | 'rating' | 'downloads';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: MarketItem[]; total: number }>;

  getItem(id: string): Promise<MarketItem>;
  getItemComments(id: string, page?: number): Promise<{ comments: Comment[]; total: number }>;

  installItem(id: string, targetDir: string): Promise<boolean>;
  uninstallItem(id: string, targetDir: string): Promise<boolean>;

  likeItem(id: string): Promise<boolean>;
  favoriteItem(id: string): Promise<boolean>;

  uploadItem(data: FormData): Promise<MarketItem>;
  updateItem(id: string, data: Partial<MarketItem>): Promise<MarketItem>;
  deleteItem(id: string): Promise<boolean>;
}

export interface PetInteractionSystem {
  petId: string;
  stats: {
    happiness: number;
    hunger: number;
    energy: number;
    affection: number;
    health: number;
  };
  lastInteraction: number;
  birthTime: number;
  totalInteractions: number;
  achievements: string[];
}

export interface PetMinigame {
  id: string;
  name: string;
  description: string;
  type: 'clicker' | 'memory' | 'catch' | 'dressup';
  reward: {
    happiness?: number;
    affection?: number;
    coins?: number;
  };
}

export interface PetInventoryItem {
  id: string;
  name: string;
  type: 'food' | 'toy' | 'accessory' | 'background';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  effect?: {
    happiness?: number;
    hunger?: number;
    energy?: number;
  };
}

export interface PetSaveState {
  petId: string;
  name: string;
  stats: PetInteractionSystem['stats'];
  inventory: PetInventoryItem[];
  achievements: string[];
  createdAt: string;
  lastPlayedAt: string;
  playTime: number;
}

export const SYSTEM_MODULES: ModuleInfo[] = [
  {
    id: 'skin-manager',
    name: '皮肤管理器',
    layer: 'service',
    version: '0.1.0',
    description: '管理皮肤的加载、应用、恢复',
    dependencies: ['cdp-injector', 'shared'],
  },
  {
    id: 'pet-engine',
    name: '宠物引擎',
    layer: 'service',
    version: '0.1.0',
    description: '管理宠物的加载、状态、交互',
    dependencies: ['shared'],
  },
  {
    id: 'cdp-injector',
    name: 'CDP 注入器',
    layer: 'injector',
    version: '0.1.0',
    description: '通过 Chrome DevTools Protocol 注入 CSS',
    dependencies: ['shared'],
  },
  {
    id: 'shared',
    name: '共享模块',
    layer: 'data',
    version: '0.1.0',
    description: '共享类型、i18n、图标等',
    dependencies: [],
  },
];

export const MARKETPLACE_API_BASE = 'https://api.market.skins.app/v1';
export const MARKETPLACE_WEB_BASE = 'https://market.skins.app';

export const SUPPORTED_PET_RENDER_TYPES = ['image', 'spritesheet', 'live2d'] as const;
export const SUPPORTED_SKIN_FORMATS = ['preset', 'custom-image'] as const;

export const PET_SIZE_CONSTRAINTS = {
  minWidth: 60,
  maxWidth: 200,
  minHeight: 60,
  maxHeight: 200,
  standardHeight: 150,
};

export const INTERACTION_CONSTANTS = {
  happinessDecayRate: 1,
  hungerDecayRate: 0.5,
  energyDecayRate: 0.3,
  maxAffection: 9999,
  interactionCooldownMs: 500,
};
