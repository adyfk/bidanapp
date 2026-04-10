'use client';

import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import type { ServicePlatformId } from '@marketplace/platform-config';
import { MessageBanner } from '@marketplace/ui/primitives';
import { useEffect, useState } from 'react';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { MarketplaceAuthShell } from './parts/auth-shell';
import { MarketplaceSecuritySummary } from './parts/security-summary';
import { viewerAuthClient } from './runtime';
import { useViewerAuthController } from './use-viewer-auth-controller';

export function ViewerSecurityPage({
  initialSession,
  platformId,
  locale,
}: {
  initialSession?: ViewerSession | null;
  platformId?: ServicePlatformId;
  locale: string;
}) {
  const viewerAuth = useViewerAuthController();
  const en = isEnglishLocale(locale);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const payload = await viewerAuth.fetchSession(viewerAuthClient);
        setSession(payload);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Gagal memuat pengaturan akun.');
      }
    })();
  }, [viewerAuth]);

  return (
    <MarketplaceAuthShell
      backHref={platformId ? createLocalizedPath(locale, '/profile') : undefined}
      title={en ? 'Security center' : 'Pusat keamanan'}
    >
      {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}
      <MarketplaceSecuritySummary
        en={en}
        feedback={feedback}
        locale={locale}
        platformId={platformId}
        session={session}
      />
    </MarketplaceAuthShell>
  );
}
