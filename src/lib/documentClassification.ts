/**
 * Classificação automática de documentos por palavras-chave no nome do arquivo.
 * Associa documentos às etapas corretas do workflow.
 */

export type WorkflowStepKey = 
  | 'cliente' 
  | 'checklist' 
  | 'bau' 
  | 'bo' 
  | 'conta'
  | 'laudo' 
  | 'protocolo' 
  | 'pericia' 
  | 'financeiro' 
  | 'juridico';

interface ClassificationRule {
  step: WorkflowStepKey;
  keywords: string[];
  label: string;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    step: 'cliente',
    keywords: ['RG', 'CPF', 'IDENTIDADE', 'COMPROVANTE DE RESIDENCIA', 'COMP RESID', 'CNH', 'HABILITACAO', 'HABILITAÇÃO', 'CERTIDAO', 'CERTIDÃO', 'NASCIMENTO', 'CASAMENTO', 'CTPS', 'CARTEIRA DE TRABALHO', 'TITULO ELEITOR', 'FOTO', 'SELFIE'],
    label: 'Documentos Pessoais',
  },
  {
    step: 'checklist',
    keywords: ['CHECKLIST', 'TRIAGEM', 'QUESTIONARIO', 'QUESTIONÁRIO', 'FORMULARIO', 'FORMULÁRIO'],
    label: 'Checklist / Triagem',
  },
  {
    step: 'bau',
    keywords: ['BAU', 'PRONTUARIO', 'PRONTUÁRIO', 'HOSPITALAR', 'INTERNACAO', 'INTERNAÇÃO', 'ALTA HOSPITALAR', 'FICHA MEDICA'],
    label: 'BAU / Hospitalar',
  },
  {
    step: 'bo',
    keywords: ['BO', 'BOLETIM', 'CAT', 'OCORRENCIA', 'OCORRÊNCIA', 'COMUNICACAO ACIDENTE', 'COMUNICAÇÃO ACIDENTE', 'DELEGACIA'],
    label: 'Boletim de Ocorrência / CAT',
  },
  {
    step: 'conta',
    keywords: ['CONTA', 'BANCARI', 'PICPAY', 'NUBANK', 'EXTRATO', 'PIX', 'COMPROVANTE CONTA', 'DADOS BANCARIOS', 'DADOS BANCÁRIOS', 'AGENCIA', 'AGÊNCIA'],
    label: 'Conta Bancária',
  },
  {
    step: 'laudo',
    keywords: ['LAUDO', 'ATESTADO', 'PARECER', 'EXAME', 'RAIO', 'RX', 'TOMOGRAFIA', 'RESSONANCIA', 'RESSONÂNCIA', 'ULTRASSOM', 'RECEITA', 'CID', 'SEQUELA'],
    label: 'Laudo / Exames Médicos',
  },
  {
    step: 'protocolo',
    keywords: ['PROTOCOLO', 'REQUERIMENTO', 'SOLICITACAO', 'SOLICITAÇÃO', 'COMPROVANTE PROTOCOLO', 'NUMERO PROTOCOLO'],
    label: 'Protocolo',
  },
  {
    step: 'pericia',
    keywords: ['PERICIA', 'PERÍCIA', 'PERICIAL', 'AGENDAMENTO PERICIA', 'RESULTADO PERICIA'],
    label: 'Perícia',
  },
  {
    step: 'financeiro',
    keywords: ['PAGAMENTO', 'RECIBO', 'NOTA FISCAL', 'NF', 'COMPROVANTE PAGAMENTO', 'HONORARIO', 'HONORÁRIO', 'CONTRATO HONORARIO', 'BOLETO', 'TRANSFERENCIA', 'TRANSFERÊNCIA'],
    label: 'Financeiro / Honorários',
  },
  {
    step: 'juridico',
    keywords: ['PROCURACAO', 'PROCURAÇÃO', 'DECLARACAO', 'DECLARAÇÃO', 'HIPOSSUFICIENCIA', 'HIPOSSUFICIÊNCIA', 'CONTRATO', 'TERMO', 'PETICAO', 'PETIÇÃO', 'MANDATO', 'RESIDENCIA JURIDIC', 'RESIDÊNCIA JURIDIC'],
    label: 'Jurídico',
  },
];

export interface ClassifiedDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  document_category: string | null;
  created_at: string;
  step: WorkflowStepKey;
  stepLabel: string;
}

/**
 * Classifica um documento com base no nome do arquivo.
 * Retorna a etapa do workflow correspondente.
 */
export function classificarDocumento(fileName: string): { step: WorkflowStepKey; label: string } {
  const upper = (fileName || '').toUpperCase();
  
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.keywords.some(kw => upper.includes(kw))) {
      return { step: rule.step, label: rule.label };
    }
  }
  
  // Default: associar ao cliente
  return { step: 'cliente', label: 'Documentos Gerais' };
}

/**
 * Classifica uma lista de documentos e retorna agrupados por etapa.
 */
export function classificarDocumentos(
  docs: Array<{ id: string; file_name: string; file_path: string; file_type: string | null; file_size: number | null; document_category: string | null; created_at: string }>
): Record<WorkflowStepKey, ClassifiedDocument[]> {
  const grouped: Record<WorkflowStepKey, ClassifiedDocument[]> = {
    cliente: [],
    checklist: [],
    bau: [],
    bo: [],
    conta: [],
    laudo: [],
    protocolo: [],
    pericia: [],
    financeiro: [],
    juridico: [],
  };

  for (const doc of docs) {
    const { step, label } = classificarDocumento(doc.file_name);
    grouped[step].push({ ...doc, step, stepLabel: label });
  }

  return grouped;
}

/**
 * Retorna a lista de regras para UI de referência.
 */
export function getClassificationRules() {
  return CLASSIFICATION_RULES;
}
