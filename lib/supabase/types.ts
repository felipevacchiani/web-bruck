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
export type FileCategory   = 'impuestos' | 'financiero' | 'legal' | 'laboral' | 'otro'
export type DocStatus      = 'pendiente' | 'visto' | 'aprobado'

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

export const DOC_STATUSES: { value: DocStatus; label: string; color: string; bg: string; border: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
  { value: 'visto',     label: 'Visto',     color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  { value: 'aprobado',  label: 'Aprobado',  color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
]

export const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export const FISCAL_YEARS: number[] = (() => {
  const y = new Date().getFullYear()
  return [y+1, y, y-1, y-2, y-3]
})()

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
  fiscal_month: number | null
  fiscal_year: number | null
  doc_status: DocStatus
  due_date: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      files:    { Row: FileRecord; Insert: Partial<FileRecord>; Update: Partial<FileRecord> }
    }
  }
}
