'use client'

import { useState } from 'react'
import './Header.css'
import type { DashboardFilters, FilterOptions, Nucleo } from '@/types/dashboard'

interface HeaderProps {
  filters: DashboardFilters
  filterOptions: FilterOptions
  onFiltersChange: (filters: DashboardFilters) => void
}

export default function Header({ filters, filterOptions, onFiltersChange }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Formatar data para exibição
  const formatDateRange = () => {
    if (!filters.dateRange) return 'Selecione o período'
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  const handleDateChange = (start: Date, end: Date) => {
    onFiltersChange({
      ...filters,
      dateRange: { start, end },
    })
    setShowDatePicker(false)
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

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="header-top-section">
          <div className="header-left-group">
            <img 
              src="0856ee234df592a0c29f3505e8b32441998b3c29.png" 
              alt="Casual Móveis" 
              className="header-logo-img"
            />
            <div className="header-title-wrapper">
              <h3 className="page-title">Dashboard Executivo - CRM</h3>
              <p className="page-subtitle">Status de Projetos - Visão Geral do Pipeline</p>
            </div>
          </div>
          <div className="header-right-group">
            <div style={{ position: 'relative' }}>
              <button 
                className="date-button"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="calendar-icon">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                {formatDateRange()}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                }}>
                  <input
                    type="date"
                    value={filters.dateRange?.start instanceof Date ? filters.dateRange.start.toISOString().split('T')[0] : filters.dateRange?.start || ''}
                    onChange={(e) => {
                      const start = e.target.value ? new Date(e.target.value) : new Date()
                      const end = filters.dateRange?.end instanceof Date ? filters.dateRange.end : new Date(filters.dateRange?.end || new Date())
                      handleDateChange(start, end)
                    }}
                    style={{ marginBottom: '8px', padding: '8px', width: '100%' }}
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end instanceof Date ? filters.dateRange.end.toISOString().split('T')[0] : filters.dateRange?.end || ''}
                    onChange={(e) => {
                      const start = filters.dateRange?.start instanceof Date ? filters.dateRange.start : new Date(filters.dateRange?.start || new Date())
                      const end = e.target.value ? new Date(e.target.value) : new Date()
                      handleDateChange(start, end)
                    }}
                    style={{ padding: '8px', width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="header-filters">
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
        </div>
      </div>
    </header>
  )
}

