'use client'

import './DataTable.css'

export default function DataTable() {
  const tableData = [
    { id: 1, cliente: 'Empresa A', projeto: 'Website Redesign', valor: 'R$ 45.000', status: 'Em andamento', data: '15/11/2024' },
    { id: 2, cliente: 'Empresa B', projeto: 'App Mobile', valor: 'R$ 120.000', status: 'Concluído', data: '10/11/2024' },
    { id: 3, cliente: 'Empresa C', projeto: 'Sistema ERP', valor: 'R$ 250.000', status: 'Em andamento', data: '20/11/2024' },
    { id: 4, cliente: 'Empresa D', projeto: 'E-commerce', valor: 'R$ 80.000', status: 'Pendente', data: '25/11/2024' },
  ]

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'status-completed'
      case 'Em andamento':
        return 'status-progress'
      case 'Pendente':
        return 'status-pending'
      default:
        return ''
    }
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="table-title">Projetos Recentes</h3>
        <button className="table-action">Ver todos</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Projeto</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td>{row.cliente}</td>
                <td>{row.projeto}</td>
                <td className="value-cell">{row.valor}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td>{row.data}</td>
                <td>
                  <button className="action-button">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



