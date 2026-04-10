'use client';

import {
  createMarketplaceApiClient,
  type DirectoryProfessional,
  fetchDirectoryProfessionals,
  fetchProfessionalPlatformWorkspace,
  fetchViewerAuthSession,
  issueProfessionalDocumentUploadToken,
  type ProfessionalPlatformWorkspace,
  saveProfessionalPlatformApplication,
  type ViewerSession,
} from '@marketplace/marketplace-core';
import {
  getPlatformRegistrationSchema,
  getServicePlatformConfig,
  type ServicePlatformId,
} from '@marketplace/platform-config';
import { MarketplaceMobileShell } from '@marketplace/ui';
import { useEffect, useMemo, useState } from 'react';
import { createLocaleSwitcherItems } from '../../../layout/navigation';
import { getApiBaseUrl, getApiOrigin } from '../../../lib/env';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { ProfessionalAccessSkeleton } from './parts/access-skeleton';
import {
  ApplicationFormSection,
  ApplicationStatusCard,
  ProfessionalAccessHero,
  ProfileMaintenanceCard,
  ReviewAttachmentsSection,
} from './parts/application-sections';
import { GuestAccessSection, GuestPreviewSection, PathSeparationCard } from './parts/guest-access';
import { ProfessionalApplyNotReadyState } from './parts/not-ready-state';
import { ProfessionalApplyPageHeader } from './parts/page-header';
import { fallbackPreviewProfessionals, stringifyApplyValue } from './utils';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

