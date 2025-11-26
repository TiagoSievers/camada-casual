/**
 * Hook React para buscar e gerenciar projetos
 */

import { useState, useEffect } from 'react'
import { fetchProjects, filterProjects } from '@/lib/api'
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
      
      // Buscar todos os projetos da API
      const allProjects = await fetchProjects()
      setProjects(allProjects)
      
      // Aplicar filtros
      const filtered = filterProjects(allProjects, filters)
      setFilteredProjects(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos')
      console.error('Erro ao carregar projetos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Reaplicar filtros quando mudarem
  useEffect(() => {
    const filtered = filterProjects(projects, filters)
    setFilteredProjects(filtered)
  }, [filters, projects])

  return {
    projects,
    filteredProjects,
    loading,
    error,
    refetch: loadProjects,
  }
}



