import { LOGGER_TOKEN, LoggerPort, TemplateRendererPort } from '@workspace/ports';

import { Inject, Injectable } from '@nestjs/common';
import Handlebars, { TemplateDelegate } from 'handlebars';
import mjml from 'mjml';
import * as fs from 'fs/promises';
import { statSync } from 'fs';
import { BRAND_COLORS } from '@workspace/brand-tokens';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class HandlebarsTemplateRenderer implements TemplateRendererPort {
  private readonly context = HandlebarsTemplateRenderer.name;
  private readonly templatesDir: string;

  private templateCache: Map<string, TemplateDelegate> = new Map();

  constructor(@Inject(LOGGER_TOKEN) private readonly logger: LoggerPort) {
    // when compiled by tsdown, all code is bundled into index.mjs in dist/
    // so __dirname at runtime points to the dist/ directory
    // The handlebars folder is copied to dist/handlebars during build
    const baseDir = __dirname;

    // Try possible locations for handlebars directory
    // Since __dirname = dist/, handlebars should be at dist/handlebars
    const candidates = [
      path.join(baseDir, 'handlebars'), // dist/handlebars (most likely after tsdown bundle)
      path.resolve(baseDir, '..', 'handlebars'), // parent/handlebars (fallback)
    ];

    let resolvedPath: string | null = null;
    for (const candidate of candidates) {
      try {
        const stat = statSync(candidate);
        if (stat.isDirectory()) {
          resolvedPath = candidate;
          break;
        }
      } catch (_e) {
        // Continue trying other paths
      }
    }

    // If still not found, use a default and let registerPartials handle the error gracefully
    this.templatesDir = resolvedPath || path.join(baseDir, 'handlebars');

    this.registerHelpers();
  }

  render(template: string, variables: Record<string, unknown>): string {
    const compiledTemplate = Handlebars.compile(template, { strict: true, noEscape: true });
    return compiledTemplate(this.withDefaultBrandContext(variables));
  }

  async renderFromFile(templateName: string, variables: Record<string, unknown>): Promise<string> {
    const compiledTemplate = await this.loadTemplate(templateName);
    return compiledTemplate(this.withDefaultBrandContext(variables));
  }

  private withDefaultBrandContext(variables: Record<string, unknown>): Record<string, unknown> {
    return {
      companyName: 'Workspace',
      frontendUrl: 'https://example.com',
      supportEmail: 'support@example.com',
      logoUrl: 'https://example.com/workspace.webp',
      year: new Date().getFullYear(),
      ...variables,
      colors: BRAND_COLORS,
    };
  }

  private resolveTemplateName(name: string): string {
    const normalized = name.endsWith('.hbs') ? name.slice(0, -4) : name;

    // basic traversal guard
    const safe = normalized.replace(/^(\.\.(\/|\\|$))+/, '');

    // respect explicit namespace paths for emails/layouts/partials/documents
    if (
      safe.startsWith('emails/') ||
      safe.startsWith('layouts/') ||
      safe.startsWith('partials/') ||
      safe.startsWith('documents/')
    ) {
      return safe;
    }

    // keep explicit nested paths for custom namespaces
    if (safe.includes('/')) {
      return safe;
    }

    // ✅ default: email templates live under /emails
    return `emails/${safe}`;
  }

  private async loadTemplate(templateName: string): Promise<TemplateDelegate> {
    if (process.env.NODE_ENV === 'development') this.templateCache.clear();

    const resolvedName = this.resolveTemplateName(templateName);
    const hbsPath = path.join(this.templatesDir, `${resolvedName}.hbs`);
    const mjmlPath = path.join(this.templatesDir, `${resolvedName}.mjml`);

    // Use hbs cache key if file exists, else mjml cache key
    const cacheKey = hbsPath;

    if (this.templateCache.has(cacheKey)) return this.templateCache.get(cacheKey)!;

    // Try .hbs first, then .mjml
    let templateContent: string | null = null;
    let isMjml = false;

    try {
      templateContent = await fs.readFile(hbsPath, 'utf-8');
    } catch {
      try {
        templateContent = await fs.readFile(mjmlPath, 'utf-8');
        isMjml = true;
      } catch {
        templateContent = null;
      }
    }

    if (!templateContent) {
      this.logger.error(
        `Failed to load template — not found at ${hbsPath} or ${mjmlPath}`,
        undefined,
        this.context,
      );
      throw new Error(`Template ${resolvedName} not found`);
    }

    let compiled: TemplateDelegate;

    if (isMjml) {
      // mjml() is async in MJML v5 — must be awaited or result is a Promise
      const result = await mjml(templateContent, { validationLevel: 'soft' });
      const errors = result.errors ?? [];
      if (errors.length > 0) {
        errors.forEach((e) =>
          this.logger.warn(`MJML [${resolvedName}] line ${e.line}: ${e.message}`, this.context),
        );
      }
      // noEscape: MJML output is already-formed HTML; Handlebars must not re-escape it
      compiled = Handlebars.compile(result.html, { noEscape: true });
    } else {
      compiled = Handlebars.compile(templateContent);
    }

    this.templateCache.set(cacheKey, compiled);
    return compiled;
  }

  private registerHelpers() {
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(date),
      );
    });

    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    Handlebars.registerHelper('cleanGreeting', (value: unknown) => {
      if (typeof value !== 'string') return 'there';
      if (value.includes('@')) {
        const namePart = value.split('@')[0] || 'there';
        return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
      }
      return value;
    });

    Handlebars.registerHelper('formatAmount', (amount: number) => {
      if (typeof amount !== 'number') return '0.00';
      return (amount / 100).toFixed(2);
    });

    Handlebars.registerHelper('add', (a: number, b: number) => {
      if (typeof a !== 'number' || typeof b !== 'number') return 0;
      return a + b;
    });

    Handlebars.registerHelper('gt', (a: number, b: number) => {
      if (typeof a !== 'number' || typeof b !== 'number') return false;
      return a > b;
    });
  }
}
