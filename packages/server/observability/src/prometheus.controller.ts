import { Controller, Get, Header, Inject, Req, Res } from '@nestjs/common';
import {
  OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
  type ObservabilityRuntimeConfig,
} from '@repo/config';
import { SkipHttpResponseEnvelope } from '@repo/decorators';
import type { AppRequest, Response } from '@repo/types';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';

interface MetricsUser {
  user: string;
  pass: string;
}

@Controller('metrics')
export class PrometheusController {
  private readonly auth: MetricsUser;
  constructor(
    @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort,
    @Inject(OBSERVABILITY_RUNTIME_CONFIG_TOKEN)
    private readonly config: ObservabilityRuntimeConfig,
  ) {
    this.auth = {
      user: this.config.metricsAuth.user ?? '',
      pass: this.config.metricsAuth.pass ?? '',
    };
  }

  @Get()
  @SkipHttpResponseEnvelope()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics() {
    // Return the raw string directly
    return await this.prometheusService.getMetrics();
  }

  @Get('/auth')
  @SkipHttpResponseEnvelope()
  async getMetricsProduction(@Req() req: AppRequest, @Res() res: Response) {
    const auth = req.headers.authorization;

    if (!this.auth || !auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).send('Unauthorized');
    }

    const decoded = Buffer.from(auth.split(' ')[1] || '', 'base64').toString('utf-8');

    const [user, pass] = decoded.split(':');

    if (user !== this.auth.user || pass !== this.auth.pass) {
      return res.status(403).send('Forbidden');
    }

    const metrics = await this.prometheusService.getMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  }
}
