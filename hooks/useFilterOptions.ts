/**
 * Hook para montar opções de filtros (núcleos, lojas, vendedores, arquitetos)
 * usando:
 * - projetos já carregados (para núcleos)
 * - APIs específicas (lojas, vendedores, arquitetos)
 *
 * Importante: este hook NÃO chama mais a API de projetos.
 */

import { useState, useEffect } from 'react'
import { fetchLojas, fetchVendedores, fetchArquitetos } from '@/lib/api'
import type { Project, FilterOptions, Nucleo } from '@/types/dashboard'

interface UseFilterOptionsReturn {
  options: FilterOptions
  loading: boolean
  error: string | null
}

export function useFilterOptions(projects: Project[]): UseFilterOptionsReturn {
  const [options, setOptions] = useState<FilterOptions>({
    nucleos: [],
    lojas: [],
    vendedores: [],
    arquitetos: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoading(true)
        setError(null)

        // Extrair núcleos únicos a partir dos projetos recebidos
        const nucleosSet = new Set<Nucleo>()
        projects.forEach(project => {
          if (project.nucleo_lista) {
            project.nucleo_lista.forEach(nucleo => nucleosSet.add(nucleo))
          }
        })
        const nucleos = Array.from(nucleosSet).map(id => ({
          id,
          name: id, // TODO: Buscar nome do núcleo se houver API específica
        }))

        // Buscar TODAS as lojas da API (apenas filtrar removidas)
        const lojasData = await fetchLojas(false) // false = use cache if available
        const lojas = lojasData
          .filter(loja => {
            // Pular apenas lojas removidas
            return loja.removido !== true
          })
          .map(loja => ({
            id: loja._id,
            name: loja.nome_da_loja || loja._id,
            nucleoId: undefined, // TODO: Se houver relação núcleo-loja na API
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        // Buscar TODOS os vendedores da API (apenas filtrar removidos/inativos)
        const vendedoresData = await fetchVendedores(false) // false = use cache if available
        const vendedores = vendedoresData
          .filter(vendedor => {
            // Pular vendedores removidos
            if (vendedor.removido === true) return false
            // Pular vendedores inativos
            if (vendedor['status_do_vendedor'] && vendedor['status_do_vendedor'] !== 'ATIVO') return false
            return true
          })
          .map(vendedor => ({
            id: vendedor._id,
            name: vendedor.nome || vendedor._id,
            type: 'vendedor' as const, // TODO: Determinar tipo (vendedor/gerente) se houver campo
            nucleo: [], // TODO: Se houver relação vendedor-núcleo na API
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        // Buscar TODOS os arquitetos da API (apenas filtrar removidos/inativos)
        const arquitetosData = await fetchArquitetos(false) // false = use cache if available
        const arquitetos = arquitetosData
          .filter(arquiteto => {
            // Pular arquitetos removidos
            if (arquiteto.removido === true) return false
            // Pular arquitetos inativos
            if (arquiteto['Status do Arquiteto'] && arquiteto['Status do Arquiteto'] !== 'ATIVO') return false
            return true
          })
          .map(arquiteto => ({
            id: arquiteto._id,
            name: arquiteto['Nome do Arquiteto'] || arquiteto._id,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        setOptions({
          nucleos,
          lojas,
          vendedores,
          arquitetos,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar opções de filtros')
        console.error('Erro ao carregar opções:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [projects])

  return { options, loading, error }
}



