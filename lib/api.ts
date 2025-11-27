/**
 * Serviço de API para o Dashboard Casual CRM
 * Endpoint base: https://crm.casualmoveis.com.br/version-live/api/1.1/obj/projeto
 */

import type { Project, ProjectsResponse, DashboardFilters, FunnelType, OrcamentoStatusFilter } from '@/types/dashboard'

const API_BASE_URL = 'https://crm.casualmoveis.com.br/api/1.1'

// Flag global para desabilitar TODAS as chamadas de API deste módulo.
// Para voltar a chamar a API de verdade, deixe como `false`.
const API_DISABLED = false

function logApiDisabled(endpoint: string) {
  // Função mantida apenas por compatibilidade; não gera logs.
  void endpoint
}

/**
 * Limpa TODOS os caches do localStorage ao atualizar a página
 * Detecta refresh usando Performance Navigation API ou sessionStorage
 */
function clearAllCachesOnRefresh() {
  if (typeof window === 'undefined') return

  try {
    let shouldClear = false

    // Tentar detectar reload usando Performance Navigation API
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        // type pode ser: 'navigate', 'reload', 'back_forward', ou 'prerender'
        shouldClear = navigation.type === 'reload'
      }
    } catch (error) {
      // Fallback: usar sessionStorage para detectar primeira execução
      const cacheClearedKey = 'casual_crm_cache_cleared_flag'
      const wasCleared = sessionStorage.getItem(cacheClearedKey)
      
      // Se não foi limpo ainda, é primeira execução = refresh
      if (!wasCleared) {
        shouldClear = true
        sessionStorage.setItem(cacheClearedKey, 'true')
      }
    }

    // Se for reload OU primeira execução, limpar TODOS os caches
    if (shouldClear) {
      // Lista de prefixos de chaves de cache
      const cachePrefixes = [
        'casual_crm_projetos_cache_',
        'casual_crm_orcamentos_cache_',
        'casual_crm_vendedores_cache',
        'casual_crm_arquitetos_cache',
        'casual_crm_clientes_cache',
        'casual_crm_lojas_cache',
        'performance_cache_',
      ]

      // Coletar todas as chaves de cache para remover
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        // Verificar se é uma chave de cache
        const isCacheKey = cachePrefixes.some(prefix => key.startsWith(prefix))
        if (isCacheKey) {
          keysToRemove.push(key)
        }
      }

      // Remover todas as chaves de cache
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
    }
  } catch (error) {
    // Ignorar erros ao limpar cache
  }
}

/**
 * Limpa caches expirados (mais de 30 minutos) do localStorage
 * Executado periodicamente para manter o localStorage limpo
 */
function clearExpiredCaches() {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()
    const thirtyMinutesInMs = 1000 * 60 * 30

    // Lista de prefixos de chaves de cache
    const cachePrefixes = [
      'casual_crm_projetos_cache_',
      'casual_crm_orcamentos_cache_',
      'casual_crm_vendedores_cache',
      'casual_crm_arquitetos_cache',
      'casual_crm_clientes_cache',
      'casual_crm_lojas_cache',
      'performance_cache_',
    ]

    // Iterar sobre todas as chaves do localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (!key) continue

      // Verificar se é uma chave de cache
      const isCacheKey = cachePrefixes.some(prefix => key.startsWith(prefix))
      if (!isCacheKey) continue

      // Se for uma chave de timestamp, verificar se expirou
      if (key.endsWith('_timestamp')) {
        try {
          const timestamp = parseInt(localStorage.getItem(key) || '0', 10)
          const ageInMs = now - timestamp

          if (ageInMs > thirtyMinutesInMs) {
            // Cache expirado, remover chave de dados e timestamp
            const dataKey = key.replace('_timestamp', '')
            localStorage.removeItem(dataKey)
            localStorage.removeItem(key)
          }
        } catch (error) {
          // Se houver erro ao ler timestamp, remover a chave
          localStorage.removeItem(key)
        }
      }
    }
  } catch (error) {
    // Ignorar erros ao limpar cache
  }
}

// Limpar TODOS os caches ao carregar o módulo (quando a página carrega/atualiza)
if (typeof window !== 'undefined') {
  clearAllCachesOnRefresh()
  // Também limpar caches expirados periodicamente
  clearExpiredCaches()
}

/**
 * Interface para orçamento da API
 */
export interface Orcamento {
  _id: string
  status?: string
  'Created Date'?: string
  'Modified Date'?: string
  [key: string]: any
}

export interface OrcamentosResponse {
  response: {
    cursor: number
    results: Orcamento[]
    count: number
    remaining: number
  }
}

/**
 * Interface para item de orçamento da API
 * Endpoint: /obj/item_orcamento
 * Exemplo de payload: https://crm.casualmoveis.com.br/api/1.1/obj/item_orcamento
 */
export interface ItemOrcamento {
  _id: string
  orcamento?: string
  fornecedor?: string
  produto?: string
  quantidade?: number
  custo_total?: number
  preco_total?: number
  'Created Date'?: string
  'Modified Date'?: string
  [key: string]: any
}

export interface ItemOrcamentosResponse {
  response: {
    cursor: number
    results: ItemOrcamento[]
    count: number
    remaining: number
  }
}

/**
 * Interface para vendedor da API
 */
export interface Vendedor {
  _id: string
  nome?: string
  email?: string
  'status_do_vendedor'?: string
  'Created Date'?: string
  'Modified Date'?: string
  removido?: boolean
  [key: string]: any
}

export interface VendedoresResponse {
  response: {
    cursor: number
    results: Vendedor[]
    count: number
    remaining: number
  }
}

/**
 * Interface para arquiteto da API
 */
export interface Arquiteto {
  _id: string
  'Nome do Arquiteto'?: string
  'Email do Arquiteto'?: string
  'Status do Arquiteto'?: string
  'Created Date'?: string
  'Modified Date'?: string
  removido?: boolean
  [key: string]: any
}

