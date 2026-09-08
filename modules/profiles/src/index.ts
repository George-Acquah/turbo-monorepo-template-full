// API (producing) half — imported by apps/api
export * from './profiles.module';
export * from './profiles.routes';
export * from './profiles.produces';

// Worker (reacting) half — imported by apps/worker
export * from './profiles.worker.module';
export * from './profiles.subscriptions';

// Exported separately so apps/worker can import just this narrow @Global()
// sub-module (not the full ProfilesModule with its HTTP controllers) —
// needed by modules/memberships' subscription renewal use-cases, via
// ProfilesApplicationService.getProfileContact (dunning email contact info).
export * from './profiles-application-port.module';
