import { apiClient } from '../../lib/apiClient';
import type {
  OperationalTask,
  TaskDetail,
  TaskComment,
  CreateTaskRequest,
  UpdateTaskStatusRequest,
  AddTaskCommentRequest,
  TaskSummary,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from './types';

export const operationalTaskApi = {
  listTasks: (params?: {
    storeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: TaskCategory;
    assigneeId?: string;
    assignerId?: string;
    overdueOnly?: boolean;
    search?: string;
  }) => apiClient.get<OperationalTask[]>('/api/v1/tasks', { params }),

  getSummary: (storeId?: string) =>
    apiClient.get<TaskSummary>('/api/v1/tasks/summary', { params: { storeId } }),

  getTaskById: (id: string) =>
    apiClient.get<TaskDetail>(`/api/v1/tasks/${id}`),

  createTask: (req: CreateTaskRequest) =>
    apiClient.post<OperationalTask>('/api/v1/tasks', req),

  updateStatus: (id: string, req: UpdateTaskStatusRequest) =>
    apiClient.patch<OperationalTask>(`/api/v1/tasks/${id}/status`, req),

  addComment: (id: string, req: AddTaskCommentRequest) =>
    apiClient.post<TaskComment>(`/api/v1/tasks/${id}/comments`, req),
};

