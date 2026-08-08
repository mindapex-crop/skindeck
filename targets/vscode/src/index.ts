import type { TargetConfig } from '@skins/shared';

export const vscodeConfig: TargetConfig = {
  id: 'vscode',
  name: 'VS Code',
  bundleId: 'com.microsoft.VSCode',
  expectedTeamId: '',
  appPath: '/Applications/Visual Studio Code.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Code`,
  cdpPort: 9333,
  type: 'vscode-fork',
};

export default vscodeConfig;
