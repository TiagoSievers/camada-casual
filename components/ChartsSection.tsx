'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import './ChartsSection.css'
import type { Project, ProjectStatus, OrcamentoStatusFilter } from '@/types/dashboard'
import { fetchProjects, fetchAllOrcamentos } from '@/lib/api'
import type { Orcamento } from '@/lib/api'

interface ChartsSectionProps {
  projects?: Project[] // Mantido para compatibilidade, mas não será usado para o gráfico de evolução diária
}

type MetricType = 'created' | 'sent' | 'approved'
type PeriodType = '7days' | '30days' | '90days'
type StatusFilterType = ProjectStatus | 'all'
type OrcamentoStatusFilterType = OrcamentoStatusFilter | 'all'

interface StatusChartProps {
  data: Array<{ date: string; value: number }>
  statusFilter: OrcamentoStatusFilterType
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
            const label = statusFilter === 'all' 
              ? 'orçamentos' 
              : statusFilter === 'Em Aprovação' 
              ? 'orçamentos em aprovação' 
              : statusFilter === 'Enviado' 
              ? 'orçamentos enviados' 
              : statusFilter === 'Aprovado' 
              ? 'orçamentos aprovados'
              : statusFilter === 'Reprovado'
              ? 'orçamentos reprovados'
              : 'orçamentos liberados para pedido'
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
  // NOVO: Status do projeto ao invés de métrica para o gráfico de evolução diária
  const [statusFilterDaily, setStatusFilterDaily] = useState<StatusFilterType>('all')
  const [periodDaily, setPeriodDaily] = useState<PeriodType>('30days') // Período para o gráfico de evolução diária
  const [periodStatus, setPeriodStatus] = useState<PeriodType>('30days') // Período para o gráfico de evolução de status
  const [statusFilter, setStatusFilter] = useState<OrcamentoStatusFilterType>('all')
  
  // NOVO: Projetos buscados diretamente do endpoint /obj/projeto para o gráfico de evolução diária
  const [chartProjects, setChartProjects] = useState<Project[]>([])
  const [loadingChartProjects, setLoadingChartProjects] = useState(false)
  
  // NOVO: Orçamentos buscados diretamente do endpoint /obj/orcamento para o gráfico de evolução de status
  const [chartOrcamentos, setChartOrcamentos] = useState<Orcamento[]>([])
  const [loadingChartOrcamentos, setLoadingChartOrcamentos] = useState(false)

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

  // NOVO: Buscar projetos diretamente do endpoint /obj/projeto quando o período mudar
  useEffect(() => {
    const loadChartProjects = async () => {
      setLoadingChartProjects(true)
      try {
        console.log(`[GRAFICO] Buscando projetos diretamente do endpoint /obj/projeto para período: ${periodDaily}`)
        const fetchedProjects = await fetchProjects({
          dateRange: dateRangeDaily,
        })
        console.log(`[GRAFICO] Projetos encontrados: ${fetchedProjects.length}`)
        setChartProjects(fetchedProjects)
      } catch (err) {
        console.error('Erro ao buscar projetos para o gráfico:', err)
        setChartProjects([])
      } finally {
        setLoadingChartProjects(false)
      }
    }
    
    loadChartProjects()
  }, [periodDaily, dateRangeDaily])

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

  // NOVO: Buscar orçamentos diretamente do endpoint /obj/orcamento quando o período mudar
  useEffect(() => {
    const loadChartOrcamentos = async () => {
      setLoadingChartOrcamentos(true)
      try {
        console.log(`[GRAFICO STATUS] Buscando orçamentos diretamente do endpoint /obj/orcamento para período: ${periodStatus}`)
        const fetchedOrcamentos = await fetchAllOrcamentos({
          dateRange: dateRangeStatus,
          removido: false,
        })
        console.log(`[GRAFICO STATUS] Orçamentos encontrados: ${fetchedOrcamentos.length}`)
        setChartOrcamentos(fetchedOrcamentos)
      } catch (err) {
        console.error('Erro ao buscar orçamentos para o gráfico de status:', err)
        setChartOrcamentos([])
      } finally {
        setLoadingChartOrcamentos(false)
      }
    }
    
    loadChartOrcamentos()
  }, [periodStatus, dateRangeStatus])

  // Removido: não precisamos mais buscar orçamentos, pois agora filtramos apenas por status do projeto