export interface ArquitetosResponse {
  response: {
    cursor: number
    results: Arquiteto[]
    count: number
    remaining: number
  }
}

/**
 * Interface para cliente da API
 */
export interface Cliente {
  _id: string
  'Nome do Cliente'?: string
  'Email'?: string
  'CPF do Cliente'?: string
  'Telefone Principal'?: string
  'Telefone Secundário'?: string
  'Created Date'?: string
  'Modified Date'?: string
  projetos_count?: number
  [key: string]: any
}

export interface ClientesResponse {
  response: {
    cursor: number
    results: Cliente[]
    count: number
    remaining: number
  }
}

/**
 * Interface para loja da API
 */
export interface Loja {
  _id: string
  nome_da_loja?: string
  'ENDEREÇO - Logradouro'?: string
  'ENDEREÇO - Número'?: string
  'ENDEREÇO - Complemento'?: string
  'ENDEREÇO - Bairro'?: string
  'ENDEREÇO - Cidade'?: string
  'ENDEREÇO - UF'?: string
  'ENDEREÇO - CEP'?: string
  telefone_da_loja?: string
  'lista de_nucleos_da_loja'?: string[]
  'Created Date'?: string
  'Modified Date'?: string
  removido?: boolean
  [key: string]: any
}

export interface LojasResponse {
  response: {
    cursor: number
    results: Loja[]
    count: number
    remaining: number
  }
}

/**
 * Gera hash simples de uma string
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Gera chave de cache baseada em todos os filtros
 * Inclui: período, status, núcleo, loja, vendedor, arquiteto
 * Suporta períodos customizados do calendário
 */
function getCacheKeyForFilters(
  filters: Partial<DashboardFilters> | undefined,
  dataType: 'projetos' | 'orcamentos'
): string | null {
  if (!filters) {
    // Sem filtros, usar período padrão
    return `casual_crm_${dataType}_cache_${hashString('ultimos_7_dias')}`
  }

  // Verificar se é período customizado ou pré-definido
  const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) : 'Últimos 7 dias'
  
  // Criar objeto com todos os filtros para gerar hash
  const filterKey: any = {
    status: filters.status || null,
    nucleo: filters.nucleo || null,
    loja: filters.loja || null,
    vendedor: filters.vendedor || null,
    arquiteto: filters.arquiteto || null,
  }

  // Se for período customizado, usar as datas exatas
  if (!periodLabel && filters.dateRange) {
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    // Normalizar datas para garantir consistência (apenas data, sem hora)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    filterKey.periodo_customizado = {
      start: start.toISOString().split('T')[0], // Apenas a data (YYYY-MM-DD)
      end: end.toISOString().split('T')[0],
    }
  } else {
    // Período pré-definido
    filterKey.periodo = periodLabel || 'Últimos 7 dias'
  }

  // Gerar hash da combinação de filtros
  const filterString = JSON.stringify(filterKey)
  const hash = hashString(filterString)

  return `casual_crm_${dataType}_cache_${hash}`
}

/**
 * Gera chave de cache para orçamentos baseada nos filtros específicos
 * Inclui: período, status (array), removido
 * Suporta períodos customizados do calendário
 */
function getCacheKeyForOrcamentosFilters(filters?: {
  dateRange?: { start: Date | string; end: Date | string }
  status?: string[]
  removido?: boolean
}): string | null {
  if (!filters?.dateRange) {
    // Sem dateRange, não usar cache
    return null
  }

  // Verificar se é período customizado ou pré-definido
  const periodLabel = getDropdownPeriodLabelFromRange(filters.dateRange)
  
  // Criar objeto com todos os filtros para gerar hash
  const filterKey: any = {
    status: filters.status ? filters.status.sort().join(',') : null, // Ordenar para garantir consistência
    removido: filters.removido !== undefined ? filters.removido : null,
  }

  // Se for período customizado, usar as datas exatas
  if (!periodLabel) {
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    // Normalizar datas para garantir consistência (apenas data, sem hora)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    filterKey.periodo_customizado = {
      start: start.toISOString().split('T')[0], // Apenas a data (YYYY-MM-DD)
      end: end.toISOString().split('T')[0],
    }
  } else {
    // Período pré-definido
    filterKey.periodo = periodLabel
  }

  // Gerar hash da combinação de filtros
  const filterString = JSON.stringify(filterKey)
  const hash = hashString(filterString)

  return `casual_crm_orcamentos_cache_${hash}`
}

/**
 * Busca projetos da API aplicando o filtro de data via URL (sem filtro no front).
 *
 * Regra (Status de Projeto):
 * - Apenas uma chamada para `/obj/projeto`
 * - Filtro feito por `Created Date` usando `constraints` (greater than / less than)
 * - Cache no localStorage para períodos pré-definidos e customizados
 */
