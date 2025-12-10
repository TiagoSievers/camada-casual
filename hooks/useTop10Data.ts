/**
 * Hook React para buscar e calcular dados do TOP 10
 */

import { useState, useEffect } from 'react'
import type { DashboardFilters, Nucleo, Project } from '@/types/dashboard'
import { extractVendedorIds } from '@/types/dashboard'
import { fetchAllOrcamentos, fetchProjects, fetchClientes, fetchItemOrcamentosByOrcamentoIds, type ItemOrcamento } from '@/lib/api'

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

      // Buscar itens de orçamento para calcular TOP 10 produtos
      // Buscar diretamente pelo campo 'orcamento' usando constraint 'in'
      if (filteredOrcamentos.length > 0) {
        const orcamentoIds = filteredOrcamentos.map(orc => orc._id)
        console.log(`[TOP10] Buscando itens de orçamento da API usando orcamento IDs (${orcamentoIds.length} orçamentos)...`)
        const allItemOrcamentos = await fetchItemOrcamentosByOrcamentoIds(orcamentoIds)
        console.log(`[TOP10] Itens de orçamento encontrados: ${allItemOrcamentos.length}`)

        // Agrupar itens por produto e calcular métricas
        const produtosMap = new Map<string, { nome: string; quantidade: number; receita: number }>()

        allItemOrcamentos.forEach(item => {
          const produtoId = item.produto
          if (!produtoId) return

          // Buscar nome do produto (campo disponível em item_orcamento)
          const nomeProduto = (item as any)['nome_do_produto'] || 
                             (item as any)['descricao_do_produto'] || 
                             (item as any)['artigo'] ||
                             `Produto ${produtoId.slice(0, 8)}...`

          const quantidade = Number(item.quantidade) || 0
          const precoTotal = Number(item.preco_total) || 0

          const existing = produtosMap.get(produtoId)
          if (existing) {
            // Produto já existe, acumular valores
            produtosMap.set(produtoId, {
              nome: existing.nome, // Manter o primeiro nome encontrado
              quantidade: existing.quantidade + quantidade,
              receita: existing.receita + precoTotal,
            })
          } else {
            // Primeira ocorrência do produto
            produtosMap.set(produtoId, {
              nome: nomeProduto,
              quantidade: quantidade,
              receita: precoTotal,
            })
          }
        })

        // Converter para array, ordenar por receita e pegar TOP 10
        const produtosData: Top10Item[] = Array.from(produtosMap.entries())
          .map(([id, data]) => {
            return {
              id,
              name: data.nome, // Usar nome real do produto
              value: data.receita, // Ordenar por receita total
            }
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10

        console.log(`[TOP10] TOP 10 produtos calculados: ${produtosData.length}`)
        setProdutos(produtosData)
      } else {
        console.log(`[TOP10] Nenhum orçamento encontrado para buscar itens`)
        setProdutos([])
      }
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
