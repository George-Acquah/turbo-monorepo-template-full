import { Inject, Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import {
  DocumentServicePort,
  type ReceiptPdfInput,
  type InvoicePdfInput,
  type CertificatePdfInput,
  TEMPLATE_RENDERER_TOKEN,
  type TemplateRendererPort,
} from '@workspace/ports';

@Injectable()
export class PuppeteerDocumentService extends DocumentServicePort {
  constructor(
    @Inject(TEMPLATE_RENDERER_TOKEN) private readonly templateRenderer: TemplateRendererPort,
  ) {
    super();
  }
  async generateReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
    const html = await this.templateRenderer.renderFromFile(
      'documents/receipt',
      input as unknown as Record<string, unknown>,
    );
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
    const statusColors: Record<string, { bg: string; fg: string }> = {
      DRAFT: { bg: '#f3f4f6', fg: '#374151' },
      ISSUED: { bg: '#dbeafe', fg: '#1e40af' },
      PARTIALLY_PAID: { bg: '#fef9c3', fg: '#854d0e' },
      PAID: { bg: '#dcfce7', fg: '#166534' },
      OVERDUE: { bg: '#fee2e2', fg: '#991b1b' },
      CANCELLED: { bg: '#f3f4f6', fg: '#6b7280' },
    };
    const sc = statusColors[input.status] ?? { bg: '#f3f4f6', fg: '#374151' };

    const html = await this.templateRenderer.renderFromFile('documents/invoice', {
      ...input,
      statusBg: sc.bg,
      statusFg: sc.fg,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
    const html = await this.templateRenderer.renderFromFile(
      'documents/certificate',
      input as unknown as Record<string, unknown>,
    );
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