export async function fetchProjects(filters?: Partial<DashboardFilters>): Promise<Project[]> {
  // Verificar se deve usar cache (declarar antes do try para estar disponível no catch)
  const cacheKey = getCacheKeyForFilters(filters, 'projetos')
  const timestampKey = cacheKey ? `${cacheKey}_timestamp` : null

  try {
    // Tentar carregar do cache se não for período customizado
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(timestampKey)
        
        if (cachedData && cachedTimestamp) {
          const projects = JSON.parse(cachedData) as Project[]
          const timestamp = parseInt(cachedTimestamp, 10)
          const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
          
          // Cache válido por 30 minutos
          if (ageInMinutes < 30) {
            return projects
          }
        }
      } catch (error) {
        // Ignorar erros de leitura de cache
      }
    }

    const allProjects: Project[] = []

    // Definir período de data:
    // - Se vier `filters.dateRange`, usamos ele
    // - Caso contrário, período padrão = últimos 7 dias até agora
    let start: Date
    let end: Date

    if (filters?.dateRange) {
      start = new Date(filters.dateRange.start)
      end = new Date(filters.dateRange.end)
    } else {
      end = new Date()
      start = new Date()
      start.setDate(start.getDate() - 7)
    }

    // Garantir início/fim do dia
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    const baseConstraints = [
      {
        key: 'Created Date',
        constraint_type: 'greater than',
        value: start.toISOString(),
      },
      {
        key: 'Created Date',
        constraint_type: 'less than',
        value: end.toISOString(),
      },
    ]

    let cursor = 0
    let hasMore = true
    let pageNumber = 1

    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/projeto`)

      // Paginação Bubble: cursor + limit
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')

      // Constraints de data (copiados a cada página)
      url.searchParams.set('constraints', JSON.stringify(baseConstraints))
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar projetos: ${response.statusText}`)
    }
    
    const data: ProjectsResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining ?? 0

      allProjects.push(...results)

      hasMore = remaining > 0 && results.length > 0

      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }

    // Log da quantidade de projetos retornados
    console.log(`projeto api result total_projetos=${allProjects.length}`)

    // Salvar no cache se não for período customizado e se a chave ainda não existir
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache para esta combinação
        const existingCache = localStorage.getItem(cacheKey)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
          localStorage.setItem(cacheKey, JSON.stringify(allProjects))
          localStorage.setItem(timestampKey, Date.now().toString())
        }
  } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }

    return allProjects
  } catch (error) {
    console.error('❌ [API] Erro ao buscar projetos:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        if (cachedData) {
          return JSON.parse(cachedData) as Project[]
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }
    
    throw error
  }
}

/**
 * Filtra projetos localmente com base nos filtros fornecidos
 */
/**
 * Mapeia o filtro de status para os status reais dos orçamentos na API
 */
export function mapStatusFilterToOrcamentoStatuses(statusFilter: OrcamentoStatusFilter): string[] {
  switch (statusFilter) {
    case 'Em Aprovação':
      // Status que indicam que está em aprovação
      return ['em aprovação', 'aguardando aprovação', 'pendente aprovação']
    case 'Enviado':
      // Status que indicam que foi enviado ao cliente
      return ['enviado ao cliente', 'enviado']
    case 'Aprovado':
      // Status que indicam aprovação
      return ['aprovado pelo cliente', 'aprovado', 'liberado para pedido']
    case 'Reprovado':
      // Status que indicam reprovação
      return ['reprovado']
    default:
      return []
  }
}

/**
 * Verifica se um orçamento corresponde ao filtro de status
 */
export function orcamentoMatchesStatusFilter(orcamento: Orcamento, statusFilter: OrcamentoStatusFilter): boolean {
  const status = (orcamento.status || '').toLowerCase()
  const allowedStatuses = mapStatusFilterToOrcamentoStatuses(statusFilter)
  
  // Verificar se o status do orçamento corresponde a algum dos status permitidos
  return allowedStatuses.some(allowed => {
    const allowedLower = allowed.toLowerCase()
    // Verificar correspondência exata ou parcial
    return status === allowedLower || status.includes(allowedLower) || allowedLower.includes(status)
  })
}

/**
 * Verifica se um projeto tem pelo menos um orçamento com o status correspondente
 * Status do dropdown: Em Aprovação, Enviado, Aprovado, Reprovado
 */
export function projectMatchesStatusFilter(
  project: Project,
  orcamentosMap: Map<string, Orcamento>,
  statusFilter: OrcamentoStatusFilter
): boolean {
  if (!project.new_orcamentos || project.new_orcamentos.length === 0) {
    // Projeto sem orçamentos: não corresponde a nenhum status
    return false
  }
  
  // Verificar cada orçamento do projeto
  for (const orcamentoId of project.new_orcamentos) {
    const orcamento = orcamentosMap.get(orcamentoId)
    if (!orcamento) continue
    
    // Usar a função existente que verifica se o orçamento corresponde ao filtro
    if (orcamentoMatchesStatusFilter(orcamento, statusFilter)) {
      return true // Tem pelo menos um orçamento com o status correspondente
    }
  }
  
        return false
      }

/**
 * Filtra projetos baseado no status dos orçamentos
 * Busca os orçamentos dos projetos e aplica o filtro
 */
export async function filterProjectsByOrcamentoStatus(
  projects: Project[],
  statusFilter: OrcamentoStatusFilter
): Promise<Project[]> {
  if (!statusFilter) {
    return projects
  }

  // Coletar todos os IDs de orçamentos
  const orcamentoIdsSet = new Set<string>()
  projects.forEach(project => {
    if (project.new_orcamentos) {
      project.new_orcamentos.forEach(id => orcamentoIdsSet.add(id))
    }
  })

  if (orcamentoIdsSet.size === 0) {
    // Se não há orçamentos, não há como filtrar por status de orçamento
    return []
  }

  // Buscar orçamentos em lotes
  const orcamentosMap = new Map<string, Orcamento>()
  const orcamentoIdsArray = Array.from(orcamentoIdsSet)
  const batchSize = 50

  for (let i = 0; i < orcamentoIdsArray.length; i += batchSize) {
    const batch = orcamentoIdsArray.slice(i, i + batchSize)
    
    const constraints = [
      {
        key: '_id',
        constraint_type: 'in',
        value: batch,
      },
    ]

    const url = new URL(`${API_BASE_URL}/obj/orcamento`)
    url.searchParams.set('constraints', JSON.stringify(constraints))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data: OrcamentosResponse = await response.json()
      const results = data.response?.results || []
      
      results.forEach(orcamento => {
        if (orcamento.removido !== true) {
          orcamentosMap.set(orcamento._id, orcamento)
        }
      })
    }
  }

  // Filtrar projetos baseado no status dos orçamentos
  return projects.filter(project => 
    projectMatchesStatusFilter(project, orcamentosMap, statusFilter)
  )
}

