import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse, AuditUserSummary } from '../types/api.types';
import type { APIEndpoint, DocumentationSection } from '../../types/common';

export type NotificationRecipientType = 'user' | 'role' | 'email' | 'webhook';

export interface NotificationRecipientPayload {
  type: NotificationRecipientType;
  value: string;
  meta?: Record<string, unknown> | null;
}

export interface NotificationChannelTargetPayload {
  channelType: string;
  templateId?: string | null;
  enabled?: boolean;
  settingsOverride?: Record<string, unknown> | null;
}

export interface NotificationRulePayload {
  name: string;
  description?: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string;
  eventKey: string;
  isActive?: boolean;
  filters?: Record<string, unknown>;
  recipients?: NotificationRecipientPayload[];
  channels?: NotificationChannelTargetPayload[];
  metadata?: Record<string, unknown>;
}

export interface NotificationRule extends NotificationRulePayload {
  id: string;
  tenantId: string;
  isActive: boolean;
  recipients: NotificationRecipientPayload[];
  channels: NotificationChannelTargetPayload[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  updatedBy?: AuditUserSummary;
  nameLanguage: string | null;
  descriptionLanguage: string | null;
}

export interface NotificationChannelPayload {
  type: string;
  name: string;
  isEnabled?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface NotificationChannel extends NotificationChannelPayload {
  id: string;
  tenantId: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplatePayload {
  name: string;
  description?: string;
  channelType: string;
  eventKey: string;
  language: string;
  subject?: string;
  body: string;
  isDefault?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface NotificationTemplate extends NotificationTemplatePayload {
  id: string;
  tenantId: string;
  isDefault: boolean;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  updatedBy?: AuditUserSummary;
}

export interface NotificationRuleStatisticsChannel {
  channelType: string;
  total: number;
  successCount: number;
  failureCount: number;
  partialCount: number;
  averageAttempts: number;
}

export interface NotificationRuleRecentEvent {
  id: string;
  status: 'pending' | 'success' | 'partial' | 'failed';
  triggeredAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  failureReason?: string | null;
}

export interface NotificationRuleStatistics {
  totalEvents: number;
  successCount: number;
  failureCount: number;
  partialCount: number;
  successRate: number;
  averageDurationMs: number | null;
  minDurationMs: number | null;
  maxDurationMs: number | null;
  averageAttempts: number | null;
  lastTriggeredAt: string | null;
  lastCompletedAt: string | null;
  lastFailedAt: string | null;
  channelBreakdown: NotificationRuleStatisticsChannel[];
  recentEvents: NotificationRuleRecentEvent[];
}

export interface NotificationRuleQuery {
  search?: string;
  eventKey?: string;
  isActive?: boolean;
}

export interface NotificationChannelQuery {
  type?: string;
  isEnabled?: boolean;
}

export interface NotificationTemplateQuery {
  channelType?: string;
  eventKey?: string;
  language?: string;
}

export type NotificationEventSeverity = 'info' | 'warning' | 'critical';

export interface NotificationEventFilterDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  example?: string;
}

export interface NotificationEventRecipientSuggestion {
  type: NotificationRecipientType;
  roleKey?: string;
  description?: string;
}

export interface NotificationEventDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  entity: string;
  severity: NotificationEventSeverity;
  availableFilters: NotificationEventFilterDefinition[];
  samplePayload: Record<string, unknown>;
  defaultRecipients?: NotificationEventRecipientSuggestion[];
  recommendedChannels?: string[];
  tags?: string[];
}

export interface NotificationEventCategory {
  key: string;
  label: string;
  description: string;
}

export interface NotificationEventCatalog {
  categories: NotificationEventCategory[];
  events: NotificationEventDefinition[];
}

export const notificationsService = {
  async getEventCatalog(): Promise<NotificationEventCatalog> {
    const response = await apiClient.get<ApiSuccessResponse<NotificationEventCatalog>>(
      API_ENDPOINTS.NOTIFICATIONS.EVENTS.CATALOG,
    );
    return response.data.data;
  },

  async listRules(params: NotificationRuleQuery = {}): Promise<NotificationRule[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: NotificationRule[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.BASE,
      { params },
    );
    return response.data.data.items;
  },

  async getRule(id: string): Promise<NotificationRule> {
    const response = await apiClient.get<ApiSuccessResponse<NotificationRule>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.BY_ID(id),
    );
    return response.data.data;
  },

  async getRuleStatistics(id: string): Promise<NotificationRuleStatistics> {
    const response = await apiClient.get<ApiSuccessResponse<NotificationRuleStatistics>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.STATS(id),
    );
    return response.data.data;
  },

