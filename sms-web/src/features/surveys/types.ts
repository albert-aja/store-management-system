export type SurveyStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Survey {
  id: string;
  salesOrderId: string;
  surveyorEmployeeId: string | null;
  status: SurveyStatus;
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  existingObligations: string | null;
  residenceNotes: string | null;
  employmentNotes: string | null;
  referencesNotes: string | null;
  abilityToPayAssessment: string | null;
  decidedAt: string | null;
  decisionNotes: string | null;
}

export interface AssessmentInput {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  existingObligations?: string;
  residenceNotes?: string;
  employmentNotes?: string;
  referencesNotes?: string;
  abilityToPayAssessment?: string;
}
