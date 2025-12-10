/**
 * Hook React para buscar e gerenciar projetos
 */

import { useState, useEffect } from 'react'
import { fetchOrcamentosAndProjects, type Orcamento } from '@/lib/api'
import type { Project, DashboardFilters } from '@/types/dashboard'

interface UseProjectsReturn {
  projects: Project[]
  filteredProjects: Project[]
  orcamentos: Orcamento[] // NOVO: Orçamentos já buscados
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProjects(filters: DashboardFilters): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]) // NOVO: Orçamentos
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // NOVA ABORDAGEM: Buscar orçamentos primeiro, depois projetos relacionados
      // Isso elimina a necessidade de buscar projetos e depois orçamentos
      const { orcamentos: fetchedOrcamentos, projects: fetchedProjects } = await fetchOrcamentosAndProjects(filters)
      
      // Os projetos já vêm filtrados por todos os critérios (data, status, núcleo, loja, vendedor, arquiteto)
      setProjects(fetchedProjects)
      setFilteredProjects(fetchedProjects) // filteredProjects agora é sempre igual a projects, pois filtros já foram aplicados
      setOrcamentos(fetchedOrcamentos) // Salvar orçamentos também
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos')
      console.error('Erro ao carregar projetos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [filters])

  return {
    projects,
    filteredProjects,
    orcamentos, // NOVO: Retornar orçamentos também
    loading,
    error,
    refetch: loadProjects,
  }
}



