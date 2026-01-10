export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advogados: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          especialidades: string[] | null
          id: string
          nome: string
          oab: string
          situacao_oab: string | null
          status: string
          telefone: string | null
          uf: string
          updated_at: string
          verificado_em: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          especialidades?: string[] | null
          id?: string
          nome: string
          oab: string
          situacao_oab?: string | null
          status?: string
          telefone?: string | null
          uf: string
          updated_at?: string
          verificado_em?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          especialidades?: string[] | null
          id?: string
          nome?: string
          oab?: string
          situacao_oab?: string | null
          status?: string
          telefone?: string | null
          uf?: string
          updated_at?: string
          verificado_em?: string | null
        }
        Relationships: []
      }
      agenda: {
        Row: {
          created_at: string
          data_evento: string
          descricao: string | null
          id: string
          processo_id: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_evento: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_evento?: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          created_at: string
          descricao: string | null
          funcionario_id: string | null
          id: string
          lido_em: string | null
          prioridade: string
          processo_id: string | null
          resolvido_em: string | null
          status: string
          tipo: string
          titulo: string
          usuario_alvo_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          lido_em?: string | null
          prioridade?: string
          processo_id?: string | null
          resolvido_em?: string | null
          status?: string
          tipo: string
          titulo: string
          usuario_alvo_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          lido_em?: string | null
          prioridade?: string
          processo_id?: string | null
          resolvido_em?: string | null
          status?: string
          tipo?: string
          titulo?: string
          usuario_alvo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_financeira: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string | null
          id: string
          ip_address: string | null
          lancamento_id: string | null
          usuario_id: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: string | null
          lancamento_id?: string | null
          usuario_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          ip_address?: string | null
          lancamento_id?: string | null
          usuario_id?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_financeira_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      client_alerts: {
        Row: {
          client_id: string
          created_at: string
          descricao: string | null
          id: string
          prioridade: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          client_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          client_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_bau_contatos: {
        Row: {
          bau_id: string
          created_at: string
          descricao: string
          id: string
          nova_previsao: string | null
          registrado_por: string | null
          resultado: string | null
          tipo_contato: string
        }
        Insert: {
          bau_id: string
          created_at?: string
          descricao: string
          id?: string
          nova_previsao?: string | null
          registrado_por?: string | null
          resultado?: string | null
          tipo_contato?: string
        }
        Update: {
          bau_id?: string
          created_at?: string
          descricao?: string
          id?: string
          nova_previsao?: string | null
          registrado_por?: string | null
          resultado?: string | null
          tipo_contato?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_bau_contatos_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_bau_contatos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_baus: {
        Row: {
          client_id: string
          created_at: string
          data_recebimento: string | null
          data_solicitacao: string
          fase_cobranca: string | null
          hospital_contato: string | null
          hospital_nome: string
          hospital_telefone: string | null
          id: string
          motivo_incompleto: string | null
          observacoes: string | null
          previsao_entrega: string | null
          qualidade_status: string | null
          responsavel_id: string | null
          status: string
          tipo_solicitacao: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data_recebimento?: string | null
          data_solicitacao?: string
          fase_cobranca?: string | null
          hospital_contato?: string | null
          hospital_nome: string
          hospital_telefone?: string | null
          id?: string
          motivo_incompleto?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          qualidade_status?: string | null
          responsavel_id?: string | null
          status?: string
          tipo_solicitacao?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data_recebimento?: string | null
          data_solicitacao?: string
          fase_cobranca?: string | null
          hospital_contato?: string | null
          hospital_nome?: string
          hospital_telefone?: string | null
          id?: string
          motivo_incompleto?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          qualidade_status?: string | null
          responsavel_id?: string | null
          status?: string
          tipo_solicitacao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_baus_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_baus_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          document_category: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          document_category?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          document_category?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accident_date: string | null
          accident_location: string | null
          accident_type: string | null
          address: string | null
          admission_date: string | null
          admission_hospital: string | null
          advogado_id: string | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          birth_date: string | null
          body_part_affected: string | null
          cep: string | null
          cid_code: string | null
          city: string | null
          civil_status: string | null
          client_status: string | null
          code: number
          company_name: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          disability_percentage: number | null
          email: string | null
          had_surgery: boolean | null
          has_police_report: boolean | null
          has_sequelae: boolean | null
          hospitalization_days: number | null
          id: string
          injuries: string | null
          injury_severity: string | null
          is_clt: boolean | null
          last_contact_date: string | null
          name: string
          nationality: string | null
          naturality: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone1: string | null
          phone2: string | null
          police_report_number: string | null
          profession: string | null
          referral_source: string | null
          referral_type: string | null
          referrer_name: string | null
          responsavel_id: string | null
          rg: string | null
          seguradora_id: string | null
          transfer_date: string | null
          transfer_hospital: string | null
          uf: string | null
          updated_at: string
          was_hospitalized: boolean | null
        }
        Insert: {
          accident_date?: string | null
          accident_location?: string | null
          accident_type?: string | null
          address?: string | null
          admission_date?: string | null
          admission_hospital?: string | null
          advogado_id?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          body_part_affected?: string | null
          cep?: string | null
          cid_code?: string | null
          city?: string | null
          civil_status?: string | null
          client_status?: string | null
          code?: number
          company_name?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          disability_percentage?: number | null
          email?: string | null
          had_surgery?: boolean | null
          has_police_report?: boolean | null
          has_sequelae?: boolean | null
          hospitalization_days?: number | null
          id?: string
          injuries?: string | null
          injury_severity?: string | null
          is_clt?: boolean | null
          last_contact_date?: string | null
          name: string
          nationality?: string | null
          naturality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone1?: string | null
          phone2?: string | null
          police_report_number?: string | null
          profession?: string | null
          referral_source?: string | null
          referral_type?: string | null
          referrer_name?: string | null
          responsavel_id?: string | null
          rg?: string | null
          seguradora_id?: string | null
          transfer_date?: string | null
          transfer_hospital?: string | null
          uf?: string | null
          updated_at?: string
          was_hospitalized?: boolean | null
        }
        Update: {
          accident_date?: string | null
          accident_location?: string | null
          accident_type?: string | null
          address?: string | null
          admission_date?: string | null
          admission_hospital?: string | null
          advogado_id?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          body_part_affected?: string | null
          cep?: string | null
          cid_code?: string | null
          city?: string | null
          civil_status?: string | null
          client_status?: string | null
          code?: number
          company_name?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          disability_percentage?: number | null
          email?: string | null
          had_surgery?: boolean | null
          has_police_report?: boolean | null
          has_sequelae?: boolean | null
          hospitalization_days?: number | null
          id?: string
          injuries?: string | null
          injury_severity?: string | null
          is_clt?: boolean | null
          last_contact_date?: string | null
          name?: string
          nationality?: string | null
          naturality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone1?: string | null
          phone2?: string | null
          police_report_number?: string | null
          profession?: string | null
          referral_source?: string | null
          referral_type?: string | null
          referrer_name?: string | null
          responsavel_id?: string | null
          rg?: string | null
          seguradora_id?: string | null
          transfer_date?: string | null
          transfer_hospital?: string | null
          uf?: string | null
          updated_at?: string
          was_hospitalized?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicacao_historico: {
        Row: {
          assunto: string | null
          canal: string
          cliente_id: string | null
          conteudo: string
          destinatario: string
          enviado_em: string
          enviado_por: string | null
          erro_detalhes: string | null
          id: string
          processo_id: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          assunto?: string | null
          canal: string
          cliente_id?: string | null
          conteudo: string
          destinatario: string
          enviado_em?: string
          enviado_por?: string | null
          erro_detalhes?: string | null
          id?: string
          processo_id?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          assunto?: string | null
          canal?: string
          cliente_id?: string | null
          conteudo?: string
          destinatario?: string
          enviado_em?: string
          enviado_por?: string | null
          erro_detalhes?: string | null
          id?: string
          processo_id?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicacao_historico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacao_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacao_historico_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "comunicacao_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicacao_templates: {
        Row: {
          assunto: string | null
          ativo: boolean | null
          canal: string
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          nome: string
          updated_at: string
          variaveis: string[] | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean | null
          canal: string
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string
          variaveis?: string[] | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean | null
          canal?: string
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string
          variaveis?: string[] | null
        }
        Relationships: []
      }
      fechamentos_mensais: {
        Row: {
          ano: number
          created_at: string
          fechado_em: string
          fechado_por: string | null
          id: string
          mes: number
          numero_lancamentos: number
          observacoes: string | null
          resumo_por_tipo: Json | null
          total_a_receber: number
          total_em_atraso: number
          total_recebido: number
        }
        Insert: {
          ano: number
          created_at?: string
          fechado_em?: string
          fechado_por?: string | null
          id?: string
          mes: number
          numero_lancamentos?: number
          observacoes?: string | null
          resumo_por_tipo?: Json | null
          total_a_receber?: number
          total_em_atraso?: number
          total_recebido?: number
        }
        Update: {
          ano?: number
          created_at?: string
          fechado_em?: string
          fechado_por?: string | null
          id?: string
          mes?: number
          numero_lancamentos?: number
          observacoes?: string | null
          resumo_por_tipo?: Json | null
          total_a_receber?: number
          total_em_atraso?: number
          total_recebido?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          cpf: string | null
          created_at: string
          departamento: string | null
          email: string
          id: string
          nome: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cargo?: string
          cpf?: string | null
          created_at?: string
          departamento?: string | null
          email: string
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cargo?: string
          cpf?: string | null
          created_at?: string
          departamento?: string | null
          email?: string
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gestores: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          id: string
          nome: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lancamentos_financeiros: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          data_recebimento: string | null
          data_vencimento: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          protocolo_id: string | null
          status: string
          tipo_receita: string
          tipo_receita_justificativa: string | null
          updated_at: string
          valor_bruto: number
          valor_pago: number
          valor_pendente: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          protocolo_id?: string | null
          status?: string
          tipo_receita: string
          tipo_receita_justificativa?: string | null
          updated_at?: string
          valor_bruto?: number
          valor_pago?: number
          valor_pendente?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          protocolo_id?: string | null
          status?: string
          tipo_receita?: string
          tipo_receita_justificativa?: string | null
          updated_at?: string
          valor_bruto?: number
          valor_pago?: number
          valor_pendente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cliente_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          responsavel_id: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_diarias: {
        Row: {
          clientes_atendidos: number | null
          created_at: string
          data: string
          descricao: string | null
          funcionario_id: string
          id: string
          pastas_liberadas: number | null
          pendencias: string | null
          processos_movidos: number | null
        }
        Insert: {
          clientes_atendidos?: number | null
          created_at?: string
          data?: string
          descricao?: string | null
          funcionario_id: string
          id?: string
          pastas_liberadas?: number | null
          pendencias?: string | null
          processos_movidos?: number | null
        }
        Update: {
          clientes_atendidos?: number | null
          created_at?: string
          data?: string
          descricao?: string | null
          funcionario_id?: string
          id?: string
          pastas_liberadas?: number | null
          pendencias?: string | null
          processos_movidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_diarias_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      peritos: {
        Row: {
          created_at: string
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processo_acessos: {
        Row: {
          acao: string | null
          created_at: string
          id: string
          ip_address: string | null
          processo_id: string
          user_id: string
        }
        Insert: {
          acao?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          processo_id: string
          user_id: string
        }
        Update: {
          acao?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          processo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_acessos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          advogado_id: string | null
          cliente_id: string | null
          created_at: string
          data_abertura: string | null
          data_conclusao: string | null
          etiquetas: string[] | null
          honorarios: number | null
          id: string
          numero: string | null
          observacoes: string | null
          responsavel_id: string | null
          seguradora_id: string | null
          status: string
          tipo: string
          titulo: string | null
          ultima_movimentacao: string | null
          updated_at: string
          valor_estimado: number | null
          valor_final: number | null
        }
        Insert: {
          advogado_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_abertura?: string | null
          data_conclusao?: string | null
          etiquetas?: string[] | null
          honorarios?: number | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          seguradora_id?: string | null
          status?: string
          tipo: string
          titulo?: string | null
          ultima_movimentacao?: string | null
          updated_at?: string
          valor_estimado?: number | null
          valor_final?: number | null
        }
        Update: {
          advogado_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_abertura?: string | null
          data_conclusao?: string | null
          etiquetas?: string[] | null
          honorarios?: number | null
          id?: string
          numero?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          seguradora_id?: string | null
          status?: string
          tipo?: string
          titulo?: string | null
          ultima_movimentacao?: string | null
          updated_at?: string
          valor_estimado?: number | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      protocolo_alertas: {
        Row: {
          created_at: string
          descricao: string | null
          escalonado_para: string | null
          escalonamento_nivel: number | null
          id: string
          nivel: string
          protocolo_id: string
          resolucao_observacao: string | null
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          escalonado_para?: string | null
          escalonamento_nivel?: number | null
          id?: string
          nivel: string
          protocolo_id: string
          resolucao_observacao?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          escalonado_para?: string | null
          escalonamento_nivel?: number | null
          id?: string
          nivel?: string
          protocolo_id?: string
          resolucao_observacao?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_alertas_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_auxilio_acidente: {
        Row: {
          created_at: string
          data_acidente: string | null
          data_pericia: string | null
          data_requerimento: string | null
          id: string
          judicializado: boolean | null
          numero_processo_judicial: string | null
          numero_protocolo_inss: string | null
          pericia_realizada: boolean | null
          protocolo_id: string
          resultado_pericia: string | null
          situacao_atual: string | null
          tipo_beneficio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_acidente?: string | null
          data_pericia?: string | null
          data_requerimento?: string | null
          id?: string
          judicializado?: boolean | null
          numero_processo_judicial?: string | null
          numero_protocolo_inss?: string | null
          pericia_realizada?: boolean | null
          protocolo_id: string
          resultado_pericia?: string | null
          situacao_atual?: string | null
          tipo_beneficio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_acidente?: string | null
          data_pericia?: string | null
          data_requerimento?: string | null
          id?: string
          judicializado?: boolean | null
          numero_processo_judicial?: string | null
          numero_protocolo_inss?: string | null
          pericia_realizada?: boolean | null
          protocolo_id?: string
          resultado_pericia?: string | null
          situacao_atual?: string | null
          tipo_beneficio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_auxilio_acidente_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: true
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_checklist_encerramento: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          documento_final_anexado: boolean | null
          financeiro_preenchido: boolean | null
          honorarios_calculados: boolean | null
          id: string
          observacao_final_registrada: boolean | null
          protocolo_id: string
          status_final_definido: boolean | null
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          documento_final_anexado?: boolean | null
          financeiro_preenchido?: boolean | null
          honorarios_calculados?: boolean | null
          id?: string
          observacao_final_registrada?: boolean | null
          protocolo_id: string
          status_final_definido?: boolean | null
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          documento_final_anexado?: boolean | null
          financeiro_preenchido?: boolean | null
          honorarios_calculados?: boolean | null
          id?: string
          observacao_final_registrada?: boolean | null
          protocolo_id?: string
          status_final_definido?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_checklist_encerramento_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: true
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_documentos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          nome: string
          obrigatorio: boolean | null
          protocolo_id: string
          status: string
          updated_at: string
          uploaded_by: string | null
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          protocolo_id: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          protocolo_id?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_documentos_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_etiquetas: {
        Row: {
          ativo: boolean | null
          codigo: string
          cor: string
          created_at: string
          gerado_automaticamente: boolean | null
          id: string
          nome: string
          protocolo_id: string
          regra_aplicada: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          cor: string
          created_at?: string
          gerado_automaticamente?: boolean | null
          id?: string
          nome: string
          protocolo_id: string
          regra_aplicada?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          cor?: string
          created_at?: string
          gerado_automaticamente?: boolean | null
          id?: string
          nome?: string
          protocolo_id?: string
          regra_aplicada?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_etiquetas_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_financeiro: {
        Row: {
          comissao_interna: number | null
          comprovante_path: string | null
          created_at: string
          data_pagamento: string | null
          honorarios_calculados: number | null
          id: string
          motivo_prejuizo: string | null
          percentual_honorario: number | null
          prejuizo_registrado: number | null
          protocolo_id: string
          tipo_honorario: string | null
          updated_at: string
          valor_a_receber: number | null
          valor_estimado: number | null
          valor_fixo_honorario: number | null
          valor_recebido: number | null
        }
        Insert: {
          comissao_interna?: number | null
          comprovante_path?: string | null
          created_at?: string
          data_pagamento?: string | null
          honorarios_calculados?: number | null
          id?: string
          motivo_prejuizo?: string | null
          percentual_honorario?: number | null
          prejuizo_registrado?: number | null
          protocolo_id: string
          tipo_honorario?: string | null
          updated_at?: string
          valor_a_receber?: number | null
          valor_estimado?: number | null
          valor_fixo_honorario?: number | null
          valor_recebido?: number | null
        }
        Update: {
          comissao_interna?: number | null
          comprovante_path?: string | null
          created_at?: string
          data_pagamento?: string | null
          honorarios_calculados?: number | null
          id?: string
          motivo_prejuizo?: string | null
          percentual_honorario?: number | null
          prejuizo_registrado?: number | null
          protocolo_id?: string
          tipo_honorario?: string | null
          updated_at?: string
          valor_a_receber?: number | null
          valor_estimado?: number | null
          valor_fixo_honorario?: number | null
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_financeiro_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: true
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_historico: {
        Row: {
          campo_alterado: string
          created_at: string
          id: string
          observacao: string
          protocolo_id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          created_at?: string
          id?: string
          observacao: string
          protocolo_id: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          created_at?: string
          id?: string
          observacao?: string
          protocolo_id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_historico_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_responsaveis: {
        Row: {
          ativo: boolean | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          funcionario_id: string
          id: string
          protocolo_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          funcionario_id: string
          id?: string
          protocolo_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          funcionario_id?: string
          id?: string
          protocolo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_responsaveis_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolo_responsaveis_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos: {
        Row: {
          advogado_id: string | null
          cliente_id: string
          codigo: number
          created_at: string
          data_protocolo: string
          data_ultima_movimentacao: string | null
          funcionario_id: string | null
          id: string
          natureza: string
          observacoes: string | null
          orgao_responsavel: string | null
          prazo_estimado: string | null
          prioridade: string | null
          seguradora_id: string | null
          sla_dias: number | null
          status: string
          subtipo: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          advogado_id?: string | null
          cliente_id: string
          codigo?: number
          created_at?: string
          data_protocolo?: string
          data_ultima_movimentacao?: string | null
          funcionario_id?: string | null
          id?: string
          natureza: string
          observacoes?: string | null
          orgao_responsavel?: string | null
          prazo_estimado?: string | null
          prioridade?: string | null
          seguradora_id?: string | null
          sla_dias?: number | null
          status?: string
          subtipo?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          advogado_id?: string | null
          cliente_id?: string
          codigo?: number
          created_at?: string
          data_protocolo?: string
          data_ultima_movimentacao?: string | null
          funcionario_id?: string | null
          id?: string
          natureza?: string
          observacoes?: string | null
          orgao_responsavel?: string | null
          prazo_estimado?: string | null
          prioridade?: string | null
          seguradora_id?: string | null
          sla_dias?: number | null
          status?: string
          subtipo?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      seguradoras: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "funcionario"],
    },
  },
} as const
