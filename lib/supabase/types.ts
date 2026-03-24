// lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'client'
          full_name: string | null
          company: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'client'
          full_name?: string | null
          company?: string | null
          active?: boolean
        }
        Update: {
          email?: string
          role?: 'admin' | 'client'
          full_name?: string | null
          company?: string | null
          active?: boolean
        }
      }
      files: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          storage_path: string
          file_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          client_id: string
          name: string
          description?: string | null
          storage_path: string
          file_size?: number | null
        }
        Update: {
          name?: string
          description?: string | null
          storage_path?: string
          file_size?: number | null
        }
      }
    }
  }
}

// Tipos de uso común
export type Profile = Database['public']['Tables']['profiles']['Row']
export type FileRecord = Database['public']['Tables']['files']['Row']
export type FileWithClient = FileRecord & { profiles: Profile }
