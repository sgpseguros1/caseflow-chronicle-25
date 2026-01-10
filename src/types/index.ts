// Core Types for SGP System

export type UserRole = 'ADMIN' | 'GERENTE' | 'ANALISTA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

export type CaseType = 'DPVAT' | 'INSS' | 'VIDA' | 'VIDA_EMPRESARIAL' | 'DANOS' | 'JUDICIAL';

export type MacroStatus = 
  | 'TRIAGEM'
  | 'A_PROTOCOLAR'
  | 'PROTOCOLADO'
  | 'EM_ANDAMENTO'
  | 'EXIGENCIA'
  | 'PERICIA'
  | 'CONCLUIDO_EXITO'
  | 'CONCLUIDO_SEM_EXITO'
  | 'JUDICIALIZADO'
  | 'SENTENCIADO'
  | 'ENCERRADO';

export type StatusAdministrativo =
  | 'PROTOCOLO_ADM'
  | 'PERICIA'
  | 'ANALISE_SEM_PENDENCIA'
  | 'PENDENTE_SEGURADORA'
  | 'PENDENTE_ESCRITORIO'
  | 'FALTA_BO'
  | 'FALTA_DOCS_PESSOAIS'
  | 'FALTA_PROCURACAO'
  | 'FALTA_DOCS_JUDICIALIZAR'
  | 'PAGO_ADM'
  | 'FINALIZADO';

export interface Client {
  id: string;
  code: number;
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  phone1: string;
  phone2?: string;
  email?: string;
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: 'CORRENTE' | 'POUPANCA';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  clientId: string;
  client?: Client;
  title: string;
  type: CaseType;
  macroStatus: MacroStatus;
  statusAdm?: StatusAdministrativo;
  priority: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  accidentDate?: string;
  protocolNumber?: string;
  protocolDate?: string;
  assignedTo?: string;
  assignedUser?: User;
  relato?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  kind: 'STATUS_CHANGE' | 'DOCUMENT' | 'NOTE' | 'PROTOCOL' | 'PAYMENT' | 'TASK';
  message: string;
  userId: string;
  user?: User;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  status: 'ABERTA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'CANCELADA';
  priority: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  dueAt?: string;
  assignedTo?: string;
  assignedUser?: User;
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalCases: number;
  protocolados: number;
  emAndamento: number;
  pendentes: number;
  pagos: number;
  finalizados: number;
  byType: Record<CaseType, number>;
  byAnalyst: Array<{ name: string; count: number }>;
}

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  DPVAT: 'DPVAT',
  INSS: 'INSS',
  VIDA: 'Vida',
  VIDA_EMPRESARIAL: 'Vida Empresarial',
  DANOS: 'Danos',
  JUDICIAL: 'Judicial',
};

export const CASE_TYPE_ICONS: Record<CaseType, string> = {
  DPVAT: '📁',
  INSS: '🏥',
  VIDA: '❤️',
  VIDA_EMPRESARIAL: '🏢',
  DANOS: '⚠️',
  JUDICIAL: '⚖️',
};

export const STATUS_LABELS: Record<MacroStatus, string> = {
  TRIAGEM: 'Triagem',
  A_PROTOCOLAR: 'A Protocolar',
  PROTOCOLADO: 'Protocolado',
  EM_ANDAMENTO: 'Em Andamento',
  EXIGENCIA: 'Exigência',
  PERICIA: 'Perícia',
  CONCLUIDO_EXITO: 'Concluído c/ Êxito',
  CONCLUIDO_SEM_EXITO: 'Concluído s/ Êxito',
  JUDICIALIZADO: 'Judicializado',
  SENTENCIADO: 'Sentenciado',
  ENCERRADO: 'Encerrado',
};

export const STATUS_COLORS: Record<MacroStatus, string> = {
  TRIAGEM: 'bg-muted text-muted-foreground',
  A_PROTOCOLAR: 'bg-warning/10 text-warning',
  PROTOCOLADO: 'bg-info/10 text-info',
  EM_ANDAMENTO: 'bg-info/10 text-info',
  EXIGENCIA: 'bg-warning/10 text-warning',
  PERICIA: 'bg-warning/10 text-warning',
  CONCLUIDO_EXITO: 'bg-success/10 text-success',
  CONCLUIDO_SEM_EXITO: 'bg-destructive/10 text-destructive',
  JUDICIALIZADO: 'bg-primary/10 text-primary',
  SENTENCIADO: 'bg-primary/10 text-primary',
  ENCERRADO: 'bg-muted text-muted-foreground',
};
