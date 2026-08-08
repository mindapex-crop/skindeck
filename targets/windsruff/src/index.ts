import type { TargetConfig } from '@skins/shared';

export const windsruffConfig: TargetConfig = {
  id: 'windsurf',
  name: 'Windsurf',
  bundleId: 'com.windsurf.app',
  expectedTeamId: '',
  appPath: '/Applications/Windsurf.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Windsurf`,
  cdpPort: 9334,
  type: 'vscode-fork',
};

export default windsruffConfig;
