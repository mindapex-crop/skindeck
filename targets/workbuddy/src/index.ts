import type { TargetConfig } from '@skins/shared';

export const workbuddyConfig: TargetConfig = {
  id: 'workbuddy',
  name: 'WorkBuddy',
  bundleId: 'com.workbuddy.workbuddy',
  expectedTeamId: 'FN2V63AD2J',
  appPath: '/Applications/WorkBuddy.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/WorkBuddy`,
  cdpPort: 9342,
  type: 'workbuddy',
};

export default workbuddyConfig;
