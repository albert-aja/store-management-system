export type TaskCategory =
  | 'SHOWROOM_DISPLAY'
  | 'STOCK_AUDIT'
  | 'CUSTOMER_SERVICE'
  | 'DOCUMENTATION'
  | 'MAINTENANCE'
  | 'GENERAL';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OperationalTask {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  assigneeName: string;
  storeId?: string;
  completedAt?: string;
  completionNotes?: string;
  commentCount: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface TaskDetail extends OperationalTask {
  comments: TaskComment[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId: string;
  storeId?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  completionNotes?: string;
}

export interface AddTaskCommentRequest {
  message: string;
  attachmentUrl?: string;
}

export interface TaskSummary {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  myPendingTasks: number;
}

