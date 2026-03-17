'use client';

import {
  type ChatClientMessage,
  type ChatLiveMessage,
  type ChatServerEvent,
  createBidanappApiClient,
  fetchBackendIntegrationSnapshot,
  type IntegrationSnapshot,
} from '@bidanapp/sdk';
import { Activity, Database, MessagesSquare, RefreshCcw, Send, Wifi, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import { getBackendApiBaseUrl, getBackendChatWebSocketUrl } from '@/lib/backend';
import { APP_CONFIG } from '@/lib/config';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export const BackendIntegrationExampleScreen = () => {
  const t = useTranslations('Integration');
  const apiBaseUrl = getBackendApiBaseUrl();
  const websocketUrl = getBackendChatWebSocketUrl({
    threadId: 'integration-demo',
    clientId: 'frontend-demo',
    sender: 'Frontend Demo',
  });
  const openapiUrl = `${apiBaseUrl}/openapi.json`;
  const client = createBidanappApiClient(apiBaseUrl);
  const socketRef = useRef<WebSocket | null>(null);

  const [healthSummary, setHealthSummary] = useState<string>('');
  const [professionalsCount, setProfessionalsCount] = useState<number>(0);
  const [chatThreadCount, setChatThreadCount] = useState<number>(0);
  const [inputMessage, setInputMessage] = useState('');
  const [liveMessages, setLiveMessages] = useState<ChatLiveMessage[]>([]);
  const [restError, setRestError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');

  const applySnapshot = (snapshot: IntegrationSnapshot) => {
    startTransition(() => {
      setHealthSummary(snapshot.healthSummary);
      setProfessionalsCount(snapshot.professionalsCount);
      setChatThreadCount(snapshot.chatThreadCount);
    });
  };

  const syncRestData = useEffectEvent(async () => {
    setRestError(null);

    try {
      const snapshot = await fetchBackendIntegrationSnapshot(client);
      applySnapshot(snapshot);
    } catch {
      setRestError(t('restError'));
    }
  });

  const refreshRestData = async () => {
    setRestError(null);

    try {
      const snapshot = await fetchBackendIntegrationSnapshot(client);
      applySnapshot(snapshot);
    } catch {
      setRestError(t('restError'));
    }
  };

  const handleSocketMessage = useEffectEvent((event: MessageEvent<string>) => {
    const payload = JSON.parse(event.data) as ChatServerEvent;

    if (payload.type === 'connected') {
      startTransition(() => {
        setLiveMessages(payload.messages);
        setConnectionState('connected');
      });
      return;
    }

    if (payload.type === 'message') {
      startTransition(() => {
        setLiveMessages((current) => [...current, payload.message]);
      });
    }
  });

  const connectSocket = useEffectEvent(() => {
    socketRef.current?.close();
    setSocketError(null);
    setConnectionState('connecting');

    const socket = new WebSocket(websocketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionState('connected');
    };

    socket.onmessage = handleSocketMessage;

    socket.onerror = () => {
      setConnectionState('error');
      setSocketError(t('socketError'));
    };

    socket.onclose = () => {
      setConnectionState((current) => (current === 'error' ? current : 'idle'));
    };
  });

  useEffect(() => {
    void syncRestData();
    connectSocket();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = () => {
    const nextMessage = inputMessage.trim();
    if (!nextMessage || socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload: ChatClientMessage = {
      type: 'message',
      sender: 'Frontend Demo',
      text: nextMessage,
    };

    socketRef.current.send(JSON.stringify(payload));
    setInputMessage('');
  };

  return (
    <div
      className="flex min-h-full flex-col gap-6 px-5 pb-28 pt-14"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      <div className="space-y-2">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: APP_CONFIG.colors.primary }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="text-[28px] font-bold tracking-tight text-gray-900">{t('title')}</h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-gray-500">{t('description')}</p>
      </div>

      <div className="grid gap-4">
        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Database className="h-5 w-5" style={{ color: APP_CONFIG.colors.primary }} />
            <h2 className="text-[16px] font-bold text-gray-900">{t('restSection')}</h2>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] bg-gray-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('health')}</p>
              <p className="mt-2 text-[13px] font-semibold text-gray-900">{healthSummary || '...'}</p>
            </div>
            <div className="rounded-[20px] bg-gray-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('frontendVersion')}</p>
              <p className="mt-2 text-[22px] font-bold text-gray-900">{APP_CONFIG.appVersion}</p>
            </div>
            <div className="rounded-[20px] bg-gray-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('professionals')}</p>
              <p className="mt-2 text-[22px] font-bold text-gray-900">{professionalsCount}</p>
            </div>
            <div className="rounded-[20px] bg-gray-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('threads')}</p>
              <p className="mt-2 text-[22px] font-bold text-gray-900">{chatThreadCount}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
            <a
              href={openapiUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              {t('openapiLink')}
            </a>
            <span>{apiBaseUrl}</span>
            <button
              type="button"
              onClick={() => void refreshRestData()}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 font-semibold text-gray-700"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> {t('refresh')}
            </button>
          </div>

          {restError ? <p className="mt-3 text-[13px] font-medium text-red-600">{restError}</p> : null}
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessagesSquare className="h-5 w-5" style={{ color: APP_CONFIG.colors.primary }} />
              <h2 className="text-[16px] font-bold text-gray-900">{t('socketSection')}</h2>
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                backgroundColor: connectionState === 'connected' ? '#ECFDF5' : '#FEF2F2',
                color: connectionState === 'connected' ? '#047857' : '#B91C1C',
              }}
            >
              {connectionState === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {t(`socketState.${connectionState}`)}
            </span>
          </div>

          <div className="mb-4 rounded-[20px] bg-gray-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('socketUrl')}</p>
            <p className="mt-2 break-all text-[12px] text-gray-600">{websocketUrl}</p>
          </div>

          <div className="space-y-3">
            {liveMessages.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-gray-200 p-5 text-center text-[13px] text-gray-500">
                {t('emptyMessages')}
              </div>
            ) : (
              liveMessages.map((message) => (
                <div key={message.id} className="rounded-[20px] bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-bold text-gray-900">{message.sender}</p>
                    <p className="text-[11px] text-gray-400">{new Date(message.sentAt).toLocaleTimeString()}</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{message.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder={t('messagePlaceholder')}
              className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-800 outline-none focus:border-pink-300"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {socketError ? <p className="mt-3 text-[13px] font-medium text-red-600">{socketError}</p> : null}
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Activity className="h-5 w-5" style={{ color: APP_CONFIG.colors.primary }} />
            <h2 className="text-[16px] font-bold text-gray-900">{t('notesSection')}</h2>
          </div>
          <div className="space-y-2 text-[13px] leading-relaxed text-gray-600">
            <p>{t('noteContract')}</p>
            <p>{t('noteSdk')}</p>
            <p>{t('noteWebsocket')}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
