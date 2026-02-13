import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  ChatbotConfig,
  Conversation,
  ConversationMessage,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Config service                                                     */
/* ------------------------------------------------------------------ */

export const chatbotConfigService = {
  async list(params?: {
    isActive?: boolean;
    search?: string;
  }): Promise<{ items: ChatbotConfig[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: ChatbotConfig[]; total: number }>
    >(API_ENDPOINTS.CHATBOT.CONFIG, { params });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items,
      total: payload?.total ?? items.length,
    };
  },

  async getActive(): Promise<ChatbotConfig | null> {
    const response = await apiClient.get<ApiSuccessResponse<ChatbotConfig | null>>(
      API_ENDPOINTS.CHATBOT.CONFIG_ACTIVE,
    );
    return response.data.data;
  },

  async getById(id: string): Promise<ChatbotConfig> {
    const response = await apiClient.get<ApiSuccessResponse<ChatbotConfig>>(
      API_ENDPOINTS.CHATBOT.CONFIG_BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: Record<string, unknown>): Promise<ChatbotConfig> {
    const response = await apiClient.post<ApiSuccessResponse<ChatbotConfig>>(
      API_ENDPOINTS.CHATBOT.CONFIG,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<ChatbotConfig> {
    const response = await apiClient.put<ApiSuccessResponse<ChatbotConfig>>(
      API_ENDPOINTS.CHATBOT.CONFIG_BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CHATBOT.CONFIG_BY_ID(id));
  },
};

/* ------------------------------------------------------------------ */
/*  Conversation service                                               */
/* ------------------------------------------------------------------ */

export const conversationService = {
  async list(params?: {
    userId?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ items: Conversation[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: Conversation[]; total: number }>
    >(API_ENDPOINTS.CHATBOT.CONVERSATIONS, { params });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items,
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Conversation> {
    const response = await apiClient.get<ApiSuccessResponse<Conversation>>(
      API_ENDPOINTS.CHATBOT.CONVERSATION_BY_ID(id),
    );
    return response.data.data;
  },

  async create(chatbotConfigId?: string): Promise<Conversation> {
    const response = await apiClient.post<ApiSuccessResponse<Conversation>>(
      API_ENDPOINTS.CHATBOT.CONVERSATIONS,
      chatbotConfigId ? { chatbotConfigId } : {},
    );
    return response.data.data;
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<{ userMessage: ConversationMessage; assistantMessage: ConversationMessage }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
      }>
    >(API_ENDPOINTS.CHATBOT.MESSAGES(conversationId), { content });

    return response.data.data;
  },

  async close(id: string): Promise<Conversation> {
    const response = await apiClient.put<ApiSuccessResponse<Conversation>>(
      API_ENDPOINTS.CHATBOT.CLOSE(id),
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CHATBOT.CONVERSATION_BY_ID(id));
  },
};
