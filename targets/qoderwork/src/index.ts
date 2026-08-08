import type { TargetConfig } from '@skins/shared';

export const qoderworkConfig: TargetConfig = {
  id: 'qoderwork',
  name: 'QoderWork',
  bundleId: 'com.qoder.work',
  expectedTeamId: '',
  appPath: '/Applications/QoderWork.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/QoderWork`,
  cdpPort: 9337,
  type: 'vscode-fork',
};

export default qoderworkConfig;