export function ProfessionalApplyPage({
  authHref,
  initialSession,
  locale,
  platformId,
}: {
  authHref: string;
  initialSession?: ViewerSession | null;
  locale: string;
  platformId: ServicePlatformId;
}) {
  const platform = getServicePlatformConfig(platformId);
  const localizedSchema = getPlatformRegistrationSchema(platform, locale);
  const [workspace, setWorkspace] = useState<ProfessionalPlatformWorkspace | null>(null);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [previewProfessionals, setPreviewProfessionals] = useState<DirectoryProfessional[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFieldKey, setUploadingFieldKey] = useState('');
  const [applicationForm, setApplicationForm] = useState<{
    attributes: Record<string, string | boolean>;
    city: string;
    displayName: string;
    slug: string;
  }>({
    attributes: {},
    city: '',
    displayName: '',
    slug: '',
  });

  const schemaFields = localizedSchema.fields;
  const loginHref = createLocalizedPath(locale, '/login');
  const registerHref = createLocalizedPath(locale, '/register');
  const forgotPasswordHref = createLocalizedPath(locale, '/forgot-password');
  const homeHref = createLocalizedPath(locale, '/home');
  const profileHref = createLocalizedPath(locale, '/profile');
  const currentPath = createLocalizedPath(locale, '/professionals/apply');
  const localeItems = createLocaleSwitcherItems(currentPath, locale);

  const previewCards = useMemo(() => {
    if (previewProfessionals.length) {
      return previewProfessionals.slice(0, 3);
    }
    return fallbackPreviewProfessionals(locale, platformId);
  }, [locale, platformId, previewProfessionals]);

  const selectedPreview =
    previewCards.find((professional) => professional.id === selectedPreviewId) || previewCards[0] || null;

  useEffect(() => {
    if (!selectedPreviewId && previewCards[0]?.id) {
      setSelectedPreviewId(previewCards[0].id);
    }
  }, [previewCards, selectedPreviewId]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const [sessionResult, previewResult] = await Promise.allSettled([
          fetchViewerAuthSession(client),
          fetchDirectoryProfessionals(client, platformId),
        ]);

        if (!isActive) {
          return;
        }

        if (previewResult.status === 'fulfilled') {
          setPreviewProfessionals(previewResult.value.professionals ?? []);
        }

        if (sessionResult.status === 'fulfilled') {
          setSession(sessionResult.value);

          if (sessionResult.value.isAuthenticated) {
            const workspaceResult = await fetchProfessionalPlatformWorkspace(client, platformId);
            if (!isActive) {
              return;
            }

            setWorkspace(workspaceResult);
            setApplicationForm({
              displayName:
                workspaceResult.profile?.displayName || sessionResult.value.customerProfile?.displayName || '',
              city: workspaceResult.profile?.city || sessionResult.value.customerProfile?.city || '',
              slug: workspaceResult.profile?.slug || '',
              attributes: Object.fromEntries(
                (localizedSchema.fields ?? []).map((field) => [
                  field.key,
                  typeof workspaceResult.application?.attributes?.[field.key] === 'boolean'
                    ? Boolean(workspaceResult.application?.attributes?.[field.key])
                    : stringifyApplyValue(workspaceResult.application?.attributes?.[field.key]),
                ]),
              ),
            });
          } else {
            setWorkspace(null);
            setApplicationForm((current) => ({
              ...current,
              attributes: Object.fromEntries(
                schemaFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
              ),
              city: sessionResult.value.customerProfile?.city || current.city,
              displayName: sessionResult.value.customerProfile?.displayName || current.displayName,
            }));
          }
        } else {
          setWorkspace(null);
          setApplicationForm((current) => ({
            ...current,
            attributes: Object.fromEntries(
              schemaFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
            ),
          }));
        }
      } catch (error) {
        if (isActive) {
          setMessage(error instanceof Error ? error.message : 'Gagal memuat halaman profesional.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [platformId, schemaFields, localizedSchema.fields]);

  const currentStatus = workspace?.application?.status || 'draft';
  const isAuthenticated = Boolean(session?.isAuthenticated);
  const reviewStatus = workspace?.profile?.reviewStatus || 'draft';
  const localizedStatus = currentStatus.replaceAll('_', ' ');
  const localizedReviewStatus = reviewStatus.replaceAll('_', ' ');

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');

      const result = await saveProfessionalPlatformApplication(client, platformId, {
        city: applicationForm.city,
        displayName: applicationForm.displayName,
        slug: applicationForm.slug,
        attributes: Object.fromEntries(
          Object.entries(applicationForm.attributes).map(([key, value]) => [key, value === '' ? null : value]),
        ),
      });

      setWorkspace(result);
      setMessage(isEnglishLocale(locale) ? 'Your application has been saved.' : 'Aplikasi Anda berhasil disimpan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan aplikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (fieldKey: string, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setUploadingFieldKey(fieldKey);
      setMessage('');
      const token = await issueProfessionalDocumentUploadToken(client, platformId, {
        contentType: file.type,
        documentKey: fieldKey,
        fileName: file.name,
      });

      const uploadUrl = new URL(token.uploadUrl, getApiOrigin()).toString();
      const uploadResponse = await fetch(uploadUrl, {
        body: file,
        credentials: 'include',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        method: token.method || 'PUT',
      });
      if (!uploadResponse.ok) {
        throw new Error(isEnglishLocale(locale) ? 'Document upload failed.' : 'Upload dokumen gagal.');
      }

      setApplicationForm((current) => ({
        ...current,
        attributes: {
          ...current.attributes,
          [fieldKey]: token.documentId,
        },
      }));
      setMessage(
        isEnglishLocale(locale) ? `${file.name} uploaded successfully.` : `Dokumen ${file.name} berhasil diunggah.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal mengunggah dokumen.');
    } finally {
      setUploadingFieldKey('');
    }
  };

  if (loading) {
    return <ProfessionalAccessSkeleton homeHref={homeHref} locale={locale} localeItems={localeItems} />;
  }

  if (isAuthenticated && !workspace) {
    return <ProfessionalApplyNotReadyState homeHref={homeHref} locale={locale} localeItems={localeItems} />;
  }

  return (
    <MarketplaceMobileShell showNav={false}>
      <div
        className="flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
        style={{ backgroundColor: 'var(--ui-background)' }}
      >
        <ProfessionalApplyPageHeader homeHref={homeHref} locale={locale} localeItems={localeItems} />

        <div className="space-y-6 px-5 py-6">
          <ProfessionalAccessHero
            locale={locale}
            localizedReviewStatus={localizedReviewStatus}
            localizedSchemaDescription={
              localizedSchema.description ||
              (isEnglishLocale(locale)
                ? 'Choose your professional path, complete the requested details, then send your application.'
                : 'Pilih jalur profesional Anda, lengkapi detail yang diminta, lalu kirim aplikasi Anda.')
            }
            localizedSchemaTitle={
              localizedSchema.title || (isEnglishLocale(locale) ? 'Professional application' : 'Aplikasi profesional')
            }
            localizedStatus={localizedStatus}
            platformName={platform.name}
          />

          {!isAuthenticated ? (
            <>
              <GuestPreviewSection
                locale={locale}
                onSelect={setSelectedPreviewId}
                previewCards={previewCards}
                selectedPreview={selectedPreview}
              />
              <GuestAccessSection
                forgotPasswordHref={forgotPasswordHref}
                locale={locale}
                loginHref={loginHref}
                registerHref={registerHref}
                selectedPreview={selectedPreview}
              />
              <PathSeparationCard currentPath={currentPath} homeHref={homeHref} locale={locale} />
            </>
          ) : (
            <>
              <ApplicationStatusCard
                applicationFormCity={applicationForm.city}
                authHref={authHref}
                displayName={workspace?.profile?.displayName || applicationForm.displayName || platform.name}
                locale={locale}
                localizedReviewStatus={localizedReviewStatus}
                localizedStatus={localizedStatus}
                message={workspace?.application?.reviewNotes || ''}
                profileHref={profileHref}
                reviewNotes={workspace?.application?.reviewNotes || ''}
              />
              <ApplicationFormSection
                applicationForm={applicationForm}
                isSubmitting={isSubmitting}
                locale={locale}
                message={message}
                onAttributeBooleanChange={(key, checked) =>
                  setApplicationForm((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [key]: checked,
                    },
                  }))
                }
                onAttributeTextChange={(key, value) =>
                  setApplicationForm((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [key]: value,
                    },
                  }))
                }
                onCityChange={(value) => setApplicationForm((current) => ({ ...current, city: value }))}
                onDisplayNameChange={(value) => setApplicationForm((current) => ({ ...current, displayName: value }))}
                onProfileClick={() => {
                  window.location.href = profileHref;
                }}
                onSave={handleSubmit}
                onSlugChange={(value) => setApplicationForm((current) => ({ ...current, slug: value }))}
                onUpload={(key, file) => void handleDocumentUpload(key, file)}
                schemaFields={schemaFields}
                uploadingFieldKey={uploadingFieldKey}
              />
              <ReviewAttachmentsSection
                documents={workspace?.application?.documents ?? []}
                locale={locale}
                localizedReviewStatus={localizedReviewStatus}
                session={session}
              />
              <ProfileMaintenanceCard
                authHref={authHref}
                locale={locale}
                onProfileClick={() => {
                  window.location.href = profileHref;
                }}
              />
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
