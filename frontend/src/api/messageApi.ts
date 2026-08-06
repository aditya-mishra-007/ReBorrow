import api from '@/lib/api';
import type { ApiResponse, ChatMessage, Conversation, PaginatedApiResponse } from '@/types';

export async function startConversation(
  recipientId: string,
  assetId?: string
): Promise<ApiResponse<Conversation>> {
  const response = await api.post<ApiResponse<Conversation>>('/messages/conversations', {
    recipientId,
    assetId,
  });
  return response.data;
}

export async function getMyConversations(): Promise<ApiResponse<Conversation[]>> {
  const response = await api.get<ApiResponse<Conversation[]>>('/messages/conversations');
  return response.data;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

export async function getMessages(
  conversationId: string,
  params?: GetMessagesParams
): Promise<PaginatedApiResponse<ChatMessage[]>> {
  const response = await api.get<PaginatedApiResponse<ChatMessage[]>>(
    `/messages/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ApiResponse<ChatMessage>> {
  const response = await api.post<ApiResponse<ChatMessage>>(
    `/messages/conversations/${conversationId}/messages`,
    { text }
  );
  return response.data;
}