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
          atribuicao_automatica: boolean | null
          created_at: string
          descricao: string | null
          funcionario_id: string | null
          id: string
          lido_em: string | null
          prioridade: string
          processo_id: string | null
          protocolo_id: string | null
          resolvido_em: string | null
          responsavel_atribuido_id: string | null
          status: string
          tipo: string
          titulo: string
          usuario_alvo_id: string | null
        }
        Insert: {
          atribuicao_automatica?: boolean | null
          created_at?: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          lido_em?: string | null
          prioridade?: string
          processo_id?: string | null
          protocolo_id?: string | null
          resolvido_em?: string | null
          responsavel_atribuido_id?: string | null
          status?: string
          tipo: string
          titulo: string
          usuario_alvo_id?: string | null
        }
        Update: {
          atribuicao_automatica?: boolean | null
          created_at?: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          lido_em?: string | null
          prioridade?: string
          processo_id?: string | null
          protocolo_id?: string | null
          resolvido_em?: string | null
          responsavel_atribuido_id?: string | null
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
          {
            foreignKeyName: "alertas_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_responsavel_atribuido_id_fkey"
            columns: ["responsavel_atribuido_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_prazo: {
        Row: {
          created_at: string
          data_prazo: string
          descricao: string | null
          dias_restantes: number | null
          id: string
          lido_em: string | null
          processo_id: string
          status: string | null
          tipo: string
          titulo: string
          usuario_alvo_id: string | null
        }
        Insert: {
          created_at?: string
          data_prazo: string
          descricao?: string | null
          dias_restantes?: number | null
          id?: string
          lido_em?: string | null
          processo_id: string
          status?: string | null
          tipo: string
          titulo: string
          usuario_alvo_id?: string | null
        }
        Update: {
          created_at?: string
          data_prazo?: string
          descricao?: string | null
          dias_restantes?: number | null
          id?: string
          lido_em?: string | null
          processo_id?: string
          status?: string | null
          tipo?: string
          titulo?: string
          usuario_alvo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_prazo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
        ]
      }
      andamentos_ia_analise: {
        Row: {
          acao_exigida: string | null
          alerta_1_dia: boolean | null
          alerta_10_dias: boolean | null
          alerta_5_dias: boolean | null
          analisado_em: string | null
          andamento_id: string
          categoria_andamento: string | null
          created_at: string
          gera_prazo: boolean | null
          id: string
          modelo_utilizado: string | null
          prazo_data_final: string | null
          prazo_dias_uteis: number | null
          processo_id: string
          quem_deve_agir: string | null
          texto_original: string
          tipo_peca_provavel: string | null
        }
        Insert: {
          acao_exigida?: string | null
          alerta_1_dia?: boolean | null
          alerta_10_dias?: boolean | null
          alerta_5_dias?: boolean | null
          analisado_em?: string | null
          andamento_id: string
          categoria_andamento?: string | null
          created_at?: string
          gera_prazo?: boolean | null
          id?: string
          modelo_utilizado?: string | null
          prazo_data_final?: string | null
          prazo_dias_uteis?: number | null
          processo_id: string
          quem_deve_agir?: string | null
          texto_original: string
          tipo_peca_provavel?: string | null
        }
        Update: {
          acao_exigida?: string | null
          alerta_1_dia?: boolean | null
          alerta_10_dias?: boolean | null
          alerta_5_dias?: boolean | null
          analisado_em?: string | null
          andamento_id?: string
          categoria_andamento?: string | null
          created_at?: string
          gera_prazo?: boolean | null
          id?: string
          modelo_utilizado?: string | null
          prazo_data_final?: string | null
          prazo_dias_uteis?: number | null
          processo_id?: string
          quem_deve_agir?: string | null
          texto_original?: string
          tipo_peca_provavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_ia_analise_andamento_id_fkey"
            columns: ["andamento_id"]
            isOneToOne: false
            referencedRelation: "andamentos_processo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "andamentos_ia_analise_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
        ]
      }
      andamentos_processo: {
        Row: {
          codigo_movimento: number | null
          complemento: string | null
          created_at: string
          data_andamento: string
          descricao: string
          destaque: boolean | null
          id: string
          lido: boolean | null
          lido_em: string | null
          lido_por: string | null
          processo_id: string
          tipo: string | null
        }
        Insert: {
          codigo_movimento?: number | null
          complemento?: string | null
          created_at?: string
          data_andamento: string
          descricao: string
          destaque?: boolean | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          processo_id: string
          tipo?: string | null
        }
        Update: {
          codigo_movimento?: number | null
          complemento?: string | null
          created_at?: string
          data_andamento?: string
          descricao?: string
          destaque?: boolean | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          processo_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
        ]
      }
      atribuicao_automatica_log: {
        Row: {
          alerta_id: string | null
          created_at: string
          historico_id: string | null
          id: string
          motivo: string
          protocolo_id: string | null
          responsavel_anterior_id: string | null
          responsavel_novo_id: string | null
          usuario_ultima_interacao: string | null
        }
        Insert: {
          alerta_id?: string | null
          created_at?: string
          historico_id?: string | null
          id?: string
          motivo: string
          protocolo_id?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          usuario_ultima_interacao?: string | null
        }
        Update: {
          alerta_id?: string | null
          created_at?: string
          historico_id?: string | null
          id?: string
          motivo?: string
          protocolo_id?: string | null
          responsavel_anterior_id?: string | null
          responsavel_novo_id?: string | null
          usuario_ultima_interacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atribuicao_automatica_log_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicao_automatica_log_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicao_automatica_log_responsavel_anterior_id_fkey"
            columns: ["responsavel_anterior_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicao_automatica_log_responsavel_novo_id_fkey"
            columns: ["responsavel_novo_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atribuicao_automatica_log_usuario_ultima_interacao_fkey"
            columns: ["usuario_ultima_interacao"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      bau_documentos_faltantes: {
        Row: {
          bau_id: string
          created_at: string
          data_recebimento: string | null
          documento_nome: string
          id: string
          obrigatorio: boolean | null
          observacoes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          bau_id: string
          created_at?: string
          data_recebimento?: string | null
          documento_nome: string
          id?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          bau_id?: string
          created_at?: string
          data_recebimento?: string | null
          documento_nome?: string
          id?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bau_documentos_faltantes_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
        ]
      }
      bau_etiquetas: {
        Row: {
          ativo: boolean | null
          bau_id: string
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          bau_id: string
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          bau_id?: string
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bau_etiquetas_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
        ]
      }
      bau_historico: {
        Row: {
          bau_id: string
          campo_alterado: string
          created_at: string
          id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          bau_id: string
          campo_alterado: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          bau_id?: string
          campo_alterado?: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bau_historico_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
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
          concluido_em: string | null
          concluido_por: string | null
          created_at: string
          data_recebimento: string | null
          data_solicitacao: string
          fase_cobranca: string | null
          hospital_contato: string | null
          hospital_id: string | null
          hospital_nome: string
          hospital_telefone: string | null
          id: string
          justificativa_conclusao: string | null
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
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_solicitacao?: string
          fase_cobranca?: string | null
          hospital_contato?: string | null
          hospital_id?: string | null
          hospital_nome: string
          hospital_telefone?: string | null
          id?: string
          justificativa_conclusao?: string | null
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
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_solicitacao?: string
          fase_cobranca?: string | null
          hospital_contato?: string | null
          hospital_id?: string | null
          hospital_nome?: string
          hospital_telefone?: string | null
          id?: string
          justificativa_conclusao?: string | null
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
            foreignKeyName: "client_baus_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitais"
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
      client_checklist_ia: {
        Row: {
          afastamento: boolean | null
          afastamento_15_dias: boolean | null
          atendimento_medico: boolean | null
          beneficio_recebido: string | null
          bo_status: string | null
          cidade_uf_evento: string | null
          client_id: string
          concluido_em: string | null
          concluido_por: string | null
          contribuia_inss: boolean | null
          created_at: string
          culpa_cliente: string | null
          dano_material_comprovavel: boolean | null
          danos_materiais: string[] | null
          data_evento: string | null
          e_clt: boolean | null
          e_motorista_app: boolean | null
          empresa_cnpj: string | null
          fez_financiamento: boolean | null
          funcao_cargo: string | null
          havia_epi: boolean | null
          havia_treinamento: boolean | null
          houve_cat: boolean | null
          id: string
          impacto_moral: string[] | null
          incapacidade_atual: string | null
          internacao: boolean | null
          lesao_corporal: boolean | null
          obito: boolean | null
          perda_renda: boolean | null
          perfil_vitima: string | null
          placa_terceiro: string | null
          provas_disponiveis: string[] | null
          recebeu_beneficio: boolean | null
          regime_trabalho: string | null
          sequela_permanente: string | null
          sequelas: string | null
          status: string | null
          tem_cartao_credito: boolean | null
          tem_conta_banco: boolean | null
          tem_emprestimo: boolean | null
          terceiro_identificado: string | null
          terceiro_tem_seguro: string | null
          tipo_acidente_trabalho: string | null
          tipo_ocorrencia: string | null
          tipos_gastos: string[] | null
          trabalhava: boolean | null
          updated_at: string
          usa_fintech: boolean | null
          usava_equipamento_seguranca: string | null
          veiculo_cliente: string | null
          veiculo_financiado: string | null
          veiculo_segurado: boolean | null
          veiculos_envolvidos: number | null
        }
        Insert: {
          afastamento?: boolean | null
          afastamento_15_dias?: boolean | null
          atendimento_medico?: boolean | null
          beneficio_recebido?: string | null
          bo_status?: string | null
          cidade_uf_evento?: string | null
          client_id: string
          concluido_em?: string | null
          concluido_por?: string | null
          contribuia_inss?: boolean | null
          created_at?: string
          culpa_cliente?: string | null
          dano_material_comprovavel?: boolean | null
          danos_materiais?: string[] | null
          data_evento?: string | null
          e_clt?: boolean | null
          e_motorista_app?: boolean | null
          empresa_cnpj?: string | null
          fez_financiamento?: boolean | null
          funcao_cargo?: string | null
          havia_epi?: boolean | null
          havia_treinamento?: boolean | null
          houve_cat?: boolean | null
          id?: string
          impacto_moral?: string[] | null
          incapacidade_atual?: string | null
          internacao?: boolean | null
          lesao_corporal?: boolean | null
          obito?: boolean | null
          perda_renda?: boolean | null
          perfil_vitima?: string | null
          placa_terceiro?: string | null
          provas_disponiveis?: string[] | null
          recebeu_beneficio?: boolean | null
          regime_trabalho?: string | null
          sequela_permanente?: string | null
          sequelas?: string | null
          status?: string | null
          tem_cartao_credito?: boolean | null
          tem_conta_banco?: boolean | null
          tem_emprestimo?: boolean | null
          terceiro_identificado?: string | null
          terceiro_tem_seguro?: string | null
          tipo_acidente_trabalho?: string | null
          tipo_ocorrencia?: string | null
          tipos_gastos?: string[] | null
          trabalhava?: boolean | null
          updated_at?: string
          usa_fintech?: boolean | null
          usava_equipamento_seguranca?: string | null
          veiculo_cliente?: string | null
          veiculo_financiado?: string | null
          veiculo_segurado?: boolean | null
          veiculos_envolvidos?: number | null
        }
        Update: {
          afastamento?: boolean | null
          afastamento_15_dias?: boolean | null
          atendimento_medico?: boolean | null
          beneficio_recebido?: string | null
          bo_status?: string | null
          cidade_uf_evento?: string | null
          client_id?: string
          concluido_em?: string | null
          concluido_por?: string | null
          contribuia_inss?: boolean | null
          created_at?: string
          culpa_cliente?: string | null
          dano_material_comprovavel?: boolean | null
          danos_materiais?: string[] | null
          data_evento?: string | null
          e_clt?: boolean | null
          e_motorista_app?: boolean | null
          empresa_cnpj?: string | null
          fez_financiamento?: boolean | null
          funcao_cargo?: string | null
          havia_epi?: boolean | null
          havia_treinamento?: boolean | null
          houve_cat?: boolean | null
          id?: string
          impacto_moral?: string[] | null
          incapacidade_atual?: string | null
          internacao?: boolean | null
          lesao_corporal?: boolean | null
          obito?: boolean | null
          perda_renda?: boolean | null
          perfil_vitima?: string | null
          placa_terceiro?: string | null
          provas_disponiveis?: string[] | null
          recebeu_beneficio?: boolean | null
          regime_trabalho?: string | null
          sequela_permanente?: string | null
          sequelas?: string | null
          status?: string | null
          tem_cartao_credito?: boolean | null
          tem_conta_banco?: boolean | null
          tem_emprestimo?: boolean | null
          terceiro_identificado?: string | null
          terceiro_tem_seguro?: string | null
          tipo_acidente_trabalho?: string | null
          tipo_ocorrencia?: string | null
          tipos_gastos?: string[] | null
          trabalhava?: boolean | null
          updated_at?: string
          usa_fintech?: boolean | null
          usava_equipamento_seguranca?: string | null
          veiculo_cliente?: string | null
          veiculo_financiado?: string | null
          veiculo_segurado?: boolean | null
          veiculos_envolvidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_checklist_ia_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      client_seguradoras: {
        Row: {
          client_id: string
          created_at: string
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          id: string
          nome_seguradora: string
          numero_apolice: string | null
          numero_certificado: string | null
          observacoes: string | null
          status: string | null
          tipo_produto: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          id?: string
          nome_seguradora: string
          numero_apolice?: string | null
          numero_certificado?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_produto?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          id?: string
          nome_seguradora?: string
          numero_apolice?: string | null
          numero_certificado?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_produto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_seguradoras_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workflow: {
        Row: {
          bau_acionado: boolean | null
          bau_id: string | null
          bau_status: string | null
          bo_data: string | null
          bo_numero: string | null
          bo_orgao: string | null
          bo_status: string | null
          checklist_ia_status: string | null
          client_id: string
          cliente_cadastrado: boolean | null
          created_at: string
          financeiro_liberado: boolean | null
          id: string
          juridico_liberado: boolean | null
          laudo_cid: string | null
          laudo_crm: string | null
          laudo_data: string | null
          laudo_medico: string | null
          laudo_status: string | null
          laudo_tipo_incapacidade: string | null
          pericia_liberada: boolean | null
          protocolo_id: string | null
          protocolo_status: string | null
          updated_at: string
        }
        Insert: {
          bau_acionado?: boolean | null
          bau_id?: string | null
          bau_status?: string | null
          bo_data?: string | null
          bo_numero?: string | null
          bo_orgao?: string | null
          bo_status?: string | null
          checklist_ia_status?: string | null
          client_id: string
          cliente_cadastrado?: boolean | null
          created_at?: string
          financeiro_liberado?: boolean | null
          id?: string
          juridico_liberado?: boolean | null
          laudo_cid?: string | null
          laudo_crm?: string | null
          laudo_data?: string | null
          laudo_medico?: string | null
          laudo_status?: string | null
          laudo_tipo_incapacidade?: string | null
          pericia_liberada?: boolean | null
          protocolo_id?: string | null
          protocolo_status?: string | null
          updated_at?: string
        }
        Update: {
          bau_acionado?: boolean | null
          bau_id?: string | null
          bau_status?: string | null
          bo_data?: string | null
          bo_numero?: string | null
          bo_orgao?: string | null
          bo_status?: string | null
          checklist_ia_status?: string | null
          client_id?: string
          cliente_cadastrado?: boolean | null
          created_at?: string
          financeiro_liberado?: boolean | null
          id?: string
          juridico_liberado?: boolean | null
          laudo_cid?: string | null
          laudo_crm?: string | null
          laudo_data?: string | null
          laudo_medico?: string | null
          laudo_status?: string | null
          laudo_tipo_incapacidade?: string | null
          pericia_liberada?: boolean | null
          protocolo_id?: string | null
          protocolo_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workflow_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workflow_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workflow_log: {
        Row: {
          campo_alterado: string
          created_at: string
          id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
          workflow_id: string
        }
        Insert: {
          campo_alterado: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
          workflow_id: string
        }
        Update: {
          campo_alterado?: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workflow_log_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "client_workflow"
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
      comissoes: {
        Row: {
          beneficiario_nome: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          data_acidente: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          motivo_bloqueio: string | null
          observacoes: string | null
          pago_em: string | null
          pago_por: string | null
          revertido_em: string | null
          revertido_motivo: string | null
          revertido_por: string | null
          status: string
          tipo_indenizacao: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          beneficiario_nome?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_acidente: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          pago_em?: string | null
          pago_por?: string | null
          revertido_em?: string | null
          revertido_motivo?: string | null
          revertido_por?: string | null
          status?: string
          tipo_indenizacao: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          beneficiario_nome?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_acidente?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          pago_em?: string | null
          pago_por?: string | null
          revertido_em?: string | null
          revertido_motivo?: string | null
          revertido_por?: string | null
          status?: string
          tipo_indenizacao?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_historico: {
        Row: {
          acao: string
          campo_alterado: string | null
          comissao_id: string
          created_at: string
          id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo_alterado?: string | null
          comissao_id: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo_alterado?: string | null
          comissao_id?: string
          created_at?: string
          id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_historico_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes"
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
      comunicacao_registros: {
        Row: {
          assunto: string | null
          bau_id: string | null
          canal: string
          cliente_id: string | null
          conteudo: string
          created_at: string
          data_leitura: string | null
          destinatario_id: string | null
          direcao: string
          id: string
          metadados: Json | null
          processo_id: string | null
          protocolo_id: string | null
          remetente_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          bau_id?: string | null
          canal: string
          cliente_id?: string | null
          conteudo: string
          created_at?: string
          data_leitura?: string | null
          destinatario_id?: string | null
          direcao?: string
          id?: string
          metadados?: Json | null
          processo_id?: string | null
          protocolo_id?: string | null
          remetente_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          bau_id?: string | null
          canal?: string
          cliente_id?: string | null
          conteudo?: string
          created_at?: string
          data_leitura?: string | null
          destinatario_id?: string | null
          direcao?: string
          id?: string
          metadados?: Json | null
          processo_id?: string | null
          protocolo_id?: string | null
          remetente_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicacao_registros_bau_id_fkey"
            columns: ["bau_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacao_registros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacao_registros_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacao_registros_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
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
      documentos_processo: {
        Row: {
          created_at: string
          descricao: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          nome: string
          processo_id: string
          tipo_documento: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          nome: string
          processo_id: string
          tipo_documento: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          nome?: string
          processo_id?: string
          tipo_documento?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
        ]
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
          deleted_at: string | null
          deleted_by: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
      historico_processo: {
        Row: {
          acao: string
          campo_alterado: string | null
          created_at: string
          id: string
          ip_address: string | null
          processo_id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo_alterado?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          processo_id: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo_alterado?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          processo_id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitais: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          created_at: string
          critico: boolean | null
          email: string | null
          id: string
          motivo_critico: string | null
          nome: string
          numero: string
          rua: string
          telefone1: string
          telefone2: string | null
          total_atrasos: number | null
          total_incompletos: number | null
          updated_at: string
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          created_at?: string
          critico?: boolean | null
          email?: string | null
          id?: string
          motivo_critico?: string | null
          nome: string
          numero: string
          rua: string
          telefone1: string
          telefone2?: string | null
          total_atrasos?: number | null
          total_incompletos?: number | null
          updated_at?: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          created_at?: string
          critico?: boolean | null
          email?: string | null
          id?: string
          motivo_critico?: string | null
          nome?: string
          numero?: string
          rua?: string
          telefone1?: string
          telefone2?: string | null
          total_atrasos?: number | null
          total_incompletos?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ia_analises_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          modelo_utilizado: string | null
          resultado_ia: string | null
          texto_observacao: string | null
          usuario_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          modelo_utilizado?: string | null
          resultado_ia?: string | null
          texto_observacao?: string | null
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          modelo_utilizado?: string | null
          resultado_ia?: string | null
          texto_observacao?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ia_analises_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      junta_medicos: {
        Row: {
          created_at: string
          crm: string
          endereco_profissional: string | null
          especialidade: string | null
          id: string
          junta_id: string
          nome_medico: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          crm: string
          endereco_profissional?: string | null
          especialidade?: string | null
          id?: string
          junta_id: string
          nome_medico: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          crm?: string
          endereco_profissional?: string | null
          especialidade?: string | null
          id?: string
          junta_id?: string
          nome_medico?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "junta_medicos_junta_id_fkey"
            columns: ["junta_id"]
            isOneToOne: false
            referencedRelation: "juntas_medicas"
            referencedColumns: ["id"]
          },
        ]
      }
      juntas_medicas: {
        Row: {
          created_at: string
          data_junta: string
          endereco_junta: string | null
          hora_junta: string | null
          id: string
          local_junta: string
          observacoes: string | null
          pericia_id: string
        }
        Insert: {
          created_at?: string
          data_junta: string
          endereco_junta?: string | null
          hora_junta?: string | null
          id?: string
          local_junta: string
          observacoes?: string | null
          pericia_id: string
        }
        Update: {
          created_at?: string
          data_junta?: string
          endereco_junta?: string | null
          hora_junta?: string | null
          id?: string
          local_junta?: string
          observacoes?: string | null
          pericia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "juntas_medicas_pericia_id_fkey"
            columns: ["pericia_id"]
            isOneToOne: false
            referencedRelation: "pericias"
            referencedColumns: ["id"]
          },
        ]
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
          pericia_id: string | null
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
          pericia_id?: string | null
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
          pericia_id?: string | null
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
            foreignKeyName: "lancamentos_financeiros_pericia_id_fkey"
            columns: ["pericia_id"]
            isOneToOne: false
            referencedRelation: "pericias"
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
      mensagens_chat: {
        Row: {
          conteudo: string
          created_at: string | null
          destinatario_id: string
          id: string
          lida: boolean | null
          lida_em: string | null
          remetente_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          destinatario_id: string
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          remetente_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          destinatario_id?: string
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          remetente_id?: string
        }
        Relationships: []
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
      movimentacoes_processo: {
        Row: {
          codigo_movimento: number | null
          complemento: string | null
          created_at: string | null
          data_movimento: string
          decisao_teor: string | null
          descricao: string
          id: string
          lido: boolean | null
          lido_em: string | null
          lido_por: string | null
          prazo_dias: number | null
          prazo_fatal: string | null
          processo_id: string | null
          urgente: boolean | null
        }
        Insert: {
          codigo_movimento?: number | null
          complemento?: string | null
          created_at?: string | null
          data_movimento: string
          decisao_teor?: string | null
          descricao: string
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          prazo_dias?: number | null
          prazo_fatal?: string | null
          processo_id?: string | null
          urgente?: boolean | null
        }
        Update: {
          codigo_movimento?: number | null
          complemento?: string | null
          created_at?: string | null
          data_movimento?: string
          decisao_teor?: string | null
          descricao?: string
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          lido_por?: string | null
          prazo_dias?: number | null
          prazo_fatal?: string | null
          processo_id?: string | null
          urgente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_processo_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_sincronizados"
            referencedColumns: ["id"]
          },
        ]
      }
      oab_monitoradas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          criado_por: string | null
          id: string
          nome_advogado: string | null
          numero_oab: string
          uf: string
          ultima_sincronizacao: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          nome_advogado?: string | null
          numero_oab: string
          uf: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          nome_advogado?: string | null
          numero_oab?: string
          uf?: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pericia_logs: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          pericia_id: string
          status_anterior: string | null
          status_novo: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          pericia_id: string
          status_anterior?: string | null
          status_novo?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          pericia_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pericia_logs_pericia_id_fkey"
            columns: ["pericia_id"]
            isOneToOne: false
            referencedRelation: "pericias"
            referencedColumns: ["id"]
          },
        ]
      }
      pericias: {
        Row: {
          cliente_id: string
          clinica_bairro: string | null
          clinica_cep: string | null
          clinica_cidade: string | null
          clinica_endereco: string | null
          clinica_nome: string | null
          clinica_numero: string | null
          clinica_telefone: string | null
          created_at: string
          created_by: string | null
          crm_medico: string | null
          data_pericia: string
          hora_pericia: string | null
          id: string
          medico_responsavel: string | null
          observacoes: string | null
          status: string
          tipo_pericia: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          clinica_bairro?: string | null
          clinica_cep?: string | null
          clinica_cidade?: string | null
          clinica_endereco?: string | null
          clinica_nome?: string | null
          clinica_numero?: string | null
          clinica_telefone?: string | null
          created_at?: string
          created_by?: string | null
          crm_medico?: string | null
          data_pericia: string
          hora_pericia?: string | null
          id?: string
          medico_responsavel?: string | null
          observacoes?: string | null
          status?: string
          tipo_pericia: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          clinica_bairro?: string | null
          clinica_cep?: string | null
          clinica_cidade?: string | null
          clinica_endereco?: string | null
          clinica_nome?: string | null
          clinica_numero?: string | null
          clinica_telefone?: string | null
          created_at?: string
          created_by?: string | null
          crm_medico?: string | null
          data_pericia?: string
          hora_pericia?: string | null
          id?: string
          medico_responsavel?: string | null
          observacoes?: string | null
          status?: string
          tipo_pericia?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pericias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      processo_ia_historico: {
        Row: {
          created_at: string
          id: string
          modelo_utilizado: string | null
          processo_id: string
          resultado_analise: Json | null
          tipo_analise: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          modelo_utilizado?: string | null
          processo_id: string
          resultado_analise?: Json | null
          tipo_analise: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          modelo_utilizado?: string | null
          processo_id?: string
          resultado_analise?: Json | null
          tipo_analise?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processo_ia_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_judiciais"
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
      processos_judiciais: {
        Row: {
          advogado_auxiliar_id: string | null
          alerta_prazo_dias: number | null
          assunto_principal: string | null
          assuntos_secundarios: string[] | null
          autor_documento: string | null
          autor_nome: string | null
          autor_tipo: string | null
          bau_vinculado_id: string | null
          cadastrado_por: string | null
          classe_processual: string | null
          cliente_id: string | null
          comarca: string | null
          created_at: string
          custas_iniciais: number | null
          custas_totais: number | null
          dados_completos: Json | null
          data_audiencia: string | null
          data_citacao: string | null
          data_distribuicao: string | null
          data_fato: string | null
          data_pagamento: string | null
          data_pericia: string | null
          data_sentenca: string | null
          data_ultima_movimentacao: string | null
          dias_parado: number | null
          diferenca_valores: number | null
          etiquetas: string[] | null
          grau: string | null
          honorarios_estimados: number | null
          ia_acao_necessaria: string | null
          ia_analisado_em: string | null
          ia_depende_bau: boolean | null
          ia_depende_cliente: boolean | null
          ia_depende_pericia: boolean | null
          ia_entendimento: string | null
          ia_impacto_financeiro: string | null
          ia_proxima_acao_sugerida: string | null
          ia_resumo_processo: string | null
          ia_risco_processual: string | null
          id: string
          indenizacao_paga: number | null
          indenizacao_pleiteada: number | null
          juiz_responsavel: string | null
          link_externo: string | null
          numero_processo: string
          observacoes_estrategicas: string | null
          prazo_aberto: boolean | null
          prazo_acao_quem: string | null
          prazo_data_final: string | null
          prazo_dias_restantes: number | null
          prazo_processual: string | null
          prioridade: string | null
          processo_critico: boolean | null
          processo_parado: boolean | null
          proxima_acao: string | null
          responsavel_id: string | null
          reu_documento: string | null
          reu_nome: string | null
          reu_tipo: string | null
          sincronizado_em: string | null
          status: string | null
          status_detalhado: string | null
          tipo_prazo: string | null
          tribunal: string | null
          ultima_movimentacao: string | null
          updated_at: string
          valor_atualizado: number | null
          valor_causa: number | null
          vara: string | null
        }
        Insert: {
          advogado_auxiliar_id?: string | null
          alerta_prazo_dias?: number | null
          assunto_principal?: string | null
          assuntos_secundarios?: string[] | null
          autor_documento?: string | null
          autor_nome?: string | null
          autor_tipo?: string | null
          bau_vinculado_id?: string | null
          cadastrado_por?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string
          custas_iniciais?: number | null
          custas_totais?: number | null
          dados_completos?: Json | null
          data_audiencia?: string | null
          data_citacao?: string | null
          data_distribuicao?: string | null
          data_fato?: string | null
          data_pagamento?: string | null
          data_pericia?: string | null
          data_sentenca?: string | null
          data_ultima_movimentacao?: string | null
          dias_parado?: number | null
          diferenca_valores?: number | null
          etiquetas?: string[] | null
          grau?: string | null
          honorarios_estimados?: number | null
          ia_acao_necessaria?: string | null
          ia_analisado_em?: string | null
          ia_depende_bau?: boolean | null
          ia_depende_cliente?: boolean | null
          ia_depende_pericia?: boolean | null
          ia_entendimento?: string | null
          ia_impacto_financeiro?: string | null
          ia_proxima_acao_sugerida?: string | null
          ia_resumo_processo?: string | null
          ia_risco_processual?: string | null
          id?: string
          indenizacao_paga?: number | null
          indenizacao_pleiteada?: number | null
          juiz_responsavel?: string | null
          link_externo?: string | null
          numero_processo: string
          observacoes_estrategicas?: string | null
          prazo_aberto?: boolean | null
          prazo_acao_quem?: string | null
          prazo_data_final?: string | null
          prazo_dias_restantes?: number | null
          prazo_processual?: string | null
          prioridade?: string | null
          processo_critico?: boolean | null
          processo_parado?: boolean | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          reu_documento?: string | null
          reu_nome?: string | null
          reu_tipo?: string | null
          sincronizado_em?: string | null
          status?: string | null
          status_detalhado?: string | null
          tipo_prazo?: string | null
          tribunal?: string | null
          ultima_movimentacao?: string | null
          updated_at?: string
          valor_atualizado?: number | null
          valor_causa?: number | null
          vara?: string | null
        }
        Update: {
          advogado_auxiliar_id?: string | null
          alerta_prazo_dias?: number | null
          assunto_principal?: string | null
          assuntos_secundarios?: string[] | null
          autor_documento?: string | null
          autor_nome?: string | null
          autor_tipo?: string | null
          bau_vinculado_id?: string | null
          cadastrado_por?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string
          custas_iniciais?: number | null
          custas_totais?: number | null
          dados_completos?: Json | null
          data_audiencia?: string | null
          data_citacao?: string | null
          data_distribuicao?: string | null
          data_fato?: string | null
          data_pagamento?: string | null
          data_pericia?: string | null
          data_sentenca?: string | null
          data_ultima_movimentacao?: string | null
          dias_parado?: number | null
          diferenca_valores?: number | null
          etiquetas?: string[] | null
          grau?: string | null
          honorarios_estimados?: number | null
          ia_acao_necessaria?: string | null
          ia_analisado_em?: string | null
          ia_depende_bau?: boolean | null
          ia_depende_cliente?: boolean | null
          ia_depende_pericia?: boolean | null
          ia_entendimento?: string | null
          ia_impacto_financeiro?: string | null
          ia_proxima_acao_sugerida?: string | null
          ia_resumo_processo?: string | null
          ia_risco_processual?: string | null
          id?: string
          indenizacao_paga?: number | null
          indenizacao_pleiteada?: number | null
          juiz_responsavel?: string | null
          link_externo?: string | null
          numero_processo?: string
          observacoes_estrategicas?: string | null
          prazo_aberto?: boolean | null
          prazo_acao_quem?: string | null
          prazo_data_final?: string | null
          prazo_dias_restantes?: number | null
          prazo_processual?: string | null
          prioridade?: string | null
          processo_critico?: boolean | null
          processo_parado?: boolean | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          reu_documento?: string | null
          reu_nome?: string | null
          reu_tipo?: string | null
          sincronizado_em?: string | null
          status?: string | null
          status_detalhado?: string | null
          tipo_prazo?: string | null
          tribunal?: string | null
          ultima_movimentacao?: string | null
          updated_at?: string
          valor_atualizado?: number | null
          valor_causa?: number | null
          vara?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_judiciais_advogado_auxiliar_id_fkey"
            columns: ["advogado_auxiliar_id"]
            isOneToOne: false
            referencedRelation: "advogados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_judiciais_bau_vinculado_id_fkey"
            columns: ["bau_vinculado_id"]
            isOneToOne: false
            referencedRelation: "client_baus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_judiciais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_judiciais_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_sincronizados: {
        Row: {
          assunto: string | null
          classe_processual: string | null
          created_at: string | null
          dados_completos: Json | null
          data_ajuizamento: string | null
          data_ultimo_movimento: string | null
          id: string
          link_externo: string | null
          nivel_sigilo: string | null
          numero_processo: string
          oab_id: string | null
          orgao_julgador: string | null
          partes: Json | null
          situacao: string | null
          tribunal: string | null
          ultimo_movimento: string | null
          updated_at: string | null
        }
        Insert: {
          assunto?: string | null
          classe_processual?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_ajuizamento?: string | null
          data_ultimo_movimento?: string | null
          id?: string
          link_externo?: string | null
          nivel_sigilo?: string | null
          numero_processo: string
          oab_id?: string | null
          orgao_julgador?: string | null
          partes?: Json | null
          situacao?: string | null
          tribunal?: string | null
          ultimo_movimento?: string | null
          updated_at?: string | null
        }
        Update: {
          assunto?: string | null
          classe_processual?: string | null
          created_at?: string | null
          dados_completos?: Json | null
          data_ajuizamento?: string | null
          data_ultimo_movimento?: string | null
          id?: string
          link_externo?: string | null
          nivel_sigilo?: string | null
          numero_processo?: string
          oab_id?: string | null
          orgao_julgador?: string | null
          partes?: Json | null
          situacao?: string | null
          tribunal?: string | null
          ultimo_movimento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_sincronizados_oab_id_fkey"
            columns: ["oab_id"]
            isOneToOne: false
            referencedRelation: "oab_monitoradas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
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
          origem: string | null
          prazo_estimado: string | null
          prioridade: string | null
          seguradora_id: string | null
          sla_dias: number | null
          status: string
          subtipo: string | null
          tema: string | null
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
          origem?: string | null
          prazo_estimado?: string | null
          prioridade?: string | null
          seguradora_id?: string | null
          sla_dias?: number | null
          status?: string
          subtipo?: string | null
          tema?: string | null
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
          origem?: string | null
          prazo_estimado?: string | null
          prioridade?: string | null
          seguradora_id?: string | null
          sla_dias?: number | null
          status?: string
          subtipo?: string | null
          tema?: string | null
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
      solicitacoes: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          descricao: string | null
          destinatario_id: string
          id: string
          prazo: string | null
          prioridade: string | null
          processo_id: string | null
          protocolo_id: string | null
          remetente_id: string
          respondido_em: string | null
          resposta: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          descricao?: string | null
          destinatario_id: string
          id?: string
          prazo?: string | null
          prioridade?: string | null
          processo_id?: string | null
          protocolo_id?: string | null
          remetente_id: string
          respondido_em?: string | null
          resposta?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          descricao?: string | null
          destinatario_id?: string
          id?: string
          prazo?: string | null
          prioridade?: string | null
          processo_id?: string | null
          protocolo_id?: string | null
          remetente_id?: string
          respondido_em?: string | null
          resposta?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_mensagens: {
        Row: {
          conteudo: string
          created_at: string | null
          id: string
          tarefa_id: string
          usuario_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          id?: string
          tarefa_id: string
          usuario_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          id?: string
          tarefa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_mensagens_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas_rafael"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_historico: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string | null
          id: string
          tarefa_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          tarefa_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          tarefa_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_historico_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas_rafael"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_metricas_usuario: {
        Row: {
          ano: number
          created_at: string | null
          feedback_gerado: string | null
          id: string
          mes: number
          percentual_em_5_minutos: number | null
          tempo_medio_resolucao_segundos: number | null
          total_concluidas: number | null
          total_pendentes: number | null
          total_recebidas: number | null
          total_urgentes: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          feedback_gerado?: string | null
          id?: string
          mes: number
          percentual_em_5_minutos?: number | null
          tempo_medio_resolucao_segundos?: number | null
          total_concluidas?: number | null
          total_pendentes?: number | null
          total_recebidas?: number | null
          total_urgentes?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          feedback_gerado?: string | null
          id?: string
          mes?: number
          percentual_em_5_minutos?: number | null
          tempo_medio_resolucao_segundos?: number | null
          total_concluidas?: number | null
          total_pendentes?: number | null
          total_recebidas?: number | null
          total_urgentes?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      tarefas_rafael: {
        Row: {
          atrasada: boolean | null
          cliente_id: string | null
          concluido_em: string | null
          created_at: string | null
          descricao: string | null
          enviado_por: string
          feedback_exibido: boolean | null
          id: string
          iniciado_em: string | null
          prazo: string | null
          prioridade: string | null
          processo_id: string | null
          protocolo_id: string | null
          respondido_em: string | null
          responsavel_id: string | null
          resposta: string | null
          status: string | null
          tempo_resolucao_segundos: number | null
          tipo_solicitacao: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          atrasada?: boolean | null
          cliente_id?: string | null
          concluido_em?: string | null
          created_at?: string | null
          descricao?: string | null
          enviado_por: string
          feedback_exibido?: boolean | null
          id?: string
          iniciado_em?: string | null
          prazo?: string | null
          prioridade?: string | null
          processo_id?: string | null
          protocolo_id?: string | null
          respondido_em?: string | null
          responsavel_id?: string | null
          resposta?: string | null
          status?: string | null
          tempo_resolucao_segundos?: number | null
          tipo_solicitacao?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          atrasada?: boolean | null
          cliente_id?: string | null
          concluido_em?: string | null
          created_at?: string | null
          descricao?: string | null
          enviado_por?: string
          feedback_exibido?: boolean | null
          id?: string
          iniciado_em?: string | null
          prazo?: string | null
          prioridade?: string | null
          processo_id?: string | null
          protocolo_id?: string | null
          respondido_em?: string | null
          responsavel_id?: string | null
          resposta?: string | null
          status?: string | null
          tempo_resolucao_segundos?: number | null
          tipo_solicitacao?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_rafael_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_rafael_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_rafael_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
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
