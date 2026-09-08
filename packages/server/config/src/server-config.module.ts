import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEnvFiles } from './load-env-files';
import { validateServerEnv } from './env.schema';
import { setValidatedServerEnv } from './env.store';
import { serverConfigExports, serverConfigProviders } from './providers';
import { ServerRuntime, VALIDATED_ENV_TOKEN } from '@workspace/ports/config';

export interface ServerConfigModuleOptions {
  runtime: ServerRuntime;
  envFilePaths?: string[];
  cwd?: string;
}

@Global()
@Module({})
export class ServerConfigModule {
  static forRoot(options: ServerConfigModuleOptions): DynamicModule {
    const cwd = options.cwd ?? process.cwd();
    const envFilePaths = options.envFilePaths ?? ['.env'];

    const loadedFiles = loadEnvFiles(envFilePaths, { cwd });

    const mergedEnv: NodeJS.ProcessEnv = {
      ...process.env,
    };

    const env = validateServerEnv(mergedEnv, options.runtime);
    setValidatedServerEnv(env);

    return {
      module: ServerConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          ignoreEnvFile: true,
        }),
      ],
      providers: [
        {
          provide: VALIDATED_ENV_TOKEN,
          useValue: env,
        },
        {
          provide: 'LOADED_ENV_FILES',
          useValue: loadedFiles,
        },
        ...serverConfigProviders,
      ],
      exports: [...serverConfigExports, 'LOADED_ENV_FILES'],
    };
  }
}
