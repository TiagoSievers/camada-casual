# Integração com API - Dashboard Casual CRM

## ✅ Implementação Concluída

### 1. **Estrutura de API** (`lib/api.ts`)
- ✅ Função `fetchProjects()` para buscar projetos da API
- ✅ Função `filterProjects()` para filtrar projetos localmente
- ✅ Função `calculateFunnelMetrics()` (estrutura preparada)

**Endpoint**: `https://crm.casualmoveis.com.br/version-live/api/1.1/obj/projeto`

### 2. **Hooks React**

#### `hooks/useProjects.ts`
- ✅ Hook para buscar projetos da API
- ✅ Aplicação automática de filtros
- ✅ Estados de loading e error
- ✅ Função `refetch()` para recarregar dados

#### `hooks/useFilterOptions.ts`
- ✅ Hook para extrair opções de filtros dos projetos
- ✅ Extração automática de:
  - Núcleos únicos
  - Lojas únicas
  - Vendedores únicos (consolidando todos os campos)
  - Arquitetos únicos

### 3. **Componentes Atualizados**

#### `components/Header.tsx`
- ✅ Integrado com sistema de filtros
- ✅ Date picker funcional
- ✅ Dropdowns para Núcleo, Loja, Vendedor e Arquiteto
- ✅ Callbacks para atualizar filtros

#### `components/FunnelSection.tsx`
- ✅ Aceita `projects` como prop
- ✅ Calcula métricas baseado nos projetos
- ⚠️ **TODO**: Implementar cálculo real baseado nos orçamentos

#### `components/ChartsSection.tsx`
- ✅ Aceita `projects` como prop
- ⚠️ **TODO**: Processar projetos para gerar dados dos gráficos

#### `app/dashboard/page.tsx`
- ✅ Gerenciamento de estado dos filtros
- ✅ Integração com hooks de API
- ✅ Estados de loading e error
- ✅ Passagem de dados para componentes filhos

### 4. **Tipos TypeScript** (`types/dashboard.ts`)
- ✅ Interface `Project` baseada no JSON da API
- ✅ Interface `DashboardFilters`
- ✅ Interface `FilterOptions`
- ✅ Funções utilitárias (`extractVendedorIds`, `matchesFilters`)

## 🔄 Fluxo de Dados

```
1. DashboardPage inicializa com filtros padrão (últimos 30 dias)
   ↓
2. useFilterOptions() busca projetos e extrai opções
   ↓
3. useProjects(filters) busca projetos e aplica filtros
   ↓
4. Header recebe filtros e opções, permite alteração
   ↓
5. FunnelSection e ChartsSection recebem projetos filtrados
   ↓
6. Componentes renderizam dados
```

## ⚠️ Próximos Passos

### 1. **Cálculo Real do Funil**
Para calcular as métricas do funil corretamente, é necessário:
- Buscar dados da tabela "All orcamentos" usando os IDs de `new_orcamentos`
- Filtrar orçamentos por status:
  - "Enviado ao cliente"
  - "Aprovado pelo cliente"
  - "Reprovado"
  - "Liberado para pedido"
  - "Em Aprovação"

### 2. **Gráficos com Dados Reais**
- Processar projetos para gerar dados diários
- Agrupar por data de criação
- Calcular evolução de status ao longo do tempo

### 3. **Melhorias de UX**
- Loading states mais elaborados
- Tratamento de erros mais robusto
- Cache de dados
- Paginação se necessário

### 4. **Otimizações**
- Debounce nos filtros
- Memoização de cálculos pesados
- Lazy loading de componentes

## 📝 Notas Técnicas

### CORS
Se houver problemas de CORS ao acessar a API, pode ser necessário:
- Configurar proxy no `next.config.js`
- Ou fazer requisições via API routes do Next.js

### Autenticação
Se a API requerer autenticação, adicionar headers apropriados em `lib/api.ts`:
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer TOKEN', // Se necessário
}
```

### Rate Limiting
Considerar implementar:
- Cache de requisições
- Throttling de chamadas
- Retry logic para falhas temporárias


