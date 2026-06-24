export type Database = {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      audits: {
        Row: {
          id: string
          location_id: string
          auditor_name: string
          /** Array of auditor names - supports multiple auditors per audit */
          auditor_names: string[] | null
          audit_date: string
          audit_quarter: string | null
          status: 'in_progress' | 'submitted'
          salon_score: number | null
          cocina_score: number | null
          calidad_score: number | null
          global_score: number | null
          global_label: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          auditor_name: string
          /** Array of auditor names - supports multiple auditors per audit */
          auditor_names?: string[] | null
          audit_date: string
          audit_quarter?: string | null
          status?: 'in_progress' | 'submitted'
          salon_score?: number | null
          cocina_score?: number | null
          calidad_score?: number | null
          global_score?: number | null
          global_label?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          auditor_name?: string
          /** Array of auditor names - supports multiple auditors per audit */
          auditor_names?: string[] | null
          audit_date?: string
          audit_quarter?: string | null
          status?: 'in_progress' | 'submitted'
          salon_score?: number | null
          cocina_score?: number | null
          calidad_score?: number | null
          global_score?: number | null
          global_label?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_responses: {
        Row: {
          id: string
          audit_id: string
          area_id: string
          area_label: string
          category_id: string
          category_label: string
          item_id: string
          item_label: string
          item_description: string | null
          rating_value: number | null
          rating_label: string | null
          observation: string | null
          photo_url: string | null
          /** Array of photo URLs - supports multiple photos per item */
          photo_urls: string[] | null
          custom_label: string | null
          text_value: string | null
          is_text_field: boolean
          is_custom_label: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          area_id: string
          area_label: string
          category_id: string
          category_label: string
          item_id: string
          item_label: string
          item_description?: string | null
          rating_value?: number | null
          rating_label?: string | null
          observation?: string | null
          photo_url?: string | null
          /** Array of photo URLs - supports multiple photos per item */
          photo_urls?: string[] | null
          custom_label?: string | null
          text_value?: string | null
          is_text_field?: boolean
          is_custom_label?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          area_id?: string
          area_label?: string
          category_id?: string
          category_label?: string
          item_id?: string
          item_label?: string
          item_description?: string | null
          rating_value?: number | null
          rating_label?: string | null
          observation?: string | null
          photo_url?: string | null
          /** Array of photo URLs - supports multiple photos per item */
          photo_urls?: string[] | null
          custom_label?: string | null
          text_value?: string | null
          is_text_field?: boolean
          is_custom_label?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_scores: {
        Row: {
          id: string
          audit_id: string
          score_type: string
          area_id: string | null
          category_id: string | null
          weight: number | null
          score_value: number
          score_label: string
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          score_type: string
          area_id?: string | null
          category_id?: string | null
          weight?: number | null
          score_value: number
          score_label: string
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          score_type?: string
          area_id?: string | null
          category_id?: string | null
          weight?: number | null
          score_value?: number
          score_label?: string
          created_at?: string
        }
      }
    }
  }
}

export type Location = Database['public']['Tables']['locations']['Row']
export type Audit = Database['public']['Tables']['audits']['Row']
export type AuditInsert = Database['public']['Tables']['audits']['Insert']
export type AuditResponse = Database['public']['Tables']['audit_responses']['Row']
export type AuditResponseInsert = Database['public']['Tables']['audit_responses']['Insert']
export type AuditScore = Database['public']['Tables']['audit_scores']['Row']
export type AuditScoreInsert = Database['public']['Tables']['audit_scores']['Insert']
