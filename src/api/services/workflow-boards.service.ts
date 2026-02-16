import apiClient from '../client/axios';
import { API_ENDPOINTS } from '../endpoints';
import type { ApiSuccessResponse } from '../types/api.types';
import type { WorkflowBoard, BoardTask, BoardActivity } from '../../types';

/* ------------------------------------------------------------------ */
/*  Board service                                                      */
/* ------------------------------------------------------------------ */

export interface BoardListParams {
  search?: string;
  isArchived?: boolean;
  limit?: number;
  skip?: number;
}

export const workflowBoardsService = {
  /* ---- Board CRUD ---- */

  async list(params?: BoardListParams): Promise<WorkflowBoard[]> {
    const response = await apiClient.get<ApiSuccessResponse<WorkflowBoard[]>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.BASE,
      { params },
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  async getById(id: string): Promise<WorkflowBoard> {
    const response = await apiClient.get<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.BY_ID(id),
    );
    return response.data.data;
  },

  async create(payload: { name: string; description?: string; prefix: string }): Promise<WorkflowBoard> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.BASE,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: { name?: string; description?: string }): Promise<WorkflowBoard> {
    const response = await apiClient.put<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.BY_ID(id),
      payload,
    );
    return response.data.data;
  },

  async archive(id: string): Promise<WorkflowBoard> {
    const response = await apiClient.delete<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.BY_ID(id),
    );
    return response.data.data;
  },

  /* ---- Columns ---- */

  async addColumn(boardId: string, payload: { title: string; color?: string; wipLimit?: number }): Promise<WorkflowBoard> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.COLUMNS(boardId),
      payload,
    );
    return response.data.data;
  },

  async updateColumn(boardId: string, colId: string, payload: { title?: string; color?: string; wipLimit?: number }): Promise<WorkflowBoard> {
    const response = await apiClient.put<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.COLUMN_BY_ID(boardId, colId),
      payload,
    );
    return response.data.data;
  },

  async removeColumn(boardId: string, colId: string): Promise<WorkflowBoard> {
    const response = await apiClient.delete<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.COLUMN_BY_ID(boardId, colId),
    );
    return response.data.data;
  },

  async reorderColumns(boardId: string, columnIds: string[]): Promise<WorkflowBoard> {
    const response = await apiClient.patch<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.COLUMNS_REORDER(boardId),
      { columnIds },
    );
    return response.data.data;
  },

  /* ---- Members ---- */

  async addMember(boardId: string, userId: string): Promise<WorkflowBoard> {
    const response = await apiClient.post<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.MEMBERS(boardId),
      { userId },
    );
    return response.data.data;
  },

  async removeMember(boardId: string, userId: string): Promise<WorkflowBoard> {
    const response = await apiClient.delete<ApiSuccessResponse<WorkflowBoard>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.MEMBER_BY_ID(boardId, userId),
    );
    return response.data.data;
  },

  /* ---- Tasks ---- */

  async listTasks(boardId: string, params?: Record<string, unknown>): Promise<BoardTask[]> {
    const response = await apiClient.get<ApiSuccessResponse<BoardTask[]>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASKS(boardId),
      { params },
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  async getTask(boardId: string, taskId: string): Promise<BoardTask> {
    const response = await apiClient.get<ApiSuccessResponse<BoardTask>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_BY_ID(boardId, taskId),
    );
    return response.data.data;
  },

  async createTask(boardId: string, payload: Record<string, unknown>): Promise<BoardTask> {
    const response = await apiClient.post<ApiSuccessResponse<BoardTask>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASKS(boardId),
      payload,
    );
    return response.data.data;
  },

  async updateTask(boardId: string, taskId: string, payload: Record<string, unknown>): Promise<BoardTask> {
    const response = await apiClient.put<ApiSuccessResponse<BoardTask>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_BY_ID(boardId, taskId),
      payload,
    );
    return response.data.data;
  },

  async archiveTask(boardId: string, taskId: string): Promise<BoardTask> {
    const response = await apiClient.delete<ApiSuccessResponse<BoardTask>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_BY_ID(boardId, taskId),
    );
    return response.data.data;
  },

  async moveTask(boardId: string, taskId: string, targetColumnId: string, targetOrder: number): Promise<BoardTask> {
    const response = await apiClient.patch<ApiSuccessResponse<BoardTask>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_MOVE(boardId, taskId),
      { targetColumnId, targetOrder },
    );
    return response.data.data;
  },

  /* ---- Comments ---- */

  async addComment(boardId: string, taskId: string, content: string): Promise<BoardActivity> {
    const response = await apiClient.post<ApiSuccessResponse<BoardActivity>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_COMMENTS(boardId, taskId),
      { content },
    );
    return response.data.data;
  },

  async listComments(boardId: string, taskId: string): Promise<BoardActivity[]> {
    const response = await apiClient.get<ApiSuccessResponse<BoardActivity[]>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_COMMENTS(boardId, taskId),
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  /* ---- Activity ---- */

  async getTaskActivity(boardId: string, taskId: string): Promise<BoardActivity[]> {
    const response = await apiClient.get<ApiSuccessResponse<BoardActivity[]>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.TASK_ACTIVITY(boardId, taskId),
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  async getBoardActivity(boardId: string): Promise<BoardActivity[]> {
    const response = await apiClient.get<ApiSuccessResponse<BoardActivity[]>>(
      API_ENDPOINTS.WORKFLOW_BOARDS.ACTIVITY(boardId),
    );
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
};
