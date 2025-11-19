'use client'

import { useState } from 'react'
import './FunnelSection.css'
import type { Project } from '@/types/dashboard'

interface FunnelSectionProps {
  projects?: Project[]
}

export default function FunnelSection({ projects = [] }: FunnelSectionProps) {
  const [funnelType, setFunnelType] = useState<'closed' | 'open'>('closed')
  const [comparePrevious, setComparePrevious] = useState(false)

  // Calcular métricas baseado nos projetos da API (dados disponíveis)
  const createdCount = projects.length
  
  // Contar projetos com orçamentos (projetos que têm pelo menos um orçamento)
  const projectsWithOrcamentos = projects.filter(p => p.new_orcamentos && p.new_orcamentos.length > 0).length
  
  // Calcular taxa de envio (projetos com orçamentos / total de projetos)
  const sentCount = projectsWithOrcamentos
  const sentPercentage = createdCount > 0 
    ? ((sentCount / createdCount) * 100).toFixed(1) 
    : '0'
  
  const funnelData = {
    created: { 
      count: createdCount, 
      label: 'Projetos Criados', 
      sublabel: 'projetos' 
    },
    sent: { 
      count: sentCount, 
      label: 'Projetos Enviados', 
      sublabel: 'ao cliente', 
      percentage: `${sentPercentage}%`, 
      labelPercentage: 'Taxa envio' 
    },
    // Nota: Para calcular estes valores precisamos consultar a API de orçamentos
    // Por enquanto, mostramos 0
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
  }
  
  // Mostrar aviso se não houver dados
  const showInfo = createdCount === 0

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
                <span className="funnel-info-bold">Funil Fechado:</span> Mostra apenas os projetos criados no período selecionado (Nov 1-5, 2025) e como eles progrediram até a data final.
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
      
      {!showInfo && (
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
      )}
    </div>
  )
}

