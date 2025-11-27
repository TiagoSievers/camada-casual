/**
 * Hook React para buscar e calcular dados do TOP 10
 */

import { useState, useEffect } from 'react'
import type { DashboardFilters, Nucleo, Project } from '@/types/dashboard'
import { extractVendedorIds } from '@/types/dashboard'
import { fetchAllOrcamentos, fetchProjects, fetchClientes } from '@/lib/api'

interface Top10Item {
  id: string
  name: string
  value: number
}

interface UseTop10DataReturn {
  produtos: Top10Item[]
  clientes: Top10Item[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refreshClientes: () => Promise<void>
}

export function useTop10Data(filters: DashboardFilters): UseTop10DataReturn {
  const [produtos, setProdutos] = useState<Top10Item[]>([])
  const [clientes, setClientes] = useState<Top10Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTop10Data = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar orçamentos do período filtrado
      const orcamentos = await fetchAllOrcamentos({
        dateRange: filters.dateRange,
        removido: false,
      })

      // Buscar projetos para obter informações de cliente
      const allProjects = await fetchProjects(filters)
      
      // Filtrar projetos conforme filtros aplicados (núcleo, loja, vendedor, arquiteto)
      const filteredProjects = allProjects.filter(project => {
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

      const projectsMap = new Map<string, Project>()
      filteredProjects.forEach(project => {
        projectsMap.set(project._id, project)
      })

      // Filtrar orçamentos pelos projetos filtrados
      const filteredOrcamentos = orcamentos.filter(orcamento => {
        const projetoId = orcamento.projeto
        if (!projetoId) return false
        
        return projectsMap.has(projetoId)
      })

      // Agrupar orçamentos por cliente e calcular valores
      const clientesMap = new Map<string, { name: string; value: number }>()

      filteredOrcamentos.forEach(orcamento => {
        // Obter cliente do projeto associado ao orçamento
        const projetoId = orcamento.projeto
        if (!projetoId) return

        const projeto = projectsMap.get(projetoId)
        if (!projeto || !projeto.cliente) return

        const clienteId = projeto.cliente
        const clienteName = projeto.titulo || `Cliente ${clienteId}` // Usar título do projeto como nome do cliente temporariamente

        // Calcular valor do orçamento (Faturamento Líquido)
        const faturamentoLiquido = Number(
          (orcamento as any)['Valor_final_produtos'] ??
            (orcamento as any).valor_final_produtos ??
            0
        ) || 0

        // Acumular valor por cliente
        const existing = clientesMap.get(clienteId) || { name: clienteName, value: 0 }
        clientesMap.set(clienteId, {
          name: existing.name,
          value: existing.value + faturamentoLiquido,
        })
      })

      // Buscar nomes reais dos clientes
      const allClientes = await fetchClientes(false)
      const clientesNamesMap = new Map<string, string>()
      allClientes.forEach(cliente => {
        const nome = cliente['Nome do Cliente'] || cliente._id
        clientesNamesMap.set(cliente._id, nome)
      })

      // Converter para array, atualizar nomes e ordenar por valor
      const clientesData: Top10Item[] = Array.from(clientesMap.entries())
        .map(([id, data]) => {
          // Usar nome real do cliente se disponível
          const nomeReal = clientesNamesMap.get(id) || data.name
          return {
            id,
            name: nomeReal,
            value: data.value,
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10

      setClientes(clientesData)
      setProdutos([]) // TODO: Implementar produtos
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de TOP 10')
      console.error('Erro ao carregar dados de TOP 10:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTop10Data()
  }, [
    filters.dateRange.start,
    filters.dateRange.end,
    filters.nucleo,
    filters.loja,
    filters.vendedor,
    filters.arquiteto,
  ])

  return {
    produtos,
    clientes,
    loading,
    error,
    refetch: loadTop10Data,
    refreshClientes: loadTop10Data,
  }
}
