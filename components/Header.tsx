'use client'

import { useState } from 'react'
import './Header.css'
import type { DashboardFilters, FilterOptions, Nucleo, ProjectStatus } from '@/types/dashboard'
import type { TabType } from '@/components/Sidebar'

interface HeaderProps {
  filters: DashboardFilters
  filterOptions: FilterOptions
  onFiltersChange: (filters: DashboardFilters) => void
  activeTab?: TabType
}

type DateRangePreset = 'last7days' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom'

export default function Header({ filters, filterOptions, onFiltersChange, activeTab = 'status' }: HeaderProps) {
  // Calcular períodos pré-definidos
  const getDateRangeForPreset = (preset: DateRangePreset): { start: Date; end: Date } => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()

    switch (preset) {
      case 'last7days':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case 'thisMonth':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'thisQuarter':
        const currentMonth = start.getMonth()
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3
        start.setMonth(quarterStartMonth, 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'thisYear':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
      default:
        // Para custom, manter as datas atuais
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
    }

    return { start, end }
  }

  // Detectar qual preset está ativo baseado nas datas
  const getCurrentPreset = (): DateRangePreset => {
    if (!filters.dateRange) return 'last7days'
    
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    const now = new Date()
    
    // Normalizar datas para comparação (apenas data, sem hora)
    const normalizeDate = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    
    const startTime = normalizeDate(start)
    const endTime = normalizeDate(end)
    const nowTime = normalizeDate(now)
    
    // Verificar se é "Últimos 7 dias"
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last7DaysTime = normalizeDate(last7Days)
    if (startTime === last7DaysTime && endTime >= nowTime - 86400000) {
      return 'last7days'
    }
    
    // Verificar se é "Este Mês"
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthStartTime = normalizeDate(thisMonthStart)
    if (startTime === thisMonthStartTime && endTime >= nowTime - 86400000) {
      return 'thisMonth'
    }
    
    // Verificar se é "Este Trimestre"
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    const thisQuarterStart = new Date(now.getFullYear(), quarterStartMonth, 1)
    const thisQuarterStartTime = normalizeDate(thisQuarterStart)
    if (startTime === thisQuarterStartTime && endTime >= nowTime - 86400000) {
      return 'thisQuarter'
    }
    
    // Verificar se é "Este Ano"
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearStartTime = normalizeDate(thisYearStart)
    if (startTime === thisYearStartTime && endTime >= nowTime - 86400000) {
      return 'thisYear'
    }
    
    // Se não corresponde a nenhum preset, usar "Últimos 7 dias" como padrão
    return 'last7days'
  }

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Para custom, manter as datas atuais ou usar um período padrão
      return
    }
    
    const { start, end } = getDateRangeForPreset(preset)
    onFiltersChange({
      ...filters,
      dateRange: { start, end },
    })
  }

  const handleNucleoChange = (nucleo: Nucleo | null) => {
    onFiltersChange({
      ...filters,
      nucleo,
    })
  }

  const handleLojaChange = (loja: string | null) => {
    onFiltersChange({
      ...filters,
      loja,
    })
  }

  const handleVendedorChange = (vendedor: string | null) => {
    onFiltersChange({
      ...filters,
      vendedor,
    })
  }

  const handleArquitetoChange = (arquiteto: string | null) => {
    onFiltersChange({
      ...filters,
      arquiteto,
    })
  }

  const handleStatusChange = (status: ProjectStatus | null) => {
    onFiltersChange({
      ...filters,
      status,
    })
  }

  // Determinar quais filtros mostrar baseado na aba ativa
  const showVendedorArquiteto = activeTab !== 'status'
  const showStatus = activeTab === 'status'

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="header-top-section">
          <div className="header-left-group">
            <img 
              src="https://1031175002200b361ff427a3391f739a.cdn.bubble.io/f1725666407339x738660638395827200/marca-casual-pt-internas.svg?_gl=1*gwftgc*_gcl_au*ODU3OTU3Njg5LjE3NjMxNDQxMDU.*_ga*MTYxNTMyMzA4Ni4xNzYzMTQ0MTA1*_ga_BFPVR2DEE2*czE3NjM5ODQ5NzEkbzUkZzEkdDE3NjM5OTE4NzMkajU4JGwwJGgw" 
              alt="Casual Móveis" 
              className="header-logo-img"
            />
            <div className="header-title-wrapper">
              <h3 className="page-title">Dashboard Executivo - CRM</h3>
              <p className="page-subtitle">
                {activeTab === 'status' && 'Status de Projetos - Visão Geral do Pipeline'}
                {activeTab === 'margin' && 'Margem & Rentabilidade - Análise de margens'}
                {activeTab === 'performance' && 'Performance Comercial - Vendedores e arquitetos'}
                {activeTab === 'rankings' && 'TOP 10 Rankings - Produtos e clientes'}
              </p>
            </div>
          </div>
        </div>
        <div className="header-filters">
          <select
            className="filter-button"
            value={getCurrentPreset()}
            onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
          >
            <option value="last7days">Últimos 7 dias</option>
            <option value="thisMonth">Este Mês</option>
            <option value="thisQuarter">Este Trimestre</option>
            <option value="thisYear">Este Ano</option>
          </select>
          <select
            className="filter-button"
            value={filters.nucleo || ''}
            onChange={(e) => handleNucleoChange(e.target.value as Nucleo || null)}
          >
            <option value="">Todos Núcleos</option>
            {filterOptions.nucleos.map(nucleo => (
              <option key={nucleo.id} value={nucleo.id}>{nucleo.name}</option>
            ))}
          </select>
          <select
            className="filter-button"
            value={filters.loja || ''}
            onChange={(e) => handleLojaChange(e.target.value || null)}
          >
            <option value="">Todas Lojas</option>
            {filterOptions.lojas.map(loja => (
              <option key={loja.id} value={loja.id}>{loja.name}</option>
            ))}
          </select>
          {showStatus && (
            <select
              className="filter-button"
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus || null)}
            >
              <option value="">Todos Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Pausado">Pausado</option>
              <option value="Inativo">Inativo</option>
            </select>
          )}
          {showVendedorArquiteto && (
            <>
              <select
                className="filter-button"
                value={filters.vendedor || ''}
                onChange={(e) => handleVendedorChange(e.target.value || null)}
              >
                <option value="">Todos Vendedores</option>
                {filterOptions.vendedores.map(vendedor => (
                  <option key={vendedor.id} value={vendedor.id}>{vendedor.name}</option>
                ))}
              </select>
              <select
                className="filter-button"
                value={filters.arquiteto || ''}
                onChange={(e) => handleArquitetoChange(e.target.value || null)}
              >
                <option value="">Todos Arquitetos</option>
                {filterOptions.arquitetos.map(arquiteto => (
                  <option key={arquiteto.id} value={arquiteto.id}>{arquiteto.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

