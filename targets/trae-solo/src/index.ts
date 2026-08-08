import type { TargetConfig } from '@skins/shared';

export const traeSoloConfig: TargetConfig = {
  id: 'trae-solo',
  name: 'Trae Solo',
  bundleId: 'com.trae.solo',
  expectedTeamId: '',
  appPath: '/Applications/Trae Solo.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Trae Solo`,
  cdpPort: 9338,
  type: 'vscode-fork',
};

export default traeSoloConfig;
