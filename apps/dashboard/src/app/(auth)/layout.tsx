import { GraduationCap, Users, Video } from 'lucide-react';

/**
 * Auth screens sit outside the app shell — no sidebar, no topbar.
 *
 * Split layout: the form owns the right column, a brand/value panel the left. The left panel is
 * `lg:`-only — on a phone it would push the form below the fold, and the form is the only thing
 * anyone came here to use.
 */
const VALUE_PROPS = [
  { icon: GraduationCap, title: 'Structured programmes', body: 'From your first chart to a funded account.' },
  { icon: Video, title: 'Live sessions & replays', body: 'Trade alongside mentors, or catch up after.' },
  { icon: Users, title: 'A community that trades', body: 'Members-only rooms, not a public chat.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient-canvas flex min-h-dvh bg-background">
      {/* Brand / value column */}
      <aside className="relative hidden w-1/2 flex-col justify-between p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground"
          >
            S
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Workspace
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground">
            Learn to trade with structure, not guesswork.
          </h2>
          <ul className="mt-8 space-y-4">
            {VALUE_PROPS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"
                >
                  <item.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block text-sm text-muted-foreground">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          {/* TEMPLATE: replace with a short product line or remove. */}
          Your product, in one place.
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="glass-strong w-full max-w-sm rounded-2xl p-6 shadow-elevation-3 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
