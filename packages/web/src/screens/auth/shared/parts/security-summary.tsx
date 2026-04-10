'use client';

import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import type { ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceAccessHero,
  MarketplaceEmptyCard,
  MarketplaceListCard,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton } from '@marketplace/ui/primitives';
import { KeyRound, Smartphone } from 'lucide-react';
import {
  createPlatformForgotPasswordPath,
  createPlatformLoginPath,
  createViewerSessionsHref,
} from '../../../../lib/platform';

export function MarketplaceSecuritySummary({
  en,
  feedback,
  locale,
  platformId,
  session,
}: {
  en: boolean;
  feedback?: string;
  locale: string;
  platformId?: ServicePlatformId;
  session?: ViewerSession | null;
}) {
  void feedback;
  const loginHref = createPlatformLoginPath(locale);
  const sessionsHref = createViewerSessionsHref(locale, platformId);
  const forgotPasswordHref = createPlatformForgotPasswordPath(locale);
  return (
    <>
      <MarketplaceAccessHero
        badgeLabel={en ? 'Security' : 'Keamanan'}
        title={en ? 'Keep your account secure' : 'Jaga akun Anda tetap aman'}
        description={
          en
            ? 'Review active devices and update your password when needed.'
            : 'Tinjau perangkat aktif dan ubah kata sandi saat diperlukan.'
        }
        statusLabel={
          session?.isAuthenticated ? (en ? 'Active account' : 'Akun aktif') : en ? 'Customer path' : 'Jalur customer'
        }
        benefits={[
          { icon: <Smartphone className="h-4 w-4" />, label: session?.phone || '-' },
          {
            icon: <KeyRound className="h-4 w-4" />,
            label: en ? 'Reset password anytime' : 'Reset password kapan pun',
          },
        ]}
      />

      {!session?.isAuthenticated ? (
        <MarketplaceEmptyCard
          action={
            <a href={loginHref}>
              <PrimaryButton type="button">{en ? 'Sign in' : 'Masuk'}</PrimaryButton>
            </a>
          }
          description={
            en ? 'Sign in first to access your security tools.' : 'Masuk dulu untuk membuka alat keamanan akun Anda.'
          }
          title={en ? 'You are not signed in' : 'Anda belum login'}
        />
      ) : (
        <MarketplaceSurfaceCard tone="white">
          <MarketplaceSectionHeader
            title={en ? 'Quick actions' : 'Aksi cepat'}
            description={
              en ? 'Open sessions or reset password from here.' : 'Buka daftar session atau reset password dari sini.'
            }
          />
          <div className="space-y-3">
            <a href={sessionsHref}>
              <MarketplaceListCard
                image={
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: '#fff1f7', color: 'var(--ui-primary)' }}
                  >
                    <Smartphone className="h-5 w-5" />
                  </div>
                }
                title={en ? 'Manage device sessions' : 'Kelola session perangkat'}
                description={
                  en
                    ? 'Review devices that still have access to your account.'
                    : 'Tinjau perangkat yang masih punya akses ke akun Anda.'
                }
              />
            </a>
            <a href={forgotPasswordHref}>
              <MarketplaceListCard
                image={
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: '#fff1f7', color: 'var(--ui-primary)' }}
                  >
                    <KeyRound className="h-5 w-5" />
                  </div>
                }
                title={en ? 'Reset password' : 'Reset password'}
                description={
                  en
                    ? 'Send OTP to your phone number, then create a new password.'
                    : 'Kirim OTP ke nomor Anda, lalu buat password baru.'
                }
              />
            </a>
          </div>
        </MarketplaceSurfaceCard>
      )}
    </>
  );
}
