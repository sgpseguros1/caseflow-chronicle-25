// ==========================================
// TIPOS DO SISTEMA DE PROTOCOLOS
// ==========================================

export type TipoProtocolo = 
  | 'AUXILIO_ACIDENTE' 
  | 'DPVAT' 
  | 'SEGURO_VIDA' 
  | 'PREVIDENCIARIO' 
  | 'JUDICIAL_CIVEL' 
  | 'ADMINISTRATIVO_SEGURADORA';

export type NaturezaProtocolo = 'ADMINISTRATIVO' | 'JUDICIAL';

export type StatusProtocolo = 
  | 'novo'
  | 'em_analise'
  | 'aguardando_documentos'
  | 'documentacao_completa'
  | 'em_andamento'
  | 'aguardando_pericia'
  | 'pericia_realizada'
  | 'aguardando_decisao'
  | 'deferido'
  | 'indeferido'
  | 'recurso'
  | 'judicializado'
  | 'aguardando_pagamento'
  | 'pago'
  | 'encerrado_sucesso'
  | 'encerrado_prejuizo'
  | 'arquivado';

export type PrioridadeProtocolo = 'baixa' | 'normal' | 'alta' | 'urgente';

export type StatusDocumento = 'nao_solicitado' | 'solicitado' | 'recebido' | 'incompleto' | 'validado';

export type TipoEtiqueta = 'tempo' | 'risco' | 'resultado' | 'prioridade' | 'sistema';

export type TipoAlertaProtocolo = 'tempo_parado' | 'documento_pendente' | 'sla_excedido' | 'risco' | 'financeiro' | 'sem_responsavel';

export type NivelAlerta = 'info' | 'aviso' | 'critico' | 'urgente';

export type TipoBeneficio = 'B91' | 'B92' | 'B93' | 'B94' | 'OUTRO';

export type TipoHonorario = 'percentual' | 'fixo' | 'hibrido';

// ==========================================
// INTERFACES PRINCIPAIS
// ==========================================

export interface Protocolo {
  id: string;
  codigo: number;
  cliente_id: string;
  tipo: TipoProtocolo;
  natureza: NaturezaProtocolo;
  subtipo: string | null;
  orgao_responsavel: string | null;
  seguradora_id: string | null;
  advogado_id: string | null;
  funcionario_id: string | null;
  status: StatusProtocolo;
  data_protocolo: string;
  data_ultima_movimentacao: string | null;
  prazo_estimado: string | null;
  sla_dias: number;
  prioridade: PrioridadeProtocolo;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados/relacionados
  dias_parado?: number;
  cliente?: { name: string; cpf: string | null };
  seguradora?: { razao_social: string };
  advogado?: { nome: string };
  funcionario?: { nome: string };
  etiquetas?: ProtocoloEtiqueta[];
  financeiro?: ProtocoloFinanceiro;
}

