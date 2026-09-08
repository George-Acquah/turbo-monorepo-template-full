import { Module } from '@nestjs/common';
import { AuthPersistenceModule } from '@workspace/auth-persistence';
import { GetMyPreferencesUseCase } from './application/use-cases/get-my-preferences.use-case';
import { UpdateMyPreferencesUseCase } from './application/use-cases/update-my-preferences.use-case';
import { PreferencesController } from './presentation/controllers/preferences.controller';

/**
 * Sibling to AuthModule rather than part of it, purely so the route tree reads correctly:
 * AuthModule is mounted under 'auth', and these are app preferences, not authentication
 * operations — /v1/preferences, not /v1/auth/preferences. Same bounded context (the
 * UserPreference row lives in workspace_auth), same persistence module.
 */
@Module({
  imports: [AuthPersistenceModule],
  controllers: [PreferencesController],
  providers: [GetMyPreferencesUseCase, UpdateMyPreferencesUseCase],
})
export class UserPreferencesModule {}
