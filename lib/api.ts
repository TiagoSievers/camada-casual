/**
 * Serviço de API para o Dashboard Casual CRM
 * Endpoint base: https://crm.casualmoveis.com.br/version-live/api/1.1/obj/projeto
 */

import type { Project, ProjectsResponse, DashboardFilters, FunnelType, OrcamentoStatusFilter, Nucleo } from '@/types/dashboard'

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
      'funnel_cache_',
      'funnel_cache_',
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
  projeto?: string // ID do projeto relacionado
  loja?: string // ID da loja (pode vir do orçamento ou do projeto)
  'Created Date'?: string
  'Modified Date'?: string
  removido?: boolean
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
export function hashString(str: string): string {
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
 * Para projetos: inclui período, núcleo, loja, vendedor, arquiteto (status é aplicado depois na ETAPA 2)
 * Para orçamentos: inclui período, status, removido
 * Para orcamentos_e_projetos: inclui todos os filtros (data, status, núcleo, loja, vendedor, arquiteto)
 * Suporta períodos customizados do calendário
 */
function getCacheKeyForFilters(
  filters: Partial<DashboardFilters> | undefined,
  dataType: 'projetos' | 'orcamentos' | 'orcamentos_e_projetos'
): string | null {
  if (!filters) {
    // Sem filtros, usar período padrão
    return `casual_crm_${dataType}_cache_${hashString('ultimos_7_dias')}`
  }

  // Criar objeto com todos os filtros para gerar hash
  // Sempre usar datas customizadas (não há mais períodos pré-definidos)
  const filterKey: any = {
    nucleo: filters.nucleo || null,
    loja: filters.loja || null,
    vendedor: filters.vendedor || null,
    arquiteto: filters.arquiteto || null,
  }

  // Para orçamentos e orcamentos_e_projetos, incluir status
  if (dataType === 'orcamentos' || dataType === 'orcamentos_e_projetos') {
    filterKey.status = filters.status || null
  }
  // Para projetos, NÃO incluímos status aqui porque ele é aplicado depois na ETAPA 2

  // Sempre usar as datas exatas (período customizado)
  if (filters.dateRange) {
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
    // Fallback: se não houver dateRange, usar últimos 7 dias
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
    filterKey.periodo_customizado = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  // Gerar hash da combinação de filtros
  const filterString = JSON.stringify(filterKey)
  const hash = hashString(filterString)

  // Para orcamentos_e_projetos, usar prefixo específico
  const cachePrefix = dataType === 'orcamentos_e_projetos' ? 'orcamentos_e_projetos' : dataType
  return `casual_crm_${cachePrefix}_cache_${hash}`
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

  // Criar objeto com todos os filtros para gerar hash
  const filterKey: any = {
    status: filters.status ? filters.status.sort().join(',') : null, // Ordenar para garantir consistência
    removido: filters.removido !== undefined ? filters.removido : null,
  }

  // Sempre usar as datas exatas (período customizado)
  const start = new Date(filters.dateRange.start)
  const end = new Date(filters.dateRange.end)
  // Normalizar datas para garantir consistência (apenas data, sem hora)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  filterKey.periodo_customizado = {
    start: start.toISOString().split('T')[0], // Apenas a data (YYYY-MM-DD)
    end: end.toISOString().split('T')[0],
  }

  // Gerar hash da combinação de filtros
  const filterString = JSON.stringify(filterKey)
  const hash = hashString(filterString)

  return `casual_crm_orcamentos_cache_${hash}`
}

/**
 * NOVA ABORDAGEM: Busca orçamentos primeiro, depois projetos relacionados
 * 
 * Fluxo:
 * 1. Busca orçamentos com filtros de data e status
 * 2. Coleta IDs únicos de projetos dos orçamentos
 * 3. Busca projetos por IDs
 * 4. Filtra projetos por núcleo, loja, vendedor, arquiteto
 * 5. Filtra orçamentos para manter apenas os que pertencem aos projetos filtrados
 */
export async function fetchOrcamentosAndProjects(filters?: Partial<DashboardFilters>): Promise<{
  orcamentos: Orcamento[]
  projects: Project[]
}> {
  // Gerar chave de cache baseada em todos os filtros
  const cacheKey = getCacheKeyForFilters(filters, 'orcamentos_e_projetos')
  const timestampKey = cacheKey ? `${cacheKey}_timestamp` : null

  try {
    // Verificar cache primeiro
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(timestampKey)
        
        if (cachedData && cachedTimestamp) {
          const cached = JSON.parse(cachedData) as { orcamentos: Orcamento[]; projects: Project[] }
          const timestamp = parseInt(cachedTimestamp, 10)
          const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
          
          if (ageInMinutes < 30) {
            console.log(`[ETAPA 1] (CACHE) orcamentos e projetos carregados do cache: ${cached.orcamentos.length} orcamentos, ${cached.projects.length} projetos key=${cacheKey} age=${ageInMinutes.toFixed(1)}min`)
            return cached
          } else {
            console.log(`[ETAPA 1] Cache expirado (${ageInMinutes.toFixed(1)}min > 30min) - buscando da API key=${cacheKey}`)
          }
        } else {
          console.log(`[ETAPA 1] Cache não encontrado - buscando da API key=${cacheKey}`)
        }
      } catch (error) {
        console.log(`[ETAPA 1] Erro ao ler cache - buscando da API key=${cacheKey} error=${error}`)
      }
    }

    // ETAPA 1: Buscar orçamentos com filtros de data e status
    console.log(`[ETAPA 1] Buscando orçamentos da API com filtros...`)
    
    const orcamentosFilters: {
      dateRange?: { start: Date | string; end: Date | string }
      status?: string[]
      removido?: boolean
    } = {
      removido: false,
    }

    if (filters?.dateRange) {
      orcamentosFilters.dateRange = filters.dateRange
    }

    // Converter filtro de status para array se existir
    if (filters?.status) {
      const statusMap: Record<OrcamentoStatusFilter, string[]> = {
        'Em Aprovação': ['em aprovação', 'aprovação', 'pendente aprovação'],
        'Enviado': ['enviado'],
        'Aprovado': ['aprovado pelo cliente', 'aprovado (master)'],
        'Reprovado': ['reprovado'],
        'Liberado para pedido': ['liberado para pedido', 'liberado'],
      }
      orcamentosFilters.status = statusMap[filters.status] || []
    }

    const allOrcamentos = await fetchAllOrcamentos(orcamentosFilters)
    console.log(`[ETAPA 1] Orçamentos encontrados: ${allOrcamentos.length}`)

    // ETAPA 2: Coletar IDs únicos de projetos dos orçamentos
    const projetoIdsSet = new Set<string>()
    allOrcamentos.forEach(orcamento => {
      if (orcamento.projeto) {
        projetoIdsSet.add(orcamento.projeto)
      }
    })
    console.log(`[ETAPA 2] IDs únicos de projetos coletados: ${projetoIdsSet.size}`)

    // ETAPA 3: Buscar projetos por IDs
    const projetoIdsArray = Array.from(projetoIdsSet)
    const projectsMap = new Map<string, Project>()
    
    if (projetoIdsArray.length > 0) {
      const batchSize = 50
      
      for (let i = 0; i < projetoIdsArray.length; i += batchSize) {
        const batch = projetoIdsArray.slice(i, i + batchSize)
        
        const constraints = [
          {
            key: '_id',
            constraint_type: 'in',
            value: batch,
          },
        ]

        const url = new URL(`${API_BASE_URL}/obj/projeto`)
        url.searchParams.set('constraints', JSON.stringify(constraints))

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data: ProjectsResponse = await response.json()
          const results = data.response?.results || []
          
          results.forEach(project => {
            projectsMap.set(project._id, project)
          })
        }
      }
    }
    console.log(`[ETAPA 3] Projetos encontrados: ${projectsMap.size}`)

    // ETAPA 4: Filtrar projetos por núcleo, loja, vendedor, arquiteto
    let filteredProjects = Array.from(projectsMap.values())

    if (filters?.nucleo) {
      filteredProjects = filteredProjects.filter(p => 
        p.nucleo_lista && p.nucleo_lista.includes(filters.nucleo!)
      )
    }

    if (filters?.loja) {
      filteredProjects = filteredProjects.filter(p => p.loja === filters.loja)
    }

    if (filters?.vendedor) {
      filteredProjects = filteredProjects.filter(p => {
        const vendedorIds = extractVendedorIds(p)
        return vendedorIds.includes(filters.vendedor!)
      })
    }

    if (filters?.arquiteto) {
      filteredProjects = filteredProjects.filter(p => p.arquiteto === filters.arquiteto)
    }

    const filteredProjetoIds = new Set(filteredProjects.map(p => p._id))
    console.log(`[ETAPA 4] Projetos após filtros: ${filteredProjects.length}`)

    // ETAPA 5: Filtrar orçamentos para manter apenas os que pertencem aos projetos filtrados
    const filteredOrcamentos = allOrcamentos.filter(orc => 
      orc.projeto && filteredProjetoIds.has(orc.projeto)
    )
    console.log(`[ETAPA 5] Orçamentos filtrados: ${filteredOrcamentos.length}`)

    const result = {
      orcamentos: filteredOrcamentos,
      projects: filteredProjects,
    }

    // Salvar no cache
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result))
        localStorage.setItem(timestampKey, Date.now().toString())
        console.log(`[ETAPA 1] Cache salvo key=${cacheKey} orcamentos=${filteredOrcamentos.length} projetos=${filteredProjects.length}`)
      } catch (error) {
        console.log(`[ETAPA 1] Erro ao salvar cache key=${cacheKey} error=${error}`)
      }
    }

    return result
  } catch (error) {
    console.error('Erro ao buscar orçamentos e projetos:', error)
    throw error
  }
}

