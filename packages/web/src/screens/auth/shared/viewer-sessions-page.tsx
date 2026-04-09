'use client';

import type { ViewerDeviceSession, ViewerSession } from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';
import { MarketplaceHeroBanner, MarketplaceTopPill } from '@marketplace/ui';
import { useEffect, useState } from 'react';
import { redirectToTarget } from '../../../controllers/viewer-auth';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { createPlatformLoginPath, createViewerSecurityHref } from '../../../lib/platform';
import { MarketplaceAuthShell } from './parts/auth-shell';
import { MarketplaceDeviceSessionList } from './parts/device-session-list';
import { viewerAuthClient } from './runtime';
import { useViewerAuthController } from './use-viewer-auth-controller';

export function ViewerSessionsPage({
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
  const [items, setItems] = useState<ViewerDeviceSession[]>([]);
  const [feedback, setFeedback] = useState('');
  const [busySessionId, setBusySessionId] = useState('');
  const [busyLogoutAll, setBusyLogoutAll] = useState(false);

  const load = async () => {
    const [sessionPayload, sessionsPayload] = await Promise.all([
      viewerAuth.fetchSession(viewerAuthClient),
      viewerAuth.fetchSessions(viewerAuthClient),
    ]);
    setSession(sessionPayload);
    setItems(sessionsPayload.items || []);
  };

  useEffect(() => {
    void load().catch((error) => {
      setFeedback(error instanceof Error ? error.message : 'Gagal memuat daftar session.');
    });
  }, [viewerAuth]);

  const handleRevoke = async (sessionId: string) => {
    try {
      setBusySessionId(sessionId);
      setFeedback('');
      const payload = await viewerAuth.revokeSession(viewerAuthClient, sessionId);
      if (payload.currentSessionExpired) {
        redirectToTarget(createPlatformLoginPath(locale));
        return;
      }
      await load();
      setFeedback(en ? 'Device session revoked.' : 'Session perangkat berhasil dicabut.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal mencabut session.');
    } finally {
      setBusySessionId('');
    }
  };

  const handleLogoutOthers = async () => {
    try {
      setBusyLogoutAll(true);
      setFeedback('');
      await viewerAuth.logoutOtherSessions(viewerAuthClient);
      await load();
      setFeedback(en ? 'All other devices have been logged out.' : 'Semua perangkat lain berhasil dikeluarkan.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal mengeluarkan device lain.');
    } finally {
      setBusyLogoutAll(false);
    }
  };

  return (
    <MarketplaceAuthShell
      backHref={createViewerSecurityHref(locale, platformId)}
      title={en ? 'Device sessions' : 'Session perangkat'}
    >
      <MarketplaceHeroBanner
        eyebrow={<MarketplaceTopPill tone="glass">Security</MarketplaceTopPill>}
        title={en ? 'Manage active devices' : 'Kelola perangkat aktif'}
        description={
          en
            ? 'Review trusted devices and revoke anything you no longer use.'
            : 'Tinjau perangkat yang masih dipercaya dan cabut akses yang sudah tidak dipakai.'
        }
      />
      <MarketplaceDeviceSessionList
        busyLogoutAll={busyLogoutAll}
        busySessionId={busySessionId}
        en={en}
        feedback={feedback}
        isAuthenticated={Boolean(session?.isAuthenticated)}
        items={items}
        locale={locale}
        platformId={platformId}
        onLogoutOthers={() => void handleLogoutOthers()}
        onRevoke={(sessionId) => void handleRevoke(sessionId)}
      />
    </MarketplaceAuthShell>
  );
}
