export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company: string | null
  role: UserRole
  active: boolean
  created_at: string
}

export type TaxSubcategory = 'iva' | 'ganancias' | 'iibb_sicreb' | '931_sindicatos'

export type FileCategory = 'impuestos' | 'financiero' | 'legal' | 'laboral' | 'otro'

export const TAX_SUBCATEGORIES: { value: TaxSubcategory; label: string; icon: string }[] = [
  { value: 'iva',            label: 'IVA (Impuesto al Valor Agregado)', icon: '🧾' },
  { value: 'ganancias',      label: 'Impuesto a las Ganancias',         icon: '📊' },
  { value: 'iibb_sicreb',    label: 'IIBB / SICREB',                    icon: '🗂️' },
  { value: '931_sindicatos', label: '931 + Sindicatos',                 icon: '👷' },
]

export const FILE_CATEGORIES: { value: FileCategory; label: string; icon: string }[] = [
  { value: 'impuestos',  label: 'Impuestos',  icon: '🧾' },
  { value: 'financiero', label: 'Financiero', icon: '💰' },
  { value: 'legal',      label: 'Legal',      icon: '⚖️' },
  { value: 'laboral',    label: 'Laboral',    icon: '👷' },
  { value: 'otro',       label: 'Otro',       icon: '📄' },
]

export interface FileRecord {
  id: string
  client_id: string
  name: string
  description: string | null
  category: FileCategory
  tax_subcategory: TaxSubcategory | null
  storage_path: string
  mime_type: string | null
  file_size: number | null
  file_group_id: string | null
  group_title: string | null
  document_label: string | null
  created_at: string
}

// Para compatibilidad con Supabase typed client
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      files: { Row: FileRecord; Insert: Partial<FileRecord>; Update: Partial<FileRecord> }
    }
  }
}
