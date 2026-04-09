import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type ChatMessage = MarketplaceComponents['schemas']['ChatMessageRecord'];
export type ChatThread = MarketplaceComponents['schemas']['ChatThreadSummary'];
export type ChatThreadDetail = MarketplaceComponents['schemas']['ChatThreadDetail'];
export type CreateChatMessageInput = MarketplaceComponents['schemas']['CreateChatMessageRequest'];
export type CreateChatThreadInput = MarketplaceComponents['schemas']['CreateChatThreadRequest'];

export async function fetchChatThreads(
  client: MarketplaceApiClient,
  input: { orderId?: string; platformId?: string },
): Promise<{ threads: ChatThread[] }> {
  const result = await client.GET('/chat/threads', {
    params: {
      query: {
        order_id: input.orderId,
        platform_id: input.platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load chat threads');
  }

  return {
    threads: result.data.data.threads ?? [],
  };
}

export async function createChatThread(
  client: MarketplaceApiClient,
  input: CreateChatThreadInput,
): Promise<ChatThreadDetail> {
  const result = await client.POST('/chat/threads', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create chat thread');
  }

  return result.data.data;
}

export async function fetchChatThread(client: MarketplaceApiClient, threadId: string): Promise<ChatThreadDetail> {
  const result = await client.GET('/chat/threads/{thread_id}', {
    params: {
      path: {
        thread_id: threadId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load chat thread');
  }

  return result.data.data;
}

export async function createChatMessage(
  client: MarketplaceApiClient,
  threadId: string,
  input: CreateChatMessageInput,
): Promise<ChatThreadDetail> {
  const result = await client.POST('/chat/threads/{thread_id}/messages', {
    params: {
      path: {
        thread_id: threadId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create chat message');
  }

  return result.data.data;
}