  async getRuleApiReference(id: string): Promise<APIEndpoint[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ endpoints: APIEndpoint[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.API_REFERENCE(id),
    );
    return response.data.data.endpoints;
  },

  async updateRuleApiReference(id: string, endpoints: APIEndpoint[]): Promise<APIEndpoint[]> {
    const response = await apiClient.put<ApiSuccessResponse<{ endpoints: APIEndpoint[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.API_REFERENCE(id),
      { endpoints },
    );
    return response.data.data.endpoints;
  },

  async getRuleDocumentation(id: string): Promise<DocumentationSection[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ sections: DocumentationSection[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.DOCUMENTATION(id),
    );
    return response.data.data.sections;
  },

  async updateRuleDocumentation(id: string, sections: DocumentationSection[]): Promise<DocumentationSection[]> {
    const response = await apiClient.put<ApiSuccessResponse<{ sections: DocumentationSection[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.DOCUMENTATION(id),
      { sections },
    );
    return response.data.data.sections;
  },

  async createRule(payload: NotificationRulePayload): Promise<NotificationRule> {
    const response = await apiClient.post<ApiSuccessResponse<NotificationRule>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.BASE,
      payload,
    );
    return response.data.data;
  },

  async updateRule(id: string, payload: Partial<NotificationRulePayload>): Promise<NotificationRule> {
    const response = await apiClient.put<ApiSuccessResponse<NotificationRule>>(
      API_ENDPOINTS.NOTIFICATIONS.RULES.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.RULES.BY_ID(id));
  },

  async listChannels(params: NotificationChannelQuery = {}): Promise<NotificationChannel[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: NotificationChannel[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.CHANNELS.BASE,
      { params },
    );
    return response.data.data.items;
  },

  async getChannel(id: string): Promise<NotificationChannel> {
    const response = await apiClient.get<ApiSuccessResponse<NotificationChannel>>(
      API_ENDPOINTS.NOTIFICATIONS.CHANNELS.BY_ID(id),
    );
    return response.data.data;
  },

  async createChannel(payload: NotificationChannelPayload): Promise<NotificationChannel> {
    const response = await apiClient.post<ApiSuccessResponse<NotificationChannel>>(
      API_ENDPOINTS.NOTIFICATIONS.CHANNELS.BASE,
      payload,
    );
    return response.data.data;
  },

  async updateChannel(
    id: string,
    payload: Partial<NotificationChannelPayload>,
  ): Promise<NotificationChannel> {
    const response = await apiClient.put<ApiSuccessResponse<NotificationChannel>>(
      API_ENDPOINTS.NOTIFICATIONS.CHANNELS.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async deleteChannel(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.CHANNELS.BY_ID(id));
  },

  async listTemplates(params: NotificationTemplateQuery = {}): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<ApiSuccessResponse<{ items: NotificationTemplate[] }>>(
      API_ENDPOINTS.NOTIFICATIONS.TEMPLATES.BASE,
      { params },
    );
    return response.data.data.items;
  },

  async getTemplate(id: string): Promise<NotificationTemplate> {
    const response = await apiClient.get<ApiSuccessResponse<NotificationTemplate>>(
      API_ENDPOINTS.NOTIFICATIONS.TEMPLATES.BY_ID(id),
    );
    return response.data.data;
  },

  async createTemplate(payload: NotificationTemplatePayload): Promise<NotificationTemplate> {
    const response = await apiClient.post<ApiSuccessResponse<NotificationTemplate>>(
      API_ENDPOINTS.NOTIFICATIONS.TEMPLATES.BASE,
      payload,
    );
    return response.data.data;
  },

  async updateTemplate(
    id: string,
    payload: Partial<NotificationTemplatePayload>,
  ): Promise<NotificationTemplate> {
    const response = await apiClient.put<ApiSuccessResponse<NotificationTemplate>>(
      API_ENDPOINTS.NOTIFICATIONS.TEMPLATES.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.TEMPLATES.BY_ID(id));
  },
};

export type {
  NotificationRule,
  NotificationRulePayload,
  NotificationChannel,
  NotificationChannelPayload,
  NotificationTemplate,
  NotificationTemplatePayload,
  NotificationRuleStatistics,
  NotificationRuleStatisticsChannel,
  NotificationRuleRecentEvent,
  NotificationEventCatalog,
  NotificationEventDefinition,
  NotificationEventFilterDefinition,
  NotificationEventSeverity,
};
