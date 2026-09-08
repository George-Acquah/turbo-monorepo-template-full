import { BadgeCheck, CalendarDays, Mail, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, Badge, cn } from '@workspace/client-ui-primitives';
import { formatDate } from '@workspace/client-lib/utils';
import type { Account } from '@/entities/account';
import { profileCompleteness } from '../lib/completeness';
import { CompletenessRing } from './completeness-ring';

/**
 * The account screen's one hero. `tile-spotlight` is used here and nowhere else on this page —
 * it's an emphasis device, and a second one would cancel the first out (see tokens.css).
 */
export function ProfileHero({ account }: { account: Account }) {
  const completeness = profileCompleteness(account);
  const name = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
  const initials =
    [account.firstName?.[0], account.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    account.email[0]?.toUpperCase() ||
    'M';

  return (
    <section className="glass-strong tile-spotlight rounded-2xl p-6 shadow-elevation-3">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar size="lg" className="size-16 shrink-0">
          <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {name || 'Your profile'}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{account.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Icon carries the meaning alongside colour — never colour alone. */}
            <Badge variant="outline" className={cn(account.userId ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning')}>
              {account.userId ? <BadgeCheck className="size-3" /> : <ShieldAlert className="size-3" />}
              {account.userId ? 'Verified account' : 'Unclaimed'}
            </Badge>
            <Badge variant="secondary">
              <CalendarDays className="size-3" />
              Member since {formatDate(String(account.createdAt))}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <CompletenessRing percent={completeness.percent} />
          <p className="text-xs text-muted-foreground sm:text-right">
            {completeness.percent === 100
              ? 'Profile complete'
              : `${completeness.filled} of ${completeness.total} fields`}
          </p>
        </div>
      </div>

      {completeness.missing.length > 0 && (
        <p className="mt-5 rounded-lg bg-surface-2/50 px-3 py-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Finish your profile:</span>{' '}
          {completeness.missing.join(', ').toLowerCase()} still to add.
        </p>
      )}
    </section>
  );
}
