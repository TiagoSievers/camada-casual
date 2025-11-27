/**
 * Hook React para buscar e gerenciar projetos
 */

import { useState, useEffect } from 'react'
import { fetchProjects, filterProjectsByOrcamentoStatus } from '@/lib/api'
import type { Project, DashboardFilters } from '@/types/dashboard'

interface UseProjectsReturn {
  projects: Project[]
  filteredProjects: Project[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProjects(filters: DashboardFilters): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar projetos da API já filtrados (tudo via URL / constraints, exceto status dos orçamentos)
      const allProjects = await fetchProjects(filters)
      setProjects(allProjects)
      
      // Aplicar filtro de status dos orçamentos se houver
      if (filters.status) {
        const filtered = await filterProjectsByOrcamentoStatus(allProjects, filters.status)
        setFilteredProjects(filtered)
      } else {
        // Sem filtro de status, usar todos os projetos
        setFilteredProjects(allProjects)
      }
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
    loading,
    error,
    refetch: loadProjects,
  }
}



