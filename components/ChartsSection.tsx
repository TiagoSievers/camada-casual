'use client'

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import './ChartsSection.css'
import type { Project } from '@/types/dashboard'

interface ChartsSectionProps {
  projects?: Project[]
}

export default function ChartsSection({ projects = [] }: ChartsSectionProps) {
  // Processar projetos da API para gerar dados dos gráficos
  
  // Agrupar projetos por data de criação para o gráfico de barras
  const projectsByDate = projects.reduce((acc, project) => {
    const date = new Date(project['Created Date'])
    const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    
    if (!acc[dateKey]) {
      acc[dateKey] = { count: 0, timestamp: date.getTime() }
    }
    acc[dateKey].count++
    return acc
  }, {} as Record<string, { count: number; timestamp: number }>)
  
  // Converter para array e ordenar por timestamp
  const dailyProjectsData = Object.entries(projectsByDate)
    .map(([date, data]) => ({ date, value: data.count, timestamp: data.timestamp }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ date, value }) => ({ date, value }))
  
  // Para o gráfico de linha, calcular projetos acumulados até cada data
  // (Funil Aberto: todos os projetos criados até a data)
  let accumulatedCount = 0
  const statusEvolutionData = dailyProjectsData.map((item) => {
    accumulatedCount += item.value
    return {
      date: item.date,
      value: accumulatedCount, // Total acumulado de projetos até esta data
    }
  })
  
  // Se não houver dados, mostrar mensagem
  const hasData = dailyProjectsData.length > 0
  
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
              <select className="chart-filter">
                <option>Projetos Criados</option>
                <option>Projetos Enviados</option>
                <option>Projetos Aprovados</option>
              </select>
            </div>
            <div className="chart-filter-group">
              <label>Período:</label>
              <select className="chart-filter">
                <option>Últimos 30 dias</option>
                <option>Últimos 7 dias</option>
                <option>Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chart-container">
          {!hasData ? (
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
              <BarChart data={dailyProjectsData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
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
                formatter={(value: number) => [`${value} projetos`, '']}
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
              <select className="chart-filter">
                <option>Em Aprovação</option>
                <option>Aprovados</option>
                <option>Reprovados</option>
              </select>
            </div>
            <div className="chart-filter-group">
              <label>Período:</label>
              <select className="chart-filter">
                <option>Últimos 30 dias</option>
                <option>Últimos 7 dias</option>
                <option>Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chart-container">
          {!hasData ? (
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
              <LineChart data={statusEvolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
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
                formatter={(value: number) => [`${value} projetos`, '']}
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
          )}
        </div>
      </div>
    </div>
  )
}

