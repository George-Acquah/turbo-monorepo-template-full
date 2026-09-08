import { Link } from '@/shared/lib/transition-link';

/** Header + footer chrome shared by every auth screen (title, subtitle, alt link). */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        {/* Hidden on lg+ — the auth layout's left panel already carries the brand there, and
            two monograms on one screen reads as a mistake. */}
        <Link
          href="/"
          className="mx-auto grid size-10 place-items-center rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground lg:hidden"
        >
          S
        </Link>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {children}

      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
