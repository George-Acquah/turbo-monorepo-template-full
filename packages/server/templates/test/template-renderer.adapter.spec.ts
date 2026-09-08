import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '@jest/globals';
import type { LoggerPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { HandlebarsTemplateRenderer } from '../src/adapters/template-renderer.adapter';

function createRenderer(): HandlebarsTemplateRenderer {
  const logger = createMock<Pick<LoggerPort, 'log' | 'error' | 'warn' | 'debug' | 'verbose'>>([
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
  ]);
  return new HandlebarsTemplateRenderer(logger as unknown as LoggerPort);
}

describe('HandlebarsTemplateRenderer', () => {
  it('renders the user-welcome email template and interpolates variables', async () => {
    const renderer = createRenderer();
    const html = await renderer.renderFromFile('emails/user-welcome', {
      frontendUrl: 'https://example.com',
      name: 'Jane',
      email: 'jane@example.com',
      loginUrl: 'https://example.com/login',
      supportEmail: 'support@example.com',
      year: 2026,
    });

    expect(html).toContain('Workspace');
    expect(html).toContain('Welcome aboard, Jane!');
    expect(html).toContain('jane@example.com');
  });

  it('renders the receipt document template', async () => {
    const renderer = createRenderer();
    const html = await renderer.renderFromFile('documents/receipt', {
      receiptNumber: 'RCT-001',
      schoolName: 'Workspace Academy',
      schoolInitials: 'TP',
      studentName: 'John Doe',
      paymentDate: '2026-07-16',
      paymentMethod: 'Card',
      items: [{ description: 'Programme Fee', amount: 50000 }],
      currency: 'GHS',
      amount: 50000,
      generatedDate: '2026-07-16',
    });

    expect(html).toContain('RCT-001');
    expect(html).toContain('John Doe');
    expect(html).toContain('500.00');
  });

  it('renders the invoice document template with dynamic primaryColor', async () => {
    const renderer = createRenderer();
    const html = await renderer.renderFromFile('documents/invoice', {
      invoiceNumber: 'INV-001',
      schoolName: 'Workspace Academy',
      schoolInitials: 'TP',
      studentName: 'John Doe',
      status: 'PAID',
      statusBg: '#dcfce7',
      statusFg: '#166534',
      totalAmount: 50000,
      discountAmount: 5000,
      paidAmount: 45000,
      balanceAmount: 0,
      currency: 'GHS',
      items: [{ name: 'Programme Fee', category: 'Tuition', amount: 50000, isOptional: false }],
      primaryColor: '#7c3aed',
      generatedDate: '2026-07-16',
    });

    expect(html).toContain('INV-001');
    expect(html).toContain('#7c3aed');
  });

  it('renders the certificate document template', async () => {
    const renderer = createRenderer();
    const html = await renderer.renderFromFile('documents/certificate', {
      certificateNumber: 'CERT-001',
      memberName: 'John Doe',
      programmeName: 'Advanced Trading Mastery',
      completionDate: '2026-07-16',
      generatedDate: '2026-07-16',
    });

    expect(html).toContain('CERT-001');
    expect(html).toContain('John Doe');
    expect(html).toContain('Advanced Trading Mastery');
  });

  // Regression guard: a stray mid-document `</mjml>` (or any structural
  // breakage) makes mjml2html throw "Malformed MJML", which the worker's
  // NotificationDispatchService swallows — the email just never sends. Every
  // `.mjml` under emails/ must produce real HTML with a permissive context.
  const emailsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'handlebars',
    'emails',
  );
  const emailTemplates = readdirSync(emailsDir)
    .filter((f) => f.endsWith('.mjml'))
    .map((f) => f.replace(/\.mjml$/, ''));

  it('has email templates to check', () => {
    expect(emailTemplates.length).toBeGreaterThan(20);
  });

  it.each(emailTemplates)('renders emails/%s to non-empty HTML', async (name) => {
    const renderer = createRenderer();
    const html = await renderer.renderFromFile(`emails/${name}`, {
      frontendUrl: 'https://example.com',
      logoUrl: 'https://example.com/logo.png',
      supportEmail: 'support@example.com',
      year: 2026,
      name: 'Jane',
      email: 'jane@example.com',
    });
    expect(html).toContain('<!doctype html>');
    expect(html.length).toBeGreaterThan(500);
    expect(html).toContain('Workspace');
  });
});
