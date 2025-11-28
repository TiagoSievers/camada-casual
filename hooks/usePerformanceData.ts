/**
 * Hook React para buscar e calcular dados de performance comercial
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  fetchAllOrcamentos, 
  fetchProjects,
  fetchVendedores,
  fetchArquitetos,
  calculateOrcamentoMargin,
  hashString,
  getDropdownPeriodLabelFromRange,
} from '@/lib/api'
import { extractVendedorIds } from '@/types/dashboard'
import type { DashboardFilters, Project } from '@/types/dashboard'

interface PerformanceItem {
  id: string
  name: string
  value: number
  trend: number[] // Array de valores para o gráfico de linha
}

interface UsePerformanceDataReturn {
  vendedores: PerformanceItem[]
  arquitetos: PerformanceItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refreshVendedores: () => Promise<void>
  refreshArquitetos: () => Promise<void>
}

// Função para gerar chave de cache baseada nos filtros (usando hashString como nas outras páginas)
const getCacheKey = (filters: DashboardFilters): string => {
  // Normalizar datas para o cache
  let startDate: string | null = null
  let endDate: string | null = null
  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    startDate = start.toISOString().split('T')[0]
    endDate = end.toISOString().split('T')[0]
  }

  const cachePayload = {
    tipo: 'performance_comercial',
    startDate,
    endDate,
    nucleo: filters.nucleo || null,
    loja: filters.loja || null,
    vendedor: filters.vendedor || null,
    arquiteto: filters.arquiteto || null,
  }

  const cacheHash = hashString(JSON.stringify(cachePayload))
  return `performance_cache_${cacheHash}`
}

export function usePerformanceData(filters: DashboardFilters): UsePerformanceDataReturn {
  const [vendedores, setVendedores] = useState<PerformanceItem[]>([])
  const [arquitetos, setArquitetos] = useState<PerformanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPerformanceData = async (useCache: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      // Gerar chave de cache baseada na combinação de filtros
      let cacheKey: string | null = null
      let timestampKey: string | null = null

      if (typeof window !== 'undefined') {
        try {
          cacheKey = getCacheKey(filters)
          timestampKey = `${cacheKey}_timestamp`

          // Verificar cache do resultado final (válido por 30 minutos)
          if (useCache) {
            const cachedResult = localStorage.getItem(cacheKey)
            const cachedTimestamp = localStorage.getItem(timestampKey)
            
            if (cachedResult && cachedTimestamp) {
              const timestamp = parseInt(cachedTimestamp, 10)
              const ageInMinutes = (Date.now() - timestamp) / (1000 * 60)
              
              if (ageInMinutes < 30) {
                try {
                  const cached = JSON.parse(cachedResult)
                  const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
                  console.log(
                    `[CACHE HIT] performance_cache HIT key=${cacheKey} periodo=${periodLabel} nucleo=${filters.nucleo ?? 'Todos'} loja=${filters.loja ?? 'Todas'} vendedor=${filters.vendedor ?? 'Todos'} arquiteto=${filters.arquiteto ?? 'Todos'}`,
                  )
                  console.log(`[CACHE HIT] Resultado encontrado em cache - ETAPAS 1-5 foram puladas (não precisa recalcular)`)
                  setVendedores(cached.vendedores || [])
                  setArquitetos(cached.arquitetos || [])
                  setLoading(false)
                  return
                } catch {
                  // Erro ao parsear cache, seguir fluxo normal
                }
              } else {
                const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
                console.log(
                  `[CACHE] Cache expirado (${ageInMinutes.toFixed(1)}min > 30min) - recalculando key=${cacheKey} periodo=${periodLabel}`,
                )
              }
            } else {
              const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
              console.log(
                `[CACHE] Cache não encontrado - calculando key=${cacheKey} periodo=${periodLabel}`,
              )
            }
          }
        } catch {
          cacheKey = null
          timestampKey = null
        }
      }

      // ETAPA 1: Buscar orçamentos do período atual
      console.log(`[ETAPA 1] Buscando orçamentos do período com filtros aplicados...`)
      const orcamentos = await fetchAllOrcamentos({
        dateRange: filters.dateRange,
        removido: false,
        status: ['Enviado ao cliente', 'Aprovado pelo cliente', 'Liberado para pedido'],
      })
      console.log(`[ETAPA 1] Orçamentos encontrados: ${orcamentos.length}`)

      // ETAPA 2: Buscar projetos
      console.log(`[ETAPA 2] Buscando projetos...`)
      const allProjects = await fetchProjects()
      const projectsMap = new Map<string, Project>()
      allProjects.forEach(project => {
        projectsMap.set(project._id, project)
      })
      console.log(`[ETAPA 2] Projetos encontrados: ${allProjects.length}`)

      // ETAPA 3: Buscar vendedores para obter nomes (usando cache por padrão)
      console.log(`[ETAPA 3] Buscando vendedores para mapear nomes...`)
      const vendedoresList = await fetchVendedores(false) // false = usar cache se disponível
      const vendedoresNamesMap = new Map<string, string>()
      vendedoresList.forEach(vendedor => {
        // Filtrar apenas vendedores não removidos e ativos
        if (vendedor.removido === true) return
        if (vendedor['status_do_vendedor'] && vendedor['status_do_vendedor'] !== 'ATIVO') return
        
        const name = vendedor.nome || vendedor._id
        vendedoresNamesMap.set(vendedor._id, name)
      })
      console.log(`[ETAPA 3] Vendedores encontrados: ${vendedoresList.length}, vendedores ativos: ${vendedoresNamesMap.size}`)

      // ETAPA 4: Buscar arquitetos para obter nomes (usando cache por padrão)
      console.log(`[ETAPA 4] Buscando arquitetos para mapear nomes...`)
      const arquitetosList = await fetchArquitetos(false) // false = usar cache se disponível
      const arquitetosNamesMap = new Map<string, string>()
      arquitetosList.forEach(arquiteto => {
        // Filtrar apenas arquitetos não removidos e ativos
        if (arquiteto.removido === true) return
        if (arquiteto['Status do Arquiteto'] && arquiteto['Status do Arquiteto'] !== 'ATIVO') return
        
        const name = arquiteto['Nome do Arquiteto'] || arquiteto._id
        arquitetosNamesMap.set(arquiteto._id, name)
      })
      console.log(`[ETAPA 4] Arquitetos encontrados: ${arquitetosList.length}, arquitetos ativos: ${arquitetosNamesMap.size}`)

      // ETAPA 5: Filtrar projetos e orçamentos conforme filtros aplicados
      console.log(`[ETAPA 5] Filtrando projetos e orçamentos conforme filtros:`, {
        periodo: filters.dateRange ? `${new Date(filters.dateRange.start).toISOString().split('T')[0]} a ${new Date(filters.dateRange.end).toISOString().split('T')[0]}` : 'Todos',
        nucleo: filters.nucleo || 'Todos',
        loja: filters.loja || 'Todas',
        vendedor: filters.vendedor || 'Todos',
        arquiteto: filters.arquiteto || 'Todos',
      })
      const filteredProjects = allProjects.filter(project => {
        // Filtro de data
        if (filters.dateRange) {
          const createdDate = new Date(project['Created Date'])
          const startDate = new Date(filters.dateRange.start)
          const endDate = new Date(filters.dateRange.end)
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

      // Filtrar orçamentos pelos projetos filtrados
      const filteredOrcamentos = orcamentos.filter(orcamento => {
        const projetoId = orcamento.projeto
        if (!projetoId) return false
        
        return filteredProjects.some(p => p._id === projetoId)
      })
      console.log(`[ETAPA 5] Projetos filtrados: ${filteredProjects.length} de ${allProjects.length}, Orçamentos filtrados: ${filteredOrcamentos.length} de ${orcamentos.length}`)

      // ETAPA 6: Calcular performance de vendedores (receita total)
      console.log(`[ETAPA 6] Calculando performance de vendedores...`)
      const vendedoresPerformanceMap = new Map<string, { receita: number; trends: Map<string, number> }>()
      
      filteredOrcamentos.forEach(orcamento => {
        const projetoId = orcamento.projeto
        if (!projetoId) return
        
        const projeto = projectsMap.get(projetoId)
        if (!projeto) return

        const receita = Number(orcamento.valor_final_total) || 0
        const vendedorIds = extractVendedorIds(projeto)
        
        // Data do orçamento para agrupar por período (dia da semana)
        const dataOrcamento = orcamento.data_orcamento ? new Date(orcamento.data_orcamento) : null
        const dayKey = dataOrcamento ? dataOrcamento.getDate() % 7 : 0

        vendedorIds.forEach(vendedorId => {
          const existing = vendedoresPerformanceMap.get(vendedorId) || { receita: 0, trends: new Map() }
          existing.receita += receita
          
          const dayValue = existing.trends.get(String(dayKey)) || 0
          existing.trends.set(String(dayKey), dayValue + receita)
          
          vendedoresPerformanceMap.set(vendedorId, existing)
        })
      })

      // Converter para array e ordenar por receita
      const vendedoresData: PerformanceItem[] = Array.from(vendedoresPerformanceMap.entries())
        .map(([id, data]) => {
          // Buscar nome do vendedor
          let vendedorNome = vendedoresNamesMap.get(id)
          
          // Se não encontrou no mapa, buscar diretamente na lista
          if (!vendedorNome) {
            const vendedorNaLista = vendedoresList.find(v => v._id === id)
            if (vendedorNaLista && vendedorNaLista.nome) {
              vendedorNome = vendedorNaLista.nome
            } else {
              // Se ainda não encontrou, pular este vendedor
              return null
            }
          }
          
          // Gerar array de tendência (7 pontos simulados baseados na receita total)
          // Criar uma tendência crescente suave
          const baseValue = data.receita / 7
          const trendData = Array.from({ length: 7 }, (_, i) => {
            // Simular uma tendência crescente com variação
            const variation = (Math.random() - 0.5) * 0.2
            return Math.max(0, baseValue * (1 + i * 0.1 + variation))
          })
          
          return {
            id,
            name: vendedorNome,
            value: data.receita,
            trend: trendData,
          }
        })
        .filter((item): item is PerformanceItem => item !== null) // Remover nulls
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5

      setVendedores(vendedoresData)
      console.log(`[ETAPA 6] Performance de vendedores calculada: ${vendedoresData.length} vendedores`)

      // ETAPA 7: Calcular performance de arquitetos (número de projetos)
      console.log(`[ETAPA 7] Calculando performance de arquitetos...`)
      const arquitetosPerformanceMap = new Map<string, { count: number; trends: Map<string, number> }>()
      
      filteredProjects.forEach(project => {
        if (!project.arquiteto) return

        const arquitetoId = project.arquiteto
        const existing = arquitetosPerformanceMap.get(arquitetoId) || { count: 0, trends: new Map() }
        existing.count += 1
        
        arquitetosPerformanceMap.set(arquitetoId, existing)
      })

      // Converter para array e ordenar por número de projetos
      const arquitetosData: PerformanceItem[] = Array.from(arquitetosPerformanceMap.entries())
        .map(([id, data]) => {
          // Buscar nome do arquiteto
          let arquitetoNome = arquitetosNamesMap.get(id)
          
          // Se não encontrou no mapa, buscar diretamente na lista
          if (!arquitetoNome) {
            const arquitetoNaLista = arquitetosList.find(a => a._id === id)
            if (arquitetoNaLista && arquitetoNaLista['Nome do Arquiteto']) {
              arquitetoNome = arquitetoNaLista['Nome do Arquiteto']
            } else {
              // Se ainda não encontrou, pular este arquiteto
              return null
            }
          }
          
          // Gerar array de tendência (7 pontos simulados baseados no número de projetos)
          // Criar uma tendência crescente suave
          const baseValue = data.count / 7
          const trendData = Array.from({ length: 7 }, (_, i) => {
            // Simular uma tendência crescente com variação
            const variation = (Math.random() - 0.5) * 0.2
            return Math.max(0, baseValue * (1 + i * 0.1 + variation))
          })
          
          return {
            id,
            name: arquitetoNome,
            value: data.count,
            trend: trendData,
          }
        })
        .filter((item): item is PerformanceItem => item !== null) // Remover nulls
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5

      setArquitetos(arquitetosData)
      console.log(`[ETAPA 7] Performance de arquitetos calculada: ${arquitetosData.length} arquitetos`)
      
      // ETAPA 8: Salvar resultado final no cache
      if (typeof window !== 'undefined' && cacheKey && timestampKey) {
        try {
          const cacheData = {
            vendedores: vendedoresData,
            arquitetos: arquitetosData,
          }
          localStorage.setItem(cacheKey, JSON.stringify(cacheData))
          localStorage.setItem(timestampKey, Date.now().toString())
          const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
          console.log(
            `[ETAPA 8] performance_cache SAVE key=${cacheKey} periodo=${periodLabel} nucleo=${filters.nucleo ?? 'Todos'} loja=${filters.loja ?? 'Todas'} vendedor=${filters.vendedor ?? 'Todos'} arquiteto=${filters.arquiteto ?? 'Todos'} total_vendedores=${vendedoresData.length} total_arquitetos=${arquitetosData.length}`,
          )
        } catch (error) {
          console.log(`[ETAPA 8] Erro ao salvar cache key=${cacheKey} error=${error}`)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de performance')
      console.error('Erro ao carregar dados de performance:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshVendedores = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [PERFORMANCE] Atualizando lista de vendedores...')
      
      // Limpar cache de vendedores e resultados para forçar recálculo
      if (typeof window !== 'undefined') {
        localStorage.removeItem('casual_crm_vendedores_cache')
        localStorage.removeItem('casual_crm_vendedores_cache_timestamp')
        const cacheKey = getCacheKey(filters)
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(`${cacheKey}_timestamp`)
      }
      
      // Buscar vendedores forçando atualização
      const vendedoresList = await fetchVendedores(true) // true = força atualização
      const vendedoresNamesMap = new Map<string, string>()
      vendedoresList.forEach(vendedor => {
        if (vendedor.removido === true) return
        if (vendedor['status_do_vendedor'] && vendedor['status_do_vendedor'] !== 'ATIVO') return
        const name = vendedor.nome || vendedor._id
        vendedoresNamesMap.set(vendedor._id, name)
      })
      
      // Recarregar dados sem usar cache
      await loadPerformanceData(false) // false = não usar cache
    } catch (err) {
      console.error('❌ [PERFORMANCE] Erro ao atualizar vendedores:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lista de vendedores')
    }
  }

  const refreshArquitetos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [PERFORMANCE] Atualizando lista de arquitetos...')
      
      // Limpar cache de arquitetos e resultados para forçar recálculo
      if (typeof window !== 'undefined') {
        localStorage.removeItem('casual_crm_arquitetos_cache')
        localStorage.removeItem('casual_crm_arquitetos_cache_timestamp')
        const cacheKey = getCacheKey(filters)
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(`${cacheKey}_timestamp`)
      }
      
      // Buscar arquitetos forçando atualização
      const arquitetosList = await fetchArquitetos(true) // true = força atualização
      const arquitetosNamesMap = new Map<string, string>()
      arquitetosList.forEach(arquiteto => {
        if (arquiteto.removido === true) return
        if (arquiteto['Status do Arquiteto'] && arquiteto['Status do Arquiteto'] !== 'ATIVO') return
        const name = arquiteto['Nome do Arquiteto'] || arquiteto._id
        arquitetosNamesMap.set(arquiteto._id, name)
      })
      
      // Recarregar dados sem usar cache
      await loadPerformanceData(false) // false = não usar cache
    } catch (err) {
      console.error('❌ [PERFORMANCE] Erro ao atualizar arquitetos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lista de arquitetos')
    }
  }

  useEffect(() => {
    loadPerformanceData(true) // true = usar cache se disponível
  }, [
    filters.dateRange.start,
    filters.dateRange.end,
    filters.nucleo,
    filters.loja,
    filters.vendedor,
    filters.arquiteto,
  ])

  return {
    vendedores,
    arquitetos,
    loading,
    error,
    refetch: loadPerformanceData,
    refreshVendedores,
    refreshArquitetos,
  }
}

