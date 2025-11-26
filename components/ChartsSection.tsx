'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import './ChartsSection.css'
import type { Project, ProjectStatus } from '@/types/dashboard'
import { fetchAllOrcamentos, fetchOrcamentosFromProjects } from '@/lib/api'
import type { Orcamento } from '@/lib/api'

interface ChartsSectionProps {
  projects?: Project[]
}

type MetricType = 'created' | 'sent' | 'approved'
type PeriodType = '7days' | '30days' | '90days'
type StatusFilterType = ProjectStatus | 'all'

interface StatusChartProps {
  data: Array<{ date: string; value: number }>
  statusFilter: StatusFilterType
}

// Componente memoizado para o gráfico de status para evitar re-renderizações desnecessárias
const StatusChart = memo(({ data, statusFilter }: StatusChartProps) => {
  const hasData = data.length > 0
  
  if (!hasData) {
    return (
      <div style={{ 
        height: '320px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--color-gray-500)',
        fontSize: '14px'
      }}>
        Nenhum dado disponível para o período selecionado
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(229, 231, 235)" />
        <XAxis 
          dataKey="date" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 11, fill: 'rgb(107, 114, 128)' }}
          stroke="rgb(102, 102, 102)"
        />
        <YAxis 
          tick={{ fontSize: 11, fill: 'rgb(107, 114, 128)' }}
          domain={[0, 'auto']}
          stroke="rgb(102, 102, 102)"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '8px 12px'
          }}
          labelStyle={{
            color: 'rgb(217, 119, 6)',
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '4px'
          }}
          formatter={(value: number) => {
            const label = statusFilter === 'all' ? 'projetos' : statusFilter === 'Ativo' ? 'projetos ativos' : statusFilter === 'Pausado' ? 'projetos pausados' : 'projetos inativos'
            return [`${value} ${label}`, '']
          }}
          separator=""
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="rgb(245, 158, 11)" 
          strokeWidth={3}
          dot={{ fill: 'rgb(245, 158, 11)', strokeWidth: 3, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}, (prevProps, nextProps) => {
  // Comparação customizada: só re-renderiza se os dados realmente mudaram
  if (prevProps.data.length !== nextProps.data.length) return false
  if (prevProps.statusFilter !== nextProps.statusFilter) return false
  
  // Comparar cada item dos dados
  for (let i = 0; i < prevProps.data.length; i++) {
    if (prevProps.data[i].date !== nextProps.data[i].date || 
        prevProps.data[i].value !== nextProps.data[i].value) {
      return false
    }
  }
  
  return true // Não re-renderizar se os dados são iguais
})

StatusChart.displayName = 'StatusChart'

