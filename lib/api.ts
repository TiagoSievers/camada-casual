/**
 * Serviço de API para o Dashboard Casual CRM
 * Endpoint base: https://crm.casualmoveis.com.br/version-live/api/1.1/obj/projeto
 */

import type { Project, ProjectsResponse, DashboardFilters, FunnelType, OrcamentoStatusFilter } from '@/types/dashboard'

const API_BASE_URL = 'https://crm.casualmoveis.com.br/api/1.1'

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
 * Busca projetos da API com filtros opcionais
 */
export async function fetchProjects(filters?: Partial<DashboardFilters>): Promise<Project[]> {
  try {
    const url = new URL(`${API_BASE_URL}/obj/projeto`)
    
    // Adicionar parâmetros de filtro se fornecidos
    // Nota: A API pode ter parâmetros específicos, ajustar conforme documentação
    if (filters?.dateRange) {
      // Adicionar filtros de data se a API suportar
      // url.searchParams.append('startDate', filters.dateRange.start.toString())
      // url.searchParams.append('endDate', filters.dateRange.end.toString())
    }
    
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
    return data.response.results
  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
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

export function filterProjects(projects: Project[], filters: DashboardFilters): Project[] {
  return projects.filter(project => {
    // Filtro de data (Created Date)
    if (filters.dateRange) {
      const createdDate = new Date(project['Created Date'])
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      
      // Ajustar para incluir o dia inteiro
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
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
    
    // Filtro de status do projeto
    if (filters.status && project.status !== filters.status) {
      return false
    }
    
    return true
  })
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

/**
 * Busca orçamentos da API usando IDs
 * Tenta diferentes endpoints possíveis baseado no padrão da API
 */
export async function fetchOrcamentos(orcamentoIds: string[]): Promise<Orcamento[]> {
  if (orcamentoIds.length === 0) {
    return []
  }

  // Possíveis endpoints para orçamentos
  const possibleEndpoints = [
    'orcamento',
    'orcamentos',
    'All orcamentos',
    'all_orcamentos',
  ]

  // Tentar buscar individualmente primeiro (mais confiável)
  const orcamentos: Orcamento[] = []
  const BATCH_SIZE = 20 // Limitar para não sobrecarregar
  
  for (let i = 0; i < Math.min(orcamentoIds.length, BATCH_SIZE); i++) {
    const id = orcamentoIds[i]
    
    // Tentar cada endpoint possível
    for (const endpoint of possibleEndpoints) {
      try {
        const url = new URL(`${API_BASE_URL}/obj/${endpoint}/${id}`)
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          // A API pode retornar de diferentes formas
          if (data.response?.results?.[0]) {
            orcamentos.push(data.response.results[0])
            break // Se encontrou, não tentar outros endpoints
          } else if (data.response?.result) {
            orcamentos.push(data.response.result)
            break
          } else if (data._id === id) {
            // Pode retornar diretamente o objeto
            orcamentos.push(data)
            break
          }
        }
      } catch (err) {
        // Continuar tentando outros endpoints
        continue
      }
    }
  }
  
  return orcamentos
}

/**
 * Busca todos os orçamentos relacionados aos projetos fornecidos
 */
export async function fetchOrcamentosFromProjects(projects: Project[]): Promise<Map<string, Orcamento>> {
  // Coletar todos os IDs de orçamentos únicos
  const orcamentoIdsSet = new Set<string>()
  projects.forEach(project => {
    if (project.new_orcamentos) {
      project.new_orcamentos.forEach(id => orcamentoIdsSet.add(id))
    }
  })
  
  const orcamentoIds = Array.from(orcamentoIdsSet)
  
  if (orcamentoIds.length === 0) {
    return new Map()
  }
  
  // Tentar buscar todos os orçamentos de uma vez primeiro (mais eficiente)
  const possibleEndpoints = ['orcamento', 'orcamentos', 'All orcamentos', 'all_orcamentos']
  let allOrcamentos: Orcamento[] = []
  
  // Tentar buscar listagem completa primeiro
  for (const endpoint of possibleEndpoints) {
    try {
      const url = new URL(`${API_BASE_URL}/obj/${endpoint}`)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data: OrcamentosResponse = await response.json()
        const results = data.response?.results || []
        // Filtrar apenas os orçamentos que precisamos
        const filtered = results.filter((orc: Orcamento) => orcamentoIds.includes(orc._id))
        if (filtered.length > 0) {
          allOrcamentos = filtered
          break
        }
      }
    } catch (err) {
      // Continuar tentando outros endpoints
      continue
    }
  }
  
  // Se não encontrou na listagem, buscar individualmente
  if (allOrcamentos.length === 0) {
    allOrcamentos = await fetchOrcamentos(orcamentoIds)
  }
  
  // Criar mapa de ID -> Orcamento
  const orcamentosMap = new Map<string, Orcamento>()
  allOrcamentos.forEach(orcamento => {
    orcamentosMap.set(orcamento._id, orcamento)
  })
  
  return orcamentosMap
}

/**
 * Busca todos os orçamentos da API com filtros opcionais
 */
export async function fetchAllOrcamentos(filters?: {
  dateRange?: { start: Date | string; end: Date | string }
  status?: string[]
  removido?: boolean
}): Promise<Orcamento[]> {
  try {
    const url = new URL(`${API_BASE_URL}/obj/orcamento`)
    
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
    let orcamentos = data.response.results || []
    
    // Filtrar por removido
    if (filters?.removido !== undefined) {
      orcamentos = orcamentos.filter(orc => {
        const removido = orc.removido === true
        return filters.removido ? removido : !removido
      })
    } else {
      // Por padrão, excluir removidos
      orcamentos = orcamentos.filter(orc => orc.removido !== true)
    }
    
    // Filtrar por status
    if (filters?.status && filters.status.length > 0) {
      orcamentos = orcamentos.filter(orc => {
        const status = String(orc.status || '').toLowerCase()
        return filters.status!.some(s => status.includes(s.toLowerCase()))
      })
    }
    
    // Filtrar por data
    if (filters?.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      
      orcamentos = orcamentos.filter(orc => {
        const dataOrcamento = orc.data_orcamento ? new Date(orc.data_orcamento) : null
        if (!dataOrcamento) return false
        
        return dataOrcamento >= startDate && dataOrcamento <= endDate
      })
    }
    
    return orcamentos
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
    throw error
  }
}

/**
 * Busca todos os itens de orçamento da API com paginação
 * Endpoint: /obj/item_orcamento
 */
export async function fetchAllItemOrcamentos(): Promise<ItemOrcamento[]> {
  try {
    const allItems: ItemOrcamento[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1

    console.log('🔵 [API] Iniciando busca de item_orcamento com paginação...')

    while (hasMore) {
      const url = new URL(`${API_BASE_URL}/obj/item_orcamento`)
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
        throw new Error(`Erro ao buscar item_orcamento: ${response.statusText}`)
      }

      const data: ItemOrcamentosResponse = await response.json()
      const results = data.response.results || []
      const remaining = data.response.remaining || 0

      allItems.push(...results)

      console.log(
        `🔵 [API] Página ${pageNumber}: ${results.length} itens encontrados | Restantes: ${remaining} | Total acumulado: ${allItems.length}`,
      )

      hasMore = remaining > 0 && results.length > 0

      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }

    console.log(`✅ [API] Busca concluída: ${allItems.length} itens de orçamento no total (${pageNumber} páginas)`)

    return allItems
  } catch (error) {
    console.error('❌ [API] Erro ao buscar itens de orçamento (item_orcamento):', error)
    throw error
  }
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
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        
        console.log(`💾 [API] Usando cache de vendedores (${vendedores.length} vendedores, ${ageInHours.toFixed(1)}h atrás)`)
        return vendedores
      }
    } catch (error) {
      console.warn('⚠️ [API] Erro ao ler cache, buscando da API:', error)
    }
  }
  
  try {
    const allVendedores: Vendedor[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    console.log('🔵 [API] Iniciando busca de vendedores com paginação...')
    
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
      
      console.log(`🔵 [API] Página ${pageNumber}: ${results.length} vendedores encontrados | Restantes: ${remaining} | Total acumulado: ${allVendedores.length}`)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    console.log(`✅ [API] Busca concluída: ${allVendedores.length} vendedores no total (${pageNumber} páginas)`)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allVendedores))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        console.log(`💾 [API] Cache de vendedores salvo no localStorage`)
      } catch (error) {
        console.warn('⚠️ [API] Erro ao salvar cache:', error)
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
          console.log('⚠️ [API] Erro na API, usando cache como fallback')
          return JSON.parse(cachedData) as Vendedor[]
        }
      } catch (cacheError) {
        console.error('❌ [API] Erro ao ler cache de fallback:', cacheError)
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
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        
        console.log(`💾 [API] Usando cache de arquitetos (${arquitetos.length} arquitetos, ${ageInHours.toFixed(1)}h atrás)`)
        return arquitetos
      }
    } catch (error) {
      console.warn('⚠️ [API] Erro ao ler cache, buscando da API:', error)
    }
  }
  
  try {
    const allArquitetos: Arquiteto[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    console.log('🔵 [API] Iniciando busca de arquitetos com paginação...')
    
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
      
      console.log(`🔵 [API] Página ${pageNumber}: ${results.length} arquitetos encontrados | Restantes: ${remaining} | Total acumulado: ${allArquitetos.length}`)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    console.log(`✅ [API] Busca concluída: ${allArquitetos.length} arquitetos no total (${pageNumber} páginas)`)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allArquitetos))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        console.log(`💾 [API] Cache de arquitetos salvo no localStorage`)
      } catch (error) {
        console.warn('⚠️ [API] Erro ao salvar cache:', error)
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
          console.log('⚠️ [API] Erro na API, usando cache como fallback')
          return JSON.parse(cachedData) as Arquiteto[]
        }
      } catch (cacheError) {
        console.error('❌ [API] Erro ao ler cache de fallback:', cacheError)
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
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        
        console.log(`💾 [API] Usando cache de clientes (${clientes.length} clientes, ${ageInHours.toFixed(1)}h atrás)`)
        return clientes
      }
    } catch (error) {
      console.warn('⚠️ [API] Erro ao ler cache, buscando da API:', error)
    }
  }
  
  try {
    const allClientes: Cliente[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    console.log('🔵 [API] Iniciando busca de clientes com paginação...')
    
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
      
      console.log(`🔵 [API] Página ${pageNumber}: ${results.length} clientes encontrados | Restantes: ${remaining} | Total acumulado: ${allClientes.length}`)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        // Atualizar cursor para próxima página
        // O cursor deve ser o índice do próximo item a buscar
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    console.log(`✅ [API] Busca concluída: ${allClientes.length} clientes no total (${pageNumber} páginas)`)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allClientes))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        console.log(`💾 [API] Cache salvo no localStorage`)
      } catch (error) {
        console.warn('⚠️ [API] Erro ao salvar cache:', error)
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
          console.log('⚠️ [API] Erro na API, usando cache como fallback')
          return JSON.parse(cachedData) as Cliente[]
        }
      } catch (cacheError) {
        console.error('❌ [API] Erro ao ler cache de fallback:', cacheError)
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
        const ageInHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        
        console.log(`💾 [API] Usando cache de lojas (${lojas.length} lojas, ${ageInHours.toFixed(1)}h atrás)`)
        return lojas
      }
    } catch (error) {
      console.warn('⚠️ [API] Erro ao ler cache, buscando da API:', error)
    }
  }
  
  try {
    const allLojas: Loja[] = []
    let cursor = 0
    let hasMore = true
    let pageNumber = 1
    
    console.log('🔵 [API] Iniciando busca de lojas com paginação...')
    
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
      
      console.log(`🔵 [API] Página ${pageNumber}: ${results.length} lojas encontradas | Restantes: ${remaining} | Total acumulado: ${allLojas.length}`)
      
      // Verificar se há mais resultados para buscar
      hasMore = remaining > 0 && results.length > 0
      
      if (hasMore) {
        cursor = data.response.cursor + results.length
        pageNumber++
      }
    }
    
    console.log(`✅ [API] Busca concluída: ${allLojas.length} lojas no total (${pageNumber} páginas)`)
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allLojas))
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
        console.log(`💾 [API] Cache salvo no localStorage`)
      } catch (error) {
        console.warn('⚠️ [API] Erro ao salvar cache:', error)
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
          console.log('⚠️ [API] Erro na API, usando cache como fallback')
          return JSON.parse(cachedData) as Loja[]
        }
      } catch (cacheError) {
        console.error('❌ [API] Erro ao ler cache de fallback:', cacheError)
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
  // Faturamento Líquido = Valor_final_produtos (doc)
  // Usamos fallbacks para evitar quebrar caso o campo tenha outro nome na API
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

  const lucro = receita - custoProdutos
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
  comparePrevious?: boolean
) {
  const createdCount = projects.length
  
  // Coletar todos os IDs de orçamentos dos projetos
  const orcamentoIdsSet = new Set<string>()
  projects.forEach(project => {
    if (project.new_orcamentos) {
      project.new_orcamentos.forEach(id => orcamentoIdsSet.add(id))
    }
  })
  
  // Buscar todos os orçamentos da API
  const allOrcamentos = await fetchAllOrcamentos()
  
  // Filtrar apenas os orçamentos relacionados aos projetos
  const orcamentosMap = new Map<string, Orcamento>()
  allOrcamentos.forEach(orcamento => {
    if (orcamentoIdsSet.has(orcamento._id)) {
      orcamentosMap.set(orcamento._id, orcamento)
    }
  })
  
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
  
  projects.forEach(project => {
    if (!project.new_orcamentos || project.new_orcamentos.length === 0) {
      return
    }
    
    // Verificar status dos orçamentos deste projeto
    let hasSent = false
    let hasInApproval = false
    let hasApproved = false
    let hasRejected = false
    
    project.new_orcamentos.forEach(orcamentoId => {
      const orcamento = orcamentosMap.get(orcamentoId)
      if (orcamento && orcamento.status) {
        const status = String(orcamento.status).toLowerCase().trim()
        
        // Verificar se foi enviado (qualquer status que indique envio)
        const isSent = sentStatuses.some(s => status.includes(s.toLowerCase())) ||
                      status.includes('enviado') ||
                      status.includes('aprovado') ||
                      status.includes('reprovado') ||
                      status.includes('liberado')
        
        if (isSent) {
          hasSent = true
        }
        
        // Verificar status específicos (mais específicos primeiro)
        if (status.includes('reprovado')) {
          hasRejected = true
        } else if (status.includes('aprovado pelo cliente') || 
                   status.includes('aprovado') && !status.includes('reprovado')) {
          hasApproved = true
        } else if (status.includes('em aprovação') || 
                   (status.includes('aprovação') && !status.includes('aprovado') && !status.includes('reprovado'))) {
          hasInApproval = true
        }
      }
    })
    
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

