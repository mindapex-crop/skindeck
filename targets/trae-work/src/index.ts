import type { TargetConfig } from '@skins/shared';

// TRAE Work 桌面版 (原名 TRAE SOLO CN)
export const traeWorkConfig: TargetConfig = {
  id: 'trae-work',
  name: 'TRAE Work',
  bundleId: 'cn.trae.solo.app',
  expectedTeamId: 'CG2SCM6AV5',
  appPath: '/Applications/TRAE SOLO CN.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/TRAE SOLO CN`,
  cdpPort: 9341,
  type: 'workbuddy', // 待实测: TRAE Work 可能跟 WorkBuddy 结构类似, 先假设
};

export default traeWorkConfig;