/**
 * Busca projetos da API aplicando o filtro de data via URL (sem filtro no front).
 *
 * Regra (Status de Projeto):
 * - Apenas uma chamada para `/obj/projeto`
 * - Filtro feito por `Created Date` usando `constraints` (greater than / less than)
 * - Cache no localStorage para períodos pré-definidos e customizados
 * 
 * @deprecated Use fetchOrcamentosAndProjects instead
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
            console.log(`[ETAPA 1] (CACHE) projeto api result total_projetos=${projects.length} key=${cacheKey} age=${ageInMinutes.toFixed(1)}min`)
            return projects
          } else {
            console.log(`[ETAPA 1] Cache expirado (${ageInMinutes.toFixed(1)}min > 30min) - buscando da API key=${cacheKey}`)
          }
        } else {
          console.log(`[ETAPA 1] Cache não encontrado - buscando da API key=${cacheKey}`)
        }
      } catch (error) {
        console.log(`[ETAPA 1] Erro ao ler cache - buscando da API key=${cacheKey} error=${error}`)
        // Ignorar erros de leitura de cache
      }
    } else {
      console.log(`[ETAPA 1] Cache desabilitado (cacheKey=${cacheKey ? 'ok' : 'null'}, window=${typeof window !== 'undefined'}) - buscando da API`)
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

    const baseConstraints: any[] = [
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

    // Adicionar filtro de núcleo se houver
    if (filters?.nucleo) {
      baseConstraints.push({
        key: 'nucleo_lista',
        constraint_type: 'contains',
        value: filters.nucleo,
      })
    }

    // Adicionar filtro de loja se houver
    if (filters?.loja) {
      baseConstraints.push({
        key: 'loja',
        constraint_type: 'equals',
        value: filters.loja,
      })
    }

    // Adicionar filtro de vendedor se houver
    // Nota: vendedor pode estar em vários campos, então aplicamos no frontend
    // Mas podemos tentar filtrar pelo campo principal se existir
    if (filters?.vendedor) {
      // Vendedor pode estar em diferentes campos dependendo do núcleo
      // Por enquanto, vamos aplicar no frontend, mas podemos adicionar aqui se necessário
    }

    // Adicionar filtro de arquiteto se houver
    if (filters?.arquiteto) {
      baseConstraints.push({
        key: 'arquiteto',
        constraint_type: 'equals',
        value: filters.arquiteto,
      })
    }

    // Log: informações dos filtros aplicados
    console.log(`[ETAPA 1] Chamada API - Filtros aplicados:`, {
      periodo: filters?.dateRange ? `${start.toISOString().split('T')[0]} a ${end.toISOString().split('T')[0]}` : 'Últimos 7 dias',
      nucleo: filters?.nucleo || 'Todos',
      loja: filters?.loja || 'Todas',
      vendedor: filters?.vendedor || 'Todos',
      arquiteto: filters?.arquiteto || 'Todos',
      status: filters?.status || 'Todos (aplicado depois na ETAPA 2)',
    })

    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    let totalPages = 0

    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/projeto`)

      // Paginação Bubble: cursor + limit
      if (cursor > 0) {
        url.searchParams.set('cursor', cursor.toString())
      }
      url.searchParams.set('limit', '100')

      // Constraints de data (copiados a cada página)
      url.searchParams.set('constraints', JSON.stringify(baseConstraints))
      
      // Log: URL e query completa da chamada API
      console.log(`[ETAPA 1] API Request - Página ${pageNumber}:`, {
        url: url.toString(),
        method: 'GET',
        constraints: baseConstraints,
        cursor: cursor || 0,
        limit: 100,
      })
    
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

      // Log: resultado da API
      console.log(`[ETAPA 1] API Response - Página ${pageNumber}:`, {
        projetos_retornados: results.length,
        projetos_restantes: remaining,
        cursor_atual: data.response.cursor,
        total_projetos_acumulados: allProjects.length + results.length,
      })

      allProjects.push(...results)
      totalPages = pageNumber

      hasMore = remaining > 0 && results.length > 0

      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }

    // Log: resumo final da chamada API
    console.log(`[ETAPA 1] API Resumo Final:`, {
      total_paginas: totalPages,
      total_projetos: allProjects.length,
      periodo: `${start.toISOString().split('T')[0]} a ${end.toISOString().split('T')[0]}`,
      filtros: {
        nucleo: filters?.nucleo || 'Todos',
        loja: filters?.loja || 'Todas',
        vendedor: filters?.vendedor || 'Todos',
        arquiteto: filters?.arquiteto || 'Todos',
      },
    })

    // ETAPA 1: Buscar projetos da API com os parâmetros de acordo com o período selecionado
    console.log(`[ETAPA 1] projeto api result total_projetos=${allProjects.length}`)

    // Salvar no cache se não for período customizado e se a chave ainda não existir
    if (cacheKey && timestampKey && typeof window !== 'undefined') {
      try {
        // Verificar se já existe cache para esta combinação
        const existingCache = localStorage.getItem(cacheKey)
        if (!existingCache) {
          // Só salvar se não existir (não sobrescrever)
          localStorage.setItem(cacheKey, JSON.stringify(allProjects))
          localStorage.setItem(timestampKey, Date.now().toString())
          console.log(`[ETAPA 1] Cache salvo key=${cacheKey} total_projetos=${allProjects.length}`)
        } else {
          console.log(`[ETAPA 1] Cache já existe - não sobrescrevendo key=${cacheKey}`)
        }
  } catch (error) {
        console.log(`[ETAPA 1] Erro ao salvar cache key=${cacheKey} error=${error}`)
        // Ignorar erros ao salvar cache
      }
    }

    return allProjects
  } catch (error) {
    // console.error('❌ [API] Erro ao buscar projetos:', error)
    
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
    // ETAPA 2: pulada porque não há filtro de status
    console.log('[ETAPA 2] Nenhum filtro de status aplicado (status=Todos) - etapa ignorada')
    return projects
  }

  // Gerar chave de cache baseada nos IDs dos projetos + status
  // Isso permite reutilizar o resultado filtrado se os mesmos projetos forem filtrados novamente
  const projectIds = projects.map(p => p._id).sort().join(',')
  const cacheKey = `filtered_projetos_${hashString(`${projectIds}_${statusFilter}`)}`
  const timestampKey = `${cacheKey}_timestamp`

  // Verificar cache (válido por 30 minutos)
  if (typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(cacheKey)
      const cachedTimestamp = localStorage.getItem(timestampKey)
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        
        if (ageInMinutes < 30) {
          const filtered = JSON.parse(cachedData) as Project[]
          console.log(`[ETAPA 2] (CACHE) Projetos filtrados por status carregados do cache: ${filtered.length} de ${projects.length} status=${statusFilter} key=${cacheKey} age=${ageInMinutes.toFixed(1)}min`)
          return filtered
        } else {
          console.log(`[ETAPA 2] Cache expirado (${ageInMinutes.toFixed(1)}min > 30min) - buscando da API status=${statusFilter} key=${cacheKey}`)
        }
      } else {
        console.log(`[ETAPA 2] Cache não encontrado - buscando da API status=${statusFilter} key=${cacheKey}`)
      }
    } catch (error) {
      console.log(`[ETAPA 2] Erro ao ler cache - buscando da API status=${statusFilter} error=${error}`)
    }
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

  // ETAPA 2: Buscar os orçamentos destes projetos para filtrar por status
  console.log(`[ETAPA 2] Filtrando projetos por status de orçamento: ${statusFilter}, total_orcamento_ids=${orcamentoIdsSet.size}`)

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
  const filtered = projects.filter(project => 
    projectMatchesStatusFilter(project, orcamentosMap, statusFilter)
  )
  
  console.log(`[ETAPA 2] Orçamentos encontrados: ${orcamentosMap.size}, projetos filtrados: ${filtered.length} de ${projects.length}`)
  
  // Salvar resultado filtrado no cache
  if (typeof window !== 'undefined' && cacheKey && timestampKey) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(filtered))
      localStorage.setItem(timestampKey, Date.now().toString())
      console.log(`[ETAPA 2] Cache salvo key=${cacheKey} projetos_filtrados=${filtered.length} de ${projects.length} status=${statusFilter}`)
    } catch (error) {
      console.log(`[ETAPA 2] Erro ao salvar cache key=${cacheKey} error=${error}`)
    }
  }
  
  return filtered
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
/**
 * @deprecated Não há mais períodos pré-definidos, sempre retorna null
 * Mantida apenas para compatibilidade com código existente
 */