export interface ProtocoloAuxilioAcidente {
  id: string;
  protocolo_id: string;
  data_acidente: string | null;
  data_requerimento: string | null;
  numero_protocolo_inss: string | null;
  tipo_beneficio: TipoBeneficio | null;
  situacao_atual: string | null;
  pericia_realizada: boolean;
  data_pericia: string | null;
  resultado_pericia: string | null;
  judicializado: boolean;
  numero_processo_judicial: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtocoloHistorico {
  id: string;
  protocolo_id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  usuario_id: string | null;
  observacao: string;
  created_at: string;
  usuario?: { name: string };
}

export interface ProtocoloResponsavel {
  id: string;
  protocolo_id: string;
  funcionario_id: string;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  created_at: string;
  funcionario?: { nome: string };
}

export interface ProtocoloDocumento {
  id: string;
  protocolo_id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  obrigatorio: boolean;
  status: StatusDocumento;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  validado_por: string | null;
  validado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtocoloFinanceiro {
  id: string;
  protocolo_id: string;
  valor_estimado: number;
  valor_recebido: number;
  valor_a_receber: number;
  tipo_honorario: TipoHonorario | null;
  percentual_honorario: number | null;
  valor_fixo_honorario: number | null;
  honorarios_calculados: number;
  comissao_interna: number;
  prejuizo_registrado: number;
  motivo_prejuizo: string | null;
  data_pagamento: string | null;
  comprovante_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProtocoloEtiqueta {
  id: string;
  protocolo_id: string;
  tipo: TipoEtiqueta;
  codigo: string;
  nome: string;
  cor: string;
  gerado_automaticamente: boolean;
  regra_aplicada: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProtocoloAlerta {
  id: string;
  protocolo_id: string;
  tipo: TipoAlertaProtocolo;
  nivel: NivelAlerta;
  titulo: string;
  descricao: string | null;
  escalonado_para: string | null;
  escalonamento_nivel: number;
  status: 'ativo' | 'lido' | 'resolvido' | 'ignorado';
  resolvido_por: string | null;
  resolvido_em: string | null;
  resolucao_observacao: string | null;
  created_at: string;
  protocolo?: Protocolo;
}

export interface ProtocoloChecklistEncerramento {
  id: string;
  protocolo_id: string;
  status_final_definido: boolean;
  financeiro_preenchido: boolean;
  honorarios_calculados: boolean;
  documento_final_anexado: boolean;
  observacao_final_registrada: boolean;
  aprovado_por: string | null;
  aprovado_em: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// CONSTANTES
// ==========================================

export const TIPO_PROTOCOLO_LABELS: Record<TipoProtocolo, string> = {
  AUXILIO_ACIDENTE: 'Auxílio-Acidente',
  DPVAT: 'DPVAT',
  SEGURO_VIDA: 'Seguro Vida',
  PREVIDENCIARIO: 'Previdenciário',
  JUDICIAL_CIVEL: 'Judicial Cível',
  ADMINISTRATIVO_SEGURADORA: 'Administrativo Seguradora',
};

export const TIPO_PROTOCOLO_COLORS: Record<TipoProtocolo, string> = {
  AUXILIO_ACIDENTE: 'bg-purple-500',
  DPVAT: 'bg-blue-500',
  SEGURO_VIDA: 'bg-green-500',
  PREVIDENCIARIO: 'bg-amber-500',
  JUDICIAL_CIVEL: 'bg-red-500',
  ADMINISTRATIVO_SEGURADORA: 'bg-cyan-500',
};

export const NATUREZA_LABELS: Record<NaturezaProtocolo, string> = {
  ADMINISTRATIVO: 'Administrativo',
  JUDICIAL: 'Judicial',
};

export const STATUS_PROTOCOLO_LABELS: Record<StatusProtocolo, string> = {
  novo: 'Novo',
  em_analise: 'Em Análise',
  aguardando_documentos: 'Aguardando Documentos',
  documentacao_completa: 'Documentação Completa',
  em_andamento: 'Em Andamento',
  aguardando_pericia: 'Aguardando Perícia',
  pericia_realizada: 'Perícia Realizada',
  aguardando_decisao: 'Aguardando Decisão',
  deferido: 'Deferido',
  indeferido: 'Indeferido',
  recurso: 'Em Recurso',
  judicializado: 'Judicializado',
  aguardando_pagamento: 'Aguardando Pagamento',
  pago: 'Pago',
  encerrado_sucesso: 'Encerrado com Sucesso',
  encerrado_prejuizo: 'Encerrado com Prejuízo',
  arquivado: 'Arquivado',
};

export const STATUS_PROTOCOLO_COLORS: Record<StatusProtocolo, string> = {
  novo: 'bg-gray-500',
  em_analise: 'bg-blue-500',
  aguardando_documentos: 'bg-yellow-500',
  documentacao_completa: 'bg-teal-500',
  em_andamento: 'bg-indigo-500',
  aguardando_pericia: 'bg-orange-500',
  pericia_realizada: 'bg-purple-500',
  aguardando_decisao: 'bg-pink-500',
  deferido: 'bg-green-500',
  indeferido: 'bg-red-500',
  recurso: 'bg-amber-500',
  judicializado: 'bg-rose-500',
  aguardando_pagamento: 'bg-lime-500',
  pago: 'bg-emerald-500',
  encerrado_sucesso: 'bg-green-600',
  encerrado_prejuizo: 'bg-red-600',
  arquivado: 'bg-slate-500',
};

export const PRIORIDADE_LABELS: Record<PrioridadeProtocolo, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORIDADE_COLORS: Record<PrioridadeProtocolo, string> = {
  baixa: 'bg-gray-500',
  normal: 'bg-blue-500',
  alta: 'bg-orange-500',
  urgente: 'bg-red-500',
};

export const STATUS_DOCUMENTO_LABELS: Record<StatusDocumento, string> = {
  nao_solicitado: 'Não Solicitado',
  solicitado: 'Solicitado',
  recebido: 'Recebido',
  incompleto: 'Incompleto',
  validado: 'Validado',
};

export const STATUS_DOCUMENTO_COLORS: Record<StatusDocumento, string> = {
  nao_solicitado: 'bg-gray-400',
  solicitado: 'bg-yellow-500',
  recebido: 'bg-blue-500',
  incompleto: 'bg-orange-500',
  validado: 'bg-green-500',
};

export const NIVEL_ALERTA_COLORS: Record<NivelAlerta, string> = {
  info: 'bg-blue-500',
  aviso: 'bg-yellow-500',
  critico: 'bg-orange-500',
  urgente: 'bg-red-500',
};

export const TIPO_BENEFICIO_LABELS: Record<TipoBeneficio, string> = {
  B91: 'B91 - Auxílio-doença acidentário',
  B92: 'B92 - Aposentadoria por invalidez acidentária',
  B93: 'B93 - Pensão por morte acidentária',
  B94: 'B94 - Auxílio-acidente',
  OUTRO: 'Outro',
};

// Documentos obrigatórios por tipo de protocolo
export const DOCUMENTOS_OBRIGATORIOS: Record<TipoProtocolo, string[]> = {
  AUXILIO_ACIDENTE: [
    'RG/CPF',
    'Comprovante de Residência',
    'CTPS',
    'CAT (Comunicação de Acidente de Trabalho)',
    'Laudo Médico',
    'Exames Complementares',
  ],
  DPVAT: [
    'RG/CPF',
    'Boletim de Ocorrência',
    'Laudo do IML',
    'Comprovante de Residência',
    'Certidão de Óbito (se aplicável)',
  ],
  SEGURO_VIDA: [
    'RG/CPF',
    'Apólice de Seguro',
    'Atestado/Laudo Médico',
    'Comprovante de Residência',
  ],
  PREVIDENCIARIO: [
    'RG/CPF',
    'CTPS',
    'CNIS',
    'Laudos Médicos',
    'Comprovante de Residência',
  ],
  JUDICIAL_CIVEL: [
    'RG/CPF',
    'Procuração',
    'Documentos do Caso',
    'Comprovante de Residência',
  ],
  ADMINISTRATIVO_SEGURADORA: [
    'RG/CPF',
    'Apólice',
    'Sinistro',
    'Laudos',
    'Comprovante de Residência',
  ],
};
