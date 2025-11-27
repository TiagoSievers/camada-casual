/**
 * Tipos TypeScript baseados na estrutura do JSON de projetos
 * Análise realizada em: 2025-01-XX
 */

// ============================================
// TIPOS BASE
// ============================================

export type ProjectStatus = 'Ativo' | 'Pausado' | 'Inativo'
export type Nucleo = 'Interiores' | 'Exteriores' | 'Conceito' | 'Projetos'
export type FunnelType = 'open' | 'closed'
export type MetricType = 'created' | 'sent' | 'approved'
export type StatusType = 'inApproval' | 'approved' | 'rejected'
export type OrcamentoStatusFilter = 'Em Aprovação' | 'Enviado' | 'Aprovado' | 'Reprovado'

// ============================================
// ESTRUTURA DO PROJETO (JSON)
// ============================================

export interface Project {
  _id: string
  id: number
  titulo: string
  cliente: string
  status: ProjectStatus
  
  // Datas
  'Created Date': string // ISO 8601
  'Modified Date': string // ISO 8601
  'Created By': string
  ultima_atualizacao?: string // ISO 8601 (opcional)
  
  // Filtros
  nucleo_lista?: Nucleo[] // Array de núcleos
  loja?: string // ID da loja (opcional)
  arquiteto?: string // ID do arquiteto (opcional)
  
  // Vendedores e Gerenciadores
  vendedor_user?: string // ID do vendedor principal
  Gerenciador?: string // ID do gerenciador
  
  // Campos específicos por núcleo (Vendedor Principal)
  'user Interiores - Vendedor Principal'?: string
  'user Exteriores - Vendedor Principal'?: string
  'user Conceito - Vendedor Principal'?: string
  'user Projetos - Vendedor Principal'?: string
  'Interiores - Vendedor Principal'?: string
  'Exteriores - Vendedor Principal'?: string
  'Conceito - Vendedor Principal'?: string
  'Projetos - Vendedor Principal'?: string
  
  // Campos específicos por núcleo (Vendedor Parceiro)
  'user Interiores - Vendedor Parceiro'?: string
  'user Exteriores - Vendedor Parceiro'?: string
  'user Conceito - Vendedor Parceiro'?: string
  'Interiores - Vendedor Parceiro'?: string
  'Exteriores - Vendedor Parceiro'?: string
  'Conceito - Vendedor Parceiro'?: string
  
  // Orçamentos
  new_orcamentos?: string[] // Array de IDs de orçamentos
  
  // Campos adicionais
  escritorio?: string
  name_filter_key?: string
  arquivos_novo?: string[]
  list_notas?: string[]
}

// ============================================
// FILTROS
// ============================================

export interface DateRange {
  start: Date | string
  end: Date | string
}

export interface DashboardFilters {
  dateRange: DateRange
  nucleo?: Nucleo | null
  loja?: string | null
  vendedor?: string | null // ID consolidado de vendedor/gerenciador
  arquiteto?: string | null
  status?: OrcamentoStatusFilter | null // Status do orçamento (Em Aprovação, Enviado, Aprovado, Reprovado)
}

// ============================================
// OPÇÕES DE FILTROS (Para dropdowns)
// ============================================

export interface FilterOptions {
  nucleos: NucleoOption[]
  lojas: LojaOption[]
  vendedores: VendedorOption[]
  arquitetos: ArquitetoOption[]
}

export interface NucleoOption {
  id: Nucleo
  name: string
}

export interface LojaOption {
  id: string
  name: string
  nucleoId?: Nucleo
}

export interface VendedorOption {
  id: string
  name: string
  type: 'vendedor' | 'gerente'
  nucleo?: Nucleo[]
}

export interface ArquitetoOption {
  id: string
  name: string
}

// ============================================
// DADOS DO FUNIL
// ============================================

export interface MetricData {
  count: number
  percentage?: string
  label: string
  sublabel?: string
  labelPercentage?: string
  previousCount?: number
  delta?: number
  deltaPercentage?: number
}

export interface FunnelMetrics {
  created: MetricData
  sent: MetricData
  inApproval: MetricData
  approved: MetricData
  rejected: MetricData
}

