import { Lock, MessageSquare, Send, Smartphone, Bell, type LucideIcon } from 'lucide-react';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';
import { PreferenceSwitch } from './preference-switch';

const CHANNEL_META: Record<string, { label: string; icon: LucideIcon }> = {
  IN_APP: { label: 'In-app', icon: Bell },
  SMS: { label: 'SMS', icon: MessageSquare },
  PUSH: { label: 'Push', icon: Smartphone },
  WHATSAPP: { label: 'WhatsApp', icon: Send },
};

/**
 * Category × channel matrix. Email is deliberately absent — the backend never gates it on a
 * preference (see the API's own doc comment on `CONFIGURABLE_NOTIFICATION_CHANNELS`), so there
 * is no channel column for it here either; a switch that can't do anything is worse than no
 * switch. A locked cell (an active compliance/security override forces delivery) renders as
 * static text, not a switch the backend would silently overrule.
 */
export async function NotificationPreferencesPanel() {
  const client = await getServerApiClient();
  const { data } = unwrap(await client.GET('/api/v1/notification-preferences'));

  const categories = [...new Set(data.entries.map((e) => e.category))];
  const channels = [...new Set(data.entries.map((e) => e.channel))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-md text-sm">
        <thead>
          <tr>
            <th className="w-0 pb-2 text-left text-xs font-medium text-muted-foreground">Category</th>
            {channels.map((channel) => {
              const meta = CHANNEL_META[channel];
              return (
                <th key={channel} className="pb-2 text-center text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {meta && <meta.icon aria-hidden className="size-3.5" />}
                    {meta?.label ?? channel}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category} className="border-t border-glass-border">
              <td className="py-3 pr-4 text-foreground">{data.categoryLabels[category] ?? category}</td>
              {channels.map((channel) => {
                const entry = data.entries.find((e) => e.category === category && e.channel === channel);
                if (!entry) return <td key={channel} />;
                return (
                  <td key={channel} className="py-3 text-center">
                    {entry.locked ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        title={entry.lockedReason ?? undefined}
                      >
                        <Lock aria-hidden className="size-3" />
                        Always on
                      </span>
                    ) : (
                      <PreferenceSwitch category={category} channel={channel} enabled={entry.enabled} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
