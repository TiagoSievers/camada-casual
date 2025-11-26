/**
 * Hook React para buscar e calcular dados do TOP 10
 */

import { useState, useEffect } from 'react'
import type { DashboardFilters } from '@/types/dashboard'

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

      // TODO: Implementar busca de produtos e clientes
      // Por enquanto, retorna arrays vazios
      setProdutos([])
      setClientes([])
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
