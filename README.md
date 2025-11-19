# Casual CRM - Dashboard Executivo

Dashboard executivo desenvolvido com Next.js e TypeScript, baseado no design do Figma.

## Estrutura do Projeto

```
├── app/
│   ├── dashboard/
│   │   ├── page.tsx       # Página principal do dashboard
│   │   ├── page.css       # Estilos da página
│   │   └── layout.tsx     # Layout do dashboard
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial (redireciona para /dashboard)
│   └── globals.css        # Estilos globais
├── components/
│   ├── Sidebar.tsx        # Barra lateral de navegação
│   ├── Header.tsx         # Cabeçalho do dashboard
│   ├── MetricsCards.tsx   # Cards de métricas
│   ├── ChartsSection.tsx  # Seção de gráficos
│   └── DataTable.tsx      # Tabela de dados
└── package.json
```

## Instalação

```bash
npm install
```

## Executar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Funcionalidades

- ✅ Sidebar colapsável com navegação
- ✅ Header com informações do usuário
- ✅ Cards de métricas com indicadores de tendência
- ✅ Seção de gráficos (placeholder para integração futura)
- ✅ Tabela de projetos recentes
- ✅ Design responsivo
- ✅ Tema claro com cores personalizáveis via CSS variables

## Deploy

### Deploy na Vercel

1. **Conecte seu repositório GitHub à Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub
   - Clique em "Add New Project"
   - Selecione o repositório `camada-casual`
   - A Vercel detectará automaticamente que é um projeto Next.js

2. **Configure as variáveis de ambiente (se necessário):**
   - No painel da Vercel, vá em Settings > Environment Variables
   - Adicione as variáveis necessárias (consulte `.env.example`)

3. **Deploy automático:**
   - A Vercel fará deploy automaticamente a cada push na branch `main`
   - Você pode também fazer deploy manual clicando em "Deploy"

### Deploy Manual

```bash
# Build do projeto
npm run build

# Testar build localmente
npm start
```

### Comandos Git para Push

```bash
# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit"

# Configurar branch main (se necessário)
git branch -M main

# Adicionar remote (se ainda não foi adicionado)
git remote add origin https://github.com/TiagoSievers/camada-casual.git

# Fazer push
git push -u origin main
```

## Próximos Passos

- Integrar biblioteca de gráficos (Chart.js, Recharts, etc.)
- Conectar com API real para dados
- Adicionar mais páginas e funcionalidades
- Implementar autenticação
- Adicionar testes


