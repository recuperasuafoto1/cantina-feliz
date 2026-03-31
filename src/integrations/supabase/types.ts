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
      anotacoes_dia: {
        Row: {
          conteudo: string
          criado_em: string
          data: string
          funcionario_id: string | null
          id: string
        }
        Insert: {
          conteudo?: string
          criado_em?: string
          data?: string
          funcionario_id?: string | null
          id?: string
        }
        Update: {
          conteudo?: string
          criado_em?: string
          data?: string
          funcionario_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_dia_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      caixa: {
        Row: {
          data_abertura: string
          data_fechamento: string | null
          funcionario_id: string | null
          id: string
          status: string
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          data_abertura?: string
          data_fechamento?: string | null
          funcionario_id?: string | null
          id?: string
          status?: string
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          data_abertura?: string
          data_fechamento?: string | null
          funcionario_id?: string | null
          id?: string
          status?: string
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixa_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          css_personalizado: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          css_personalizado?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          css_personalizado?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      controle_numeros: {
        Row: {
          data_atual: string
          id: string
          loja_aberta: boolean
          ultimo_numero: number
        }
        Insert: {
          data_atual?: string
          id?: string
          loja_aberta?: boolean
          ultimo_numero?: number
        }
        Update: {
          data_atual?: string
          id?: string
          loja_aberta?: boolean
          ultimo_numero?: number
        }
        Relationships: []
      }
      criancas_clientes: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          nome_mae: string | null
          saldo_credito: number
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          nome_mae?: string | null
          saldo_credito?: number
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          nome_mae?: string | null
          saldo_credito?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      dividas: {
        Row: {
          criado_em: string
          crianca_id: string
          data_vencimento: string | null
          id: string
          pago: boolean
          valor: number
        }
        Insert: {
          criado_em?: string
          crianca_id: string
          data_vencimento?: string | null
          id?: string
          pago?: boolean
          valor: number
        }
        Update: {
          criado_em?: string
          crianca_id?: string
          data_vencimento?: string | null
          id?: string
          pago?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividas_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          data_cadastro: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          data_cadastro?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          data_cadastro?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade?: number
          subtotal: number
        }
        Update: {
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_credito: {
        Row: {
          crianca_id: string
          data: string | null
          descricao: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          crianca_id: string
          data?: string | null
          descricao?: string | null
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          crianca_id?: string
          data?: string | null
          descricao?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_credito_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          criado_em: string
          crianca_id: string | null
          crianca_nome: string | null
          finalizado_em: string | null
          forma_pagamento: string | null
          funcionario_id: string | null
          id: string
          numero_pedido: number
          status: string
          valor_total: number
        }
        Insert: {
          criado_em?: string
          crianca_id?: string | null
          crianca_nome?: string | null
          finalizado_em?: string | null
          forma_pagamento?: string | null
          funcionario_id?: string | null
          id?: string
          numero_pedido: number
          status?: string
          valor_total?: number
        }
        Update: {
          criado_em?: string
          crianca_id?: string | null
          crianca_nome?: string | null
          finalizado_em?: string | null
          forma_pagamento?: string | null
          funcionario_id?: string | null
          id?: string
          numero_pedido?: number
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string
          criado_em: string
          descricao: string | null
          eh_order_bump_para: string | null
          estoque_atual: number
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          tem_upsell_para: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          criado_em?: string
          descricao?: string | null
          eh_order_bump_para?: string | null
          estoque_atual?: number
          id?: string
          imagem_url?: string | null
          nome: string
          preco?: number
          tem_upsell_para?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          criado_em?: string
          descricao?: string | null
          eh_order_bump_para?: string | null
          estoque_atual?: number
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          tem_upsell_para?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_bump"
            columns: ["eh_order_bump_para"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_upsell"
            columns: ["tem_upsell_para"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_numero_pedido: { Args: never; Returns: number }
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
