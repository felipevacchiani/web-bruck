// lib/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type FileCategory = 'financiero' | 'tributario' | 'laboral' | 'otro'

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
          category: FileCategory | null
          created_at: string
          updated_at: string
        }
        Insert: {
          client_id: string
          name: string
          description?: string | null
          storage_path: string
          file_size?: number | null
          category?: FileCategory | null
        }
        Update: {
          name?: string
          description?: string | null
          storage_path?: string
          file_size?: number | null
          category?: FileCategory | null
        }
      }
    }
  }
}

// Tipos de uso común
export type Profile = Database['public']['Tables']['profiles']['Row']
export type FileRecord = Database['public']['Tables']['files']['Row']
export type FileWithClient = FileRecord & { profiles: Profile }

export const FILE_CATEGORIES: { value: FileCategory; label: string; icon: string }[] = [
  { value: 'financiero', label: 'Informes Financieros', icon: '📊' },
  { value: 'tributario', label: 'Informes Tributarios', icon: '🧾' },
  { value: 'laboral', label: 'Informes Laborales', icon: '👥' },
  { value: 'otro', label: 'Otros', icon: '📁' },
]
