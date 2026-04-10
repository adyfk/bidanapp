'use client';

import type { ViewerDeviceSession } from '@marketplace/marketplace-core/viewer-auth';
import { MarketplaceEmptyCard, MarketplaceListCard } from '@marketplace/ui/marketplace-lite';
import { MessageBanner, PrimaryButton, SecondaryButton, StatusPill } from '@marketplace/ui/primitives';
import { formatDateTime } from '../../../../lib/marketplace-copy';
import { createPlatformLoginPath } from '../../../../lib/platform';

export function MarketplaceDeviceSessionList({
  busyLogoutAll,
  busySessionId,
  en,
  feedback,
  isAuthenticated,
  items,
  locale,
  onLogoutOthers,
  onRevoke,
}: {
  busyLogoutAll: boolean;
  busySessionId: string;
  en: boolean;
  feedback: string;
  isAuthenticated: boolean;
  items: ViewerDeviceSession[];
  locale: string;
  onLogoutOthers: () => void;
  onRevoke: (sessionId: string) => void;
}) {
  const loginHref = createPlatformLoginPath(locale);

  return (
    <>
      {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

      {!isAuthenticated ? (
        <MarketplaceEmptyCard
          action={
            <a href={loginHref}>
              <PrimaryButton type="button">{en ? 'Sign in' : 'Masuk'}</PrimaryButton>
            </a>
          }
          description={
            en
              ? 'Sign in first to inspect device sessions.'
              : 'Masuk dulu untuk melihat daftar perangkat yang sedang terhubung.'
          }
          title={en ? 'Session list is unavailable' : 'Daftar perangkat belum tersedia'}
        />
      ) : items.length ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PrimaryButton disabled={busyLogoutAll} onClick={onLogoutOthers} type="button">
              {busyLogoutAll ? 'Memproses...' : en ? 'Logout other devices' : 'Keluar dari device lain'}
            </PrimaryButton>
          </div>
          {items.map((item) => (
            <MarketplaceListCard
              key={item.id}
              badge={
                <StatusPill tone={item.current ? 'accent' : 'neutral'}>
                  {item.current ? (en ? 'Current' : 'Perangkat ini') : 'Device'}
                </StatusPill>
              }
              title={item.sessionLabel || item.userAgent || item.id}
              subtitle={item.ipAddress || (en ? 'Unknown IP' : 'IP tidak diketahui')}
              description={`${en ? 'Last seen' : 'Terakhir aktif'} • ${formatDateTime(item.lastSeenAt, locale)}`}
              meta={
                <div className="space-y-3">
                  <div className="text-[12px] text-gray-500">
                    {en ? 'Expires' : 'Berakhir'} • {formatDateTime(item.expiresAt, locale)}
                  </div>
                  {!item.current ? (
                    <SecondaryButton
                      disabled={busySessionId === item.id}
                      onClick={() => onRevoke(item.id)}
                      type="button"
                    >
                      {busySessionId === item.id ? 'Mencabut...' : en ? 'Revoke device' : 'Cabut perangkat'}
                    </SecondaryButton>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <MarketplaceEmptyCard
          description={
            en
              ? 'This list will appear after your account is used on a device.'
              : 'Daftar ini akan muncul setelah akun Anda dipakai di sebuah perangkat.'
          }
          title={en ? 'No sessions yet' : 'Belum ada perangkat yang terhubung'}
        />
      )}
    </>
  );
}
