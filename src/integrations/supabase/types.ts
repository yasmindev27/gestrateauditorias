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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      aih_registros: {
        Row: {
          admissao: string | null
          aih: string
          alta: string | null
          carater: string | null
          clinica: string | null
          competencia: string | null
          corrigido: string | null
          created_at: string
          data_lancamento: string | null
          encerramento: string | null
          id: string
          nome_paciente: string
          opme: string | null
          pendencia: string | null
          procedencia: string | null
          procedimento: string | null
          subsequente: string | null
          total: number | null
          total_final: number | null
          troca_codigo: string | null
          updated_at: string
          valor_opme: number | null
        }
        Insert: {
          admissao?: string | null
          aih: string
          alta?: string | null
          carater?: string | null
          clinica?: string | null
          competencia?: string | null
          corrigido?: string | null
          created_at?: string
          data_lancamento?: string | null
          encerramento?: string | null
          id?: string
          nome_paciente: string
          opme?: string | null
          pendencia?: string | null
          procedencia?: string | null
          procedimento?: string | null
          subsequente?: string | null
          total?: number | null
          total_final?: number | null
          troca_codigo?: string | null
          updated_at?: string
          valor_opme?: number | null
        }
        Update: {
          admissao?: string | null
          aih?: string
          alta?: string | null
          carater?: string | null
          clinica?: string | null
          competencia?: string | null
          corrigido?: string | null
          created_at?: string
          data_lancamento?: string | null
          encerramento?: string | null
          id?: string
          nome_paciente?: string
          opme?: string | null
          pendencia?: string | null
          procedencia?: string | null
          procedimento?: string | null
          subsequente?: string | null
          total?: number | null
          total_final?: number | null
          troca_codigo?: string | null
          updated_at?: string
          valor_opme?: number | null
        }
        Relationships: []
      }
      mov_doc_comp: {
        Row: {
          created_at: string
          data_devolucao: string | null
          data_entrada: string
          id: string
          observacao: string | null
          qtd_aih: number
          qtd_saida: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_devolucao?: string | null
          data_entrada: string
          id?: string
          observacao?: string | null
          qtd_aih?: number
          qtd_saida?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_devolucao?: string | null
          data_entrada?: string
          id?: string
          observacao?: string | null
          qtd_aih?: number
          qtd_saida?: number
          updated_at?: string
        }
        Relationships: []
      }
      procedimento_codigos: {
        Row: {
          codigo: string
          created_at: string
          id: string
          updated_at: string
          uso_count: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          updated_at?: string
          uso_count?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          updated_at?: string
          uso_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
