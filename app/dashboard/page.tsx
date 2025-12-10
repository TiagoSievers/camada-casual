'use client'

import { useState } from 'react'
import Sidebar, { type TabType } from '@/components/Sidebar'
import Header from '@/components/Header'
import FunnelSection from '@/components/FunnelSection'
import ChartsSection from '@/components/ChartsSection'
import MarginProfitabilitySection from '@/components/MarginProfitabilitySection'
import PerformanceComercialSection from '@/components/PerformanceComercialSection'
import Top10Section from '@/components/Top10Section'
import { useProjects } from '@/hooks/useProjects'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import type { DashboardFilters } from '@/types/dashboard'
import './page.css'

function createInitialFilters(): DashboardFilters {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date()
  start.setDate(start.getDate() - 7)
  start.setHours(0, 0, 0, 0)

  return {
    dateRange: { start, end },
    nucleo: null,
    loja: null,
    vendedor: null,
    arquiteto: null,
    status: null,
  }
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('status')
  
  // Inicializar filtros com período padrão (últimos 7 dias)
  const [filters, setFilters] = useState<DashboardFilters>(() => createInitialFilters())
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Sempre que trocar de seção, resetar todos os filtros para o estado inicial
    setFilters(createInitialFilters())
  }
 
  // Buscar projetos com filtros (chamada ÚNICA de projetos)
  // NOVA ABORDAGEM: Agora também retorna orçamentos já buscados
  const { projects: allProjects, filteredProjects, orcamentos, loading: projectsLoading, error } = useProjects(filters)

  // Buscar opções de filtros (núcleos são carregados automaticamente de TODOS os orçamentos)
  const { options: filterOptions, loading: optionsLoading, loadLojas, loadVendedores, loadArquitetos } = useFilterOptions()

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
            <FunnelSection 
              projects={filteredProjects} 
              allProjects={allProjects}
              orcamentos={orcamentos}
              filters={filters}
            />
            <ChartsSection projects={allProjects} />
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
          <PerformanceComercialSection filters={filters} />
        )
      case 'rankings':
        return (
          <Top10Section filters={filters} />
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
        onTabChange={handleTabChange}
      />
      <div className="main-content" style={{ marginLeft: sidebarOpen ? '256px' : '0' }}>
        <Header 
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
          activeTab={activeTab}
          onLoadLojas={loadLojas}
          onLoadVendedores={loadVendedores}
          onLoadArquitetos={loadArquitetos}
        />
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

