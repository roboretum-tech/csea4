export interface InterviewQuestion {
  idPregunta: string;
  codigo: string;
  tipo: 'P' | 'V'; // P = Percepción, V = Verificación Conversacional
  texto: string;
  senales: {
    s1: string;
    s3: string;
    s5: string;
  };
  score?: number; // 1 - 5 rating
  respuesta: string; // Resumen breve de la respuesta del entrevistado
  notas?: string; // Campo opcional para notas/comentarios del consultor
  confianza?: 'Alta' | 'Media' | 'Baja';
  respondida: boolean;
}

export interface InterviewBlock {
  idBloque: string;
  nombreBloque: string;
  peso: number; // e.g. 20, 20, 20, 15, 15, 10
  preguntas: InterviewQuestion[];
}

export interface CSEAInterview {
  estado: 'no_generada' | 'generada' | 'en_progreso' | 'completada' | 'completado';
  generadaEn: string;
  modeloUsado: string;
  bloques: InterviewBlock[];
}

export interface Applicant {
  id: string;
  timestamp: string;
  companyName: string;
  sponsorName: string;
  email: string;
  phone?: string;
  department?: string;
  answersA: Record<string, number>;
  scoreA: number;
  percentA: number;
  statusA: 'Aceptación Inmediata' | 'Aceptación Condicional' | 'Rechazado';
  answersB: Record<string, number>;
  hasCompletedB: boolean;
  scheduledTime: string | null;
  consultorNotes: string;
  consultorId?: string;
  consultorEmail?: string;
  createdBy?: string;
  disclaimerAccepted?: boolean;
  assignedConsultor?: string;
  preBrief: PreAssessmentBrief | null;
  executiveReport: ExecutiveReport | null;
  interview?: CSEAInterview | null;
  crmStage?: CrmStage;
  crmNextFollowUp?: string | null;
  crmNotes?: string;
  crmUpdatedAt?: string;
}

export type CrmStage = 
  | 'pre_brief_pending'
  | 'pre_brief_completed'
  | 'interview_in_progress'
  | 'interview_completed'
  | 'report_generated'
  | 'closed_in_execution';

export interface PreAssessmentBrief {
  risks: string[];
  hypotheses: string;
  questions: string[];
  urgency: 'Alta' | 'Media' | 'Baja';
  conversionProb: 'Alta' | 'Media' | 'Baja';
  comments: string;
  generatedAt: string;
}

export interface ExecutiveReport {
  globalIndex: number;
  dimensions: {
    name: string;
    score: number;
    max: number;
  }[];
  findings: string[];
  risks: string[];
  quickWins: string[];
  roadmap90Days: string[];
  markdownReport?: string;
  generatedAt: string;
}

export interface Consultor {
  id?: string;
  name: string;
  email?: string;
  password?: string;
}

export interface AdminSettings {
  passwordHash: string;
  recoveryEmail: string;
  makeWebhookUrl?: string;
  defaultAiProvider?: 'gemini' | 'claude' | 'deterministic';
  anthropicApiKey?: string;
  geminiApiKey?: string;
  anthropicDepletedUntil?: number;
  geminiDepletedUntil?: number;
  activeOtp?: {
    code: string;
    expiresAt: number;
  } | null;
}

export interface DatabaseState {
  applicants: Applicant[];
  consultores: Consultor[];
  adminSettings?: AdminSettings;
  deletedApplicantIds?: string[];
}
