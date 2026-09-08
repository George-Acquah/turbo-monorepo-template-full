import type { Metadata } from 'next';
import { Inter, Manrope, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { THEME_COOKIE } from '@/shared/lib/cookie-names';
import { Providers } from './providers';

// Bound to the CSS variable names @workspace/client-theme/tokens.css references
// (--font-inter / --font-manrope / --font-mono-dashboard).
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'], display: 'swap' });
const mono = IBM_Plex_Mono({
  variable: '--font-mono-dashboard',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Workspace — Member Portal',
  description: 'Your programmes, access, and account.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${mono.variable} h-full antialiased dark`}
    >
      <head>
        {/*
          Anti-flash: runs before first paint, so the correct theme is on <html> before any
          content renders. `<html>` ships with `dark` already applied, so this only ever needs
          to *remove* it — meaning the common (dark) case costs nothing and there's no flash in
          either direction.

          `system` is resolved here against the OS, not treated as "no preference". An earlier
          version had `var theme = match ? match[2] : 'dark'` and then tested `!theme` — which
          is never true, since the fallback is a non-empty string. That made the system branch
          dead code and the cookie itself unwritten by anything. Keep the cookie name in sync
          with THEME_COOKIE.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = document.cookie.match(new RegExp('(^| )${THEME_COOKIE}=([^;]+)'));
                  var pref = m ? m[2] : 'system';
                  var dark = pref === 'dark' ||
                    (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', dark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
