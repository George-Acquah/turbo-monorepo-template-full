import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotEnv } from 'dotenv';
import { expand } from 'dotenv-expand';

export function loadEnvFiles(envFilePaths: string[] = ['.env']): void {
  for (const envFilePath of envFilePaths) {
    const absolutePath = resolve(process.cwd(), envFilePath);

    if (!existsSync(absolutePath)) {
      continue;
    }

    expand(
      loadDotEnv({
        path: absolutePath,
        override: false,
        quiet: true,
      }),
    );
  }
}
