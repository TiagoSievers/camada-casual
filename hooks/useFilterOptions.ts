/**
 * Hook para montar opções de filtros (núcleos, lojas, vendedores, arquitetos)
 * usando:
 * - projetos já carregados (para núcleos)
 * - APIs específicas (lojas, vendedores, arquitetos)
 *
 * Importante: este hook NÃO chama mais a API de projetos.
 */

import { useState, useEffect } from 'react'
import { fetchLojas, fetchVendedores, fetchArquitetos } from '@/lib/api'
import type { Project, FilterOptions, Nucleo } from '@/types/dashboard'

interface UseFilterOptionsReturn {
  options: FilterOptions
  loading: boolean
  error: string | null
  loadLojas: () => Promise<void>
  loadVendedores: () => Promise<void>
  loadArquitetos: () => Promise<void>
}

export function useFilterOptions(projects: Project[]): UseFilterOptionsReturn {
  const [options, setOptions] = useState<FilterOptions>({
    nucleos: [],
    lojas: [],
    vendedores: [],
    arquitetos: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lojasLoaded, setLojasLoaded] = useState(false)
  const [vendedoresLoaded, setVendedoresLoaded] = useState(false)
  const [arquitetosLoaded, setArquitetosLoaded] = useState(false)

  // Carregar apenas núcleos automaticamente (vem dos projetos)
  useEffect(() => {
    const nucleosSet = new Set<Nucleo>()
    projects.forEach(project => {
      if (project.nucleo_lista) {
        project.nucleo_lista.forEach(nucleo => nucleosSet.add(nucleo))
      }
    })
    const nucleos = Array.from(nucleosSet).map(id => ({
      id,
      name: id,
    }))

    setOptions(prev => ({
      ...prev,
      nucleos,
    }))
  }, [projects])

  // Função para carregar lojas sob demanda
  const loadLojas = async () => {
    if (lojasLoaded) return // Já carregado

    try {
      setLoading(true)
      console.log(`[FILTROS] Carregando lojas sob demanda...`)
      const lojasData = await fetchLojas(false) // false = use cache if available
      const lojas = lojasData
        .filter(loja => loja.removido !== true)
        .map(loja => ({
          id: loja._id,
          name: loja.nome_da_loja || loja._id,
          nucleoId: undefined,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      setOptions(prev => ({ ...prev, lojas }))
      setLojasLoaded(true)
      console.log(`[FILTROS] Lojas carregadas: ${lojas.length}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lojas')
      console.error('Erro ao carregar lojas:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar vendedores sob demanda
  const loadVendedores = async () => {
    if (vendedoresLoaded) return // Já carregado

    try {
      setLoading(true)
      console.log(`[FILTROS] Carregando vendedores sob demanda...`)
      const vendedoresData = await fetchVendedores(false) // false = use cache if available
      const vendedores = vendedoresData
        .filter(vendedor => {
          if (vendedor.removido === true) return false
          if (vendedor['status_do_vendedor'] && vendedor['status_do_vendedor'] !== 'ATIVO') return false
          return true
        })
        .map(vendedor => ({
          id: vendedor._id,
          name: vendedor.nome || vendedor._id,
          type: 'vendedor' as const,
          nucleo: [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      setOptions(prev => ({ ...prev, vendedores }))
      setVendedoresLoaded(true)
      console.log(`[FILTROS] Vendedores carregados: ${vendedores.length}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedores')
      console.error('Erro ao carregar vendedores:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar arquitetos sob demanda
  const loadArquitetos = async () => {
    if (arquitetosLoaded) return // Já carregado

    try {
      setLoading(true)
      console.log(`[FILTROS] Carregando arquitetos sob demanda...`)
      const arquitetosData = await fetchArquitetos(false) // false = use cache if available
      const arquitetos = arquitetosData
        .filter(arquiteto => {
          if (arquiteto.removido === true) return false
          if (arquiteto['Status do Arquiteto'] && arquiteto['Status do Arquiteto'] !== 'ATIVO') return false
          return true
        })
        .map(arquiteto => ({
          id: arquiteto._id,
          name: arquiteto['Nome do Arquiteto'] || arquiteto._id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      setOptions(prev => ({ ...prev, arquitetos }))
      setArquitetosLoaded(true)
      console.log(`[FILTROS] Arquitetos carregados: ${arquitetos.length}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar arquitetos')
      console.error('Erro ao carregar arquitetos:', err)
    } finally {
      setLoading(false)
    }
  }

  return { options, loading, error, loadLojas, loadVendedores, loadArquitetos }
}



