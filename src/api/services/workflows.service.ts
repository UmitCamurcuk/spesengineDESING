import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Workflow, WorkflowExecution } from '../../types';

export interface WorkflowListParams {
  status?: string;
  triggerType?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

export const workflowsService = {
  async list(params?: WorkflowListParams): Promise<{ items: Workflow[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: Workflow[]; total: number }>
    >(API_ENDPOINTS.WORKFLOWS.BASE, { params });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items,
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<Workflow> {
    const response = await apiClient.get<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: Record<string, unknown>): Promise<Workflow> {
    const response = await apiClient.post<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Workflow> {
    const response = await apiClient.put<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.WORKFLOWS.BY_ID(id));
  },

  async activate(id: string): Promise<Workflow> {
    const response = await apiClient.post<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.ACTIVATE(id),
    );
    return response.data.data;
  },

  async pause(id: string): Promise<Workflow> {
    const response = await apiClient.post<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.PAUSE(id),
    );
    return response.data.data;
  },

  async duplicate(id: string): Promise<Workflow> {
    const response = await apiClient.post<ApiSuccessResponse<Workflow>>(
      API_ENDPOINTS.WORKFLOWS.DUPLICATE(id),
    );
    return response.data.data;
  },

  async trigger(
    id: string,
    triggerData?: Record<string, unknown>,
  ): Promise<WorkflowExecution> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowExecution>>(
      API_ENDPOINTS.WORKFLOWS.TRIGGER(id),
      { triggerData },
    );
    return response.data.data;
  },

  async listExecutions(
    workflowId: string,
    params?: { status?: string; skip?: number; limit?: number },
  ): Promise<{ items: WorkflowExecution[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: WorkflowExecution[]; total: number }>
    >(API_ENDPOINTS.WORKFLOWS.EXECUTIONS(workflowId), { params });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items,
      total: payload?.total ?? items.length,
    };
  },
};

export const workflowExecutionsService = {
  async list(params?: {
    workflowId?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ items: WorkflowExecution[]; total: number }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{ items: WorkflowExecution[]; total: number }>
    >(API_ENDPOINTS.WORKFLOW_EXECUTIONS.BASE, { params });

    const payload = response.data.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return {
      items,
      total: payload?.total ?? items.length,
    };
  },

  async getById(id: string): Promise<WorkflowExecution> {
    const response = await apiClient.get<ApiSuccessResponse<WorkflowExecution>>(
      API_ENDPOINTS.WORKFLOW_EXECUTIONS.BY_ID(id),
    );
    return response.data.data;
  },

  async cancel(id: string): Promise<WorkflowExecution> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowExecution>>(
      API_ENDPOINTS.WORKFLOW_EXECUTIONS.CANCEL(id),
    );
    return response.data.data;
  },

  async retry(id: string): Promise<WorkflowExecution> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowExecution>>(
      API_ENDPOINTS.WORKFLOW_EXECUTIONS.RETRY(id),
    );
    return response.data.data;
  },
};
