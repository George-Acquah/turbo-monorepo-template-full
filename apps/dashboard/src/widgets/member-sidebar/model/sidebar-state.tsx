'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SIDEBAR_COOKIE, SIDEBAR_COOKIE_MAX_AGE } from '../config/sidebar.config';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

/**
 * Holds the sidebar collapse state, seeded from the value the server already
 * read out of the cookie — so the first paint is already the right width and
 * there's no expand/collapse flash on load.
 */
export function SidebarProvider({
  defaultCollapsed,
  children,
}: {
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      // Persist so the next server render seeds the same value.
      document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within <SidebarProvider>');
  }
  return context;
}