export function getDropdownPeriodLabelFromRange(range?: { start: Date | string; end: Date | string }): string | null {
  // Sempre retorna null pois não há mais períodos pré-definidos
  // Todos os períodos são customizados via calendário
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
      let constraints: any[] = []
      if (filters?.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)

        // início do dia
        start.setHours(0, 0, 0, 0)

        // limite superior exclusivo = dia seguinte às 00:00
        const endExclusive = new Date(end)
        endExclusive.setDate(endExclusive.getDate() + 1)
        endExclusive.setHours(0, 0, 0, 0)

        constraints = [
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
      }

      // LOG: Chamada API de orçamento
      console.log(`[ORÇAMENTO API] Página ${pageNumber} - Chamada:`, {
        url: url.toString(),
        method: 'GET',
        constraints: constraints.length > 0 ? constraints : 'nenhum',
        cursor: cursor || 0,
        limit: 100,
      })
    
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

      // LOG: Resposta da API
      const results = data.response.results || []
      const remaining = data.response.remaining ?? 0
      const count = data.response.count ?? 0

      console.log(`[ORÇAMENTO API] Página ${pageNumber} - Resposta:`, {
        count: count,
        remaining: remaining,
        results_returned: results.length,
        cursor: data.response.cursor,
      })

      // LOG: Lista de orçamentos retornados
      if (results.length > 0) {
        console.log(`[ORÇAMENTO API] Página ${pageNumber} - Lista de orçamentos (${results.length} itens):`, 
          results.map(orc => ({
            _id: orc._id,
            projeto: orc.projeto || 'sem projeto',
            status: orc.status || 'sem status',
            'Created Date': orc['Created Date'] || 'sem data',
            removido: orc.removido || false,
          }))
        )
      } else {
        console.log(`[ORÇAMENTO API] Página ${pageNumber} - Nenhum orçamento retornado`)
      }

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
    // console.error('Erro ao buscar orçamentos:', error)

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
        // console.error(`Erro ao buscar itens de orçamento (lote ${Math.floor(i / batchSize) + 1}):`, response.statusText)
        continue
      }

      const data = await response.json()
      const results = data.response?.results || []
      allItems.push(...results)
    }

    return allItems
  } catch (error) {
    // console.error('Erro ao buscar itens de orçamento:', error)
    return []
  }
}

