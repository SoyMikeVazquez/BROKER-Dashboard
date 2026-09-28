"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  ChevronDown,
  Kanban,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export default function Navigation({ activeTab, setActiveTab, user }: NavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown on click outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'propiedades', label: 'Mis propiedades', icon: Building2 },
    { id: 'contactos', label: 'Contactos', icon: Users },
    { id: 'crm', label: 'Tablero CRM', icon: Kanban },
    { id: 'admins', label: 'Administradores', icon: Shield },
  ];

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        
        {/* Left Side: Logo & Main Menu */}
        <div className="navbar-left">
          <a href="#" className="logo-link" onClick={(e) => { e.preventDefault(); setActiveTab('inicio'); }}>
            <img src="/logosinfondo.png" alt="Broker" className="logo-image" onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              const placeholder = document.getElementById('logo-text-fallback');
              if (placeholder) placeholder.style.display = 'flex';
            }} />
            <div id="logo-text-fallback" className="logo-text-placeholder" style={{ display: 'none' }}>
              Broker<span>.</span>
            </div>
          </a>

          <nav>
            <ul className="nav-menu">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <a 
                      href={`#${item.id}`} 
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(item.id);
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Right Side: Search, Notifications & Profile */}
        <div className="navbar-right">
          
          {/* Search bar */}
          <div className="search-bar-wrapper">
            <Search size={16} className="search-bar-icon" />
            <input 
              type="text" 
              className="search-bar-input" 
              placeholder="Buscar contactos y propiedades"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  alert(`Buscando: ${e.currentTarget.value}`);
                }
              }}
            />
          </div>

          {/* Profile Dropdown */}
          <div className="user-profile-menu" ref={dropdownRef}>
            <button 
              className="user-avatar-button" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-name">Administrador</div>
                  <div className="dropdown-user-email">{user?.email}</div>
                </div>

                <button 
                  className="dropdown-item" 
                  onClick={() => { setActiveTab('configuracion'); setDropdownOpen(false); }}
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />

                <button 
                  className="dropdown-item danger" 
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
