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
      clients: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          civil_status: string | null
          code: number
          complement: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          nationality: string | null
          naturality: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone1: string | null
          phone2: string | null
          profession: string | null
          rg: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          civil_status?: string | null
          code?: number
          complement?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          nationality?: string | null
          naturality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone1?: string | null
          phone2?: string | null
          profession?: string | null
          rg?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          civil_status?: string | null
          code?: number
          complement?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          nationality?: string | null
          naturality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone1?: string | null
          phone2?: string | null
          profession?: string | null
          rg?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
