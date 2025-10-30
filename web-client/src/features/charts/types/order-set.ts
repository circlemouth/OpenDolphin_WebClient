export type OrderSetPlanType =
  | 'medication'
  | 'procedure'
  | 'exam'
  | 'followup'
  | 'injection'
  | 'guidance';

export interface OrderSetPlanItem {
  id: string;
  type: OrderSetPlanType;
  title: string;
  detail: string;
  note: string;
}

export interface OrderSetProgressNote {
  subjective?: string;
  objective?: string;
  assessment?: string;
}

export interface OrderSetDocumentPreset {
  templateId: string;
  memo?: string;
  extraNote?: string;
}

export interface OrderSetDefinition {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  progressNote?: OrderSetProgressNote;
  planItems: OrderSetPlanItem[];
  documentPreset?: OrderSetDocumentPreset | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
}

export interface OrderSetInput {
  name: string;
  description?: string;
  tags: string[];
  progressNote?: OrderSetProgressNote;
  planItems: OrderSetPlanItem[];
  documentPreset?: OrderSetDocumentPreset | null;
}
