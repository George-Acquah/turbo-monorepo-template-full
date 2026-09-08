import { Module } from '@nestjs/common';
import { PermissionsModule } from '@workspace/permissions';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/**
 * Admin reporting. `PrismaService` is global (PrismaModule), so only the guard stack
 * (RolesGuard + its resolver) needs wiring — via PermissionsModule.
 */
@Module({
  imports: [PermissionsModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
