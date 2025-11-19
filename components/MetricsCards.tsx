'use client'

import './MetricsCards.css'

export default function MetricsCards() {
  const metrics = [
    {
      title: 'Receita Total',
      value: 'R$ 1.245.890',
      change: '+12.5%',
      trend: 'up',
      icon: '💰',
    },
    {
      title: 'Novos Clientes',
      value: '342',
      change: '+8.2%',
      trend: 'up',
      icon: '👥',
    },
    {
      title: 'Projetos Ativos',
      value: '28',
      change: '+3',
      trend: 'up',
      icon: '📋',
    },
    {
      title: 'Taxa de Conversão',
      value: '24.8%',
      change: '-2.1%',
      trend: 'down',
      icon: '📈',
    },
  ]

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">{metric.icon}</span>
            <span className={`metric-change ${metric.trend}`}>
              {metric.change}
            </span>
          </div>
          <div className="metric-content">
            <h3 className="metric-title">{metric.title}</h3>
            <p className="metric-value">{metric.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}



