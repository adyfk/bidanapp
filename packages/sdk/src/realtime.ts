export type ChatSocketParams = {
  threadId?: string;
  clientId?: string;
  sender?: string;
};

export type ChatClientMessage = {
  type: 'message';
  sender: string;
  text: string;
};

export type ChatLiveMessage = {
  id: string;
  threadId: string;
  sender: string;
  text: string;
  sentAt: string;
};

export type ChatServerEvent =
  | {
      type: 'connected';
      threadId: string;
      clientId: string;
      messages: ChatLiveMessage[];
      timestamp: string;
    }
  | {
      type: 'message';
      threadId: string;
      message: ChatLiveMessage;
      timestamp: string;
    };

export function createChatWebSocketUrl(apiBaseUrl: string, params: ChatSocketParams = {}) {
  const url = new URL(`${apiBaseUrl.replace(/^http/, 'ws')}/ws/chat`);

  if (params.threadId) {
    url.searchParams.set('thread_id', params.threadId);
  }

  if (params.clientId) {
    url.searchParams.set('client_id', params.clientId);
  }

  if (params.sender) {
    url.searchParams.set('sender', params.sender);
  }

  return url.toString();
}