/**
 * Mantido apenas por compatibilidade.
 * A regra agora é: todos os filtros são aplicados na API (constraints),
 * exceto o filtro de status dos orçamentos que é feito no frontend.
 */
export function filterProjects(projects: Project[], _filters: DashboardFilters): Project[] {
  return projects
}

/**
 * Extrai todos os IDs de vendedores de um projeto
 */
function extractVendedorIds(project: Project): string[] {
  const ids: string[] = []
  
  if (project.vendedor_user) ids.push(project.vendedor_user)
  if (project.Gerenciador) ids.push(project.Gerenciador)
  
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

// As APIs diretas de orçamentos foram desabilitadas. Mantemos as funções exportadas
// apenas para compatibilidade, retornando resultados vazios.
export async function fetchOrcamentos(orcamentoIds: string[]): Promise<Orcamento[]> {
  void orcamentoIds
    return []
  }

/**
 * Busca todos os orçamentos relacionados aos projetos fornecidos
 */
export async function fetchOrcamentosFromProjects(projects: Project[]): Promise<Map<string, Orcamento>> {
  void projects
  return new Map()
}

/**
 * Busca todos os orçamentos da API com filtros opcionais
 */
function getDropdownPeriodLabelFromRange(range?: { start: Date | string; end: Date | string }): string | null {
  if (!range) return 'Últimos 7 dias'

  const start = new Date(range.start)
  const end = new Date(range.end)
  const now = new Date()

  const normalizeDate = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  const startTime = normalizeDate(start)
  const endTime = normalizeDate(end)
  const nowTime = normalizeDate(now)

  // Últimos 7 dias
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)
  const last7DaysTime = normalizeDate(last7Days)
  if (startTime === last7DaysTime && endTime >= nowTime - 86400000) {
    return 'Últimos 7 dias'
  }

  // Este Mês
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthStartTime = normalizeDate(thisMonthStart)
  if (startTime === thisMonthStartTime && endTime >= nowTime - 86400000) {
    return 'Este Mês'
  }

  // Este Trimestre
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
  const thisQuarterStart = new Date(now.getFullYear(), quarterStartMonth, 1)
  const thisQuarterStartTime = normalizeDate(thisQuarterStart)
  if (startTime === thisQuarterStartTime && endTime >= nowTime - 86400000) {
    return 'Este Trimestre'
  }

  // Este Ano
  const thisYearStart = new Date(now.getFullYear(), 0, 1)
  const thisYearStartTime = normalizeDate(thisYearStart)
  if (startTime === thisYearStartTime && endTime >= nowTime - 86400000) {
    return 'Este Ano'
  }

  // Se não casar com nenhum preset do dropdown, não rotulamos
  return null
}

export async function fetchAllOrcamentos(filters?: {
  dateRange?: { start: Date | string; end: Date | string }
  status?: string[]
  removido?: boolean
}): Promise<Orcamento[]> {
  // Verificar se deve usar cache (declarar antes do try para estar disponível no catch)
  const cacheKey = getCacheKeyForOrcamentosFilters(filters)
  const timestampKey = cacheKey ? `${cacheKey}_timestamp` : null
  const periodLabel = filters?.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) : null

  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/orcamento')
      return []
    }

    // Tentar carregar do cache se não for período customizado
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(timestampKey)

        if (cachedData && cachedTimestamp) {
          const orcamentos = JSON.parse(cachedData) as Orcamento[]
          const timestamp = parseInt(cachedTimestamp, 10)
          const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)

          // Cache válido por 30 minutos
          if (ageInMinutes < 30) {
            // Aplicar filtros locais (removido, status) mesmo com cache
            let filteredOrcamentos = orcamentos

            if (filters?.removido !== undefined) {
              filteredOrcamentos = filteredOrcamentos.filter(orc => {
                const removido = orc.removido === true
                return filters.removido ? removido : !removido
              })
            } else {
              filteredOrcamentos = filteredOrcamentos.filter(orc => orc.removido !== true)
            }

            if (filters?.status && filters.status.length > 0) {
              filteredOrcamentos = filteredOrcamentos.filter(orc => {
                const status = String(orc.status || '').toLowerCase()
                return filters.status!.some((s: string) => status.includes(s.toLowerCase()))
              })
            }

            return filteredOrcamentos
          }
        }
      } catch (error) {
        // Ignorar erros de leitura de cache
      }
    }

    const allOrcamentos: Orcamento[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1

    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/orcamento`)

      // Paginação
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')

      // Quando vier dateRange (caso da Margem & Rentabilidade),
      // aplicamos o filtro direto na API usando Created Date.
      if (filters?.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)

        // início do dia
        start.setHours(0, 0, 0, 0)

        // limite superior exclusivo = dia seguinte às 00:00
        const endExclusive = new Date(end)
        endExclusive.setDate(endExclusive.getDate() + 1)
        endExclusive.setHours(0, 0, 0, 0)

        const constraints = [
          {
            key: 'Created Date',
            constraint_type: 'greater than',
            value: start.toISOString(),
          },
          {
            key: 'Created Date',
            constraint_type: 'less than',
            value: endExclusive.toISOString(),
          },
        ]

        url.searchParams.set('constraints', JSON.stringify(constraints))

        // Logs simples para inspeção:
        // 1) período aplicado
        if (periodLabel) {
          console.log(
            `orcamento dateRange periodo="${periodLabel}" start=${start.toISOString()} end=${end.toISOString()} (exclusiveEnd=${endExclusive.toISOString()})`,
          )
        } else {
          console.log(
            `orcamento dateRange start=${start.toISOString()} end=${end.toISOString()} (exclusiveEnd=${endExclusive.toISOString()})`,
          )
        }
        // 2) curl da chamada (apenas na primeira página)
        if (pageNumber === 1) {
          console.log(`curl -X GET '${url.toString()}' -H 'Content-Type: application/json'`)
        }
      }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar orçamentos: ${response.statusText}`)
    }
    
    const data: OrcamentosResponse = await response.json()

      // Log simples do resumo retornado pela API (count / remaining) - apenas na primeira página
      if (pageNumber === 1 && data && data.response) {
        console.log(
          `orcamento api result { "count": ${data.response.count ?? 0}, "remaining": ${data.response.remaining ?? 0} }`,
        )
      }

      const results = data.response.results || []
      const remaining = data.response.remaining ?? 0

      allOrcamentos.push(...results)

      hasMore = remaining > 0 && results.length > 0

      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }

    // Filtrar por removido (se pedido)
    let orcamentos = allOrcamentos
    if (filters?.removido !== undefined) {
      orcamentos = orcamentos.filter(orc => {
        const removido = orc.removido === true
        return filters.removido ? removido : !removido
      })
    } else {
      // Por padrão, excluir removidos
      orcamentos = orcamentos.filter(orc => orc.removido !== true)
    }
    
    // Filtrar por status (se pedido)
    if (filters?.status && filters.status.length > 0) {
      orcamentos = orcamentos.filter(orc => {
        const status = String(orc.status || '').toLowerCase()
        return filters.status!.some(s => status.includes(s.toLowerCase()))
      })
    }
    
    // Salvar no cache se não for período customizado e se a chave ainda não existir
    // Salvar os dados completos (antes dos filtros de removido/status) para reutilização
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache para esta combinação
        const existingCache = localStorage.getItem(cacheKey)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
          // Salvar todos os orçamentos (sem filtros de removido/status) para reutilização
          const orcamentosToCache = allOrcamentos.filter(orc => orc.removido !== true)
          localStorage.setItem(cacheKey, JSON.stringify(orcamentosToCache))
          localStorage.setItem(timestampKey, Date.now().toString())
        }
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }
    
    return orcamentos
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)

    // Em caso de erro, tentar usar cache se disponível
    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        if (cachedData) {
          const cachedOrcamentos = JSON.parse(cachedData) as Orcamento[]

          // Aplicar filtros locais
          let filtered = cachedOrcamentos
          if (filters?.removido !== undefined) {
            filtered = filtered.filter(orc => {
              const removido = orc.removido === true
              return filters.removido ? removido : !removido
            })
          }
          if (filters?.status && filters.status.length > 0) {
            filtered = filtered.filter(orc => {
              const status = String(orc.status || '').toLowerCase()
              return filters.status!.some(s => status.includes(s.toLowerCase()))
            })
          }

          return filtered
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }

    throw error
  }
}

