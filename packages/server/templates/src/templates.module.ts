import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TEMPLATE_RENDERER_TOKEN } from '@workspace/ports';
import { HandlebarsTemplateRenderer } from './adapters/template-renderer.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: TEMPLATE_RENDERER_TOKEN,
      useClass: HandlebarsTemplateRenderer,
    },
  ],
  exports: [TEMPLATE_RENDERER_TOKEN],
})
export class TemplateModule {}
