'use client'

import { usePerformanceData } from '@/hooks/usePerformanceData'
import type { DashboardFilters } from '@/types/dashboard'
import './PerformanceComercialSection.css'

interface PerformanceComercialSectionProps {
  filters: DashboardFilters
}

export default function PerformanceComercialSection({ filters }: PerformanceComercialSectionProps) {
  const { vendedores, arquitetos, loading, error } = usePerformanceData(filters)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatProjects = (value: number) => {
    return `${value} projeto${value !== 1 ? 's' : ''}`
  }

  // Componente para gráfico de linha simples
  const MiniLineChart = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) {
      // Retornar linha plana se não houver dados
      return (
        <svg width={60} height={20} className="mini-chart">
          <line x1="2" y1="10" x2="58" y2="10" stroke="#10b981" strokeWidth="1.5" />
        </svg>
      )
    }

    const allValues = data.filter(v => v >= 0)
    if (allValues.length === 0) {
      return (
        <svg width={60} height={20} className="mini-chart">
          <line x1="2" y1="10" x2="58" y2="10" stroke="#10b981" strokeWidth="1.5" />
        </svg>
      )
    }

    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues)
    const range = maxValue - minValue || 1

    const width = 60
    const height = 20
    const padding = 4

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2)
      const normalizedValue = value - minValue
      const y = height - padding - (normalizedValue / range) * (height - padding * 2)
      return `${x},${Math.max(padding, Math.min(height - padding, y))}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="mini-chart">
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Componente para avatar circular
  const Avatar = ({ name }: { name: string }) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="avatar">
        {initials}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="performance-comercial-section">
        <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="performance-comercial-section">
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Erro: {error}</div>
      </div>
    )
  }

  return (
    <div className="performance-comercial-section">
      <div className="performance-blocks">
        {/* Bloco de Vendedores */}
        <div className="performance-block">
          <div className="performance-block-header">
            <div className="performance-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="performance-block-title">Performance Vendedores</h3>
          </div>
          <div className="performance-list">
            {vendedores.length === 0 ? (
              <div className="performance-empty">Nenhum vendedor encontrado</div>
            ) : (
              vendedores.map((vendedor) => (
                <div key={vendedor.id} className="performance-item">
                  <Avatar name={vendedor.name} />
                  <div className="performance-item-content">
                    <div className="performance-item-name">{vendedor.name}</div>
                    <div className="performance-item-value">{formatCurrency(vendedor.value)}</div>
                  </div>
                  <div className="performance-item-chart">
                    <MiniLineChart data={vendedor.trend} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloco de Arquitetos */}
        <div className="performance-block">
          <div className="performance-block-header">
            <div className="performance-icon performance-icon-purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7h-3V6a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                <path d="M10 6v1h4V6"></path>
                <path d="M8 11h8"></path>
                <path d="M8 15h8"></path>
              </svg>
            </div>
            <h3 className="performance-block-title">Performance Arquitetos</h3>
          </div>
          <div className="performance-list">
            {arquitetos.length === 0 ? (
              <div className="performance-empty">Nenhum arquiteto encontrado</div>
            ) : (
              arquitetos.map((arquiteto) => (
                <div key={arquiteto.id} className="performance-item">
                  <Avatar name={arquiteto.name} />
                  <div className="performance-item-content">
                    <div className="performance-item-name">{arquiteto.name}</div>
                    <div className="performance-item-value">{formatProjects(arquiteto.value)}</div>
                  </div>
                  <div className="performance-item-chart">
                    <MiniLineChart data={arquiteto.trend} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

