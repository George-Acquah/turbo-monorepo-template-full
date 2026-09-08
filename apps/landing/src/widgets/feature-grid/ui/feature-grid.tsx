import { Sparkles, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';
import { Container } from '@/shared/ui/container';
import { SITE } from '@/shared/config/site';

const ICONS: LucideIcon[] = [Sparkles, Zap, ShieldCheck];

export function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-[--color-border] py-20">
      <Container>
        <h2 className="text-center text-3xl font-semibold tracking-tight">What you get</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {SITE.features.map((feature, i) => {
            const Icon = ICONS[i % ICONS.length]!;
            return (
              <div
                key={feature.title}
                className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-6"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[--color-surface-2] text-[--color-accent]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-[--color-muted]">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
