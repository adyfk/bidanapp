import { themeStyleVariables } from '@marketplace/ui';
import { appFontClassName, resolvePlatformContext } from '@marketplace/web';
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
