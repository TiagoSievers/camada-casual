'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import FunnelSection from '@/components/FunnelSection'
import ChartsSection from '@/components/ChartsSection'
import { useProjects } from '@/hooks/useProjects'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import type { DashboardFilters } from '@/types/dashboard'
import './page.css'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Inicializar filtros com período padrão (últimos 30 dias)
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      dateRange: { start, end },
      nucleo: null,
      loja: null,
      vendedor: null,
      arquiteto: null,
    }
  })

  // Buscar opções de filtros
  const { options: filterOptions, loading: optionsLoading } = useFilterOptions()
  
  // Buscar projetos com filtros
  const { filteredProjects, loading: projectsLoading, error } = useProjects(filters)

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-content" style={{ marginLeft: sidebarOpen ? '256px' : '0' }}>
        <Header 
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
        />
        <div className="dashboard-content">
          {error && (
            <div style={{ padding: '16px', background: '#fee', color: '#c00', borderRadius: '8px', margin: '16px' }}>
              Erro ao carregar dados: {error}
            </div>
          )}
          {(optionsLoading || projectsLoading) && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              Carregando...
            </div>
          )}
          {!optionsLoading && !projectsLoading && !error && (
            <>
              <FunnelSection projects={filteredProjects} />
              <ChartsSection projects={filteredProjects} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

