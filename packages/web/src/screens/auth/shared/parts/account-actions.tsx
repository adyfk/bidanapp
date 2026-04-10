'use client';

import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import { PrimaryButton, SecondaryButton } from '@marketplace/ui/primitives';
import { useEffect, useState } from 'react';
import { redirectToTarget } from '../../../../controllers/viewer-auth';
import { firstName } from '../../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../../lib/platform';
import { viewerAuthClient } from '../runtime';
import { useViewerAuthController } from '../use-viewer-auth-controller';

export function ViewerAccountActions({
  initialSession,
  locale,
  loginHref,
  ordersHref,
  profileHref,
  registerHref,
  returnHref,
  securityHref,
}: {
  initialSession?: ViewerSession | null;
  locale: string;
  loginHref: string;
  ordersHref: string;
  profileHref: string;
  registerHref: string;
  returnHref?: string;
  securityHref: string;
}) {
  const viewerAuth = useViewerAuthController();
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialSession !== undefined) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const payload = await viewerAuth.fetchSession(viewerAuthClient);
        if (active) {
          setSession(payload);
        }
      } catch {
        if (active) {
          setSession(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [initialSession, viewerAuth]);

  const handleLogout = async () => {
    try {
      setBusy(true);
      const payload = await viewerAuth.deleteSession(viewerAuthClient);
      setSession(payload);
      redirectToTarget(returnHref || createLocalizedPath(locale));
    } finally {
      setBusy(false);
    }
  };

  if (!session?.isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-3">
        <a href={loginHref}>
          <SecondaryButton type="button">Masuk</SecondaryButton>
        </a>
        <a href={registerHref}>
          <PrimaryButton type="button">Daftar</PrimaryButton>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={profileHref}>
        <SecondaryButton type="button">{firstName(session.customerProfile?.displayName) || 'Profil'}</SecondaryButton>
      </a>
      <a href={ordersHref}>
        <SecondaryButton type="button">Aktivitas</SecondaryButton>
      </a>
      <a href={securityHref}>
        <SecondaryButton type="button">Keamanan</SecondaryButton>
      </a>
      <SecondaryButton disabled={busy} onClick={() => void handleLogout()} type="button">
        {busy ? 'Memproses...' : 'Keluar'}
      </SecondaryButton>
    </div>
  );
}
