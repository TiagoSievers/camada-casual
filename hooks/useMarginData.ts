/**
 * Hook React para buscar e calcular dados de margem e rentabilidade
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  fetchAllOrcamentos, 
  fetchItemOrcamentosByIds,
  fetchProjects,
  fetchLojas,
  calculateMarginMetrics,
  groupOrcamentosByNucleo,
  groupOrcamentosByLoja,
  type MarginMetrics,
  type ItemOrcamento,
  hashString,
  getDropdownPeriodLabelFromRange,
} from '@/lib/api'
import { extractVendedorIds } from '@/types/dashboard'
import type { Project, DashboardFilters, Nucleo } from '@/types/dashboard'

interface MarginData {
  name: string
  lucro: number
  receita: number
  margem: number
}

interface UseMarginDataReturn {
  geral: MarginMetrics
  nucleos: MarginData[]
  marcas: MarginData[]
  previousMonth?: {
    geral: MarginMetrics
    nucleos: MarginData[]
    marcas: MarginData[]
  }
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMarginData(filters: DashboardFilters): UseMarginDataReturn {
  const [geral, setGeral] = useState<MarginMetrics>({ lucro: 0, receita: 0, margem: 0 })
  const [nucleos, setNucleos] = useState<MarginData[]>([])
  const [marcas, setMarcas] = useState<MarginData[]>([])
  const [previousMonth, setPreviousMonth] = useState<{
    geral: MarginMetrics
    nucleos: MarginData[]
    marcas: MarginData[]
  } | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMarginData = async () => {
    try {
      setLoading(true)
      setError(null)
      setPreviousMonth(undefined)

      // Gerar chave de cache baseada na combinação de filtros
      let cacheKey: string | null = null
      let timestampKey: string | null = null

      if (typeof window !== 'undefined') {
        try {
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
            tipo: 'margem_rentabilidade',
            startDate,
            endDate,
            nucleo: filters.nucleo || null,
            loja: filters.loja || null,
            vendedor: filters.vendedor || null,
            arquiteto: filters.arquiteto || null,
          }

          const cacheHash = hashString(JSON.stringify(cachePayload))
          cacheKey = `margin_cache_${cacheHash}`
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
                const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
          console.log(
            `[CACHE HIT] margin_cache HIT key=${cacheKey} periodo=${periodLabel} nucleo=${cachePayload.nucleo ?? 'Todos'} loja=${cachePayload.loja ?? 'Todas'} vendedor=${cachePayload.vendedor ?? 'Todos'} arquiteto=${cachePayload.arquiteto ?? 'Todos'}`,
          )
          console.log(`[CACHE HIT] Resultado encontrado em cache - ETAPAS 1-6 foram puladas (não precisa recalcular)`)
          setGeral(parsed.geral)
          setNucleos(parsed.nucleos)
          setMarcas(parsed.marcas)
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

      // ETAPA 2: Buscar projetos para mapear núcleos
      console.log(`[ETAPA 2] Buscando projetos para mapear núcleos...`)
      const allProjects = await fetchProjects()
      const projectsMap = new Map<string, Project>()
      allProjects.forEach(project => {
        projectsMap.set(project._id, project)
      })
      console.log(`[ETAPA 2] Projetos encontrados: ${allProjects.length}`)

      // ETAPA 3: Buscar lojas para nomes
      console.log(`[ETAPA 3] Buscando lojas para nomes...`)
      const lojasList = await fetchLojas(false) // false = use cache if available
      const lojasNamesMap = new Map<string, string>()
      lojasList.forEach(loja => {
        if (loja.removido === true) return // Skip removed lojas
        const name = loja.nome_da_loja || loja._id
        lojasNamesMap.set(loja._id, name)
      })
      console.log(`[ETAPA 3] Lojas encontradas: ${lojasNamesMap.size}`)

      // ETAPA 4: Filtrar projetos e orçamentos conforme filtros aplicados
      console.log(`[ETAPA 4] Filtrando projetos e orçamentos conforme filtros:`, {
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
          if (!project.nucleo_lista.includes(filters.nucleo as Nucleo)) {
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
      console.log(`[ETAPA 4] Projetos filtrados: ${filteredProjects.length} de ${allProjects.length}, Orçamentos filtrados: ${filteredOrcamentos.length} de ${orcamentos.length}`)

      // ETAPA 5: Buscar itens de orçamento
      console.log(`[ETAPA 5] Coletando IDs de itens de orçamento...`)
      const itemOrcamentoIds = new Set<string>()
      filteredOrcamentos.forEach(orcamento => {
        const itemList = (orcamento as any).item_orcamento_list
        if (Array.isArray(itemList)) {
          itemList.forEach((id: string) => itemOrcamentoIds.add(id))
        }
      })
      console.log(`[ETAPA 5] Total de IDs de itens coletados: ${itemOrcamentoIds.size}`)
      
      console.log(`[ETAPA 5] Buscando itens de orçamento da API...`)
      const allItemOrcamentos = await fetchItemOrcamentosByIds(Array.from(itemOrcamentoIds))
      console.log(`[ETAPA 5] Itens de orçamento encontrados: ${allItemOrcamentos.length}`)

      // Criar mapa de itens por orçamento (usando item_orcamento_list como chave)
      const itensPorOrcamento = new Map<string, ItemOrcamento[]>()
      filteredOrcamentos.forEach(orcamento => {
        const itemList = (orcamento as any).item_orcamento_list
        if (Array.isArray(itemList)) {
          const itens = allItemOrcamentos.filter(item => itemList.includes(item._id))
          itensPorOrcamento.set(orcamento._id, itens)
        } else {
          itensPorOrcamento.set(orcamento._id, [])
        }
      })

      // ETAPA 6: Calcular métricas de margem
      console.log(`[ETAPA 6] Calculando métricas de margem...`)
      
      // Calcular métricas gerais
      const geralMetrics = calculateMarginMetrics(filteredOrcamentos, itensPorOrcamento)
      setGeral(geralMetrics)
      
      console.log(`[ETAPA 6] Métricas gerais calculadas:`, {
        lucro: geralMetrics.lucro.toFixed(2),
        receita: geralMetrics.receita.toFixed(2),
        margem: `${geralMetrics.margem.toFixed(2)}%`,
        total_orcamentos: filteredOrcamentos.length,
      })

      // Agrupar por núcleo
      const nucleosMap = groupOrcamentosByNucleo(filteredOrcamentos, projectsMap, itensPorOrcamento)
      const nucleosData: MarginData[] = Array.from(nucleosMap.entries())
        .map(([name, metrics]) => ({
          name,
          lucro: metrics.lucro,
          receita: metrics.receita,
          margem: metrics.margem,
        }))
        .sort((a, b) => b.receita - a.receita)
      setNucleos(nucleosData)
      console.log(`[ETAPA 6] Métricas por núcleo calculadas: ${nucleosData.length} núcleos`)

      // Agrupar por loja (marca)
      const lojasMap = groupOrcamentosByLoja(filteredOrcamentos, projectsMap, lojasNamesMap, itensPorOrcamento)
      const marcasData: MarginData[] = Array.from(lojasMap.entries())
        .map(([name, metrics]) => ({
          name,
          lucro: metrics.lucro,
          receita: metrics.receita,
          margem: metrics.margem,
        }))
        .sort((a, b) => b.receita - a.receita)
      setMarcas(marcasData)
      console.log(`[ETAPA 6] Métricas por loja calculadas: ${marcasData.length} lojas`)

      // Salvar resultado final no cache
      if (typeof window !== 'undefined' && cacheKey && timestampKey) {
        try {
          const resultToCache = {
            geral: geralMetrics,
            nucleos: nucleosData,
            marcas: marcasData,
          }
          localStorage.setItem(cacheKey, JSON.stringify(resultToCache))
          localStorage.setItem(timestampKey, Date.now().toString())
          // ETAPA 7: Salvar resultado final no cache
          const periodLabel = filters.dateRange ? getDropdownPeriodLabelFromRange(filters.dateRange) ?? 'Customizado' : 'Customizado'
          console.log(
            `[ETAPA 7] margin_cache SAVE key=${cacheKey} periodo=${periodLabel} nucleo=${filters.nucleo ?? 'Todos'} loja=${filters.loja ?? 'Todas'} vendedor=${filters.vendedor ?? 'Todos'} arquiteto=${filters.arquiteto ?? 'Todos'} geral_lucro=${geralMetrics.lucro.toFixed(2)} geral_receita=${geralMetrics.receita.toFixed(2)} geral_margem=${geralMetrics.margem.toFixed(2)}%`,
          )
        } catch (error) {
          console.log(`[ETAPA 7] Erro ao salvar cache key=${cacheKey} error=${error}`)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de margem')
      console.error('Erro ao carregar dados de margem:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarginData()
  }, [
    filters.dateRange.start,
    filters.dateRange.end,
    filters.nucleo,
    filters.loja,
    filters.vendedor,
    filters.arquiteto,
  ])

  return {
    geral,
    nucleos,
    marcas,
    previousMonth,
    loading,
    error,
    refetch: loadMarginData,
  }
}

