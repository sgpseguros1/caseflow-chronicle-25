// DPVAT Module Types

export type DPVATStatus = 
  | 'CADASTRO_INICIADO'
  | 'DOCUMENTACAO_PENDENTE'
  | 'ANALISE_ADMINISTRATIVA'
  | 'ADMINISTRATIVO_PROTOCOLADO'
  | 'JUDICIAL_AGUARDANDO_PROTOCOLO'
  | 'JUDICIAL_PROTOCOLADO'
  | 'EM_PERICIA'
  | 'AGUARDANDO_DECISAO'
  | 'FINALIZADO_ADMINISTRATIVO'
  | 'FINALIZADO_JUDICIAL'
  | 'INDEFERIDO_ARQUIVADO';

export type DPVATStatusAdm = 
  | 'PROTOCOLO_ADM'
  | 'PERICIA'
  | 'ANALISE_SEM_PENDENCIA'
  | 'PENDENTE_SEGURADORA'
  | 'PENDENTE_ESCRITORIO'
  | 'FALTA_BO'
  | 'FALTA_DOCS_PESSOAIS'
  | 'FALTA_PROCURACAO'
  | 'PAGO_ADM'
  | 'FINALIZADO';

export type AccidentType = 'TRANSITO' | 'TRABALHO' | 'TRAJETO' | 'OUTRO';

export type DocumentCategory = 
  | 'RG_CPF_CNH'
  | 'COMPROVANTE_RESIDENCIA'
  | 'BOLETIM_OCORRENCIA'
  | 'PRONTUARIO_MEDICO'
  | 'LAUDOS_MEDICOS'
  | 'EXAMES_IMAGEM'
  | 'LAUDO_SEQUELAS'
  | 'CAT'
  | 'PROCURACAO'
  | 'HIPOSSUFICIENCIA'
  | 'OUTROS';

export interface DPVATClient {
  id: string;
  code: number;
  // Dados Pessoais
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  maritalStatus?: string;
  profession?: string;
  // Contato
  phone1: string;
  phone2?: string;
  email?: string;
  // Endereço
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  complement?: string;
  // Dados Bancários
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: 'CORRENTE' | 'POUPANCA';
  // Controle
  analystId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DPVATAccident {
  date: string;
  time?: string;
  type: AccidentType;
  street?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  description: string;
  hasBO: boolean;
  hasMedicalCare: boolean;
}

export interface DPVATProcess {
  id: string;
  clientId: string;
  client?: DPVATClient;
  // Dados do Acidente
  accident: DPVATAccident;
  // Status e Controle
  status: DPVATStatus;
  statusAdm?: DPVATStatusAdm;
  priority: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  // Protocolo
  protocolNumber?: string;
  protocolDate?: string;
  // Responsáveis
  attendantId?: string;
  adminResponsibleId?: string;
  legalResponsibleId?: string;
  // Etiquetas
  tags: string[];
  // Prazos
  adminDeadline?: string;
  judicialDeadline?: string;
  expertiseDeadline?: string;
  // Financeiro
  feePercentage?: number;
  fixedFee?: number;
  estimatedValue?: number;
  receivedValue?: number;
  paymentDate?: string;
  paymentMethod?: string;
  // Controle
  lastMovementAt: string;
  stoppedDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface DPVATDocument {
  id: string;
  processId: string;
  category: DocumentCategory;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  status: 'VALIDO' | 'INCOMPLETO' | 'PENDENTE';
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
}

export interface DPVATTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  isEmployeeTag?: boolean;
  alertEnabled?: boolean;
  alertIntervalDays?: number;
  createdAt: string;
}

export interface DPVATAlert {
  id: string;
  processId: string;
  tagId?: string;
  type: 'PRAZO' | 'DOCUMENTO' | 'ETIQUETA' | 'PARADO' | 'FINANCEIRO';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  dueAt?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DPVATTimelineEvent {
  id: string;
  processId: string;
  kind: 'CRIACAO' | 'STATUS_CHANGE' | 'DOCUMENTO' | 'NOTA' | 'ETIQUETA' | 'PROTOCOLO' | 'PAGAMENTO' | 'EDICAO';
  message: string;
  userId: string;
  userName?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface DPVATDashboardStats {
  totalClients: number;
  incompleteRegistration: number;
  pendingDocuments: number;
  adminInAnalysis: number;
  adminProtocoled: number;
  judicialAwaitingProtocol: number;
  judicialProtocoled: number;
  inExpertise: number;
  stoppedOver30Days: number;
  finalizedAdmin: number;
  finalizedJudicial: number;
  estimatedTotal: number;
  receivedTotal: number;
  pendingTotal: number;
  averageFeePercentage: number;
  processesByStatus: Record<DPVATStatus, number>;
  processesByResponsible: Array<{ name: string; count: number; stoppedCount: number }>;
}

export const DPVAT_STATUS_LABELS: Record<DPVATStatus, string> = {
  CADASTRO_INICIADO: 'Cadastro Iniciado',
  DOCUMENTACAO_PENDENTE: 'Documentação Pendente',
  ANALISE_ADMINISTRATIVA: 'Análise Administrativa',
  ADMINISTRATIVO_PROTOCOLADO: 'Administrativo Protocolado',
  JUDICIAL_AGUARDANDO_PROTOCOLO: 'Judicial Aguardando Protocolo',
  JUDICIAL_PROTOCOLADO: 'Judicial Protocolado',
  EM_PERICIA: 'Em Perícia',
  AGUARDANDO_DECISAO: 'Aguardando Decisão',
  FINALIZADO_ADMINISTRATIVO: 'Finalizado - Administrativo',
  FINALIZADO_JUDICIAL: 'Finalizado - Judicial',
  INDEFERIDO_ARQUIVADO: 'Indeferido / Arquivado',
};

export const DPVAT_STATUS_COLORS: Record<DPVATStatus, string> = {
  CADASTRO_INICIADO: 'bg-muted text-muted-foreground',
  DOCUMENTACAO_PENDENTE: 'bg-warning/10 text-warning',
  ANALISE_ADMINISTRATIVA: 'bg-info/10 text-info',
  ADMINISTRATIVO_PROTOCOLADO: 'bg-info/10 text-info',
  JUDICIAL_AGUARDANDO_PROTOCOLO: 'bg-warning/10 text-warning',
  JUDICIAL_PROTOCOLADO: 'bg-primary/10 text-primary',
  EM_PERICIA: 'bg-warning/10 text-warning',
  AGUARDANDO_DECISAO: 'bg-info/10 text-info',
  FINALIZADO_ADMINISTRATIVO: 'bg-success/10 text-success',
  FINALIZADO_JUDICIAL: 'bg-success/10 text-success',
  INDEFERIDO_ARQUIVADO: 'bg-destructive/10 text-destructive',
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  RG_CPF_CNH: 'RG / CPF / CNH',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
  BOLETIM_OCORRENCIA: 'Boletim de Ocorrência',
  PRONTUARIO_MEDICO: 'Prontuário Médico',
  LAUDOS_MEDICOS: 'Laudos Médicos',
  EXAMES_IMAGEM: 'Exames de Imagem',
  LAUDO_SEQUELAS: 'Laudo de Sequelas',
  CAT: 'CAT',
  PROCURACAO: 'Procuração',
  HIPOSSUFICIENCIA: 'Hipossuficiência',
  OUTROS: 'Outros',
};

export const ACCIDENT_TYPE_LABELS: Record<AccidentType, string> = {
  TRANSITO: 'Trânsito',
  TRABALHO: 'Trabalho',
  TRAJETO: 'Trajeto',
  OUTRO: 'Outro',
};
