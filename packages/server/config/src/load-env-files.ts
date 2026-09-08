import { existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { config as loadDotEnv } from 'dotenv';
import { expand } from 'dotenv-expand';

export interface LoadEnvFilesOptions {
  cwd?: string;
  override?: boolean;
}

export function loadEnvFiles(
  envFilePaths: string[] = ['.env'],
  options: LoadEnvFilesOptions = {},
): string[] {
  const cwd = options.cwd ?? process.cwd();
  const override = options.override ?? false;
  const loadedFiles: string[] = [];

  for (const envFilePath of envFilePaths) {
    const absolutePath = isAbsolute(envFilePath) ? envFilePath : resolve(cwd, envFilePath);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const result = loadDotEnv({
      path: absolutePath,
      override,
      quiet: true,
    });

    expand(result);
    loadedFiles.push(absolutePath);
  }

  return loadedFiles;
}
