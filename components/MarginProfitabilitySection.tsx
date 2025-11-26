'use client'

import { useState, useMemo } from 'react'
import type { Project, DashboardFilters } from '@/types/dashboard'
import { useMarginData } from '@/hooks/useMarginData'
import './MarginProfitabilitySection.css'

interface MarginProfitabilitySectionProps {
  projects: Project[]
  filters: DashboardFilters
}

interface MarginData {
  name: string
  lucro: number
  receita: number
  margem: number
}

export default function MarginProfitabilitySection({ projects, filters }: MarginProfitabilitySectionProps) {
  const [selectedNucleos, setSelectedNucleos] = useState<Set<string>>(new Set())
  const [selectedMarcas, setSelectedMarcas] = useState<Set<string>>(new Set())

  // Buscar dados reais da API
  const { geral, nucleos, marcas, previousMonth, loading, error } = useMarginData(filters)

  const nucleosData: MarginData[] = nucleos
  const marcasData: MarginData[] = marcas

  // Dados do mês anterior
  const previousMonthData = previousMonth || {
    geral: { lucro: 0, receita: 0, margem: 0 },
    nucleos: [],
    marcas: [],
  }

  // Usar dados gerais diretamente do hook
  const geralData = geral

  // Calcular totais de núcleos e marcas
  const nucleosTotal = useMemo(() => {
    const totalLucro = nucleosData.reduce((sum, n) => sum + n.lucro, 0)
    const totalReceita = nucleosData.reduce((sum, n) => sum + n.receita, 0)
    const margemPonderada = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    return { lucro: totalLucro, receita: totalReceita, margem: margemPonderada }
  }, [nucleosData])

  const marcasTotal = useMemo(() => {
    const totalLucro = marcasData.reduce((sum, m) => sum + m.lucro, 0)
    const totalReceita = marcasData.reduce((sum, m) => sum + m.receita, 0)
    const margemPonderada = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    return { lucro: totalLucro, receita: totalReceita, margem: margemPonderada }
  }, [marcasData])

  // Calcular totais dos selecionados nas tabelas
  const selectedNucleosTotal = useMemo(() => {
    const selected = nucleosData.filter(n => selectedNucleos.has(n.name) || selectedNucleos.size === 0)
    const totalLucro = selected.reduce((sum, n) => sum + n.lucro, 0)
    const totalReceita = selected.reduce((sum, n) => sum + n.receita, 0)
    const margemPonderada = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    return { lucro: totalLucro, receita: totalReceita, margem: margemPonderada }
  }, [nucleosData, selectedNucleos])

  const selectedMarcasTotal = useMemo(() => {
    const selected = marcasData.filter(m => selectedMarcas.has(m.name) || selectedMarcas.size === 0)
    const totalLucro = selected.reduce((sum, m) => sum + m.lucro, 0)
    const totalReceita = selected.reduce((sum, m) => sum + m.receita, 0)
    const margemPonderada = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    return { lucro: totalLucro, receita: totalReceita, margem: margemPonderada }
  }, [marcasData, selectedMarcas])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const calculateDelta = (current: number, previous: number) => {
    return current - previous
  }

  const formatDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}pp`
  }

  const toggleNucleo = (name: string) => {
    const newSet = new Set(selectedNucleos)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setSelectedNucleos(newSet)
  }

  const toggleMarca = (name: string) => {
    const newSet = new Set(selectedMarcas)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setSelectedMarcas(newSet)
  }

  const geralDelta = calculateDelta(geralData.margem, previousMonthData.geral.margem)
  const nucleosDelta = useMemo(() => {
    if (previousMonthData.nucleos.length === 0) return 0
    const previousAvg = previousMonthData.nucleos.reduce((sum, n) => sum + n.margem, 0) / previousMonthData.nucleos.length
    return calculateDelta(nucleosTotal.margem, previousAvg)
  }, [nucleosTotal.margem, previousMonthData.nucleos])
  const marcasDelta = useMemo(() => {
    if (previousMonthData.marcas.length === 0) return 0
    const previousAvg = previousMonthData.marcas.reduce((sum, m) => sum + m.margem, 0) / previousMonthData.marcas.length
    return calculateDelta(marcasTotal.margem, previousAvg)
  }, [marcasTotal.margem, previousMonthData.marcas])

  if (loading) {
    return (
      <div className="margin-profitability-section">
        <h2 className="section-title">Margem & Rentabilidade</h2>
        <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="margin-profitability-section">
        <h2 className="section-title">Margem & Rentabilidade</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Erro: {error}</div>
      </div>
    )
  }

  return (
    <div className="margin-profitability-section">
      <h2 className="section-title">Margem & Rentabilidade</h2>
      
      {/* Cards de Resumo */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon-wrapper card-icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7h6v6"></path>
              <path d="m22 7-8.5 8.5-5-5L2 17"></path>
            </svg>
          </div>
          <div className="card-content-wrapper">
            <div className="card-label">Margem Ponderada Geral</div>
            <div className="main-value">{formatPercent(geralData.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior:</div>
              <div className={`comparison-value ${geralDelta >= 0 ? 'positive' : 'negative'}`}>
                <span>{previousMonthData.geral.margem > 0 ? previousMonthData.geral.margem.toFixed(1) + '%' : '-'}</span>
                {previousMonthData.geral.margem > 0 && (
                  <>
                    <span className="comparison-arrow">{geralDelta >= 0 ? ' ↗' : ' ↘'}</span>
                    <span className="comparison-delta">{formatDelta(geralDelta)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-wrapper card-icon-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7h6v6"></path>
              <path d="m22 7-8.5 8.5-5-5L2 17"></path>
            </svg>
          </div>
          <div className="card-content-wrapper">
            <div className="card-label">Margem Ponderada - Núcleos</div>
            <div className="main-value">{formatPercent(nucleosTotal.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior:</div>
              <div className={`comparison-value ${nucleosDelta >= 0 ? 'positive' : 'negative'}`}>
                {previousMonthData.nucleos.length > 0 ? (
                  <>
                    <span>{previousMonthData.nucleos.reduce((sum, n) => sum + n.margem, 0) / previousMonthData.nucleos.length > 0 ? (previousMonthData.nucleos.reduce((sum, n) => sum + n.margem, 0) / previousMonthData.nucleos.length).toFixed(1) + '%' : '-'}</span>
                    <span className="comparison-arrow">{nucleosDelta >= 0 ? ' ↗' : ' ↘'}</span>
                    <span className="comparison-delta">{formatDelta(nucleosDelta)}</span>
                  </>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-wrapper card-icon-orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 7h6v6"></path>
              <path d="m22 7-8.5 8.5-5-5L2 17"></path>
            </svg>
          </div>
          <div className="card-content-wrapper">
            <div className="card-label">Margem Ponderada - Marcas</div>
            <div className="main-value">{formatPercent(marcasTotal.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior:</div>
              <div className={`comparison-value ${marcasDelta >= 0 ? 'positive' : 'negative'}`}>
                {previousMonthData.marcas.length > 0 ? (
                  <>
                    <span>{previousMonthData.marcas.reduce((sum, m) => sum + m.margem, 0) / previousMonthData.marcas.length > 0 ? (previousMonthData.marcas.reduce((sum, m) => sum + m.margem, 0) / previousMonthData.marcas.length).toFixed(1) + '%' : '-'}</span>
                    <span className="comparison-arrow">{marcasDelta >= 0 ? ' ↗' : ' ↘'}</span>
                    <span className="comparison-delta">{formatDelta(marcasDelta)}</span>
                  </>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas */}
      <div className="tables-container">
        {/* Tabela de Núcleos */}
        <div className="table-wrapper">
          <h3 className="table-title">Detalhamento por Núcleo</h3>
          <p className="table-subtitle">Selecione os núcleos para análise detalhada</p>
          <table className="margin-table">
            <thead>
              <tr>
                <th></th>
                <th className="col-lucro">Lucro</th>
                <th className="col-receita">Receita</th>
                <th className="col-margem">Margem</th>
              </tr>
            </thead>
            <tbody>
              {nucleosData.map((nucleo) => {
                const isSelected = selectedNucleos.has(nucleo.name) || selectedNucleos.size === 0
                return (
                  <tr 
                    key={nucleo.name} 
                    className={!isSelected ? 'disabled' : ''}
                    onClick={() => toggleNucleo(nucleo.name)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleNucleo(nucleo.name)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{nucleo.name}</span>
                    </td>
                    <td className="col-lucro">{formatCurrency(nucleo.lucro)}</td>
                    <td className="col-receita">{formatCurrency(nucleo.receita)}</td>
                    <td className="col-margem">{formatPercent(nucleo.margem)}</td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td><strong>Total Selecionado</strong></td>
                <td className="col-lucro"><strong>{formatCurrency(selectedNucleosTotal.lucro)}</strong></td>
                <td className="col-receita"><strong>{formatCurrency(selectedNucleosTotal.receita)}</strong></td>
                <td className="col-margem"><strong>{formatPercent(selectedNucleosTotal.margem)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabela de Marcas */}
        <div className="table-wrapper">
          <h3 className="table-title">Detalhamento por Marca</h3>
          <p className="table-subtitle">Selecione as marcas para análise detalhada</p>
          <table className="margin-table">
            <thead>
              <tr>
                <th></th>
                <th className="col-lucro">Lucro</th>
                <th className="col-receita">Receita</th>
                <th className="col-margem">Margem</th>
              </tr>
            </thead>
            <tbody>
              {marcasData.map((marca) => {
                const isSelected = selectedMarcas.has(marca.name) || selectedMarcas.size === 0
                return (
                  <tr 
                    key={marca.name} 
                    className={!isSelected ? 'disabled' : ''}
                    onClick={() => toggleMarca(marca.name)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMarca(marca.name)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{marca.name}</span>
                    </td>
                    <td className="col-lucro">{formatCurrency(marca.lucro)}</td>
                    <td className="col-receita">{formatCurrency(marca.receita)}</td>
                    <td className="col-margem">{formatPercent(marca.margem)}</td>
                  </tr>
                )
              })}
              <tr className="total-row">
                <td><strong>Total Selecionado</strong></td>
                <td className="col-lucro"><strong>{formatCurrency(selectedMarcasTotal.lucro)}</strong></td>
                <td className="col-receita"><strong>{formatCurrency(selectedMarcasTotal.receita)}</strong></td>
                <td className="col-margem"><strong>{formatPercent(selectedMarcasTotal.margem)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

