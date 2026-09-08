import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipRateLimit } from '@workspace/decorators';
import {
  DATABASE_HEALTH_TOKEN,
  type DatabaseHealthPort,
  type DatabaseHealthReport,
} from '@workspace/ports';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_HEALTH_TOKEN)
    private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  @Get()
  @SkipRateLimit()
  async check(): Promise<{ status: 'ok'; databases: DatabaseHealthReport[] }> {
    const databases = await this.databaseHealth.checkAll();
    const healthy = databases.every((db) => db.healthy);

    if (!healthy) {
      throw new ServiceUnavailableException({ status: 'degraded', databases });
    }

    return { status: 'ok', databases };
  }
}
