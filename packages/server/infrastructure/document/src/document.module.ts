import { Module } from '@nestjs/common';
import { TemplateModule } from '@workspace/templates';
import { PuppeteerDocumentService } from './puppeteer-document.service';
import { DOCUMENT_SERVICE_TOKEN } from '@workspace/ports';

@Module({
  imports: [TemplateModule],
  providers: [
    PuppeteerDocumentService,
    { provide: DOCUMENT_SERVICE_TOKEN, useExisting: PuppeteerDocumentService },
  ],
  exports: [DOCUMENT_SERVICE_TOKEN],
})
export class DocumentModule {}
