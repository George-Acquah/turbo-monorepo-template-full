import { Inject, Injectable } from '@nestjs/common';
import { type EmailJobData } from '@workspace/types';
import { LOGGER_TOKEN, type LoggerPort, TEMPLATE_RENDERER_TOKEN } from '@workspace/ports';
import type { TemplateRendererPort } from '@workspace/ports';
import { BRANDING_RUNTIME_CONFIG_TOKEN, type BrandingRuntimeConfig } from '@workspace/ports/config';

// Prod fallbacks — only used if branding config is somehow absent. `landingUrl`
// is the public marketing site (apps/landing); `portalUrl` is the authenticated
// member app (apps/members). Templates link members to `portalUrl` (dashboard,
// billing, learn, settings) and to `landingUrl` for public pages (programmes,
// events).
const FALLBACK_LANDING_URL = 'https://example.com';
const FALLBACK_PORTAL_URL = 'https://app.example.com';
const FALLBACK_SUPPORT_EMAIL = 'support@example.com';

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

@Injectable()
export class EmailTemplateRenderingService {
  private readonly context = EmailTemplateRenderingService.name;

  constructor(
    @Inject(TEMPLATE_RENDERER_TOKEN) private readonly renderer: TemplateRendererPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(BRANDING_RUNTIME_CONFIG_TOKEN) private readonly branding: BrandingRuntimeConfig,
  ) {}

  async renderIfNeeded(job: EmailJobData): Promise<EmailJobData> {
    if (job.htmlBody || job.body) return job;

    const landingUrl = stripTrailingSlash(this.branding.landingUrl || FALLBACK_LANDING_URL);
    const portalUrl = stripTrailingSlash(this.branding.portalUrl || FALLBACK_PORTAL_URL);
    const companyName = this.branding.landingName || 'Workspace';

    const templateContext = {
      companyName,
      // Public marketing site.
      landingUrl,
      // Authenticated member app (apps/members).
      portalUrl,
      // Legacy alias some older templates/contexts may still reference —
      // points at the public site, same as `landingUrl`.
      frontendUrl: landingUrl,
      supportEmail: this.branding.supportEmail || FALLBACK_SUPPORT_EMAIL,
      logoUrl: `${landingUrl}/workspace.webp`,
      year: new Date().getFullYear(),
      ...job.context,
    };

    const htmlBody = await this.renderer.renderFromFile(`emails/${job.template}`, templateContext);
    return { ...job, htmlBody };
  }
}
