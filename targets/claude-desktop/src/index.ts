import type { TargetConfig } from '@skins/shared';

// Claude Desktop (Anthropic 官方桌面客户端)
// 本机未安装, 配置待实测
export const claudeDesktopConfig: TargetConfig = {
  id: 'claude-desktop',
  name: 'Claude Desktop',
  bundleId: 'com.anthropic.claudedesktop',
  expectedTeamId: '', // 待实测
  appPath: '/Applications/Claude.app',
  userDataDir: `${process.env.HOME}/Library/Application Support/Claude`,
  cdpPort: 9344,
  type: 'generic', // 待实测后调整
};

export default claudeDesktopConfig;
