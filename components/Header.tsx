'use client'

import { useState, useRef, useEffect } from 'react'
import './Header.css'
import type { DashboardFilters, FilterOptions, Nucleo } from '@/types/dashboard'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HeaderProps {
  filters: DashboardFilters
  filterOptions: FilterOptions
  onFiltersChange: (filters: DashboardFilters) => void
}

export default function Header({ filters, filterOptions, onFiltersChange }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isSelectingEnd, setIsSelectingEnd] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Inicializar mês atual baseado na data selecionada ou hoje
  const getCurrentMonth = () => {
    if (filters.dateRange?.start) {
      return new Date(filters.dateRange.start)
    }
    return new Date()
  }
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

  // Atualizar mês quando abrir o calendário
  useEffect(() => {
    if (showDatePicker) {
      const newMonth = filters.dateRange?.start 
        ? new Date(filters.dateRange.start)
        : new Date()
      setCurrentMonth(newMonth)
    }
  }, [showDatePicker, filters.dateRange?.start])

  // Fechar calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

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
  }

  const handleDateSelect = (date: Date) => {
    const start = filters.dateRange?.start ? new Date(filters.dateRange.start) : null
    const end = filters.dateRange?.end ? new Date(filters.dateRange.end) : null

    // Normalizar as datas para comparar apenas dia/mês/ano (sem hora)
    const normalizeDate = (d: Date) => {
      const normalized = new Date(d)
      normalized.setHours(0, 0, 0, 0)
      return normalized
    }

    const normalizedDate = normalizeDate(date)
    const normalizedStart = start ? normalizeDate(start) : null
    const normalizedEnd = end ? normalizeDate(end) : null

    // Se não há data inicial, definir como inicial
    if (!normalizedStart) {
      handleDateChange(date, date)
      setIsSelectingEnd(true) // Próximo clique será para definir a data final
      return
    }

    // Se há data inicial mas não há final, ou se ambas são iguais
    if (!normalizedEnd || (normalizedStart && normalizedEnd && isSameDay(normalizedStart, normalizedEnd))) {
      // Se a data clicada é igual à inicial e ainda não há final definida, não fazer nada
      if (isSameDay(normalizedDate, normalizedStart) && !normalizedEnd) {
        return
      }
      
      // Se a data clicada é anterior à inicial, trocar (nova vira inicial, antiga vira final)
      if (isBefore(normalizedDate, normalizedStart)) {
        handleDateChange(date, start!)
        setIsSelectingEnd(false) // Resetar para começar nova seleção
      } else {
        // Caso contrário, definir como final
        handleDateChange(start!, date)
        setIsSelectingEnd(false) // Resetar para começar nova seleção
      }
      return
    }

    // Se ambas as datas estão selecionadas, começar uma nova seleção
    // Nova seleção - começar do zero
    handleDateChange(date, date)
    setIsSelectingEnd(true) // Próximo clique será para definir a data final
  }

  const handleStartDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value)
      const end = filters.dateRange?.end ? new Date(filters.dateRange.end) : date
      handleDateChange(date, end)
      setCurrentMonth(date)
    }
  }

  const handleEndDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value)
      const start = filters.dateRange?.start ? new Date(filters.dateRange.start) : date
      if (isBefore(date, start)) {
        handleDateChange(date, start)
      } else {
        handleDateChange(start, date)
      }
      setCurrentMonth(date)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const startDate = filters.dateRange?.start ? new Date(filters.dateRange.start) : null
  const endDate = filters.dateRange?.end ? new Date(filters.dateRange.end) : null
  const today = new Date()

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
              src="https://1031175002200b361ff427a3391f739a.cdn.bubble.io/f1725666407339x738660638395827200/marca-casual-pt-internas.svg?_gl=1*gwftgc*_gcl_au*ODU3OTU3Njg5LjE3NjMxNDQxMDU.*_ga*MTYxNTMyMzA4Ni4xNzYzMTQ0MTA1*_ga_BFPVR2DEE2*czE3NjM5ODQ5NzEkbzUkZzEkdDE3NjM5OTE4NzMkajU4JGwwJGgw" 
              alt="Casual Móveis" 
              className="header-logo-img"
            />
            <div className="header-title-wrapper">
              <h3 className="page-title">Dashboard Executivo - CRM</h3>
              <p className="page-subtitle">Status de Projetos - Visão Geral do Pipeline</p>
            </div>
          </div>
          <div className="header-right-group">
            <div style={{ position: 'relative' }} ref={datePickerRef}>
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
                <div className="custom-date-picker">
                  <div className="date-picker-inputs">
                    <div className="date-input-wrapper">
                      <label className="date-input-label">Data Inicial</label>
                      <input
                        type="date"
                        className="date-input"
                        value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                        onChange={handleStartDateInput}
                      />
                    </div>
                    <div className="date-input-wrapper">
                      <label className="date-input-label">Data Final</label>
                      <input
                        type="date"
                        className="date-input"
                        value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                        onChange={handleEndDateInput}
                      />
                    </div>
                  </div>
                  <div className="calendar-container">
                    <div className="calendar-header">
                      <button 
                        className="calendar-nav-button"
                        onClick={() => navigateMonth('prev')}
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6"></path>
                        </svg>
                      </button>
                      <h3 className="calendar-month-year">
                        {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
                      </h3>
                      <button 
                        className="calendar-nav-button"
                        onClick={() => navigateMonth('next')}
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="calendar-weekdays">
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                        <div key={day} className="calendar-weekday">{day}</div>
                      ))}
                    </div>
                    <div className="calendar-days">
                      {days.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        
                        // Normalizar datas para comparação (apenas dia/mês/ano)
                        const normalizeForComparison = (d: Date) => {
                          const normalized = new Date(d)
                          normalized.setHours(0, 0, 0, 0)
                          return normalized
                        }
                        
                        const normalizedDay = normalizeForComparison(day)
                        const normalizedStart = startDate ? normalizeForComparison(startDate) : null
                        const normalizedEnd = endDate ? normalizeForComparison(endDate) : null
                        
                        // Verificar se é data inicial ou final
                        const isStart = normalizedStart && isSameDay(normalizedDay, normalizedStart)
                        const isEnd = normalizedEnd && isSameDay(normalizedDay, normalizedEnd) && !isStart // Se for ambas, priorizar start
                        
                        const isToday = isSameDay(day, today)
                        
                        // Verificar se está no intervalo (entre start e end, excluindo os próprios start e end)
                        const isInRange = normalizedStart && normalizedEnd && 
                          !isSameDay(normalizedStart, normalizedEnd) && // Só mostrar range se forem diferentes
                          isWithinInterval(day, { start: startDate!, end: endDate! }) &&
                          !isStart && !isEnd

                        return (
                          <button
                            key={idx}
                            className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other-month' : ''} ${isStart ? 'calendar-day-start' : ''} ${isEnd ? 'calendar-day-end' : ''} ${isInRange ? 'calendar-day-in-range' : ''} ${isToday && !isStart && !isEnd && !isInRange ? 'calendar-day-today' : ''}`}
                            onClick={() => handleDateSelect(day)}
                            disabled={!isCurrentMonth}
                            type="button"
                          >
                            {format(day, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
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

