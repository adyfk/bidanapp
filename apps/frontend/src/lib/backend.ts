import { type ChatSocketParams, createChatWebSocketUrl } from '@bidanapp/sdk';
import { PUBLIC_ENV } from '@/lib/env';

export function getBackendApiBaseUrl() {
  return PUBLIC_ENV.apiBaseUrl;
}

export function getBackendChatWebSocketUrl(params?: ChatSocketParams) {
  return createChatWebSocketUrl(getBackendApiBaseUrl(), params);
}
