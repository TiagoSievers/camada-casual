'use client'

import { useState, useEffect, useMemo } from 'react'
import './FunnelSection.css'
import type { Project, DashboardFilters } from '@/types/dashboard'
import { calculateFunnelMetrics, fetchProjects } from '@/lib/api'

interface FunnelSectionProps {
  /** Projetos filtrados pelo período (usado no Funil Fechado) */
  projects?: Project[]
  /** Todos os projetos sem filtro de data (usado para Funil Aberto e mês anterior) */
  allProjects?: Project[]
  /** Filtros atuais, usados aqui para data (período/mês) */
  filters: DashboardFilters
}

export default function FunnelSection({ projects = [], allProjects = [], filters }: FunnelSectionProps) {
  const [funnelType, setFunnelType] = useState<'closed' | 'open'>('closed')
  const [comparePrevious, setComparePrevious] = useState(false)
  const [funnelData, setFunnelData] = useState({
    created: { 
      count: 0, 
      label: 'Projetos Criados', 
      sublabel: 'projetos' 
    },
    sent: { 
      count: 0, 
      label: 'Projetos Enviados', 
      sublabel: 'ao cliente', 
      percentage: '0%', 
      labelPercentage: 'Taxa envio' 
    },
    inApproval: { 
      count: 0, 
      percentage: '0%', 
      label: 'Em Aprovação', 
      sublabel: 'dos enviados' 
    },
    approved: { 
      count: 0, 
      percentage: '0%', 
      label: 'Aprovados', 
      sublabel: 'dos enviados' 
    },
    rejected: { 
      count: 0, 
      percentage: '0%', 
      label: 'Reprovados', 
      sublabel: 'dos enviados' 
    },
  })
  const [previousFunnelData, setPreviousFunnelData] = useState<typeof funnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allProjectsUntilEndDate, setAllProjectsUntilEndDate] = useState<Project[]>([])

  // Helpers de datas
  const currentStartDate = useMemo(() => new Date(filters.dateRange.start), [filters.dateRange.start])
  const currentEndDate = useMemo(() => new Date(filters.dateRange.end), [filters.dateRange.end])

  const isFullMonth = useMemo(() => {
    const start = new Date(currentStartDate)
    const end = new Date(currentEndDate)
    // Normalizar para meia-noite para comparação
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    const firstDayOfMonth = new Date(start.getFullYear(), start.getMonth(), 1)
    const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0)

    return (
      start.getTime() === firstDayOfMonth.getTime() &&
      end.getFullYear() === lastDayOfMonth.getFullYear() &&
      end.getMonth() === lastDayOfMonth.getMonth() &&
      end.getDate() === lastDayOfMonth.getDate()
    )
  }, [currentStartDate, currentEndDate])

  const previousMonthRange = useMemo(() => {
    if (!isFullMonth) return null

    const start = new Date(currentStartDate)
    const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0)

    return { start: prevMonthStart, end: prevMonthEnd }
  }, [currentStartDate, isFullMonth])

  const getProjectCreatedDate = (project: Project) => {
    const created = project['Created Date']
    return created ? new Date(created) : null
  }

  // Projetos usados em cada visão de funil
  const closedFunnelProjects = useMemo(() => {
    // Já recebemos os projetos filtrados por período via props (filteredProjects)
    return projects
  }, [projects])

  // Buscar todos os projetos até a data final para o Funil Aberto
  useEffect(() => {
    const loadAllProjectsUntilEndDate = async () => {
      try {
        // Buscar todos os projetos até a data final (sem limite de data inicial)
        // Aplicar os filtros de núcleo, loja, vendedor e arquiteto, mas não limitar pela data inicial
        const endDate = new Date(currentEndDate)
        endDate.setHours(23, 59, 59, 999)
        
        const allProjectsData = await fetchProjects({
          ...filters,
          dateRange: {
            // Data inicial muito antiga para pegar todos os projetos até a data final
            start: new Date('2020-01-01'),
            end: endDate,
          },
        })
        setAllProjectsUntilEndDate(allProjectsData)
      } catch (error) {
        console.error('Erro ao buscar todos os projetos para Funil Aberto:', error)
        // Em caso de erro, usar os projetos já carregados
        setAllProjectsUntilEndDate(allProjects || [])
      }
    }

    // Buscar sempre para ter os dados prontos quando o usuário alternar para Funil Aberto
    loadAllProjectsUntilEndDate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEndDate, filters.nucleo, filters.loja, filters.vendedor, filters.arquiteto])

  const openFunnelProjects = useMemo(() => {
    // Funil Aberto: todos os projetos criados até a data final do filtro (acumulado)
    // Usar allProjectsUntilEndDate que contém todos os projetos até a data final
    return (allProjectsUntilEndDate.length > 0 ? allProjectsUntilEndDate : (allProjects || [])).filter(project => {
      const createdDate = getProjectCreatedDate(project)
      if (!createdDate) return false
      return createdDate <= currentEndDate
    })
  }, [allProjectsUntilEndDate, allProjects, currentEndDate])

  const previousMonthClosedProjects = useMemo(() => {
    if (!previousMonthRange) return []

    return (allProjects || []).filter(project => {
      const createdDate = getProjectCreatedDate(project)
      if (!createdDate) return false
      return createdDate >= previousMonthRange.start && createdDate <= previousMonthRange.end
    })
  }, [allProjects, previousMonthRange])

  // Calcular métricas quando os projetos mudarem
  useEffect(() => {
    const loadFunnelData = async () => {
      const currentProjects =
        funnelType === 'closed'
          ? closedFunnelProjects
          : openFunnelProjects

      if (currentProjects.length === 0) {
        setFunnelData({
          created: { count: 0, label: 'Projetos Criados', sublabel: 'projetos' },
          sent: { count: 0, label: 'Projetos Enviados', sublabel: 'ao cliente', percentage: '0%', labelPercentage: 'Taxa envio' },
          inApproval: { count: 0, percentage: '0%', label: 'Em Aprovação', sublabel: 'dos enviados' },
          approved: { count: 0, percentage: '0%', label: 'Aprovados', sublabel: 'dos enviados' },
          rejected: { count: 0, percentage: '0%', label: 'Reprovados', sublabel: 'dos enviados' },
        })
        setPreviousFunnelData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Página Status de Projetos: não buscar orçamentos com filtro de data, apenas pelos IDs dos projetos
        const metrics = await calculateFunnelMetrics(currentProjects, funnelType, comparePrevious, filters.dateRange, false)
        setFunnelData(metrics)
        // Não buscamos mais dados de comparação de mês anterior via API
        setPreviousFunnelData(null)
      } catch (error) {
        console.error('Erro ao calcular métricas do funil:', error)
        // Em caso de erro, usar cálculo básico
        const createdCount = currentProjects.length
        const projectsWithOrcamentos = currentProjects.filter(p => p.new_orcamentos && p.new_orcamentos.length > 0).length
        const sentCount = projectsWithOrcamentos
        const sentPercentage = createdCount > 0 
          ? ((sentCount / createdCount) * 100).toFixed(1) 
          : '0'
        
        setFunnelData({
          created: { count: createdCount, label: 'Projetos Criados', sublabel: 'projetos' },
          sent: { count: sentCount, label: 'Projetos Enviados', sublabel: 'ao cliente', percentage: `${sentPercentage}%`, labelPercentage: 'Taxa envio' },
          inApproval: { count: 0, percentage: '0%', label: 'Em Aprovação', sublabel: 'dos enviados' },
          approved: { count: 0, percentage: '0%', label: 'Aprovados', sublabel: 'dos enviados' },
          rejected: { count: 0, percentage: '0%', label: 'Reprovados', sublabel: 'dos enviados' },
        })
        setPreviousFunnelData(null)
      } finally {
        setLoading(false)
      }
    }

    loadFunnelData()
  }, [
    closedFunnelProjects,
    openFunnelProjects,
    funnelType,
    comparePrevious,
    previousMonthClosedProjects,
  ])
  
  // Mostrar aviso se não houver dados
  const showInfo = funnelData.created.count === 0 && !loading

  const formatDeltaPercent = (current: number, previous: number) => {
    if (!previous || previous === 0) return '—'
    const delta = ((current - previous) / previous) * 100
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}%`
  }

  const createdPreviousCount = previousFunnelData?.created.count ?? 0
  const sentPreviousCount = previousFunnelData?.sent.count ?? 0
  const sentPreviousPercentage = previousFunnelData
    ? parseFloat(previousFunnelData.sent.percentage.replace('%', '') || '0')
    : 0
  const inApprovalPreviousPercentage = previousFunnelData
    ? parseFloat(previousFunnelData.inApproval.percentage.replace('%', '') || '0')
    : 0
  const approvedPreviousPercentage = previousFunnelData
    ? parseFloat(previousFunnelData.approved.percentage.replace('%', '') || '0')
    : 0
  const rejectedPreviousPercentage = previousFunnelData
    ? parseFloat(previousFunnelData.rejected.percentage.replace('%', '') || '0')
    : 0

  if (loading) {
    return (
      <div className="funnel-section">
        <div className="funnel-header">
          <div className="funnel-title-section">
            <h3 className="funnel-title">Análise de Funil de Projetos</h3>
            <p className="funnel-subtitle">Fluxo de criação e conversão</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="funnel-section">
      <div className="funnel-header">
          <div className="funnel-title-section">
          <h3 className="funnel-title">Análise de Funil de Projetos</h3>
          <p className="funnel-subtitle">Fluxo de criação e conversão</p>
        </div>
        <div className="funnel-controls">
          <div className="funnel-toggle" role="tablist">
            <button
              role="tab"
              className={`toggle-btn ${funnelType === 'closed' ? 'active' : ''}`}
              onClick={() => setFunnelType('closed')}
            >
              Funil Fechado
            </button>
            <button
              role="tab"
              className={`toggle-btn ${funnelType === 'open' ? 'active' : ''}`}
              onClick={() => setFunnelType('open')}
            >
              Funil Aberto
            </button>
          </div>
        </div>
      </div>

      {funnelType === 'closed' && (
        <div className="funnel-info-banner">
          <div>
            <div className="funnel-info-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="funnel-info-icon">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
            <div className="funnel-info-content">
              <p className="funnel-info-text">
                <span className="funnel-info-bold">Funil Fechado:</span> Mostra apenas os projetos criados no período selecionado e como eles progrediram até a data final.
              </p>
            </div>
          </div>
          <div className="funnel-info-switch">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(e) => setComparePrevious(e.target.checked)}
                className="switch-input"
              />
              <span className="switch-slider"></span>
            </label>
            <span className="switch-text">Comparar vs. mês anterior</span>
          </div>
        </div>
      )}

      {showInfo && (
        <div style={{ padding: '16px', background: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '24px' }}>
          Nenhum projeto encontrado com os filtros selecionados.
        </div>
      )}
      
      <div className="funnel-content">
          <div className="funnel-main-row">
            {/* Projetos Criados */}
            <div className="funnel-card large orange" style={{ width: '280px' }}>
              <p className="funnel-card-prefix">1. {funnelData.created.label}</p>
              <p className="funnel-card-number">{funnelData.created.count}</p>
              <p className="funnel-card-suffix">{funnelData.created.sublabel}</p>
            </div>

          {/* Seta e Taxa de Envio */}
          <div className="funnel-arrow-section">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="funnel-arrow-icon">
              <path d="M18 8L22 12L18 16"></path>
              <path d="M2 12H22"></path>
            </svg>
            <div className="funnel-card small">
              <p className="funnel-card-label-small">Taxa envio</p>
              <p className="funnel-card-percentage">{funnelData.sent.percentage}</p>
            </div>
          </div>

          {/* Projetos Enviados */}
          <div className="funnel-card large blue" style={{ width: '280px' }}>
            <p className="funnel-card-prefix">2. {funnelData.sent.label}</p>
            <p className="funnel-card-number blue-number">{funnelData.sent.count}</p>
            <p className="funnel-card-suffix">{funnelData.sent.sublabel}</p>
          </div>

          {/* Seta */}
          <div className="funnel-arrow-simple">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="funnel-arrow-icon">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>

          {/* Status após envio - Cards empilhados */}
          <div className="funnel-status-cards">
            <div className="funnel-card status-card yellow">
              <div className="status-card-left">
                <p className="status-card-label">a) {funnelData.inApproval.label}</p>
                <p className="status-card-number">{funnelData.inApproval.count}</p>
              </div>
              <div className="status-card-right">
                <p className="status-card-percentage">{funnelData.inApproval.percentage}</p>
                <p className="status-card-sublabel">{funnelData.inApproval.sublabel}</p>
              </div>
            </div>

            <div className="funnel-card status-card green">
              <div className="status-card-left">
                <p className="status-card-label">b) {funnelData.approved.label}</p>
                <p className="status-card-number">{funnelData.approved.count}</p>
              </div>
              <div className="status-card-right">
                <p className="status-card-percentage">{funnelData.approved.percentage}</p>
                <p className="status-card-sublabel">{funnelData.approved.sublabel}</p>
              </div>
            </div>

            <div className="funnel-card status-card red">
              <div className="status-card-left">
                <p className="status-card-label">c) {funnelData.rejected.label}</p>
                <p className="status-card-number">{funnelData.rejected.count}</p>
              </div>
              <div className="status-card-right">
                <p className="status-card-percentage">{funnelData.rejected.percentage}</p>
                <p className="status-card-sublabel">{funnelData.rejected.sublabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

