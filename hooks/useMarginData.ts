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

      // Buscar orçamentos do período atual
      const orcamentos = await fetchAllOrcamentos({
        dateRange: filters.dateRange,
        removido: false,
        status: ['Enviado ao cliente', 'Aprovado pelo cliente', 'Liberado para pedido'],
      })

      // Log: valor_final_taxas e orcamento_versao_list de cada orçamento
      orcamentos.forEach((orcamento, index) => {
        const valorFinalTaxas = Number((orcamento as any).valor_final_taxas ?? (orcamento as any)['Valor_final_taxas'] ?? 0) || 0
        const orcamentoVersaoList = (orcamento as any).orcamento_versao_list ?? []
        console.log(
          `orcamento[${index}] id=${orcamento._id} valor_final_taxas=${valorFinalTaxas.toFixed(2)} orcamento_versao_list=[${orcamentoVersaoList.join(', ')}]`,
        )
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

      // Coletar todos os IDs de item_orcamento_list de todos os orçamentos filtrados
      const itemOrcamentoIds = new Set<string>()
      filteredOrcamentos.forEach(orcamento => {
        const itemList = (orcamento as any).item_orcamento_list
        if (Array.isArray(itemList)) {
          itemList.forEach((id: string) => itemOrcamentoIds.add(id))
        }
      })

      // Buscar todos os itens de orçamento pelos IDs coletados
      const allItemOrcamentos = await fetchItemOrcamentosByIds(Array.from(itemOrcamentoIds))

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

      // Log: rentabilidade de cada orçamento
      // Faturamento Líquido = "Valor_final_produtos"
      // Custo do Produto = somatória da lista de item_orcamento
      let somaRentabilidade = 0
      let somaFaturamentoLiquido = 0
      let countFaturamentoLiquidoMaiorQueZero = 0
      
      filteredOrcamentos.forEach((orcamento, index) => {
        // Faturamento Líquido = "Valor_final_produtos"
        const faturamentoLiquido = Number(
          (orcamento as any)['Valor_final_produtos'] ??
            (orcamento as any).valor_final_produtos ??
            0
        ) || 0
        
        // Contar faturamentos líquidos > 0
        if (faturamentoLiquido > 0) {
          countFaturamentoLiquidoMaiorQueZero++
        }
        
        // Custo do Produto = somatória da lista de item_orcamento
        const itensDoOrcamento = itensPorOrcamento.get(orcamento._id) ?? []
        const custoDoProduto = itensDoOrcamento.reduce((sum, item) => {
          return sum + (Number(item.custo_total) || 0)
        }, 0)
        
        // Rentabilidade = Faturamento Líquido - Custo do Produto
        const rentabilidade = faturamentoLiquido - custoDoProduto
        
        somaRentabilidade += rentabilidade
        somaFaturamentoLiquido += faturamentoLiquido
        
        console.log(
          `orcamento[${index}] id=${orcamento._id} faturamento_liquido=${faturamentoLiquido.toFixed(2)} custo_do_produto=${custoDoProduto.toFixed(2)} rentabilidade=${rentabilidade.toFixed(2)}`,
        )
      })

      // Log: Margem Geral = somatória (Rentabilidade) / somatória (Faturamento Líquido)
      const margemGeral = somaFaturamentoLiquido > 0 ? (somaRentabilidade / somaFaturamentoLiquido) * 100 : 0
      console.log(
        `margem_geral soma_rentabilidade=${somaRentabilidade.toFixed(2)} soma_faturamento_liquido=${somaFaturamentoLiquido.toFixed(2)} margem_geral=${margemGeral.toFixed(2)}%`,
      )

      // Log: Margem Ponderada Núcleos = média do Faturamento Líquido
      const mediaFaturamentoLiquido = filteredOrcamentos.length > 0 ? somaFaturamentoLiquido / filteredOrcamentos.length : 0
      console.log(
        `margem_ponderada_nucleos total_orcamentos=${filteredOrcamentos.length} soma_faturamento_liquido=${somaFaturamentoLiquido.toFixed(2)} media_faturamento_liquido=${mediaFaturamentoLiquido.toFixed(2)}`,
      )

      // Log: contagem de faturamentos líquidos > 0
      console.log(
        `faturamentos_liquidos_maior_que_zero total_orcamentos=${filteredOrcamentos.length} count_faturamento_liquido_maior_que_zero=${countFaturamentoLiquidoMaiorQueZero}`,
      )

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

