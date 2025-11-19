/**
 * Serviço de API para o Dashboard Casual CRM
 * Endpoint base: https://crm.casualmoveis.com.br/version-live/api/1.1/obj/projeto
 */

import type { Project, ProjectsResponse, DashboardFilters, FunnelType } from '@/types/dashboard'

const API_BASE_URL = 'https://crm.casualmoveis.com.br/version-live/api/1.1'

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
 * Calcula métricas do funil baseado nos projetos e orçamentos
 */
export async function calculateFunnelMetrics(
  projects: Project[],
  funnelType: FunnelType,
  comparePrevious?: boolean
) {
  const createdCount = projects.length
  
  // Buscar todos os orçamentos relacionados aos projetos
  const orcamentosMap = await fetchOrcamentosFromProjects(projects)
  
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
        const status = String(orcamento.status).toLowerCase()
        
        // Verificar se foi enviado
        if (sentStatuses.some(s => status.includes(s.toLowerCase()))) {
          hasSent = true
        }
        
        // Verificar status específicos
        if (status.includes('em aprovação') || (status.includes('aprovação') && !status.includes('aprovado'))) {
          hasInApproval = true
        } else if (status.includes('aprovado') && !status.includes('reprovado')) {
          hasApproved = true
        } else if (status.includes('reprovado')) {
          hasRejected = true
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

