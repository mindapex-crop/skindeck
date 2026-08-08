import type { TargetConfig } from '@skins/shared';

export const zcodeConfig: TargetConfig = {
  id: 'zcode',
  name: 'ZCode',
  bundleId: 'com.zcode.app',
  expectedTeamId: '',
  appPath: '/Applications/ZCode.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/ZCode`,
  cdpPort: 9335,
  type: 'vscode-fork',
};

export default zcodeConfig;
