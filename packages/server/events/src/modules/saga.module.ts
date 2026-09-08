import { Global, Module } from '@nestjs/common';
import { SAGA_ORCHESTRATOR_TOKEN } from '@workspace/ports';
import { SagaOrchestrator, SagaCleanupService } from '../sagas';

/**
 * SagaModule — global saga infrastructure.
 *
 * Provides SagaOrchestratorPort and SagaCleanupService to the entire app.
 * Intentionally has zero imports from the events or queue packages — saga
 * coordination is pure domain orchestration and carries no transport concerns.
 *
 * Consumers that need saga execution inject SAGA_ORCHESTRATOR_TOKEN.
 * Background workers that need periodic cleanup inject SagaCleanupService.
 *
 * Required peer providers (must be registered at the app layer):
 *   - LOGGER_TOKEN        (LoggerPort)
 *   - TRANSACTION_PORT_TOKEN (TransactionPort)
 *   - SAGA_STATE_TOKEN    (SagaStatePort)
 *   - METRICS_PORT_TOKEN  (MetricsPort) — optional
 */
@Global()
@Module({
  providers: [
    SagaOrchestrator,
    SagaCleanupService,
    {
      provide: SAGA_ORCHESTRATOR_TOKEN,
      useExisting: SagaOrchestrator,
    },
  ],
  exports: [SAGA_ORCHESTRATOR_TOKEN, SagaCleanupService],
})
export class SagaModule {}
