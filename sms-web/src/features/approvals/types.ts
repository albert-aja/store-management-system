export interface ApprovalWorkflow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface ApprovalWorkflowStep {
  id: string;
  stepOrder: number;
  name: string;
  approverRoleCode: string;
  description: string | null;
}
