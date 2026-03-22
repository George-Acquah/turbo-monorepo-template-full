import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEnvFiles } from './load-env-files';
import { validateServerEnv } from './env.schema';
import { setValidatedServerEnv } from './env.store';
import { VALIDATED_ENV_TOKEN, serverConfigExports, serverConfigProviders } from './providers';
import type { ServerRuntime } from './types';

export interface ServerConfigModuleOptions {
  runtime: ServerRuntime;
  envFilePaths?: string[];
}

@Global()
@Module({})
export class ServerConfigModule {
  static forRoot(options: ServerConfigModuleOptions): DynamicModule {
    loadEnvFiles(options.envFilePaths);
    const env = validateServerEnv(process.env, options.runtime);
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
        ...serverConfigProviders,
      ],
      exports: [...serverConfigExports],
    };
  }
}
