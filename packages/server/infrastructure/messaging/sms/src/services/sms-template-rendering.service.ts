import { Inject, Injectable } from '@nestjs/common';
import { type SmsJobData } from '@workspace/types';
import { LOGGER_TOKEN, type LoggerPort, TEMPLATE_RENDERER_TOKEN } from '@workspace/ports';
import type { TemplateRendererPort } from '@workspace/ports';

@Injectable()
export class SmsTemplateRenderingService {
  private readonly context = SmsTemplateRenderingService.name;

  constructor(
    @Inject(TEMPLATE_RENDERER_TOKEN) private readonly renderer: TemplateRendererPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  async renderIfNeeded(job: SmsJobData): Promise<SmsJobData> {
    if (job.body) return job;

    const body = await this.renderer.renderFromFile(`sms/${job.template}`, job.context);
    return { ...job, body };
  }
}
