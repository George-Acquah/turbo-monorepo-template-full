'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/client-ui-overlays';
import { memberNav } from '@/shared/config/navigation';
import { beginNavigation } from '@/shared/lib/navigation-progress';
import { COMMAND_PALETTE_EVENT } from '../config/command-palette.config';

/**
 * App-wide ⌘K / Ctrl+K palette. Mounted once by the shell.
 *
 * Opens either from the keyboard shortcut or from a `COMMAND_PALETTE_EVENT`
 * window event — that event is how the topbar search button opens it without
 * needing a shared context provider around the whole shell.
 *
 * TODO(data): add resource results (programmes, courses, events) once search exists.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    const onOpenRequest = () => setOpen(true);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(COMMAND_PALETTE_EVENT, onOpenRequest);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {memberNav.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                setOpen(false);
                beginNavigation();
                router.push(item.href);
              }}
            >
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
