export interface ExtendedClient {
  id: string;
  code: number;
  name: string;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  civil_status: string | null;
  profession: string | null;
  phone1: string | null;
  phone2: string | null;
  email: string | null;
  cep: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  nationality: string | null;
  naturality: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Employment
  is_clt: boolean | null;
  company_name: string | null;
  // Accident data
  accident_date: string | null;
  accident_type: string | null;
  accident_location: string | null;
  has_police_report: boolean | null;
  police_report_number: string | null;
  // Medical data
  injuries: string | null;
  cid_code: string | null;
  body_part_affected: string | null;
  injury_severity: string | null;
  has_sequelae: boolean | null;
  disability_percentage: number | null;
  // Medical care
  admission_hospital: string | null;
  admission_date: string | null;
  transfer_hospital: string | null;
  transfer_date: string | null;
  had_surgery: boolean | null;
  was_hospitalized: boolean | null;
  hospitalization_days: number | null;
  // Referral
  referral_source: string | null;
  referral_type: string | null;
  referrer_name: string | null;
  // Relationships
  advogado_id: string | null;
  seguradora_id: string | null;
  responsavel_id: string | null;
  client_status: string | null;
  last_contact_date: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  // Joined data
  advogados?: { nome: string } | null;
  seguradoras?: { razao_social: string } | null;
  funcionarios?: { nome: string } | null;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  document_category: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ClientAlert {
  id: string;
  client_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export const ACCIDENT_TYPES = [
  'Trânsito - Colisão',
  'Trânsito - Atropelamento',
  'Trânsito - Capotamento',
  'Trânsito - Queda de moto',
  'Trabalho',
  'Doméstico',
  'Outro',
] as const;

export const INJURY_SEVERITIES = [
  'Leve',
  'Moderada',
  'Grave',
  'Gravíssima',
] as const;

export const BODY_PARTS = [
  'Cabeça',
  'Pescoço',
  'Coluna cervical',
  'Coluna torácica',
  'Coluna lombar',
  'Ombro esquerdo',
  'Ombro direito',
  'Braço esquerdo',
  'Braço direito',
  'Antebraço esquerdo',
  'Antebraço direito',
  'Mão esquerda',
  'Mão direita',
  'Tórax',
  'Abdômen',
  'Quadril',
  'Coxa esquerda',
  'Coxa direita',
  'Joelho esquerdo',
  'Joelho direito',
  'Perna esquerda',
  'Perna direita',
  'Tornozelo esquerdo',
  'Tornozelo direito',
  'Pé esquerdo',
  'Pé direito',
  'Múltiplas regiões',
] as const;

export const REFERRAL_TYPES = [
  'Indicação de cliente',
  'Indicação de advogado',
  'Indicação de parceiro',
  'Redes sociais',
  'Google',
  'Site',
  'Telefone',
  'Outro',
] as const;

export const DOCUMENT_CATEGORIES = [
  'RG/CPF',
  'Comprovante de residência',
  'Boletim de ocorrência',
  'Laudo médico',
  'Exames',
  'Receitas médicas',
  'Procuração',
  'Contrato',
  'Comprovante de pagamento',
  'Outros',
] as const;
