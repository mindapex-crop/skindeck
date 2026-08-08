import { listPages, evaluate } from './cdp.js';
import { buildThemeCss, buildInjectScript, DETECT_SCRIPT, RESTORE_SCRIPT } from './theme-injector.js';
import type { Theme, TargetType, InjectResult, RestoreResult } from '@skins/shared';
import type { InjectOptions } from './theme-injector.js';

export async function detectTarget(port: number): Promise<TargetType> {
  const pages = await listPages(port);
  if (pages.length === 0) throw new Error('没有找到 page target');
  const detected = await evaluate(pages[0].webSocketDebuggerUrl, DETECT_SCRIPT);
  return detected as TargetType;
}

export async function injectTheme(port: number, theme: Theme, imgUrl: string, options: InjectOptions = {}): Promise<InjectResult[]> {
  const pages = await listPages(port);
  const results: InjectResult[] = [];

  for (const page of pages) {
    const detected = (await evaluate(page.webSocketDebuggerUrl, DETECT_SCRIPT)) as TargetType;
    const css = buildThemeCss(theme, imgUrl, detected, options);
    const script = buildInjectScript(css, theme.id, detected, options.autoFit ?? false, options.customImageUrl || imgUrl);
    const result = (await evaluate(page.webSocketDebuggerUrl, script)) as InjectResult;
    results.push(result);
  }

  return results;
}

export async function restoreTheme(port: number): Promise<RestoreResult[]> {
  const pages = await listPages(port);
  const results: RestoreResult[] = [];

  for (const page of pages) {
    const result = (await evaluate(page.webSocketDebuggerUrl, RESTORE_SCRIPT)) as RestoreResult;
    results.push(result);
  }

  return results;
}

export { listPages, evaluate } from './cdp.js';
export { buildThemeCss, buildInjectScript, DETECT_SCRIPT, RESTORE_SCRIPT } from './theme-injector.js';
