# Passo a Passo: Fluxo quando seleciona um filtro

## Visão Geral

Quando você seleciona qualquer filtro no Header (período, núcleo, loja, vendedor, arquiteto, status), o sistema executa as seguintes etapas:

---

## ETAPA 1: Buscar projetos da API com os parâmetros de acordo com o período selecionado

**Função:** `fetchProjects(filters)` em `lib/api.ts`

**O que acontece:**
1. Verifica se existe cache válido (< 30 minutos) para esta combinação de filtros
2. Se não houver cache, faz chamada à API:
   - **URL:** `GET /api/1.1/obj/projeto?constraints=[...]&cursor=...&limit=100`
   - **Filtros aplicados via constraints:**
     - Período: `Created Date` entre `start` e `end`
     - Núcleo, Loja, Vendedor, Arquiteto (se aplicável)
   - Faz paginação automática até buscar todos os projetos
3. Salva no cache: `casual_crm_projetos_cache_<hash>`

**Log:**
```
[ETAPA 1] projeto api result total_projetos=122
```

**Resultado:** Array de projetos filtrados por período e outros filtros

---

## ETAPA 2: Filtrar projetos por status de orçamento (se houver filtro de status)

**Função:** `filterProjectsByOrcamentoStatus(projects, filters.status)` em `lib/api.ts`

**O que acontece:**
1. Se `filters.status` existir (Em Aprovação, Enviado, Aprovado, Reprovado):
   - Coleta todos os IDs de orçamentos dos projetos
   - Busca orçamentos em lotes de 50 via API:
     - **URL:** `GET /api/1.1/obj/orcamento?constraints=[{"key":"_id","constraint_type":"in","value":[...]}]`
   - Filtra projetos que têm pelo menos um orçamento com o status correspondente
2. Se não houver filtro de status, retorna todos os projetos

**Log:**
```
[ETAPA 2] Filtrando projetos por status de orçamento: Em Aprovação, total_orcamento_ids=138
[ETAPA 2] Orçamentos encontrados: 137, projetos filtrados: 4 de 122
```

**Resultado:** Array de projetos filtrados por status de orçamento (se aplicável)

---

## ETAPA 3: Buscar os orçamentos destes projetos para calcular o funil

**Função:** `calculateFunnelMetrics()` em `lib/api.ts`

**O que acontece:**
1. Verifica se existe cache válido do resultado final do funil:
   - Chave: `funnel_cache_<hash>` baseada na combinação de filtros
   - Se existir e válido (< 30 min), retorna do cache (CACHE HIT)
2. Se não houver cache:
   - Coleta todos os IDs de orçamentos dos projetos recebidos
   - Busca orçamentos em lotes de 50 via API:
     - **URL:** `GET /api/1.1/obj/orcamento?constraints=[{"key":"_id","constraint_type":"in","value":[...]}]`
   - Cria mapa de orçamentos para consulta rápida

**Log:**
```
[ETAPA 3] Buscando orçamentos dos projetos, total_projetos=4 total_orcamento_ids=10
[ETAPA 3] Orçamentos encontrados: 10 de 10 IDs buscados
```

**Resultado:** Mapa de orçamentos (`orcamentosMap`) pronto para processamento

---

## ETAPA 4: Calcular métricas do funil (contagens e percentuais)

**Função:** `calculateFunnelMetrics()` continua em `lib/api.ts`

**O que acontece:**
1. Para cada projeto:
   - Verifica se tem orçamentos
   - Para cada orçamento do projeto:
     - Busca status no mapa de orçamentos
     - Classifica: `hasSent`, `hasInApproval`, `hasApproved`, `hasRejected`
   - Conta por projeto (não por orçamento)
2. Calcula contagens totais:
   - `createdCount`: total de projetos
   - `sentCount`: projetos com orçamentos enviados
   - `inApprovalCount`: projetos em aprovação
   - `approvedCount`: projetos aprovados
   - `rejectedCount`: projetos reprovados
3. Calcula percentuais:
   - Taxa de envio: `(sentCount / createdCount) * 100`
   - Em aprovação: `(inApprovalCount / sentCount) * 100`
   - Aprovados: `(approvedCount / sentCount) * 100`
   - Reprovados: `(rejectedCount / sentCount) * 100`

**Log:**
```
[ETAPA 4] funnel_metrics processado total_projetos=4 projetos_enviados=2 em_aprovacao=4 aprovados=1 reprovados=0 total_orcamentos=10
```

**Resultado:** Objeto com todas as métricas calculadas

---

## ETAPA 5: Salvar resultado final no cache

**Função:** `calculateFunnelMetrics()` finaliza em `lib/api.ts`

**O que acontece:**
1. Gera chave de cache baseada na combinação de filtros:
   - `funnelType` (closed/open)
   - `useOrcamentos` (false para Status de Projetos)
   - `startDate` / `endDate` (período)
   - `nucleo`, `loja`, `vendedor`, `arquiteto`, `status` (filtros)
2. Salva no localStorage:
   - Chave: `funnel_cache_<hash>`
   - Valor: objeto completo com todas as métricas
   - Timestamp: `funnel_cache_<hash>_timestamp`
3. Cache válido por 30 minutos

**Log:**
```
[ETAPA 5] funnel_cache SAVE key=funnel_cache_1x21j3 periodo=Este Mês status=Em Aprovação nucleo=Todos loja=Todas vendedor=Todos arquiteto=Todos createdCount=4 sentCount=2 emAprovacao=4 aprovados=1 reprovados=0
```

**Resultado:** Resultado final salvo no cache para reutilização

---

## Fluxo Completo Resumido

```
Usuário seleciona filtro
    ↓
[ETAPA 1] Buscar projetos da API → projetos filtrados
    ↓
[ETAPA 2] Filtrar por status de orçamento (se houver) → projetos filtrados por status
    ↓
[ETAPA 3] Buscar orçamentos dos projetos → mapa de orçamentos
    ↓
[ETAPA 4] Calcular métricas do funil → objeto com métricas
    ↓
[ETAPA 5] Salvar resultado no cache → localStorage
    ↓
Renderizar na tela
```

---

## Observações Importantes

1. **Cache de Projetos (ETAPA 1):** Salva apenas os projetos crus da API, não o resultado final
2. **Cache de Funil (ETAPA 5):** Salva o resultado final calculado, pronto para exibição
3. **CACHE HIT:** Se a combinação de filtros já foi calculada antes (< 30 min), pula direto para ETAPA 5 (leitura do cache)
4. **Múltiplas Execuções:** O `useEffect` em `FunnelSection` pode disparar múltiplas vezes devido a mudanças nas dependências (`closedFunnelProjects`, `openFunnelProjects`, `previousMonthClosedProjects`)

