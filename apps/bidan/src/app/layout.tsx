import { themeStyleVariables } from '@marketplace/ui/foundations';
import { appFontClassName } from '@marketplace/web/fonts';
import { resolvePlatformContext } from '@marketplace/web/server';
import './globals.css';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const platform = await resolvePlatformContext('bidan');

  return (
    <html lang="id">
      <body className={appFontClassName} style={themeStyleVariables(platform.theme)}>
        {children}
      </body>
    </html>
  );
}
