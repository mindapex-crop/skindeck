import type { TargetConfig } from '@skins/shared';

// Cursor 是 VS Code fork (Anysphere / todesktop 打包)
// 本机未安装, Team ID 待实测后回填
export const cursorConfig: TargetConfig = {
  id: 'cursor',
  name: 'Cursor',
  bundleId: 'com.todesktop.230313mzl4w4u92',
  expectedTeamId: '',
  appPath: '/Applications/Cursor.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Cursor`,
  cdpPort: 9343,
  type: 'vscode-fork',
};

export default cursorConfig;
