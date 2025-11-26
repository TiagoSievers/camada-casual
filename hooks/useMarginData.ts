/**
 * Hook React para buscar e calcular dados de margem e rentabilidade
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  fetchAllOrcamentos, 
  fetchAllItemOrcamentos,
  fetchProjects,
  fetchLojas,
  calculateMarginMetrics,
  groupOrcamentosByNucleo,
  groupOrcamentosByLoja,
  type MarginMetrics,
  type ItemOrcamento,
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

      // Calcular período do mês anterior para comparação
      const endDate = new Date(filters.dateRange.end)
      const startDate = new Date(filters.dateRange.start)
      
      // Calcular duração do período atual
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calcular período anterior com mesma duração
      const previousEndDate = new Date(startDate)
      previousEndDate.setDate(previousEndDate.getDate() - 1)
      const previousStartDate = new Date(previousEndDate)
      previousStartDate.setDate(previousStartDate.getDate() - periodDays + 1)

      // Buscar orçamentos do período atual
      const orcamentos = await fetchAllOrcamentos({
        dateRange: filters.dateRange,
        removido: false,
        status: ['Enviado ao cliente', 'Aprovado pelo cliente', 'Liberado para pedido'],
      })

      // Buscar orçamentos do mês anterior
      const previousOrcamentos = await fetchAllOrcamentos({
        dateRange: {
          start: previousStartDate,
          end: previousEndDate,
        },
        removido: false,
        status: ['Enviado ao cliente', 'Aprovado pelo cliente', 'Liberado para pedido'],
      })

      // Buscar projetos para mapear núcleos
      const allProjects = await fetchProjects()
      const projectsMap = new Map<string, Project>()
      allProjects.forEach(project => {
        projectsMap.set(project._id, project)
      })

      // Buscar lojas para nomes
      const lojasList = await fetchLojas(false) // false = use cache if available
      const lojasNamesMap = new Map<string, string>()
      lojasList.forEach(loja => {
        if (loja.removido === true) return // Skip removed lojas
        const name = loja.nome_da_loja || loja._id
        lojasNamesMap.set(loja._id, name)
      })
      console.log('🔵 [MARGIN] Total de lojas encontradas:', lojasList.length)
      console.log('🔵 [MARGIN] Lojas com nomes:', Array.from(lojasNamesMap.entries()).slice(0, 5))

      // Buscar todos os itens de orçamento (item_orcamento) e montar mapa por orçamento
      const allItemOrcamentos = await fetchAllItemOrcamentos()
      const itensPorOrcamento = new Map<string, ItemOrcamento[]>()
      allItemOrcamentos.forEach(item => {
        const orcamentoId = item.orcamento
        if (!orcamentoId) return
        const list = itensPorOrcamento.get(orcamentoId) ?? []
        list.push(item)
        itensPorOrcamento.set(orcamentoId, list)
      })
      console.log('🔵 [MARGIN] Total de itens de orçamento carregados:', allItemOrcamentos.length)

      // Filtrar projetos conforme filtros aplicados
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

      // Calcular métricas gerais
      const geralMetrics = calculateMarginMetrics(filteredOrcamentos, itensPorOrcamento)
      setGeral(geralMetrics)

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

      // Calcular métricas do mês anterior
      const previousFilteredOrcamentos = previousOrcamentos.filter(orcamento => {
        const projetoId = orcamento.projeto
        if (!projetoId) return false
        
        return projectsMap.has(projetoId)
      })

      const previousGeral = calculateMarginMetrics(previousFilteredOrcamentos, itensPorOrcamento)
      const previousNucleosMap = groupOrcamentosByNucleo(previousFilteredOrcamentos, projectsMap, itensPorOrcamento)
      const previousNucleos: MarginData[] = Array.from(previousNucleosMap.entries())
        .map(([name, metrics]) => ({
          name,
          lucro: metrics.lucro,
          receita: metrics.receita,
          margem: metrics.margem,
        }))
      
      const previousLojasMap = groupOrcamentosByLoja(previousFilteredOrcamentos, projectsMap, lojasNamesMap, itensPorOrcamento)
      const previousMarcas: MarginData[] = Array.from(previousLojasMap.entries())
        .map(([name, metrics]) => ({
          name,
          lucro: metrics.lucro,
          receita: metrics.receita,
          margem: metrics.margem,
        }))

      setPreviousMonth({
        geral: previousGeral,
        nucleos: previousNucleos,
        marcas: previousMarcas,
      })
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

