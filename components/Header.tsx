'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale/pt-BR'
import 'react-datepicker/dist/react-datepicker.css'
import './Header.css'
import type { DashboardFilters, FilterOptions, Nucleo, OrcamentoStatusFilter } from '@/types/dashboard'
import type { TabType } from '@/components/Sidebar'

// Registrar localização em português
registerLocale('pt-BR', ptBR)

interface HeaderProps {
  filters: DashboardFilters
  filterOptions: FilterOptions
  onFiltersChange: (filters: DashboardFilters) => void
  activeTab?: TabType
}

type DateRangePreset = 'last7days' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom'

export default function Header({ filters, filterOptions, onFiltersChange, activeTab = 'status' }: HeaderProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date(filters.dateRange.start))
  const [endDate, setEndDate] = useState<Date>(new Date(filters.dateRange.end))
  const [isCustomDateRange, setIsCustomDateRange] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  const matchesPreset = (): boolean => {
    if (!filters.dateRange) return false
    
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    const now = new Date()
    
    const normalizeDate = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    
    const startTime = normalizeDate(start)
    const endTime = normalizeDate(end)
    const nowTime = normalizeDate(now)
    
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last7DaysTime = normalizeDate(last7Days)
    if (startTime === last7DaysTime && endTime >= nowTime - 86400000) return true
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthStartTime = normalizeDate(thisMonthStart)
    if (startTime === thisMonthStartTime && endTime >= nowTime - 86400000) return true
    
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoTime = normalizeDate(threeMonthsAgo)
    const daysDiff = Math.abs((startTime - threeMonthsAgoTime) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 2 && endTime >= nowTime - 86400000) return true
    
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearStartTime = normalizeDate(thisYearStart)
    if (startTime === thisYearStartTime && endTime >= nowTime - 86400000) return true
    
    return false
  }

  useEffect(() => {
    setStartDate(new Date(filters.dateRange.start))
    setEndDate(new Date(filters.dateRange.end))
    
    if (matchesPreset()) {
      setIsCustomDateRange(false)
    }
  }, [filters.dateRange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
    }

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDatePickerOpen])

  const formatDateRangeLabel = () => {
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)

    const monthShort = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short' })

    const startMonth = monthShort(start)
    const endMonth = monthShort(end)

    if (start.getFullYear() === end.getFullYear() && startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
    }

    if (start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
    }

    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    
    if (start) {
      setStartDate(start)
    }
    
    setEndDate(end || null as any)

    if (start && end) {
      const adjustedStart = new Date(start)
      adjustedStart.setHours(0, 0, 0, 0)
      
      const adjustedEnd = new Date(end)
      adjustedEnd.setHours(23, 59, 59, 999)

      setIsCustomDateRange(true)

      onFiltersChange({
        ...filters,
        dateRange: { start: adjustedStart, end: adjustedEnd },
      })
      
      setTimeout(() => setIsDatePickerOpen(false), 200)
    }
  }

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
        start.setMonth(start.getMonth() - 3)
        start.setHours(0, 0, 0, 0)
        break
      case 'thisYear':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
      default:
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
    }

    return { start, end }
  }

  const getCurrentPreset = (): DateRangePreset => {
    if (!filters.dateRange) return 'last7days'
    
    if (isCustomDateRange) {
      return 'custom'
    }
    
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    const now = new Date()
    
    const normalizeDate = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    
    const startTime = normalizeDate(start)
    const endTime = normalizeDate(end)
    const nowTime = normalizeDate(now)
    
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last7DaysTime = normalizeDate(last7Days)
    if (startTime === last7DaysTime && endTime >= nowTime - 86400000) {
      return 'last7days'
    }
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthStartTime = normalizeDate(thisMonthStart)
    if (startTime === thisMonthStartTime && endTime >= nowTime - 86400000) {
      return 'thisMonth'
    }
    
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoTime = normalizeDate(threeMonthsAgo)
    const daysDiff = Math.abs((startTime - threeMonthsAgoTime) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 2 && endTime >= nowTime - 86400000) {
      return 'thisQuarter'
    }
    
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearStartTime = normalizeDate(thisYearStart)
    if (startTime === thisYearStartTime && endTime >= nowTime - 86400000) {
      return 'thisYear'
    }
    
    return 'last7days'
  }

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      return
    }
    
    setIsCustomDateRange(false)
    
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

  const handleStatusChange = (status: OrcamentoStatusFilter | null) => {
    onFiltersChange({
      ...filters,
      status,
    })
  }

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
                {activeTab === 'status' && 'Margem & Rentabilidade - Análise de Margens'}
                {activeTab === 'margin' && 'Margem & Rentabilidade - Análise de margens'}
                {activeTab === 'performance' && 'Performance Comercial - Vendedores e arquitetos'}
                {activeTab === 'rankings' && 'TOP 10 Rankings - Produtos e clientes'}
              </p>
            </div>
          </div>
          <div className="header-right-group" ref={datePickerRef}>
            <button
              type="button"
              className="date-button"
              onClick={() => {
                setIsDatePickerOpen(!isDatePickerOpen)
              }}
            >
              <svg 
                className="calendar-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M10.6667 1.33334V4.00001" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M5.33333 1.33334V4.00001" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2 6.66667H14" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span>{formatDateRangeLabel()}</span>
              <svg 
                className="chevron-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M4 6L8 10L12 6" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isDatePickerOpen && (
              <div className="date-picker-wrapper">
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  inline
                  locale="pt-BR"
                  dateFormat="d 'de' MMM 'de' yyyy"
                  shouldCloseOnSelect={false}
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => {
                    const formatDate = (d: Date | null) => {
                      if (!d) return '--'
                      return d.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    }

                    return (
                      <div className="react-datepicker__custom-header">
                        <div className="react-datepicker__header-top">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="react-datepicker__navigation react-datepicker__navigation--previous"
                          >
                            <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous">
                              {'<'}
                            </span>
                          </button>
                          <span className="react-datepicker__current-month">
                            {date.toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            }).replace(' de ', ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="react-datepicker__navigation react-datepicker__navigation--next"
                          >
                            <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next">
                              {'>'}
                            </span>
                          </button>
                        </div>
                        <div className="react-datepicker__header-dates">
                          <span className="react-datepicker__start-date">
                            Início: {formatDate(startDate)}
                          </span>
                          <span className="react-datepicker__end-date">
                            Fim: {formatDate(endDate)}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            )}
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
            {isCustomDateRange && <option value="custom">Período Customizado</option>}
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
              onChange={(e) => handleStatusChange(e.target.value as OrcamentoStatusFilter || null)}
            >
              <option value="">Todos Status</option>
              <option value="Em Aprovação">Em Aprovação</option>
              <option value="Enviado">Enviado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
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

