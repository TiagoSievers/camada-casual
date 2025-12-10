'use client'

import { useTop10Data } from '@/hooks/useTop10Data'
import type { DashboardFilters } from '@/types/dashboard'
import './Top10Section.css'

interface Top10SectionProps {
  filters: DashboardFilters
}

export default function Top10Section({ filters }: Top10SectionProps) {
  const { produtos, clientes, loading, error } = useTop10Data(filters)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Componente para inicial do nome
  const InitialAvatar = ({ name }: { name: string }) => {
    const initial = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 1)

    return (
      <div className="top10-initial">
        {initial}
      </div>
    )
  }

  // Componente para barra vertical laranja
  const ValueBar = ({ value, maxValue }: { value: number; maxValue: number }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
    const height = Math.max(8, Math.min(40, percentage)) // Altura mínima 8px, máxima 40px

    return (
      <div className="top10-value-bar">
        <div 
          className="top10-value-bar-fill"
          style={{ height: `${height}px` }}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="top10-section">
        <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="top10-section">
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Erro: {error}</div>
      </div>
    )
  }

  return (
    <div className="top10-section">
      <div className="top10-blocks">
        {/* Bloco de Produtos */}
        <div className="top10-block">
          <div className="top10-block-header">
            <div className="top10-icon top10-icon-products">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {/* Caixa 3D - frente */}
                <rect x="5" y="11" width="14" height="9" fill="none"/>
                {/* Topo da caixa (perspectiva) */}
                <path d="M5 11 L12 7 L19 11" fill="none"/>
                {/* Linha de selagem horizontal no topo */}
                <line x1="7.5" y1="9.5" x2="16.5" y2="9.5"/>
                {/* Linha de selagem vertical esquerda */}
                <line x1="7.5" y1="9.5" x2="7.5" y2="11"/>
                {/* Linha de selagem vertical direita */}
                <line x1="16.5" y1="9.5" x2="16.5" y2="11"/>
              </svg>
            </div>
            <h3 className="top10-block-title">TOP 10 Produtos</h3>
          </div>
          <div className="top10-list">
            {produtos.length === 0 ? (
              <div className="top10-empty">Nenhum produto encontrado</div>
            ) : (
              produtos.map((produto, index) => {
                const maxValue = produtos[0]?.value || 1
                const percentage = maxValue > 0 ? ((produto.value / maxValue) * 100).toFixed(1) : '0'
                return (
                  <div key={produto.id} className="top10-item top10-item-product">
                    <div className="top10-rank-number">{index + 1}º</div>
                    <InitialAvatar name={produto.name} />
                    <div className="top10-item-content">
                      <div className="top10-item-name">{produto.name}</div>
                      <div className="top10-item-value">{formatCurrency(produto.value)}</div>
                    </div>
                    <div className="top10-item-percentage">{percentage}%</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Bloco de Clientes */}
        <div className="top10-block">
          <div className="top10-block-header">
            <div className="top10-icon top10-icon-clients">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Cabeça */}
                <circle cx="12" cy="8" r="4"/>
                {/* Ombros e corpo */}
                <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
              </svg>
            </div>
            <h3 className="top10-block-title">TOP 10 Clientes</h3>
          </div>
          <div className="top10-list">
            {clientes.length === 0 ? (
              <div className="top10-empty">Nenhum cliente encontrado</div>
            ) : (
              clientes.map((cliente, index) => {
                const maxValue = clientes[0]?.value || 1
                const percentage = maxValue > 0 ? ((cliente.value / maxValue) * 100).toFixed(1) : '0'
                return (
                  <div key={cliente.id} className="top10-item top10-item-client">
                    <div className="top10-rank-number">{index + 1}º</div>
                    <div className="top10-item-content">
                      <div className="top10-item-name">{cliente.name}</div>
                      <div className="top10-item-value">{formatCurrency(cliente.value)}</div>
                    </div>
                    <div className="top10-item-percentage">{percentage}%</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

