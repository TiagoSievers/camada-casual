# Mapeamento de Campos JSON para Filtros do Dashboard

## Análise do JSON Fornecido

### ✅ Campos Disponíveis para Filtros

#### 1. **Período (Date Range)**
- ✅ **`Created Date`**: Data de criação do projeto
  - Formato: ISO 8601 (ex: `"2025-09-18T17:37:40.345Z"`)
  - Uso: Filtro principal para Funil Fechado
  - Campo: `"Created Date"`

- ✅ **`Modified Date`**: Data de última modificação
  - Formato: ISO 8601 (ex: `"2025-11-14T12:58:33.078Z"`)
  - Uso: Pode ser usado como referência adicional
  - Campo: `"Modified Date"`

**Conclusão**: ✅ **TEMOS** campos de data para filtro de período

---

#### 2. **Núcleo**
- ✅ **`nucleo_lista`**: Array de núcleos associados ao projeto
  - Tipo: `Array<string>`
  - Exemplos encontrados:
    - `["Interiores"]`
    - `["Interiores", "Exteriores"]`
    - `["Interiores", "Conceito", "Exteriores"]`
    - `["Conceito"]`
    - `["Exteriores"]`
    - `["Interiores", "Projetos"]`
    - `["Interiores", "Conceito", "Projetos", "Exteriores"]`
  - Campo: `"nucleo_lista"`

**Conclusão**: ✅ **TEMOS** campo de núcleo (array)

---

#### 3. **Lojas**
- ✅ **`loja`**: ID da loja física
  - Tipo: `string` (ID único)
  - Exemplos encontrados:
    - `"1732213928491x520619114988830700"`
    - `"1732204531042x438951525022695400"`
    - `"1734012653578x967484958249582600"`
    - `"1733235876773x361955973433917440"`
    - `"1750873331400x213025788349906940"`
    - `"1742996751632x942472729446580200"`
    - `"1750874705918x963736883353354200"`
    - `"1733150518697x250890284542722050"`
  - Campo: `"loja"` (pode estar ausente em alguns registros)

**Conclusão**: ✅ **TEMOS** campo de loja (ID)

---

#### 4. **Vendedor (Vendedores + Gerentes)**
- ✅ **`vendedor_user`**: ID do vendedor principal
  - Tipo: `string` (ID único)
  - Campo: `"vendedor_user"`

- ✅ **`Gerenciador`**: ID do gerenciador
  - Tipo: `string` (ID único)
  - Campo: `"Gerenciador"`

- ✅ **Campos específicos por núcleo** (Vendedor Principal):
  - `"user Interiores - Vendedor Principal"`
  - `"user Exteriores - Vendedor Principal"`
  - `"user Conceito - Vendedor Principal"`
  - `"user Projetos - Vendedor Principal"`
  - `"Interiores - Vendedor Principal"`
  - `"Exteriores - Vendedor Principal"`
  - `"Conceito - Vendedor Principal"`

- ✅ **Campos de Vendedor Parceiro**:
  - `"user Interiores - Vendedor Parceiro"`
  - `"user Exteriores - Vendedor Parceiro"`
  - `"user Conceito - Vendedor Parceiro"`
  - `"Interiores - Vendedor Parceiro"`
  - `"Exteriores - Vendedor Parceiro"`

**Conclusão**: ✅ **TEMOS** múltiplos campos de vendedor/gerenciador

**Recomendação**: Consolidar todos os campos de vendedor em uma lista única para o filtro, incluindo:
- `vendedor_user`
- `Gerenciador`
- Todos os campos `"user {Núcleo} - Vendedor Principal"`
- Todos os campos `"user {Núcleo} - Vendedor Parceiro"`

---

#### 5. **Arquiteto**
- ✅ **`arquiteto`**: ID do arquiteto responsável
  - Tipo: `string` (ID único)
  - Exemplos encontrados:
    - `"1742844294999x233582783458083900"`
    - `"1742844294843x939363887624794800"`
    - `"1762720460252x680908335027060700"`
  - Campo: `"arquiteto"` (pode estar ausente em alguns registros)

**Conclusão**: ✅ **TEMOS** campo de arquiteto (ID)

---

### 📋 Campos Adicionais Úteis

#### Status do Projeto
- ✅ **`status`**: Status atual do projeto
  - Valores encontrados:
    - `"Ativo"`
    - `"Pausado"`
    - `"Inativo"`
  - Campo: `"status"`

#### Orçamentos
- ✅ **`new_orcamentos`**: Array de IDs de orçamentos
  - Tipo: `Array<string>`
  - Campo: `"new_orcamentos"`
  - **Importante**: Este campo contém os orçamentos que precisam ser consultados na tabela "All orcamentos" para obter os status

#### IDs e Identificadores
- ✅ **`id`**: ID numérico do projeto (ex: `10001`, `10002`)
- ✅ **`_id`**: ID único do registro
- ✅ **`cliente`**: ID do cliente
- ✅ **`titulo`**: Título do projeto

---

## ⚠️ Observações Importantes

### 1. Campos Opcionais
Alguns campos podem estar ausentes em alguns registros:
- `loja` - pode não existir
- `arquiteto` - pode não existir
- `nucleo_lista` - pode não existir (mas raro)

### 2. Estrutura de Vendedores
A estrutura de vendedores é complexa, com múltiplos campos por núcleo. É necessário:
- Consolidar todos os IDs de vendedores em uma lista única
- Considerar tanto "Vendedor Principal" quanto "Vendedor Parceiro"
- Incluir o campo `Gerenciador`

### 3. Relação com Orçamentos
Para calcular as métricas do funil, é necessário:
- Usar o campo `new_orcamentos` (array de IDs)
- Consultar a tabela "All orcamentos" para obter:
  - `Create Date` do orçamento
  - `status` do orçamento (para determinar "Enviado", "Em Aprovação", "Aprovado", "Reprovado")

---

## ✅ Resumo: Todos os Filtros Têm Campos Disponíveis

| Filtro | Campo(s) no JSON | Status |
|--------|------------------|--------|
| **Período** | `Created Date`, `Modified Date` | ✅ Disponível |
| **Núcleo** | `nucleo_lista` | ✅ Disponível |
| **Lojas** | `loja` | ✅ Disponível |
| **Vendedor** | `vendedor_user`, `Gerenciador`, `user {Núcleo} - Vendedor Principal/Parceiro` | ✅ Disponível |
| **Arquiteto** | `arquiteto` | ✅ Disponível |

---

## 🔄 Próximos Passos para Implementação

1. **Criar tipos TypeScript** baseados nos campos identificados
2. **Implementar funções de filtro** que processem os campos do JSON
3. **Criar endpoint/query** que consulte a tabela "All orcamentos" usando os IDs de `new_orcamentos`
4. **Consolidar campos de vendedor** em uma estrutura unificada
5. **Tratar campos opcionais** (loja, arquiteto podem estar ausentes)


