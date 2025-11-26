'use client'

import { useState } from 'react'
import './Sidebar.css'

export type TabType = 'status' | 'margin' | 'performance' | 'rankings'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function Sidebar({ isOpen, onToggle, activeTab, onTabChange }: SidebarProps) {
  const menuItems: Array<{ icon: string; label: string; subtitle: string; tab: TabType }> = [
    { 
      icon: 'layout-dashboard', 
      label: 'Status de Projetos', 
      subtitle: 'Visão geral do pipeline',
      tab: 'status'
    },
    { 
      icon: 'trending-up', 
      label: 'Margem & Rentabilidade',
      subtitle: 'Análise de margens',
      tab: 'margin'
    },
    { 
      icon: 'users', 
      label: 'Performance Comercial',
      subtitle: 'Vendedores e arquitetos',
      tab: 'performance'
    },
    { 
      icon: 'trophy', 
      label: 'TOP 10 Rankings',
      subtitle: 'Produtos e clientes',
      tab: 'rankings'
    },
  ]

  const IconComponent = ({ name, className }: { name: string, className: string }) => {
    const icons: Record<string, JSX.Element> = {
      'layout-dashboard': (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      ),
      'trending-up': (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 7h6v6"></path>
          <path d="m22 7-8.5 8.5-5-5L2 17"></path>
        </svg>
      ),
      'users': (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      ),
      'trophy': (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"></path>
          <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"></path>
          <path d="M18 9h1.5a1 1 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"></path>
          <path d="M6 9H4.5a1 1 0 0 1 0-5H6"></path>
        </svg>
      ),
    }
    return icons[name] || null
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-icon">CM</div>
          <div className="sidebar-logo-text">
            <h2 className="sidebar-logo">Casual Móveis</h2>
            <p className="sidebar-subtitle">CRM Dashboard</p>
          </div>
        </div>
        {isOpen && (
          <button className="sidebar-toggle" onClick={onToggle}>
            ←
          </button>
        )}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          const isActive = activeTab === item.tab
          return (
            <button
              key={index}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.tab)}
            >
              <IconComponent 
                name={item.icon} 
                className={`nav-icon ${isActive ? 'icon-active' : 'icon-inactive'}`}
              />
              {isOpen && (
                <div className="nav-text">
                  <p className={`nav-label ${isActive ? 'label-active' : ''}`}>{item.label}</p>
                  <p className={`nav-sublabel ${isActive ? 'sublabel-active' : ''}`}>
                    {item.subtitle}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

