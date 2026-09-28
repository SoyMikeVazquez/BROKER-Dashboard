"use client";
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InicioTabProps {
  onNavigate: (tab: string) => void;
  user: any;
}

export default function InicioTab({ onNavigate, user }: InicioTabProps) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    properties: 32,
    markedProperties: 1,
    clientRequests: 2,
    agentRequests: 3,
    visits: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        // Query actual counts from Supabase
        const { count: propCount } = await supabase.from('propiedades').select('*', { count: 'exact', head: true });
        const { count: contactsCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
        const { count: visitsCount } = await supabase.from('visits').select('*', { count: 'exact', head: true });

        setCounts(prev => ({
          ...prev,
          properties: propCount !== null ? propCount : prev.properties,
          clientRequests: contactsCount !== null ? contactsCount : prev.clientRequests,
          visits: visitsCount !== null ? visitsCount : 0
        }));
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const [greeting, setGreeting] = useState('¡Hola!');

  useEffect(() => {
    const hours = new Date().getHours();
    let greet = "¡Buenos días";
    if (hours >= 12 && hours < 19) greet = "¡Buenas tardes";
    else if (hours >= 19 || hours < 5) greet = "¡Buenas noches";
    
    const name = user?.user_metadata?.names || user?.email?.split('@')[0] || 'Broker';
    
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const currentDay = days[new Date().getDay()];

    setGreeting(`${greet} y que tengas un excelente ${currentDay}, ${name}!`);
  }, [user]);

  const shortcuts = [
    { title: 'Mis propiedades', desc: 'Sube y actualiza tu portafolio de inmuebles.', tab: 'propiedades', icon: Building2, color: '#10b981' },
    { title: 'Directorio de Contactos', desc: 'Visualiza tus prospectos y clientes activos.', tab: 'contactos', icon: Users, color: '#f59e0b' },
  ];

  return (
    <div className="animate-slide-up">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="page-subtitle" style={{ color: 'var(--secondary)', fontWeight: 500 }}>
            {greeting}
          </p>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="metrics-grid">
        {/* Card 1: Propiedades */}
        <div className="metric-card">
          <h3 className="metric-title">Propiedades</h3>
          <div className="metric-row">
            <div className="metric-column">
              <div className="metric-value">{counts.properties}</div>
              <div className="metric-sublabel">Publicadas</div>
            </div>
            <div className="metric-column">
              <div className="metric-value">{counts.markedProperties}</div>
              <div className="metric-sublabel">Marcadas</div>
            </div>
          </div>
        </div>

        {/* Card 2: Solicitudes */}
        <div className="metric-card">
          <h3 className="metric-title">Solicitudes (30 días)</h3>
          <div className="metric-row" style={{ marginTop: '0.45rem' }}>
            <div className="metric-column">
              <div className="metric-value">{counts.clientRequests}</div>
              <div className="metric-sublabel">De clientes</div>
            </div>
            <div className="metric-column">
              <div className="metric-value">{counts.agentRequests}</div>
              <div className="metric-sublabel">De asesores</div>
            </div>
          </div>
        </div>

        {/* Card 3: Visitas */}
        <div className="metric-card">
          <h3 className="metric-title">Visitas al Sitio Web</h3>
          <div className="metric-row" style={{ marginTop: '0.45rem' }}>
            <div className="metric-column">
              <div className="metric-value">{counts.visits}</div>
              <div className="metric-sublabel">Totales</div>
            </div>
            <div className="metric-column">
              <div className="metric-value">0</div>
              <div className="metric-sublabel">Hoy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Shortcuts grid */}
      <h3 style={{ margin: '2.5rem 0 1.25rem 0', fontSize: '1.25rem' }}>Secciones más importantes</h3>
      <section className="shortcuts-grid">
        {shortcuts.map((shortcut, i) => {
          const Icon = shortcut.icon;
          return (
            <div 
              key={i} 
              className="shortcut-card" 
              onClick={() => onNavigate(shortcut.tab)}
            >
              <div className="shortcut-icon-wrapper" style={{ color: shortcut.color }}>
                <Icon size={28} />
              </div>
              <div>
                <h4 className="shortcut-title" style={{ marginBottom: '0.35rem' }}>{shortcut.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {shortcut.desc}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginTop: 'auto' }}>
                <span>Ingresar</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
