import type { PlatformOffering } from '@marketplace/marketplace-core';
import type { ServicePlatformConfig } from '@marketplace/platform-config';
import {
  ActionBar,
  Badge,
  EmptyState,
  EntityCard,
  InlineNotice,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  SurfaceCard,
} from '@marketplace/ui';

export function PlatformLandingPage({
  platform,
  offerings,
  orderHref,
  professionalApplyHref,
  professionalOfferingsHref,
  authHref,
}: {
  authHref: string;
  offerings: PlatformOffering[];
  orderHref: string;
  platform: ServicePlatformConfig;
  professionalApplyHref: string;
  professionalOfferingsHref: string;
}) {
  return (
    <PageShell
      eyebrow={`${platform.name} Platform`}
      title={platform.summary}
      description={`${platform.description} Mulai dari layanan utama, lanjutkan ke order, atau buka jalur profesional dari sini.`}
      actions={
        <>
          <a href={professionalApplyHref}>
            <PrimaryButton type="button">Daftar sebagai profesional</PrimaryButton>
          </a>
          <a href={authHref}>
            <SecondaryButton type="button">Masuk</SecondaryButton>
          </a>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Layanan aktif" value={String(offerings.length)} />
        <StatCard label="Jalur utama" value="Customer • Profesional" />
        <StatCard label="Flow utama" value="Cari • Order • Tindak lanjut" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <SurfaceCard
          title="Public Offerings"
          description="Layanan publik yang sudah siap dibuka customer dari surface utama."
        >
          {offerings.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {offerings.map((offering) => (
                <EntityCard
                  key={offering.id}
                  badge={<Badge>{offering.offeringType.replaceAll('_', ' ')}</Badge>}
                  description={offering.description || 'Layanan profesional yang sudah siap dibuka customer.'}
                  meta={
                    <p className="text-sm font-semibold" style={{ color: 'var(--ui-text-strong)' }}>
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: offering.currency || 'IDR',
                        maximumFractionDigits: 0,
                      }).format(offering.priceAmount)}
                    </p>
                  }
                  title={offering.title}
                  actions={
                    <a href={orderHref}>
                      <SecondaryButton type="button">Buat order</SecondaryButton>
                    </a>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada offering publik"
              description="Daftarkan profesional lebih dulu, lalu publikasikan layanan agar customer bisa langsung memesan."
              action={
                <a href={professionalOfferingsHref}>
                  <PrimaryButton type="button">Kelola offering profesional</PrimaryButton>
                </a>
              }
            />
          )}
        </SurfaceCard>

        <SurfaceCard
          title="Mulai dari flow utama"
          description="Masuk, buka layanan, lanjutkan ke order, lalu pantau tindak lanjut customer."
        >
          <InlineNotice
            tone="accent"
            title="Flow yang tersedia"
            description="Customer bisa masuk langsung dari Bidan, lalu lanjut ke layanan, order, dan profil dari alur yang sama."
          />
          <ActionBar className="mt-5">
            <Badge>Login native</Badge>
            <Badge>Explore layanan</Badge>
            <Badge>Order dan pembayaran</Badge>
            <Badge>Apply profesional</Badge>
            <Badge>Admin review</Badge>
          </ActionBar>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
