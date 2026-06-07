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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aulas: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_hora: string
          descricao: string | null
          duracao_minutos: number
          gravacao_url: string | null
          id: string
          link_transmissao: string | null
          monitor_id: string | null
          observacoes: string | null
          professor_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_hora: string
          descricao?: string | null
          duracao_minutos?: number
          gravacao_url?: string | null
          id?: string
          link_transmissao?: string | null
          monitor_id?: string | null
          observacoes?: string | null
          professor_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_hora?: string
          descricao?: string | null
          duracao_minutos?: number
          gravacao_url?: string | null
          id?: string
          link_transmissao?: string | null
          monitor_id?: string | null
          observacoes?: string | null
          professor_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          atualizado_em: string
          aula_id: string | null
          comprovante_url: string | null
          criado_em: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          metodo: string | null
          observacoes: string | null
          professor_id: string | null
          status: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          aula_id?: string | null
          comprovante_url?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          metodo?: string | null
          observacoes?: string | null
          professor_id?: string | null
          status?: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          aula_id?: string | null
          comprovante_url?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          metodo?: string | null
          observacoes?: string | null
          professor_id?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoal: {
        Row: {
          atualizado_em: string
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string
          data_admissao: string | null
          data_demissao: string | null
          documento: string | null
          email: string | null
          estado: string | null
          id: string
          is_whatsapp: boolean | null
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          salario: number | null
          status: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          data_admissao?: string | null
          data_demissao?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          is_whatsapp?: boolean | null
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          salario?: number | null
          status?: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          data_admissao?: string | null
          data_demissao?: string | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          is_whatsapp?: boolean | null
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          salario?: number | null
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      professores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string
          documento: string | null
          email: string | null
          endereco: string | null
          especialidade: string | null
          estado: string | null
          foto_url: string | null
          id: string
          instagram_handle: string | null
          is_whatsapp: boolean | null
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          pix_chave: string | null
          pix_tipo: string | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_whatsapp?: boolean | null
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_whatsapp?: boolean | null
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
          role: string
          telas_acesso: string[] | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          nome: string
          role?: string
          telas_acesso?: string[] | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          role?: string
          telas_acesso?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
