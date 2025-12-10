/**
 * Hook para montar opções de filtros (núcleos, lojas, vendedores, arquitetos)
 * usando:
 * - API de orçamentos e projetos (para núcleos - busca TODOS os núcleos disponíveis)
 * - APIs específicas (lojas, vendedores, arquitetos)
 *
 * Núcleos são carregados automaticamente na montagem do componente.
 * Lojas, vendedores e arquitetos são carregados sob demanda (quando o dropdown é focado).
 */

import { useState, useEffect } from 'react'
import { fetchLojas, fetchVendedores, fetchArquitetos, fetchAllNucleos } from '@/lib/api'
import type { FilterOptions } from '@/types/dashboard'

interface UseFilterOptionsReturn {
  options: FilterOptions
  loading: boolean
  error: string | null
  loadLojas: () => Promise<void>
  loadVendedores: () => Promise<void>
  loadArquitetos: () => Promise<void>
}

export function useFilterOptions(): UseFilterOptionsReturn {
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
  const [nucleosLoaded, setNucleosLoaded] = useState(false)

  // Carregar todos os núcleos disponíveis (independente dos filtros)
  useEffect(() => {
    const loadNucleos = async () => {
      if (nucleosLoaded) return // Já carregado

      try {
        setLoading(true)
        console.log(`[FILTROS] Carregando todos os núcleos disponíveis...`)
        const nucleosData = await fetchAllNucleos(false) // false = use cache if available
        const nucleos = nucleosData.map(id => ({
          id,
          name: id,
        }))

        setOptions(prev => ({
          ...prev,
          nucleos,
        }))
        setNucleosLoaded(true)
        console.log(`[FILTROS] Núcleos carregados: ${nucleos.length}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar núcleos')
        console.error('Erro ao carregar núcleos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNucleos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

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



