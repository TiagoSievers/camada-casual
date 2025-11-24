'use client'

import { useState, useMemo } from 'react'
import type { Project } from '@/types/dashboard'
import './MarginProfitabilitySection.css'

interface MarginProfitabilitySectionProps {
  projects: Project[]
  filters: {
    dateRange: { start: Date | string; end: Date | string }
    nucleo?: string | null
    loja?: string | null
    vendedor?: string | null
    arquiteto?: string | null
  }
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

  // Dados simulados - substituir por dados reais da API quando disponível
  const nucleosData: MarginData[] = useMemo(() => [
    { name: 'Interiores', lucro: 125000, receita: 500000, margem: 25.0 },
    { name: 'Exteriores', lucro: 98000, receita: 420000, margem: 23.3 },
    { name: 'Conceito', lucro: 156000, receita: 650000, margem: 24.0 },
    { name: 'Projetos', lucro: 89000, receita: 380000, margem: 23.4 },
  ], [])

  const marcasData: MarginData[] = useMemo(() => [
    { name: 'Marca A', lucro: 145000, receita: 580000, margem: 25.0 },
    { name: 'Marca B', lucro: 132000, receita: 550000, margem: 24.0 },
    { name: 'Marca C', lucro: 98000, receita: 420000, margem: 23.3 },
    { name: 'Marca D', lucro: 87000, receita: 380000, margem: 22.9 },
  ], [])

  // Dados do mês anterior (simulado)
  const previousMonthData = useMemo(() => ({
    geral: { lucro: 420000, receita: 1800000, margem: 23.3 },
    nucleos: [
      { name: 'Interiores', lucro: 118000, receita: 480000, margem: 24.6 },
      { name: 'Exteriores', lucro: 95000, receita: 410000, margem: 23.2 },
      { name: 'Conceito', lucro: 148000, receita: 620000, margem: 23.9 },
      { name: 'Projetos', lucro: 85000, receita: 360000, margem: 23.6 },
    ],
    marcas: [
      { name: 'Marca A', lucro: 138000, receita: 560000, margem: 24.6 },
      { name: 'Marca B', lucro: 125000, receita: 530000, margem: 23.6 },
      { name: 'Marca C', lucro: 92000, receita: 400000, margem: 23.0 },
      { name: 'Marca D', lucro: 82000, receita: 360000, margem: 22.8 },
    ],
  }), [])

  // Calcular totais gerais baseados nos filtros do header
  const geralData = useMemo(() => {
    const totalLucro = nucleosData.reduce((sum, n) => sum + n.lucro, 0)
    const totalReceita = nucleosData.reduce((sum, n) => sum + n.receita, 0)
    const margemPonderada = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    return { lucro: totalLucro, receita: totalReceita, margem: margemPonderada }
  }, [nucleosData])

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
  const nucleosDelta = calculateDelta(nucleosTotal.margem, previousMonthData.nucleos.reduce((sum, n) => sum + n.margem, 0) / previousMonthData.nucleos.length)
  const marcasDelta = calculateDelta(marcasTotal.margem, previousMonthData.marcas.reduce((sum, m) => sum + m.margem, 0) / previousMonthData.marcas.length)

  return (
    <div className="margin-profitability-section">
      <h2 className="section-title">Margem & Rentabilidade</h2>
      
      {/* Cards de Resumo */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <h3>Margem Ponderada Geral</h3>
          </div>
          <div className="card-content">
            <div className="main-value">{formatPercent(geralData.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior</div>
              <div className={`comparison-value ${geralDelta >= 0 ? 'positive' : 'negative'}`}>
                {previousMonthData.geral.margem.toFixed(1)}% → {formatDelta(geralDelta)}
                {geralDelta >= 0 ? ' ↗' : ' ↘'}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>Por Núcleos</h3>
          </div>
          <div className="card-content">
            <div className="main-value">{formatPercent(nucleosTotal.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior</div>
              <div className={`comparison-value ${nucleosDelta >= 0 ? 'positive' : 'negative'}`}>
                {formatDelta(nucleosDelta)}
                {nucleosDelta >= 0 ? ' ↗' : ' ↘'}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>Por Marcas</h3>
          </div>
          <div className="card-content">
            <div className="main-value">{formatPercent(marcasTotal.margem)}</div>
            <div className="comparison">
              <div className="comparison-label">vs. mês anterior</div>
              <div className={`comparison-value ${marcasDelta >= 0 ? 'positive' : 'negative'}`}>
                {formatDelta(marcasDelta)}
                {marcasDelta >= 0 ? ' ↗' : ' ↘'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas */}
      <div className="tables-container">
        {/* Tabela de Núcleos */}
        <div className="table-wrapper">
          <h3 className="table-title">Núcleos</h3>
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
                <td><strong>Total</strong></td>
                <td className="col-lucro"><strong>{formatCurrency(selectedNucleosTotal.lucro)}</strong></td>
                <td className="col-receita"><strong>{formatCurrency(selectedNucleosTotal.receita)}</strong></td>
                <td className="col-margem"><strong>{formatPercent(selectedNucleosTotal.margem)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabela de Marcas */}
        <div className="table-wrapper">
          <h3 className="table-title">Marcas</h3>
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
                <td><strong>Total</strong></td>
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