  // Filtrar projetos por status e período (já filtrados pela API pelo período)
  const filteredProjectsDaily = useMemo(() => {
    let filtered = chartProjects
    
    // Filtrar por status se não for "all"
    if (statusFilterDaily !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilterDaily)
    }
    
    return filtered
  }, [chartProjects, statusFilterDaily])

  // Filtrar orçamentos por status (já filtrados pela API pelo período)
  const filteredOrcamentosStatus = useMemo(() => {
    let filtered = chartOrcamentos
    
    // Filtrar por status se não for "all"
    if (statusFilter !== 'all') {
      const statusMap: Record<OrcamentoStatusFilter, string[]> = {
        'Em Aprovação': ['em aprovação', 'aprovação', 'pendente aprovação'],
        'Enviado': ['enviado'],
        'Aprovado': ['aprovado pelo cliente', 'aprovado (master)'],
        'Reprovado': ['reprovado'],
        'Liberado para pedido': ['liberado para pedido', 'liberado'],
      }
      
      const statusKeywords = statusMap[statusFilter] || []
      
      filtered = filtered.filter(orcamento => {
        const status = String(orcamento.status || '').toLowerCase()
        return statusKeywords.some(keyword => status.includes(keyword.toLowerCase()))
      })
    }
    
    return filtered
  }, [chartOrcamentos, statusFilter])

  // Calcular dados do gráfico de evolução diária - agora baseado em status do projeto
  const dailyEvolutionData = useMemo(() => {
    const dataByDate = new Map<string, { count: number; timestamp: number }>()

    // Contar projetos por data de criação, agrupados por status
    filteredProjectsDaily.forEach(project => {
      const date = new Date(project['Created Date'])
      const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const timestamp = date.getTime()

      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, { count: 0, timestamp })
      }
      dataByDate.get(dateKey)!.count++
    })

    return Array.from(dataByDate.entries())
      .map(([date, data]) => ({
        date,
        value: data.count,
        timestamp: data.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ date, value }) => ({ date, value }))
  }, [filteredProjectsDaily])

  // Calcular dados do gráfico de evolução de status - agora baseado em orçamentos
  const statusEvolutionData = useMemo(() => {
    const dataByDate = new Map<string, { count: number; timestamp: number }>()

    // Contar orçamentos por data de criação, agrupados por status
    filteredOrcamentosStatus.forEach(orcamento => {
      // Usar data de criação do orçamento
      const date = new Date(orcamento['Created Date'] || orcamento['Modified Date'] || new Date())
      // Normalizar para meia-noite para evitar problemas de timezone
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dateKey = normalizedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const timestamp = normalizedDate.getTime()

      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, { count: 0, timestamp })
      }

      dataByDate.get(dateKey)!.count++
    })

    // Preencher dias sem orçamentos com valor 0 para manter continuidade visual
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
  }, [filteredOrcamentosStatus])

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
              <label>Status:</label>
              <select 
                className="chart-filter"
                value={statusFilterDaily}
                onChange={(e) => setStatusFilterDaily(e.target.value as StatusFilterType)}
              >
                <option value="all">Todos Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Pausado">Pausado</option>
                <option value="Inativo">Inativo</option>
                <option value="Perdido">Perdido</option>
                <option value="Ganho">Ganho</option>
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
          {loadingChartProjects ? (
            <div style={{ 
              height: '320px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-gray-500)',
              fontSize: '14px'
            }}>
              Carregando dados...
            </div>
          ) : !hasDataDaily ? (
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
                  const statusLabel = statusFilterDaily === 'all' 
                    ? 'projetos' 
                    : statusFilterDaily === 'Ativo' 
                    ? 'projetos ativos' 
                    : statusFilterDaily === 'Pausado' 
                    ? 'projetos pausados' 
                    : statusFilterDaily === 'Inativo' 
                    ? 'projetos inativos'
                    : statusFilterDaily === 'Perdido'
                    ? 'projetos perdidos'
                    : 'projetos ganhos'
                  return [`${value} ${statusLabel}`, '']
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
                onChange={(e) => setStatusFilter(e.target.value as OrcamentoStatusFilterType)}
              >
                <option value="all">Todos Status</option>
                <option value="Em Aprovação">Em Aprovação</option>
                <option value="Enviado">Enviado</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Reprovado">Reprovado</option>
                <option value="Liberado para pedido">Liberado para pedido</option>
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
          {loadingChartOrcamentos ? (
            <div style={{ 
              height: '320px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-gray-500)',
              fontSize: '14px'
            }}>
              Carregando dados...
            </div>
          ) : !hasDataStatus ? (
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
            <StatusChart data={statusEvolutionData} statusFilter={statusFilter} />
          )}
        </div>
      </div>
    </div>
  )
}