/**
 * Busca itens de orçamento por lista de IDs usando constraints
 * Endpoint: /obj/item_orcamento
 * @param itemIds - Array de IDs dos itens de orçamento a buscar
 */
export async function fetchItemOrcamentosByIds(itemIds: string[]): Promise<ItemOrcamento[]> {
  if (API_DISABLED || itemIds.length === 0) {
    return []
  }

  try {
    const allItems: ItemOrcamento[] = []
    
    // Buscar em lotes de 50 IDs usando "in" constraint (muito mais rápido)
    const batchSize = 50
    
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize)
      
      const constraints = [
        {
          key: '_id',
          constraint_type: 'in',
          value: batch,
        },
      ]

      const url = new URL(`${API_BASE_URL}/obj/item_orcamento`)
      url.searchParams.set('constraints', JSON.stringify(constraints))

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Erro ao buscar itens de orçamento (lote ${Math.floor(i / batchSize) + 1}):`, response.statusText)
        continue
      }

      const data = await response.json()
      const results = data.response?.results || []
      allItems.push(...results)
    }

    return allItems
  } catch (error) {
    console.error('Erro ao buscar itens de orçamento:', error)
    return []
  }
}

/**
 * Busca todos os itens de orçamento da API com paginação
 * Endpoint: /obj/item_orcamento
 * @deprecated Use fetchItemOrcamentosByIds instead
 */
export async function fetchAllItemOrcamentos(): Promise<ItemOrcamento[]> {
  // API de itens de orçamento desabilitada; retornar lista vazia
  return []
}

/**
 * Busca vendedores da API com paginação automática e cache no localStorage
 * A API retorna 100 vendedores por vez, então fazemos múltiplas requisições até buscar todos
 * @param forceRefresh - Se true, ignora o cache e busca novamente da API
 */
export async function fetchVendedores(forceRefresh: boolean = false): Promise<Vendedor[]> {
  const STORAGE_KEY = 'casual_crm_vendedores_cache'
  const TIMESTAMP_KEY = 'casual_crm_vendedores_cache_timestamp'
  
  // Verificar cache se não for forçado a atualizar
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY)
      const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const vendedores = JSON.parse(cachedData) as Vendedor[]
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        
        // Cache válido por 30 minutos
        if (ageInMinutes < 30) {
        return vendedores
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de cache
    }
  }
  
  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/vendedor')
      return []
    }
    const allVendedores: Vendedor[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/vendedor`)
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar vendedores: ${response.statusText}`)
      }
      
      const data: VendedoresResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining || 0
      
      allVendedores.push(...results)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    // Salvar no localStorage apenas se não existir cache
    if (typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache
        const existingCache = localStorage.getItem(STORAGE_KEY)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allVendedores))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        }
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }
    
    return allVendedores
  } catch (error) {
    console.error('❌ [API] Erro ao buscar vendedores:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          return JSON.parse(cachedData) as Vendedor[]
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }
    
    throw error
  }
}

/**
 * Busca arquitetos da API com paginação automática e cache no localStorage
 * A API retorna 100 arquitetos por vez, então fazemos múltiplas requisições até buscar todos
 * @param forceRefresh - Se true, ignora o cache e busca novamente da API
 */
export async function fetchArquitetos(forceRefresh: boolean = false): Promise<Arquiteto[]> {
  const STORAGE_KEY = 'casual_crm_arquitetos_cache'
  const TIMESTAMP_KEY = 'casual_crm_arquitetos_cache_timestamp'
  
  // Verificar cache se não for forçado a atualizar
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY)
      const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const arquitetos = JSON.parse(cachedData) as Arquiteto[]
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        
        // Cache válido por 30 minutos
        if (ageInMinutes < 30) {
        return arquitetos
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de cache
    }
  }
  
  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/arquiteto')
      return []
    }
    const allArquitetos: Arquiteto[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/arquiteto`)
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar arquitetos: ${response.statusText}`)
      }
      
      const data: ArquitetosResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining || 0
      
      allArquitetos.push(...results)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    // Salvar no localStorage apenas se não existir cache
    if (typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache
        const existingCache = localStorage.getItem(STORAGE_KEY)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allArquitetos))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        }
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }
    
    return allArquitetos
  } catch (error) {
    console.error('❌ [API] Erro ao buscar arquitetos:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          return JSON.parse(cachedData) as Arquiteto[]
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }
    
    throw error
  }
}

/**
 * Busca clientes da API com paginação automática e cache no localStorage
 * A API retorna 100 clientes por vez, então fazemos múltiplas requisições até buscar todos
 * @param forceRefresh - Se true, ignora o cache e busca novamente da API
 */
export async function fetchClientes(forceRefresh: boolean = false): Promise<Cliente[]> {
  const STORAGE_KEY = 'casual_crm_clientes_cache'
  const TIMESTAMP_KEY = 'casual_crm_clientes_cache_timestamp'
  
  // Verificar cache se não for forçado a atualizar
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY)
      const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const clientes = JSON.parse(cachedData) as Cliente[]
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        
        // Cache válido por 30 minutos
        if (ageInMinutes < 30) {
        return clientes
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de cache
    }
  }
  
  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/cliente')
      return []
    }
    const allClientes: Cliente[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/cliente`)
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      // A API retorna 100 por padrão, mas vamos especificar explicitamente
      url.searchParams.set('limit', '100')
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar clientes: ${response.statusText}`)
      }
      
      const data: ClientesResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining || 0
      
      allClientes.push(...results)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        // Atualizar cursor para próxima página
        // O cursor deve ser o índice do próximo item a buscar
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allClientes))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }
    
    return allClientes
  } catch (error) {
    console.error('❌ [API] Erro ao buscar clientes:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          return JSON.parse(cachedData) as Cliente[]
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }
    
    throw error
  }
}

/**
 * Busca lojas da API com paginação e cache
 */
export async function fetchLojas(forceRefresh: boolean = false): Promise<Loja[]> {
  const STORAGE_KEY = 'casual_crm_lojas_cache'
  const TIMESTAMP_KEY = 'casual_crm_lojas_cache_timestamp'
  
  // Verificar cache se não for forçado a atualizar
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY)
      const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const lojas = JSON.parse(cachedData) as Loja[]
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        
        // Cache válido por 30 minutos
        if (ageInMinutes < 30) {
        return lojas
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de cache
    }
  }
  
  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/loja')
      return []
    }
    const allLojas: Loja[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/loja`)
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar lojas: ${response.statusText}`)
      }
      
      const data: LojasResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining || 0
      
      allLojas.push(...results)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    // Salvar no localStorage apenas se não existir cache
    if (typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache
        const existingCache = localStorage.getItem(STORAGE_KEY)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allLojas))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        }
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }
    
    return allLojas
  } catch (error) {
    console.error('❌ [API] Erro ao buscar lojas:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          return JSON.parse(cachedData) as Loja[]
        }
      } catch {
        // Ignorar erro ao ler cache
      }
    }
    
    throw error
  }
}

/**
 * Interface para métricas de margem
 */
export interface MarginMetrics {
  lucro: number
  receita: number
  margem: number
}

/**
 * Calcula métricas de margem a partir de um orçamento
 */
export function calculateOrcamentoMargin(
  orcamento: Orcamento,
  itensDoOrcamento: ItemOrcamento[] = []
): MarginMetrics {
  // Faturamento Líquido = Valor_final_produtos
  // Usamos fallbacks para evitar quebrar caso o campo tenha outro nome na API.
  const receita =
    Number(
      // Campo conforme documentação
      (orcamento as any)['Valor_final_produtos'] ??
        // Fallbacks para manter compatibilidade com versão anterior
        (orcamento as any).valor_final_produtos ??
        (orcamento as any).valor_final_total ??
        (orcamento as any).preco_total ??
        0
    ) || 0

  // Custo do Produto = somatório de custo_total dos itens de item_orcamento ligados a este orçamento
  const custoProdutos =
    itensDoOrcamento.reduce((sum, item) => {
      return sum + (Number(item.custo_total) || 0)
    }, 0) || 0

  // Rentabilidade = Faturamento Líquido - Custo do Produto
  const lucro = receita - custoProdutos
  
  // Margem = Rentabilidade / Faturamento Líquido
  const margem = receita > 0 ? (lucro / receita) * 100 : 0
  
  return { lucro, receita, margem }
}

/**
 * Agrupa orçamentos por núcleo através dos projetos
 */
export function groupOrcamentosByNucleo(
  orcamentos: Orcamento[],
  projectsMap: Map<string, Project>,
  itensPorOrcamento?: Map<string, ItemOrcamento[]>
): Map<string, MarginMetrics> {
  const nucleoMap = new Map<string, { lucro: number; receita: number }>()
  
  orcamentos.forEach(orcamento => {
    const projetoId = orcamento.projeto
    if (!projetoId) return
    
    const projeto = projectsMap.get(projetoId)
    if (!projeto || !projeto.nucleo_lista) return
    const itensDoOrcamento = itensPorOrcamento?.get(orcamento._id) ?? []
    const metrics = calculateOrcamentoMargin(orcamento, itensDoOrcamento)
    
    projeto.nucleo_lista.forEach(nucleo => {
      const existing = nucleoMap.get(nucleo) || { lucro: 0, receita: 0 }
      nucleoMap.set(nucleo, {
        lucro: existing.lucro + metrics.lucro,
        receita: existing.receita + metrics.receita,
      })
    })
  })
  
  // Calcular margem ponderada para cada núcleo
  const result = new Map<string, MarginMetrics>()
  nucleoMap.forEach((totals, nucleo) => {
    const margem = totals.receita > 0 ? (totals.lucro / totals.receita) * 100 : 0
    result.set(nucleo, {
      lucro: totals.lucro,
      receita: totals.receita,
      margem,
    })
  })
  
  return result
}

/**
 * Agrupa orçamentos por loja (marca)
 */
export function groupOrcamentosByLoja(
  orcamentos: Orcamento[],
  projectsMap: Map<string, Project>,
  lojasNamesMap?: Map<string, string>,
  itensPorOrcamento?: Map<string, ItemOrcamento[]>
): Map<string, MarginMetrics> {
  const lojaMap = new Map<string, { lucro: number; receita: number }>()
  
  orcamentos.forEach(orcamento => {
    // Primeiro tentar pegar a loja do orçamento
    let lojaId = orcamento.loja
    
    // Se não tiver no orçamento, pegar do projeto
    if (!lojaId) {
      const projetoId = orcamento.projeto
      if (projetoId) {
        const projeto = projectsMap.get(projetoId)
        if (projeto?.loja) {
          lojaId = projeto.loja
        }
      }
    }
    
    // Buscar o nome da loja se o mapa for fornecido
    let lojaName: string
    if (!lojaId) {
      lojaName = 'Sem Loja'
    } else if (lojasNamesMap && lojasNamesMap.has(lojaId)) {
      lojaName = lojasNamesMap.get(lojaId)!
    } else {
      lojaName = lojaId // Fallback para ID se nome não encontrado
    }
    const itensDoOrcamento = itensPorOrcamento?.get(orcamento._id) ?? []
    const metrics = calculateOrcamentoMargin(orcamento, itensDoOrcamento)
    const existing = lojaMap.get(lojaName) || { lucro: 0, receita: 0 }
    lojaMap.set(lojaName, {
      lucro: existing.lucro + metrics.lucro,
      receita: existing.receita + metrics.receita,
    })
  })
  
  // Calcular margem ponderada para cada loja
  const result = new Map<string, MarginMetrics>()
  lojaMap.forEach((totals, loja) => {
    const margem = totals.receita > 0 ? (totals.lucro / totals.receita) * 100 : 0
    result.set(loja, {
      lucro: totals.lucro,
      receita: totals.receita,
      margem,
    })
  })
  
  return result
}

/**
 * Calcula métricas de margem gerais a partir de orçamentos
 */
export function calculateMarginMetrics(
  orcamentos: Orcamento[],
  itensPorOrcamento?: Map<string, ItemOrcamento[]>
): MarginMetrics {
  let totalLucro = 0
  let totalReceita = 0
  
  orcamentos.forEach(orcamento => {
    const itensDoOrcamento = itensPorOrcamento?.get(orcamento._id) ?? []
    const metrics = calculateOrcamentoMargin(orcamento, itensDoOrcamento)
    totalLucro += metrics.lucro
    totalReceita += metrics.receita
  })
  
  const margem = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
  
  return { lucro: totalLucro, receita: totalReceita, margem }
}

/**
 * Calcula métricas do funil baseado nos projetos e orçamentos
 */
export async function calculateFunnelMetrics(
  projects: Project[],
  funnelType: FunnelType,
  comparePrevious?: boolean,
  dateRange?: { start: Date | string; end: Date | string },
  useOrcamentos: boolean = false // Novo parâmetro: se false, não busca orçamentos (Status de Projetos)
) {
  const createdCount = projects.length
  
  // Coletar todos os IDs de orçamentos dos projetos
  const orcamentoIdsSet = new Set<string>()
  projects.forEach(project => {
    if (project.new_orcamentos) {
      project.new_orcamentos.forEach(id => orcamentoIdsSet.add(id))
    }
  })
  
  // Buscar orçamentos conforme a página
  const orcamentosMap = new Map<string, Orcamento>()
  
  if (orcamentoIdsSet.size > 0) {
    if (useOrcamentos) {
      // Página Margem & Rentabilidade: buscar orçamentos com filtro de data
      const allOrcamentos = await fetchAllOrcamentos(
        dateRange
          ? {
              dateRange,
              removido: false,
            }
          : undefined,
      )
  
  // Filtrar apenas os orçamentos relacionados aos projetos
  allOrcamentos.forEach(orcamento => {
    if (orcamentoIdsSet.has(orcamento._id)) {
      orcamentosMap.set(orcamento._id, orcamento)
    }
  })
    } else {
      // Página Status de Projetos: buscar apenas os orçamentos dos projetos (sem filtro de data)
      // Buscar orçamentos por IDs usando constraint "in"
      const orcamentoIdsArray = Array.from(orcamentoIdsSet)
      const batchSize = 50
      
      // Log: quantos orçamentos serão buscados
      console.log(`orcamento buscando total_orcamento_ids=${orcamentoIdsArray.length} total_lotes=${Math.ceil(orcamentoIdsArray.length / batchSize)}`)
      
      for (let i = 0; i < orcamentoIdsArray.length; i += batchSize) {
        const batch = orcamentoIdsArray.slice(i, i + batchSize)
        const loteNum = Math.floor(i / batchSize) + 1
        const totalLotes = Math.ceil(orcamentoIdsArray.length / batchSize)
        
        // Log: início de cada lote
        console.log(`orcamento lote ${loteNum}/${totalLotes} buscando ${batch.length} IDs`)
        
        const constraints = [
          {
            key: '_id',
            constraint_type: 'in',
            value: batch,
          },
        ]

        const url = new URL(`${API_BASE_URL}/obj/orcamento`)
        url.searchParams.set('constraints', JSON.stringify(constraints))

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data: OrcamentosResponse = await response.json()
          const results = data.response?.results || []
          
          // Log: resultado de cada lote
          console.log(`orcamento lote ${loteNum}/${totalLotes} retornou ${results.length} orcamentos`)
          
          results.forEach(orcamento => {
            if (orcamento.removido !== true) {
              orcamentosMap.set(orcamento._id, orcamento)
            }
          })
        }
      }
      
      // Log: total de orçamentos encontrados
      console.log(`orcamento total_encontrados=${orcamentosMap.size}`)
    }
  }
  
  // Status que contam como "Enviado ao cliente"
  const sentStatuses = [
    'Enviado ao cliente',
    'Aprovado pelo cliente',
    'Reprovado',
    'Liberado para pedido',
  ]
  
  // Contar projetos com orçamentos enviados
  let sentCount = 0
  let inApprovalCount = 0
  let approvedCount = 0
  let rejectedCount = 0
  
  projects.forEach((project, projectIndex) => {
    if (!project.new_orcamentos || project.new_orcamentos.length === 0) {
      // Log: projeto sem orçamentos
      console.log(`projeto[${projectIndex}] id=${project._id} titulo="${project.titulo}" total_orcamentos=0`)
      return
    }
    
    // Coletar informações dos orçamentos deste projeto para o log
    const orcamentosInfo: Array<{ id: string; status: string }> = []
    
    // Verificar status dos orçamentos deste projeto
    let hasSent = false
    let hasInApproval = false
    let hasApproved = false
    let hasRejected = false
    
    project.new_orcamentos.forEach(orcamentoId => {
      const orcamento = orcamentosMap.get(orcamentoId)
      if (orcamento) {
        const status = orcamento.status ? String(orcamento.status) : 'sem status'
        orcamentosInfo.push({ id: orcamentoId, status })
        
        if (orcamento.status) {
          const statusLower = status.toLowerCase().trim()
        
        // Verificar se foi enviado (qualquer status que indique envio)
          const isSent = sentStatuses.some(s => statusLower.includes(s.toLowerCase())) ||
                        statusLower.includes('enviado') ||
                        statusLower.includes('aprovado') ||
                        statusLower.includes('reprovado') ||
                        statusLower.includes('liberado')
        
        if (isSent) {
          hasSent = true
        }
        
        // Verificar status específicos (mais específicos primeiro)
          if (statusLower.includes('reprovado')) {
          hasRejected = true
          } else if (statusLower.includes('aprovado pelo cliente') || 
                     statusLower.includes('aprovado') && !statusLower.includes('reprovado')) {
          hasApproved = true
          } else if (statusLower.includes('em aprovação') || 
                     (statusLower.includes('aprovação') && !statusLower.includes('aprovado') && !statusLower.includes('reprovado'))) {
          hasInApproval = true
        }
        }
      } else {
        // Orçamento não encontrado no mapa (pode ter sido removido ou não existe)
        orcamentosInfo.push({ id: orcamentoId, status: 'não encontrado' })
      }
    })
    
    // Log: projeto com seus orçamentos (ID e status)
    const orcamentosLog = orcamentosInfo.map(o => `{id=${o.id} status="${o.status}"}`).join(' ')
    console.log(`projeto[${projectIndex}] id=${project._id} titulo="${project.titulo}" total_orcamentos=${project.new_orcamentos.length} orcamentos=[${orcamentosLog}]`)
    
    // Contar por projeto (não por orçamento)
    if (hasSent) {
      sentCount++
    }
    if (hasInApproval) {
      inApprovalCount++
    }
    if (hasApproved) {
      approvedCount++
    }
    if (hasRejected) {
      rejectedCount++
    }
  })
  
  // Calcular percentuais
  const sentPercentage = createdCount > 0 
    ? ((sentCount / createdCount) * 100).toFixed(1) 
    : '0'
  
  const inApprovalPercentage = sentCount > 0 
    ? ((inApprovalCount / sentCount) * 100).toFixed(1) 
    : '0'
  
  const approvedPercentage = sentCount > 0 
    ? ((approvedCount / sentCount) * 100).toFixed(1) 
    : '0'
  
  const rejectedPercentage = sentCount > 0 
    ? ((rejectedCount / sentCount) * 100).toFixed(1) 
    : '0'
  
  // Log final: resumo de todos os dados processados
  console.log(`funnel_metrics processado total_projetos=${createdCount} projetos_enviados=${sentCount} em_aprovacao=${inApprovalCount} aprovados=${approvedCount} reprovados=${rejectedCount} total_orcamentos=${orcamentosMap.size}`)
  
  return {
    created: { 
      count: createdCount, 
      label: 'Projetos Criados', 
      sublabel: 'projetos' 
    },
    sent: { 
      count: sentCount, 
      label: 'Projetos Enviados', 
      sublabel: 'ao cliente', 
      percentage: `${sentPercentage}%`, 
      labelPercentage: 'Taxa envio' 
    },
    inApproval: { 
      count: inApprovalCount, 
      percentage: `${inApprovalPercentage}%`, 
      label: 'Em Aprovação', 
      sublabel: 'dos enviados' 
    },
    approved: { 
      count: approvedCount, 
      percentage: `${approvedPercentage}%`, 
      label: 'Aprovados', 
      sublabel: 'dos enviados' 
    },
    rejected: { 
      count: rejectedCount, 
      percentage: `${rejectedPercentage}%`, 
      label: 'Reprovados', 
      sublabel: 'dos enviados' 
    },
  }
}

