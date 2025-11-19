/**
 * Hook para buscar opções de filtros (núcleos, lojas, vendedores, arquitetos)
 */

import { useState, useEffect } from 'react'
import { fetchProjects } from '@/lib/api'
import type { Project, FilterOptions, Nucleo } from '@/types/dashboard'

interface UseFilterOptionsReturn {
  options: FilterOptions
  loading: boolean
  error: string | null
}

export function useFilterOptions(): UseFilterOptionsReturn {
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

        // Buscar projetos para extrair opções
        const projects = await fetchProjects()

        // Extrair núcleos únicos
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

        // Extrair lojas únicas
        const lojasMap = new Map<string, { id: string; nucleoId?: Nucleo }>()
        projects.forEach(project => {
          if (project.loja) {
            if (!lojasMap.has(project.loja)) {
              lojasMap.set(project.loja, {
                id: project.loja,
                nucleoId: project.nucleo_lista?.[0], // Usar primeiro núcleo como referência
              })
            }
          }
        })
        const lojas = Array.from(lojasMap.values()).map(loja => ({
          id: loja.id,
          name: loja.id, // TODO: Buscar nome da loja se houver API específica
          nucleoId: loja.nucleoId,
        }))

        // Extrair vendedores únicos
        const vendedoresMap = new Map<string, { id: string; nucleo: Nucleo[] }>()
        projects.forEach(project => {
          // Extrair todos os IDs de vendedores
          const vendedorIds = extractVendedorIds(project)
          vendedorIds.forEach(id => {
            if (!vendedoresMap.has(id)) {
              vendedoresMap.set(id, {
                id,
                nucleo: project.nucleo_lista || [],
              })
            } else {
              // Adicionar núcleos adicionais se não estiverem na lista
              const existing = vendedoresMap.get(id)!
              if (project.nucleo_lista) {
                project.nucleo_lista.forEach(n => {
                  if (!existing.nucleo.includes(n)) {
                    existing.nucleo.push(n)
                  }
                })
              }
            }
          })
        })
        const vendedores = Array.from(vendedoresMap.values()).map(v => ({
          id: v.id,
          name: v.id, // TODO: Buscar nome do vendedor se houver API específica
          type: 'vendedor' as const, // TODO: Determinar tipo (vendedor/gerente) se houver campo
          nucleo: v.nucleo,
        }))

        // Extrair arquitetos únicos
        const arquitetosMap = new Map<string, string>()
        projects.forEach(project => {
          if (project.arquiteto) {
            arquitetosMap.set(project.arquiteto, project.arquiteto)
          }
        })
        const arquitetos = Array.from(arquitetosMap.entries()).map(([id, name]) => ({
          id,
          name, // TODO: Buscar nome do arquiteto se houver API específica
        }))

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
  }, [])

  return { options, loading, error }
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


