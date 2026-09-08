import { describe, it, expect, beforeEach } from '@jest/globals';
import type { EmailJobData } from '@workspace/types';
import type { LoggerPort, TemplateRendererPort } from '@workspace/ports';
import type { BrandingRuntimeConfig } from '@workspace/ports/config';
import { createMock } from '@workspace/testing/jest';
import { EmailTemplateRenderingService } from '../src/services/email-template-rendering.service';

function baseJob(overrides: Partial<EmailJobData> = {}): EmailJobData {
  return {
    deliveryId: 'dlv_1',
    to: { email: 'member@example.com' },
    subject: 'Test subject',
    template: 'user-welcome',
    context: { name: 'Jane' },
    ...overrides,
  };
}

const branding: BrandingRuntimeConfig = {
  apiUrl: 'http://localhost:3000',
  landingUrl: 'https://workspace.test',
  portalUrl: 'https://app.workspace.test',
  landingName: 'Workspace',
  supportEmail: 'support@workspace.test',
};

describe('EmailTemplateRenderingService', () => {
  let renderer: ReturnType<typeof createMock<Pick<TemplateRendererPort, 'renderFromFile'>>>;
  let logger: ReturnType<typeof createMock<Pick<LoggerPort, 'warn'>>>;
  let service: EmailTemplateRenderingService;

  beforeEach(() => {
    renderer = createMock<Pick<TemplateRendererPort, 'renderFromFile'>>(['renderFromFile']);
    logger = createMock<Pick<LoggerPort, 'warn'>>(['warn']);
    service = new EmailTemplateRenderingService(
      renderer as unknown as TemplateRendererPort,
      logger as unknown as LoggerPort,
      branding,
    );
  });

  it('is a no-op when htmlBody is already set', async () => {
    const job = baseJob({ htmlBody: '<p>already rendered</p>' });

    const result = await service.renderIfNeeded(job);

    expect(result).toBe(job);
    expect(renderer.renderFromFile).not.toHaveBeenCalled();
  });

  it('is a no-op when body is already set', async () => {
    const job = baseJob({ body: 'plain text already set' });

    const result = await service.renderIfNeeded(job);

    expect(result).toBe(job);
    expect(renderer.renderFromFile).not.toHaveBeenCalled();
  });

  it.each([
    ['user-welcome', 'emails/user-welcome'],
    ['password-reset', 'emails/password-reset'],
    ['payment-receipt', 'emails/payment-receipt'],
    ['email-verification', 'emails/email-verification'],
  ] as const)(
    'renders %s via the %s file with landing/portal URLs from branding config',
    async (template, expectedFile) => {
      renderer.renderFromFile.mockResolvedValue('<p>rendered</p>');
      const job = baseJob({ template, context: { foo: 'bar' } });

      const result = await service.renderIfNeeded(job);

      expect(renderer.renderFromFile).toHaveBeenCalledWith(
        expectedFile,
        expect.objectContaining({
          foo: 'bar',
          companyName: 'Workspace',
          landingUrl: 'https://workspace.test',
          portalUrl: 'https://app.workspace.test',
          frontendUrl: 'https://workspace.test',
          supportEmail: 'support@workspace.test',
          logoUrl: 'https://workspace.test/workspace.webp',
        }),
      );
      expect(result.htmlBody).toBe('<p>rendered</p>');
    },
  );

  it('strips trailing slashes and lets job context win', async () => {
    renderer.renderFromFile.mockResolvedValue('<p>x</p>');
    const slashy = new EmailTemplateRenderingService(
      renderer as unknown as TemplateRendererPort,
      logger as unknown as LoggerPort,
      { ...branding, landingUrl: 'https://workspace.test/', portalUrl: 'https://app.workspace.test/' },
    );

    await slashy.renderIfNeeded(baseJob({ context: { portalUrl: 'https://override.test' } }));

    expect(renderer.renderFromFile).toHaveBeenCalledWith(
      'emails/user-welcome',
      expect.objectContaining({
        landingUrl: 'https://workspace.test',
        portalUrl: 'https://override.test',
      }),
    );
  });
});
