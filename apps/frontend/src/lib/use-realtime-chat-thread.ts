'use client';

import type { ChatClientMessage, ChatLiveMessage, ChatServerEvent } from '@bidanapp/sdk';
import { startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { getBackendChatWebSocketUrl } from '@/lib/backend';
import type { ChatMessage } from '@/types/chat';

export type RealtimeChatConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

interface UseRealtimeChatThreadInput {
  enabled?: boolean;
  fallbackMessages?: ChatMessage[];
  professionalName: string;
  senderName: string;
  threadId?: string | null;
}

const formatMessageTime = (sentAt: string) =>
  new Date(sentAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const toChatMessage = ({
  message,
  professionalName,
  senderName,
}: {
  message: ChatLiveMessage;
  professionalName: string;
  senderName: string;
}): ChatMessage => ({
  id: message.id,
  isRead: true,
  sender:
    message.sender === senderName ? 'user' : message.sender === professionalName ? 'professional' : 'professional',
  text: message.text,
  time: formatMessageTime(message.sentAt),
});

export const useRealtimeChatThread = ({
  enabled = true,
  fallbackMessages = [],
  professionalName,
  senderName,
  threadId,
}: UseRealtimeChatThreadInput) => {
  const socketRef = useRef<WebSocket | null>(null);
  const fallbackMessagesRef = useRef<ChatMessage[]>(fallbackMessages);
  const [messages, setMessages] = useState<ChatMessage[]>(fallbackMessages);
  const [connectionState, setConnectionState] = useState<RealtimeChatConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const websocketUrl = useMemo(() => {
    if (!threadId) {
      return null;
    }

    return getBackendChatWebSocketUrl({
      clientId: `frontend-${threadId}`,
      sender: senderName,
      threadId,
    });
  }, [senderName, threadId]);

  useEffect(() => {
    fallbackMessagesRef.current = fallbackMessages;
  }, [fallbackMessages]);

  const handleSocketMessage = useEffectEvent((event: MessageEvent<string>) => {
    const payload = JSON.parse(event.data) as ChatServerEvent;

    if (payload.type === 'connected') {
      const nextMessages =
        payload.messages.length > 0
          ? payload.messages.map((message) =>
              toChatMessage({
                message,
                professionalName,
                senderName,
              }),
            )
          : fallbackMessagesRef.current;

      startTransition(() => {
        setMessages(nextMessages);
        setConnectionState('connected');
      });
      return;
    }

    if (payload.type === 'message') {
      startTransition(() => {
        setMessages((currentMessages) => [
          ...currentMessages,
          toChatMessage({
            message: payload.message,
            professionalName,
            senderName,
          }),
        ]);
      });
    }
  });

  useEffect(() => {
    if (!enabled || !websocketUrl) {
      socketRef.current?.close();
      socketRef.current = null;
      setMessages(fallbackMessagesRef.current);
      setConnectionState('idle');
      setError(null);
      return;
    }

    socketRef.current?.close();
    setMessages(fallbackMessagesRef.current);
    setError(null);
    setConnectionState('connecting');

    const socket = new WebSocket(websocketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionState('connected');
    };

    socket.onmessage = handleSocketMessage;

    socket.onerror = () => {
      setConnectionState('error');
      setError('chat_connection_failed');
    };

    socket.onclose = () => {
      setConnectionState((currentState) => (currentState === 'error' ? currentState : 'idle'));
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [enabled, websocketUrl]);

  const sendMessage = (text: string) => {
    const nextText = text.trim();

    if (!nextText || socketRef.current?.readyState !== WebSocket.OPEN) {
      return false;
    }

    const payload: ChatClientMessage = {
      sender: senderName,
      text: nextText,
      type: 'message',
    };

    socketRef.current.send(JSON.stringify(payload));
    return true;
  };

  return {
    connectionState,
    error,
    messages,
    sendMessage,
  };
};
