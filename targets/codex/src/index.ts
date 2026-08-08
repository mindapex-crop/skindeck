import type { TargetConfig } from '@skins/shared';

export const codexConfig: TargetConfig = {
  id: 'codex',
  name: 'Codex',
  bundleId: 'com.trae.codex',
  expectedTeamId: '',
  appPath: '/Applications/Codex.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Codex`,
  cdpPort: 9336,
  type: 'vscode-fork',
};

export default codexConfig;
