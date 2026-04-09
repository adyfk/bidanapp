'use client';

import { createChatThread, createMarketplaceApiClient, fetchViewerAuthSession } from '@marketplace/marketplace-core';
import { EmptyState, MessageBanner, PrimaryButton, SecondaryButton, SurfaceCard, TextAreaField } from '@marketplace/ui';
import { useState } from 'react';
import { getApiBaseUrl } from '../lib/env';
import { createLocalizedPath, createPlatformAuthUrl } from '../lib/platform';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

export function ConversationStarterCard({
  description,
  locale,
  platformId,
  title,
}: {
  description?: string;
  locale: string;
  platformId: string;
  title: string;
}) {
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState('');

  const handleStart = async () => {
    try {
      setLoading(true);
      setFeedback('');
      const session = await fetchViewerAuthSession(client);
      if (!session.isAuthenticated) {
        window.location.href = createPlatformAuthUrl(window.location.href, locale);
        return;
      }

      const thread = await createChatThread(client, {
        initialMessage: message,
        platformId,
        threadType: 'conversation',
        title,
      });
      setThreadId(thread.thread.id);
      setMessage('');
      setFeedback('Percakapan berhasil dibuat. Anda bisa lanjutkan dari halaman orders atau support.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memulai percakapan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SurfaceCard
      title="Konsultasi singkat"
      description={description || 'Mulai percakapan singkat sebelum membuat order atau meminta support.'}
    >
      <TextAreaField
        label="Pesan awal"
        placeholder="Tulis kebutuhan Anda atau pertanyaan sebelum order dibuat."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      {feedback ? (
        <div className="mt-4">
          <MessageBanner tone={threadId ? 'success' : 'info'}>{feedback}</MessageBanner>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryButton disabled={loading} onClick={handleStart} type="button">
          {loading ? 'Membuat...' : 'Mulai percakapan'}
        </PrimaryButton>
        {threadId ? (
          <a href={createLocalizedPath(locale, `/orders`)}>
            <SecondaryButton type="button">Buka orders</SecondaryButton>
          </a>
        ) : null}
      </div>
      {!threadId ? (
        <div className="mt-5">
          <EmptyState
            title="Belum ada percakapan"
            description="Tulis pesan pertama Anda untuk memulai percakapan dengan lebih cepat."
          />
        </div>
      ) : null}
    </SurfaceCard>
  );
}
