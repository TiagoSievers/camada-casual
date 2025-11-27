'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import ptBR from 'date-fns/locale/pt-BR'
import 'react-datepicker/dist/react-datepicker.css'
import './Header.css'
import type { DashboardFilters, FilterOptions, Nucleo, OrcamentoStatusFilter } from '@/types/dashboard'
import type { TabType } from '@/components/Sidebar'

// Registrar localiza├º├úo em portugu├¬s
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

  // Fun├º├úo auxiliar para verificar se as datas correspondem a um preset (sem depender de isCustomDateRange)
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
    
    // Verificar se corresponde a algum preset conhecido
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

  // Atualizar datas internas quando os filtros mudarem externamente
  useEffect(() => {
    setStartDate(new Date(filters.dateRange.start))
    setEndDate(new Date(filters.dateRange.end))
    
    // Resetar estado custom se os filtros mudarem para um preset padr├úo
    // (isso acontece quando troca de aba ou quando o dropdown ├® usado)
    if (matchesPreset()) {
      setIsCustomDateRange(false)
    }
  }, [filters.dateRange])

  // Fechar ao clicar fora
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
      // Ex.: "Nov 1 - 5, 2025"
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
    }

    // Ex.: "Nov 28 - Dec 3, 2025"
    if (start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
    }

    // Anos diferentes
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`
  }

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    
    // Atualizar estados locais conforme o usu├írio seleciona
    if (start) {
      setStartDate(start)
    }
    
    // Sempre atualizar endDate com o valor selecionado (pode ser null se ainda n├úo selecionou)
    // Isso permite que o usu├írio selecione qualquer data final, n├úo apenas hoje
    setEndDate(end || null as any)

    // Aplicar automaticamente quando ambas as datas estiverem selecionadas
    if (start && end) {
      const adjustedStart = new Date(start)
      adjustedStart.setHours(0, 0, 0, 0)
      
      const adjustedEnd = new Date(end)
      adjustedEnd.setHours(23, 59, 59, 999)

      // Marcar como range customizado (ignora o dropdown)
      setIsCustomDateRange(true)

      // Log das datas selecionadas no calend├írio (ser├úo usadas diretamente na API)
      console.log(
        `calendario customizado start=${adjustedStart.toISOString()} end=${adjustedEnd.toISOString()}`,
      )

      // Log da URL que ser├í usada na chamada da API de projeto
      const constraints = [
        {
          key: 'Created Date',
          constraint_type: 'greater than',
          value: adjustedStart.toISOString(),
        },
        {
          key: 'Created Date',
          constraint_type: 'less than',
          value: adjustedEnd.toISOString(),
        },
      ]
      const apiUrl = `https://crm.casualmoveis.com.br/api/1.1/obj/projeto?constraints=${encodeURIComponent(JSON.stringify(constraints))}`
      console.log(`projeto api url: ${apiUrl}`)

      onFiltersChange({
        ...filters,
        dateRange: { start: adjustedStart, end: adjustedEnd },
      })
      
      // Fechar ap├│s sele├º├úo
      setTimeout(() => setIsDatePickerOpen(false), 200)
    }
  }

  // Calcular per├¡odos pr├®-definidos
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
        // ├Ültimos 3 meses a partir de hoje
        start.setMonth(start.getMonth() - 3)
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

  // Detectar qual preset est├í ativo baseado nas datas
  const getCurrentPreset = (): DateRangePreset => {
    if (!filters.dateRange) return 'last7days'
    
    // Se o calend├írio customizado foi usado, retornar 'custom' para ignorar o dropdown
    if (isCustomDateRange) {
      return 'custom'
    }
    
    const start = new Date(filters.dateRange.start)
    const end = new Date(filters.dateRange.end)
    const now = new Date()
    
    // Normalizar datas para compara├º├úo (apenas data, sem hora)
    const normalizeDate = (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    
    const startTime = normalizeDate(start)
    const endTime = normalizeDate(end)
    const nowTime = normalizeDate(now)
    
    // Verificar se ├® "├Ültimos 7 dias"
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last7DaysTime = normalizeDate(last7Days)
    if (startTime === last7DaysTime && endTime >= nowTime - 86400000) {
      return 'last7days'
    }
    
    // Verificar se ├® "Este M├¬s"
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthStartTime = normalizeDate(thisMonthStart)
    if (startTime === thisMonthStartTime && endTime >= nowTime - 86400000) {
      return 'thisMonth'
    }
    
    // Verificar se ├® "Este Trimestre" (├║ltimos 3 meses)
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsAgoTime = normalizeDate(threeMonthsAgo)
    // Aceitar uma margem de ┬▒2 dias para compensar diferen├ºas de c├ílculo
    const daysDiff = Math.abs((startTime - threeMonthsAgoTime) / (1000 * 60 * 60 * 24))
    if (daysDiff <= 2 && endTime >= nowTime - 86400000) {
      return 'thisQuarter'
    }
    
    // Verificar se ├® "Este Ano"
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearStartTime = normalizeDate(thisYearStart)
    if (startTime === thisYearStartTime && endTime >= nowTime - 86400000) {
      return 'thisYear'
    }
    
    // Se n├úo corresponde a nenhum preset, usar "├Ültimos 7 dias" como padr├úo
    return 'last7days'
  }

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Para custom, manter as datas atuais ou usar um per├¡odo padr├úo
      return
    }
    
    // Resetar o estado custom quando usar o dropdown
    setIsCustomDateRange(false)
    
    const { start, end } = getDateRangeForPreset(preset)
    
     // Log simples do per├¡odo selecionado
    console.log(
      `period preset=${preset} start=${start.toISOString()} end=${end.toISOString()}`,
    )
    
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
              alt="Casual M├│veis" 
              className="header-logo-img"
            />
            <div className="header-title-wrapper">
              <h3 className="page-title">Dashboard Executivo - CRM</h3>
              <p className="page-subtitle">
                {activeTab === 'status' && 'Margem & Rentabilidade - An├ílise de Margens'}
                {activeTab === 'margin' && 'Margem & Rentabilidade - An├ílise de margens'}
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
                  minDate={undefined}
                  maxDate={undefined}
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
                            In├¡cio: {formatDate(startDate)}
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
            <option value="last7days">├Ültimos 7 dias</option>
            <option value="thisMonth">Este M├¬s</option>
            <option value="thisQuarter">Este Trimestre</option>
            <option value="thisYear">Este Ano</option>
            {isCustomDateRange && <option value="custom">Per├¡odo Customizado</option>}
          </select>
          <select
            className="filter-button"
            value={filters.nucleo || ''}
            onChange={(e) => handleNucleoChange(e.target.value as Nucleo || null)}
          >
            <option value="">Todos N├║cleos</option>
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
              <option value="Em Aprova├º├úo">Em Aprova├º├úo</option>
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