/**
 * Busca itens de orçamento por IDs de orçamentos (não por IDs de itens)
 * Endpoint: /obj/item_orcamento
 * Usa constraint: orcamento in [IDs dos orçamentos]
 * @param orcamentoIds - Array de IDs dos orçamentos
 */
export async function fetchItemOrcamentosByOrcamentoIds(orcamentoIds: string[]): Promise<ItemOrcamento[]> {
  if (API_DISABLED || orcamentoIds.length === 0) {
    return []
  }

  try {
    const allItems: ItemOrcamento[] = []
    const batchSize = 50
    
    for (let i = 0; i < orcamentoIds.length; i += batchSize) {
      const batch = orcamentoIds.slice(i, i + batchSize)
      
      const constraints = [
        {
          key: 'orcamento', // Buscar pelo campo 'orcamento' que é o ID do orçamento relacionado
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
        // console.error(`Erro ao buscar itens de orçamento (lote ${Math.floor(i / batchSize) + 1}):`, response.statusText)
        continue
      }

      const data = await response.json()
      const results = data.response?.results || []
      allItems.push(...results)
    }

    return allItems
  } catch (error) {
    // console.error('Erro ao buscar itens de orçamento:', error)
    return []
  }
}

/**
 * Busca todos os itens de orçamento da API com paginação
 * Endpoint: /obj/item_orcamento
 * @deprecated Use fetchItemOrcamentosByIds or fetchItemOrcamentosByOrcamentoIds instead
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
    // console.error('❌ [API] Erro ao buscar vendedores:', error)
    
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
    // console.error('❌ [API] Erro ao buscar arquitetos:', error)
    
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
    // console.error('❌ [API] Erro ao buscar clientes:', error)
    
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
    // console.error('❌ [API] Erro ao buscar lojas:', error)
    
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
 * Busca todos os núcleos únicos disponíveis nos orçamentos
 * Cache válido por 24 horas (núcleos não mudam com frequência)
 */
export async function fetchAllNucleos(forceRefresh: boolean = false): Promise<Nucleo[]> {
  const STORAGE_KEY = 'casual_crm_nucleos_cache'
  const TIMESTAMP_KEY = 'casual_crm_nucleos_cache_timestamp'
  
  // Verificar cache se não for forçado a atualizar
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY)
      const cachedTimestamp = localStorage.getItem(TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const nucleos = JSON.parse(cachedData) as Nucleo[]
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        
        // Cache válido por 24 horas
        if (ageInHours < 24) {
          console.log(`[FILTROS] Núcleos carregados do cache: ${nucleos.length}`)
          return nucleos
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de cache
    }
  }
  
  try {
    if (API_DISABLED) {
      logApiDisabled('/obj/orcamento + /obj/projeto')
      return []
    }

    console.log(`[FILTROS] Buscando todos os núcleos únicos...`)

    // 1. Buscar todos os orçamentos (sem filtro de data, apenas não removidos)
    const allOrcamentos = await fetchAllOrcamentos({ removido: false })
    
    // 2. Extrair IDs dos projetos únicos
    const projectIds = Array.from(
      new Set(
        allOrcamentos
          .map(orc => orc.projeto)
          .filter((id): id is string => !!id && id.trim() !== '')
      )
    )

    console.log(`[FILTROS] Encontrados ${projectIds.length} projetos únicos`)

    if (projectIds.length === 0) {
      return []
    }

    // 3. Buscar os projetos relacionados
    const allProjects: Project[] = []
    const batchSize = 100

    for (let i = 0; i < projectIds.length; i += batchSize) {
      const batch = projectIds.slice(i, i + batchSize)
      
      const url = new URL(`${API_BASE_URL}/obj/projeto`)
      const constraints = [
        {
          key: '_id',
          constraint_type: 'in',
          value: batch,
        },
      ]
      
      url.searchParams.set('constraints', JSON.stringify(constraints))
      url.searchParams.set('limit', '100')

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Erro ao buscar projetos (lote ${Math.floor(i / batchSize) + 1}):`, response.statusText)
        continue
      }

      const data: ProjectsResponse = await response.json()
      const results = data.response?.results || []
      allProjects.push(...results)
    }

    // 4. Extrair todos os núcleos únicos
    const nucleosSet = new Set<Nucleo>()
    allProjects.forEach(project => {
      if (project.nucleo_lista && Array.isArray(project.nucleo_lista)) {
        project.nucleo_lista.forEach(nucleo => {
          nucleosSet.add(nucleo)
        })
      }
    })

    const nucleos = Array.from(nucleosSet).sort()

    console.log(`[FILTROS] Núcleos únicos encontrados: ${nucleos.length}`, nucleos)

    // 5. Salvar no cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nucleos))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
      } catch (error) {
        // Ignorar erros ao salvar cache
      }
    }

    return nucleos
  } catch (error) {
    console.error('Erro ao buscar núcleos:', error)
    
    // Em caso de erro, tentar usar cache se disponível
    if (typeof window !== 'undefined' && !forceRefresh) {
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          return JSON.parse(cachedData) as Nucleo[]
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
 * 
 * NOVA ABORDAGEM: Se orcamentos forem fornecidos, usa eles diretamente (já foram buscados em fetchOrcamentosAndProjects)
 * Se não, busca orçamentos dos projetos (compatibilidade com código antigo)
 */
export async function calculateFunnelMetrics(
  projects: Project[],
  funnelType: FunnelType,
  comparePrevious?: boolean,
  dateRange?: { start: Date | string; end: Date | string },
  useOrcamentos: boolean = false, // Novo parâmetro: se false, não busca orçamentos (Status de Projetos)
  filters?: Partial<DashboardFilters>, // Filtros completos para gerar chave de cache baseada na combinação
  orcamentos?: Orcamento[] // NOVO: Orçamentos já buscados (opcional, para evitar busca duplicada)
) {
  // Gerar chave de cache baseada na combinação de filtros
  // Assim conseguimos reutilizar diretamente o resultado final do funil,
  // sem precisar refazer todas as chamadas de API e cálculos.
  let cacheKey: string | null = null
  let timestampKey: string | null = null

  if (typeof window !== 'undefined' && projects.length > 0 && filters) {
    try {
      // Normalizar datas para o cache (apenas data, sem hora)
      let startDate: string | null = null
      let endDate: string | null = null
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start)
        const end = new Date(filters.dateRange.end)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        startDate = start.toISOString().split('T')[0]
        endDate = end.toISOString().split('T')[0]
      } else if (dateRange) {
        // Fallback para dateRange direto (compatibilidade)
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        startDate = start.toISOString().split('T')[0]
        endDate = end.toISOString().split('T')[0]
      }

      // Criar payload de cache baseado na combinação de filtros
      // Cada combinação única de filtros gera uma chave única
      const cachePayload = {
        funnelType,
        useOrcamentos,
        startDate,
        endDate,
        nucleo: filters.nucleo || null,
        loja: filters.loja || null,
        vendedor: filters.vendedor || null,
        arquiteto: filters.arquiteto || null,
        status: filters.status || null, // Status de orçamento (Em Aprovação, Enviado, etc.)
      }

      const cacheHash = hashString(JSON.stringify(cachePayload))
      cacheKey = `funnel_cache_${cacheHash}`
      timestampKey = `${cacheKey}_timestamp`

      // Tentar usar resultado final em cache (válido por 30 minutos)
      const cachedData = localStorage.getItem(cacheKey)
      const cachedTimestamp = localStorage.getItem(timestampKey)
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10)
        const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
        if (ageInMinutes < 30) {
          try {
            const parsed = JSON.parse(cachedData)

            const periodLabel =
              filters?.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'

            // Cache HIT: resultado já existe, não precisa recalcular
            console.log(
              `[CACHE HIT] funnel_cache HIT key=${cacheKey} periodo=${periodLabel} status=${cachePayload.status ?? 'Todos'} nucleo=${
                cachePayload.nucleo ?? 'Todos'
              } loja=${cachePayload.loja ?? 'Todas'} vendedor=${cachePayload.vendedor ?? 'Todos'} arquiteto=${
                cachePayload.arquiteto ?? 'Todos'
              } funnelType=${funnelType} useOrcamentos=${useOrcamentos}`,
            )
            console.log('[ETAPA 3] (CACHE) Orçamentos e projetos já calculados anteriormente para esta combinação de filtros')
            console.log('[ETAPA 4] (CACHE) Métricas do funil carregadas diretamente do cache (sem recálculo)')
            console.log('[ETAPA 5] (CACHE) Cache ainda válido - nenhum novo SAVE necessário')
            return parsed
          } catch {
            // Se der erro ao parsear, seguimos fluxo normal e recalculamos
          }
        }
      }
    } catch {
      // Qualquer erro aqui não deve quebrar o cálculo; apenas ignora o cache
      cacheKey = null
      timestampKey = null
    }
  }

  // ETAPA 3: Usar orçamentos fornecidos ou buscar se necessário
  const orcamentosMap = new Map<string, Orcamento>()
  
  if (orcamentos && orcamentos.length > 0) {
    // NOVA ABORDAGEM: Orçamentos já foram buscados em fetchOrcamentosAndProjects
    console.log(`[ETAPA 3] (CACHE) Usando orçamentos já buscados: ${orcamentos.length} orçamentos`)
    orcamentos.forEach(orcamento => {
      if (orcamento.removido !== true) {
        orcamentosMap.set(orcamento._id, orcamento)
      }
    })
  } else {
    // ABORDAGEM ANTIGA: Buscar orçamentos dos projetos (compatibilidade)
    console.log(`[ETAPA 3] Buscando orçamentos dos projetos, total_projetos=${projects.length}`)
    
    // Coletar todos os IDs de orçamentos dos projetos
    const orcamentoIdsSet = new Set<string>()
    projects.forEach(project => {
      if (project.new_orcamentos) {
        project.new_orcamentos.forEach(id => orcamentoIdsSet.add(id))
      }
    })
    
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
      // console.log(`orcamento buscando total_orcamento_ids=${orcamentoIdsArray.length} total_lotes=${Math.ceil(orcamentoIdsArray.length / batchSize)}`)
      
      for (let i = 0; i < orcamentoIdsArray.length; i += batchSize) {
        const batch = orcamentoIdsArray.slice(i, i + batchSize)
        const loteNum = Math.floor(i / batchSize) + 1
        const totalLotes = Math.ceil(orcamentoIdsArray.length / batchSize)
        
        // Log: início de cada lote
        // console.log(`orcamento lote ${loteNum}/${totalLotes} buscando ${batch.length} IDs`)
        
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
          // console.log(`orcamento lote ${loteNum}/${totalLotes} retornou ${results.length} orcamentos`)
          
          results.forEach(orcamento => {
            if (orcamento.removido !== true) {
              orcamentosMap.set(orcamento._id, orcamento)
            }
          })
        }
      }
      
      console.log(`[ETAPA 3] Orçamentos encontrados: ${orcamentosMap.size} de ${orcamentoIdsSet.size} IDs buscados`)
    }
    }
  }
  
  // ETAPA 4: Calcular métricas do funil (contagens e percentuais)
  // Status que contam como "Enviado ao cliente"
  const sentStatuses = [
    'Enviado ao cliente',
    'Aprovado pelo cliente',
    'Reprovado',
    'Liberado para pedido',
  ]
  
  // NOVA LÓGICA: Contar ORÇAMENTOS diretamente (não projetos)
  let sentCount = 0
  let inApprovalCount = 0
  let approvedCount = 0
  let rejectedCount = 0
  let releasedCount = 0 // Liberado para pedido
  
  // Iterar sobre todos os orçamentos no mapa
  orcamentosMap.forEach((orcamento, orcamentoId) => {
    if (!orcamento.status) {
      return // Orçamento sem status, ignorar
    }
    
    const status = String(orcamento.status)
    const statusLower = status.toLowerCase().trim()
    
    // Verificar se foi enviado (qualquer status que indique envio)
    const isSent = sentStatuses.some(s => statusLower.includes(s.toLowerCase())) ||
                  statusLower.includes('enviado') ||
                  statusLower.includes('aprovado') ||
                  statusLower.includes('reprovado') ||
                  statusLower.includes('liberado')
    
    if (!isSent) {
      return // Orçamento não enviado, ignorar
    }
    
    // Contar orçamento como enviado
    sentCount++
    
    // Verificar status específicos (mais específicos primeiro)
    if (statusLower.includes('liberado para pedido') || statusLower.includes('liberado')) {
      releasedCount++
    } else if (statusLower.includes('reprovado')) {
      rejectedCount++
    } else if (statusLower.includes('aprovado pelo cliente') || 
               (statusLower.includes('aprovado') && !statusLower.includes('reprovado') && !statusLower.includes('liberado'))) {
      approvedCount++
    } else if (statusLower.includes('em aprovação') || 
               statusLower.includes('pendente aprovação') ||
               (statusLower.includes('aprovação') && !statusLower.includes('aprovado') && !statusLower.includes('reprovado') && !statusLower.includes('liberado'))) {
      inApprovalCount++
    }
  })
  
  // "Orçamentos Enviados" = soma de todos os orçamentos enviados (em aprovação + aprovados + reprovados + liberados)
  // Agora sentCount já é a soma correta, mas vamos garantir
  const totalEnviados = inApprovalCount + approvedCount + rejectedCount + releasedCount
  sentCount = totalEnviados
  
  // Contar total de orçamentos únicos (não removidos)
  const totalOrcamentos = orcamentosMap.size
  
  // Calcular percentuais (taxa de envio = orçamentos enviados / total de orçamentos)
  const sentPercentage = totalOrcamentos > 0 
    ? ((sentCount / totalOrcamentos) * 100).toFixed(1) 
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
  
  const releasedPercentage = sentCount > 0 
    ? ((releasedCount / sentCount) * 100).toFixed(1) 
    : '0'
  
  const result = {
    created: { 
      count: totalOrcamentos, 
      label: 'Total de Orçamentos', 
      sublabel: 'orçamentos' 
    },
    sent: { 
      count: sentCount, 
      label: 'Orçamentos Enviados', 
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
    released: { 
      count: releasedCount, 
      percentage: `${releasedPercentage}%`, 
      label: 'Liberado para pedido', 
      sublabel: 'dos enviados' 
    },
  }

  // ETAPA 4: Resumo das métricas calculadas
  console.log(`[ETAPA 4] funnel_metrics processado total_orcamentos=${totalOrcamentos} projetos_enviados=${sentCount} em_aprovacao=${inApprovalCount} aprovados=${approvedCount} reprovados=${rejectedCount} liberados=${releasedCount}`)

  // Salvar resultado final do funil em cache (quando possível)
  if (typeof window !== 'undefined' && cacheKey && timestampKey) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result))
      localStorage.setItem(timestampKey, Date.now().toString())

      const periodLabel =
        filters?.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'

      // ETAPA 5: Salvar resultado final no cache
      console.log(
        `[ETAPA 5] funnel_cache SAVE key=${cacheKey} periodo=${periodLabel} status=${filters?.status ?? 'Todos'} nucleo=${
          filters?.nucleo ?? 'Todos'
        } loja=${filters?.loja ?? 'Todas'} vendedor=${filters?.vendedor ?? 'Todos'} arquiteto=${
          filters?.arquiteto ?? 'Todos'
        } totalOrcamentos=${totalOrcamentos} sentCount=${sentCount} emAprovacao=${inApprovalCount} aprovados=${approvedCount} reprovados=${rejectedCount} liberados=${releasedCount}`,
      )
    } catch {
      // Ignorar erros ao salvar cache do funil
    }
  }

  return result
}