export interface FunnelData extends FunnelMetrics {
  previousMonth?: FunnelMetrics
  deltas?: {
    [K in keyof FunnelMetrics]: {
      value: number
      percentage: number
    }
  }
}

// ============================================
// DADOS PARA GRÁFICOS
// ============================================

export interface DailyEvolutionData {
  date: string // Formato: "DD/MMM"
  value: number
  metric: MetricType
}

export interface StatusEvolutionData {
  date: string // Formato: "DD/MMM"
  value: number
  status: StatusType
}

// ============================================
// ESTADO DO DASHBOARD
// ============================================

export interface DashboardState {
  filters: DashboardFilters
  funnel: {
    type: FunnelType
    comparePrevious: boolean
    data: FunnelData | null
    loading: boolean
    error: string | null
  }
  charts: {
    dailyEvolution: {
      metric: MetricType
      data: DailyEvolutionData[]
      loading: boolean
    }
    statusEvolution: {
      status: StatusType
      data: StatusEvolutionData[]
      loading: boolean
    }
  }
}

// ============================================
// RESPOSTA DA API
// ============================================

export interface ProjectsResponse {
  response: {
    cursor: number
    results: Project[]
    count: number
    remaining: number
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Extrai todos os IDs de vendedores de um projeto
 * Consolida todos os campos de vendedor em uma lista única
 */
export function extractVendedorIds(project: Project): string[] {
  const ids: string[] = []
  
  // Vendedor principal e gerenciador
  if (project.vendedor_user) ids.push(project.vendedor_user)
  if (project.Gerenciador) ids.push(project.Gerenciador)
  
  // Vendedores por núcleo (Principal)
  const principalFields = [
    'user Interiores - Vendedor Principal',
    'user Exteriores - Vendedor Principal',
    'user Conceito - Vendedor Principal',
    'user Projetos - Vendedor Principal',
    'Interiores - Vendedor Principal',
    'Exteriores - Vendedor Principal',
    'Conceito - Vendedor Principal',
    'Projetos - Vendedor Principal',
  ] as const
  
  principalFields.forEach(field => {
    const value = project[field]
    if (value && !ids.includes(value)) {
      ids.push(value)
    }
  })
  
  // Vendedores por núcleo (Parceiro)
  const parceiroFields = [
    'user Interiores - Vendedor Parceiro',
    'user Exteriores - Vendedor Parceiro',
    'user Conceito - Vendedor Parceiro',
    'Interiores - Vendedor Parceiro',
    'Exteriores - Vendedor Parceiro',
    'Conceito - Vendedor Parceiro',
  ] as const
  
  parceiroFields.forEach(field => {
    const value = project[field]
    if (value && !ids.includes(value)) {
      ids.push(value)
    }
  })
  
  return ids
}

/**
 * Verifica se um projeto corresponde aos filtros aplicados
 */
export function matchesFilters(project: Project, filters: DashboardFilters): boolean {
  // Filtro de data (Created Date)
  if (filters.dateRange) {
    const createdDate = new Date(project['Created Date'])
    const startDate = new Date(filters.dateRange.start)
    const endDate = new Date(filters.dateRange.end)
    
    if (createdDate < startDate || createdDate > endDate) {
      return false
    }
  }
  
  // Filtro de núcleo
  if (filters.nucleo && project.nucleo_lista) {
    if (!project.nucleo_lista.includes(filters.nucleo)) {
      return false
    }
  }
  
  // Filtro de loja
  if (filters.loja && project.loja !== filters.loja) {
    return false
  }
  
  // Filtro de vendedor
  if (filters.vendedor) {
    const vendedorIds = extractVendedorIds(project)
    if (!vendedorIds.includes(filters.vendedor)) {
      return false
    }
  }
  
  // Filtro de arquiteto
  if (filters.arquiteto && project.arquiteto !== filters.arquiteto) {
    return false
  }

  // Filtro de status do orçamento
  // Ainda não implementado porque o tipo de filtro (OrcamentoStatusFilter)
  // não corresponde ao campo de status do projeto (ProjectStatus).
  // TODO: quando o campo de status de orçamento existir no Project,
  // aplicar o filtro aqui.
  // if (filters.status && project.status !== filters.status) {
  //   return false
  // }

  return true
}



