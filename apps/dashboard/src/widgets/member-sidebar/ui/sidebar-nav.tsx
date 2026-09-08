import { memberNav } from '@/shared/config/navigation';
import { NavItem } from './nav-item';

/**
 * The nav list itself — shared verbatim by the desktop sidebar and the mobile
 * drawer so there is exactly one nav definition. Server component; only the
 * individual `NavItem`s cross into the client (they need `usePathname`).
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {memberNav.map((item) => (
        <NavItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