export default function ChartsSection({ projects = [] }: ChartsSectionProps) {
  const [metric, setMetric] = useState<MetricType>('created')
  const [periodDaily, setPeriodDaily] = useState<PeriodType>('30days') // Período para o gráfico de evolução diária
  const [periodStatus, setPeriodStatus] = useState<PeriodType>('30days') // Período para o gráfico de evolução de status
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')
  const [orcamentosMap, setOrcamentosMap] = useState<Map<string, Orcamento>>(new Map())
  const [loading, setLoading] = useState(false)

  // Log quando período muda
  useEffect(() => {
    console.log('🔵 [CHARTS] Período Daily mudou para:', periodDaily)
  }, [periodDaily])

  useEffect(() => {
    console.log('🔵 [CHARTS] Período Status mudou para:', periodStatus)
  }, [periodStatus])

  // Calcular período baseado no filtro - para o gráfico de evolução diária
  const dateRangeDaily = useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    
    switch (periodDaily) {
      case '7days':
        start.setDate(start.getDate() - 7)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        break
      case '90days':
        start.setDate(start.getDate() - 90)
        break
    }
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }, [periodDaily])

  // Calcular período baseado no filtro - para o gráfico de evolução de status
  const dateRangeStatus = useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    
    switch (periodStatus) {
      case '7days':
        start.setDate(start.getDate() - 7)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        break
      case '90days':
        start.setDate(start.getDate() - 90)
        break
    }
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }, [periodStatus])

  // Buscar orçamentos quando necessário (apenas para métricas de envio/aprovação)
  useEffect(() => {
    const loadOrcamentos = async () => {
      if (metric === 'sent' || metric === 'approved') {
        setLoading(true)
        try {
          const orcamentos = await fetchOrcamentosFromProjects(projects)
          setOrcamentosMap(orcamentos)
        } catch (err) {
          console.error('Erro ao buscar orçamentos:', err)
        } finally {
          setLoading(false)
        }
      }
    }
    loadOrcamentos()
  }, [projects, metric])

  // Filtrar projetos pelo período - para o gráfico de evolução diária
  const filteredProjectsDaily = useMemo(() => {
    const filtered = projects.filter(project => {
      const createdDate = new Date(project['Created Date'])
      // Normalizar datas para comparação (apenas data, sem hora)
      const projectDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate())
      const rangeStart = new Date(dateRangeDaily.start.getFullYear(), dateRangeDaily.start.getMonth(), dateRangeDaily.start.getDate())
      const rangeEnd = new Date(dateRangeDaily.end.getFullYear(), dateRangeDaily.end.getMonth(), dateRangeDaily.end.getDate())
      
      const isInRange = projectDate >= rangeStart && projectDate <= rangeEnd
      return isInRange
    })
    
    console.log('🔵 [CHARTS] Filtragem por período (Daily):', {
      period: periodDaily,
      totalProjects: projects.length,
      filteredProjects: filtered.length,
      dateRange: {
        start: dateRangeDaily.start.toISOString(),
        end: dateRangeDaily.end.toISOString(),
        startFormatted: dateRangeDaily.start.toLocaleDateString('pt-BR'),
        endFormatted: dateRangeDaily.end.toLocaleDateString('pt-BR')
      }
    })
    
    return filtered
  }, [projects, dateRangeDaily, periodDaily])

  // Filtrar projetos pelo período - para o gráfico de evolução de status
  const filteredProjectsStatus = useMemo(() => {
    const filtered = projects.filter(project => {
      const createdDate = new Date(project['Created Date'])
      // Normalizar datas para comparação (apenas data, sem hora)
      const projectDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate())
      const rangeStart = new Date(dateRangeStatus.start.getFullYear(), dateRangeStatus.start.getMonth(), dateRangeStatus.start.getDate())
      const rangeEnd = new Date(dateRangeStatus.end.getFullYear(), dateRangeStatus.end.getMonth(), dateRangeStatus.end.getDate())
      
      const isInRange = projectDate >= rangeStart && projectDate <= rangeEnd
      return isInRange
    })
    
    console.log('🔵 [CHARTS] Filtragem por período (Status):', {
      period: periodStatus,
      totalProjects: projects.length,
      filteredProjects: filtered.length,
      dateRange: {
        start: dateRangeStatus.start.toISOString(),
        end: dateRangeStatus.end.toISOString(),
        startFormatted: dateRangeStatus.start.toLocaleDateString('pt-BR'),
        endFormatted: dateRangeStatus.end.toLocaleDateString('pt-BR')
      }
    })
    
    return filtered
  }, [projects, dateRangeStatus, periodStatus])

  // Calcular dados do gráfico de evolução diária
  const dailyEvolutionData = useMemo(() => {
    const dataByDate = new Map<string, { created: number; sent: number; approved: number; timestamp: number }>()

    // Para "Projetos Criados", usar data de criação do projeto
    if (metric === 'created') {
      filteredProjectsDaily.forEach(project => {
        const date = new Date(project['Created Date'])
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        const timestamp = date.getTime()

        if (!dataByDate.has(dateKey)) {
          dataByDate.set(dateKey, { created: 0, sent: 0, approved: 0, timestamp })
        }
        dataByDate.get(dateKey)!.created++
      })
    } else {
      // Para "Projetos Enviados" e "Projetos Aprovados", usar data do orçamento mas contar por projeto
      filteredProjectsDaily.forEach(project => {
        if (project.new_orcamentos && project.new_orcamentos.length > 0) {
          let hasSent = false
          let hasApproved = false
          let sentDate: Date | null = null
          let approvedDate: Date | null = null

          project.new_orcamentos.forEach(orcamentoId => {
            const orcamento = orcamentosMap.get(orcamentoId)
            if (!orcamento || !orcamento.status) return

            const status = String(orcamento.status).toLowerCase()
            const orcamentoDate = orcamento['Created Date'] || orcamento['Modified Date'] || project['Created Date']
            const date = new Date(orcamentoDate)

            // Verificar se foi enviado
            if (!hasSent && (status.includes('enviado') || status.includes('aprovado') || status.includes('reprovado') || status.includes('liberado'))) {
              hasSent = true
              sentDate = date
            }

            // Verificar se foi aprovado
            if (!hasApproved && (status.includes('aprovado pelo cliente') || (status.includes('aprovado') && !status.includes('reprovado')))) {
              hasApproved = true
              approvedDate = date
            }
          })

          // Adicionar à data apropriada
          if (metric === 'sent' && hasSent && sentDate) {
            const date = sentDate as Date
            if (date >= dateRangeDaily.start && date <= dateRangeDaily.end) {
              const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
              const timestamp = date.getTime()

              if (!dataByDate.has(dateKey)) {
                dataByDate.set(dateKey, { created: 0, sent: 0, approved: 0, timestamp })
              }
              dataByDate.get(dateKey)!.sent++
            }
          } else if (metric === 'approved' && hasApproved && approvedDate) {
            const date = approvedDate as Date
            if (date >= dateRangeDaily.start && date <= dateRangeDaily.end) {
              const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
              const timestamp = date.getTime()

              if (!dataByDate.has(dateKey)) {
                dataByDate.set(dateKey, { created: 0, sent: 0, approved: 0, timestamp })
              }
              dataByDate.get(dateKey)!.approved++
            }
          }
        }
      })
    }

    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        created: data.created,
        sent: data.sent,
        approved: data.approved,
        value: metric === 'created' ? data.created : metric === 'sent' ? data.sent : data.approved,
        timestamp: data.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, value }) => ({ date, value }))
  }, [filteredProjectsDaily, orcamentosMap, metric, dateRangeDaily])

  // Calcular dados do gráfico de evolução de status
  const statusEvolutionData = useMemo(() => {
    const dataByDate = new Map<string, { count: number; timestamp: number }>()

    console.log('🔵 [CHARTS] Calculando evolução de status:', {
      totalProjects: filteredProjectsStatus.length,
      statusFilter,
      dateRange: {
        start: dateRangeStatus.start.toISOString(),
        end: dateRangeStatus.end.toISOString()
      }
    })

    // Filtrar projetos pelo status selecionado
    let projectsByStatus = 0
    filteredProjectsStatus.forEach(project => {
      // Verificar se o status do projeto corresponde ao filtro selecionado
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return
      }
      projectsByStatus++

      // Usar data de criação do projeto
      const date = new Date(project['Created Date'])
      // Normalizar para meia-noite para evitar problemas de timezone
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dateKey = normalizedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const timestamp = normalizedDate.getTime()

      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, { count: 0, timestamp })
      }

      dataByDate.get(dateKey)!.count++
    })

    console.log('🔵 [CHARTS] Projetos filtrados por status:', projectsByStatus)
    console.log('🔵 [CHARTS] Datas únicas encontradas:', Array.from(dataByDate.keys()))
    console.log('🔵 [CHARTS] Contagem por data:', Array.from(dataByDate.entries()).map(([date, data]) => ({ date, count: data.count })))

    // Preencher dias sem projetos com valor 0 para manter continuidade visual
    // Mas apenas se houver dados
    if (dataByDate.size > 0) {
      const sortedEntries = Array.from(dataByDate.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          timestamp: data.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp)

      // Calcular acumulado (funil aberto)
      let accumulated = 0
      return sortedEntries.map((item) => {
        accumulated += item.count
        return {
          date: item.date,
          value: accumulated,
        }
      })
    }

    return []
  }, [filteredProjectsStatus, statusFilter])

  const hasDataDaily = dailyEvolutionData.length > 0
  const hasDataStatus = statusEvolutionData.length > 0
  
  return (
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-header-top">
            <h3 className="chart-title">Evolução Diária de Projetos</h3>
          </div>
          <div className="chart-filters">
            <div className="chart-filter-group">
              <label>Métrica:</label>
              <select 
                className="chart-filter"
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricType)}
              >
                <option value="created">Projetos Criados</option>
                <option value="sent">Projetos Enviados</option>
                <option value="approved">Projetos Aprovados</option>
              </select>
            </div>
            <div className="chart-filter-group">
              <label>Período:</label>
              <select 
                className="chart-filter"
                value={periodDaily}
                onChange={(e) => setPeriodDaily(e.target.value as PeriodType)}
              >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chart-container">
          {!hasDataDaily ? (
            <div style={{ 
              height: '320px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-gray-500)',
              fontSize: '14px'
            }}>
              Nenhum dado disponível para o período selecionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dailyEvolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.928 0.006 264.531)" />
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11, fill: 'oklch(0.145 0 0)' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'oklch(0.145 0 0)' }}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '8px 12px'
                }}
                labelStyle={{
                  color: 'rgb(217, 119, 6)',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}
                formatter={(value: number) => {
                  const label = metric === 'created' ? 'projetos criados' : metric === 'sent' ? 'projetos enviados' : 'projetos aprovados'
                  return [`${value} ${label}`, '']
                }}
                separator=""
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-header-top">
            <h3 className="chart-title">Evolução de Status (Funil Aberto)</h3>
          </div>
          <div className="chart-filters">
            <div className="chart-filter-group">
              <label>Status:</label>
              <select 
                className="chart-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              >
                <option value="all">Todos Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Pausado">Pausado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div className="chart-filter-group">
              <label>Período:</label>
              <select 
                className="chart-filter"
                value={periodStatus}
                onChange={(e) => setPeriodStatus(e.target.value as PeriodType)}
              >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chart-container">
          <StatusChart data={statusEvolutionData} statusFilter={statusFilter} />
        </div>
      </div>
    </div>
  )
}

