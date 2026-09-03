import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** CLI 自身版本：读取 dist 两级的 package.json（与 `brier --version` 同源）。 */
export const readCliVersion = (): string => {
  try {
    const pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url));
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
};
