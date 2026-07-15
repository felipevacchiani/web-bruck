export type UserRole = 'admin' | 'client' | 'super_admin'

// ── Multi-tenant (Fase 1, Paso 1) ─────────────────────────────────────────
// Por ahora solo existe una organización ('bruck'). companies, memberships
// y permissions se agregan en los siguientes pasos de la migración.

export interface Organization {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  organization_id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export type MembershipRole = 'cliente' | 'auditor'

export interface Membership {
  id: string
  user_id: string
  company_id: string
  role: MembershipRole
  permission_template_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// ── Permisos granulares (Fase 1, Paso 4 — catálogo, aún no aplicado) ──────

export type PermissionModule = 'archivos' | 'contabilidad'
export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar'

export interface PermissionTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface PermissionTemplateAction {
  id: string
  template_id: string
  module: PermissionModule
  action: PermissionAction
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company: string | null
  company_id: string | null
  organization_id: string | null
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
  company_id: string | null
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
  tags: string[]
  version: number
  is_current: boolean
  previous_version_id: string | null
  created_at: string
}

// ── Contabilidad Interna (CI) ─────────────────────────────────────────────

export type CICategoria = 'ingreso' | 'egreso' | 'neutro'
export type CITipo      = 'ingreso' | 'gasto'  | 'neutro'
export type CICuentaTipo = 'corriente' | 'ahorro' | 'caja_ahorro' | 'otro'
export type CIMovEstado  = 'pendiente' | 'conciliado' | 'revisado'
export type CIMovTipo    = 'ingreso' | 'gasto' | 'transferencia'

export interface CIRubro {
  id: string; client_id: string; company_id: string | null; nombre: string
  categoria: CICategoria; estado: string; created_at: string; updated_at: string
}
export interface CICuentaBancaria {
  id: string; client_id: string; company_id: string | null; nombre: string; banco: string | null
  numero_cuenta: string | null; tipo: CICuentaTipo
  saldo_inicial: number; estado: string; created_at: string; updated_at: string
}
export interface CICuentaContable {
  id: string; client_id: string; company_id: string | null; nombre: string; tipo: CITipo
  rubro_id: string | null; keywords: string; estado: string
  created_at: string; updated_at: string
}
export interface CIMovimiento {
  id: string; client_id: string; company_id: string | null; cuenta_bancaria_id: string | null
  fecha: string; descripcion: string; debito: number; credito: number
  mes: number | null; anio: number | null; estado: CIMovEstado
  tipo_movimiento: CIMovTipo; cuenta_contable_id: string | null
  rubro_id: string | null; clasificacion_origen: string
  hash_dedup: string | null; created_at: string; updated_at: string
}
export interface CIPresupuesto {
  id: string; client_id: string; company_id: string | null; rubro_id: string
  mes: number; anio: number; monto: number
  created_at: string; updated_at: string
}
export interface CIConciliacion {
  id: string; client_id: string; company_id: string | null; cuenta_bancaria_id: string | null
  mes: number; anio: number; saldo_apertura: number; saldo_cierre: number
  estado: string; fecha_cierre: string | null; observaciones: string | null
  created_at: string; updated_at: string
}

export const CI_CATEGORIAS: { value: CICategoria; label: string; color: string }[] = [
  { value: 'ingreso', label: 'Ingreso', color: '#34d399' },
  { value: 'egreso',  label: 'Egreso',  color: '#f87171' },
  { value: 'neutro',  label: 'Neutro',  color: '#71717a' },
]
export type CIConciliacionEstado = 'abierto' | 'cerrado'

export const CI_CONCILIACION_ESTADOS: { value: CIConciliacionEstado; label: string; color: string; bg: string; border: string }[] = [
  { value: 'abierto', label: 'Abierto', color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
  { value: 'cerrado', label: 'Cerrado', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
]

export const CI_MOV_ESTADOS: { value: CIMovEstado; label: string; color: string; bg: string; border: string }[] = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
  { value: 'conciliado',  label: 'Conciliado',  color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  { value: 'revisado',    label: 'Revisado',    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
]

// ── Auditoría ─────────────────────────────────────────────────────────────

export type AuditAction =
  | 'file_upload'
  | 'file_delete'
  | 'file_status_change'
  | 'file_update'
  | 'client_create'
  | 'client_update'
  | 'client_delete'

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: AuditAction
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  file_upload:        'Subida de archivo',
  file_delete:        'Eliminación de archivo',
  file_status_change: 'Cambio de estado',
  file_update:        'Edición de archivo',
  client_create:      'Creación de cliente',
  client_update:      'Edición de cliente',
  client_delete:      'Eliminación de cliente',
}

export type Database = {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      companies: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> }
      memberships: { Row: Membership; Insert: Partial<Membership>; Update: Partial<Membership> }
      permission_templates: { Row: PermissionTemplate; Insert: Partial<PermissionTemplate>; Update: Partial<PermissionTemplate> }
      permission_template_actions: { Row: PermissionTemplateAction; Insert: Partial<PermissionTemplateAction>; Update: Partial<PermissionTemplateAction> }
      profiles:   { Row: Profile;    Insert: Partial<Profile>;    Update: Partial<Profile>    }
      files:      { Row: FileRecord; Insert: Partial<FileRecord>; Update: Partial<FileRecord> }
      audit_logs: { Row: AuditLog;   Insert: Partial<AuditLog>;  Update: Partial<AuditLog>  }
    }
  }
}
