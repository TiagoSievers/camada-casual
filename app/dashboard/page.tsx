'use client'

import { useState } from 'react'
import Sidebar, { type TabType } from '@/components/Sidebar'
import Header from '@/components/Header'
import FunnelSection from '@/components/FunnelSection'
import ChartsSection from '@/components/ChartsSection'
import MarginProfitabilitySection from '@/components/MarginProfitabilitySection'
import { useProjects } from '@/hooks/useProjects'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import type { DashboardFilters } from '@/types/dashboard'
import './page.css'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('status')
  
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

  const renderContent = () => {
    if (error) {
      return (
        <div style={{ padding: '16px', background: '#fee', color: '#c00', borderRadius: '8px', margin: '16px' }}>
          Erro ao carregar dados: {error}
        </div>
      )
    }

    if (optionsLoading || projectsLoading) {
      return (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          Carregando...
        </div>
      )
    }

    switch (activeTab) {
      case 'status':
        return (
          <>
            <FunnelSection projects={filteredProjects} />
            <ChartsSection projects={filteredProjects} />
          </>
        )
      case 'margin':
        return (
          <MarginProfitabilitySection 
            projects={filteredProjects} 
            filters={filters}
          />
        )
      case 'performance':
        return (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            Performance Comercial - Em desenvolvimento
          </div>
        )
      case 'rankings':
        return (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            TOP 10 Rankings - Em desenvolvimento
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="main-content" style={{ marginLeft: sidebarOpen ? '256px' : '0' }}>
        <Header 
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
        />
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

