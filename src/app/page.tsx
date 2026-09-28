"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import InicioTab from '../components/tabs/InicioTab';
import PropiedadesTab from '../components/tabs/PropiedadesTab';
import ContactosTab from '../components/tabs/ContactosTab';
import CRMTab from '../components/tabs/CRMTab';
import AdminsTab from '../components/tabs/AdminsTab';
import { HelpCircle } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Safety timeout to prevent infinite loading if Supabase is slow or blocked
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timeout: forcing sessionChecked to true');
      setSessionChecked(true);
    }, 3000);

    // Check initial auth state
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeoutId);
        if (session) {
          setUser(session.user);
          setSessionChecked(true);
        } else {
          router.replace('/login');
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Error fetching Supabase session:', err);
        router.replace('/login');
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeoutId);
      if (session) {
        setUser(session.user);
        setSessionChecked(true);
      } else {
        setUser(null);
        router.replace('/login');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'inicio':
        return <InicioTab onNavigate={setActiveTab} user={user} />;
      case 'propiedades':
        return <PropiedadesTab />;
      case 'contactos':
        return <ContactosTab />;
      case 'crm':
        return <CRMTab />;
      case 'admins':
        return <AdminsTab user={user} />;
      case 'configuracion':
        return (
          <div className="section-panel animate-fade">
            <div className="section-panel-header">
              <h2 className="section-panel-title">Configuración de la Cuenta</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>Perfil de Administrador</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Detalles del usuario de sesión actual cargados de Supabase Auth.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--background)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CORREO ELECTRÓNICO</span>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.email}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FECHA DE CREACIÓN</span>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <InicioTab onNavigate={setActiveTab} user={user} />;
    }
  };

  if (!sessionChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Cargando panel...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      {/* Main Container */}
      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* Floating Help Widget */}
      <div className="floating-help-widget">
        <button 
          className="help-widget-button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
        >
          <HelpCircle size={18} />
          <span>Ayuda</span>
        </button>

        {isHelpOpen && (
          <div className="help-widget-panel">
            <div className="help-panel-header">
              <h4 style={{ color: '#ffffff', fontSize: '1rem' }}>Centro de Ayuda Inmobiliaria</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', marginTop: '0.25rem' }}>¿En qué podemos ayudarte hoy?</p>
            </div>
            <div className="help-panel-body">
              <div className="help-panel-option" onClick={() => alert('Abriendo soporte de carga de propiedades...')}>
                Cómo subir una propiedad
              </div>
              <div className="help-panel-option" onClick={() => alert('Abriendo soporte de vinculación de portales...')}>
                Vinculación con portales
              </div>
              <div className="help-panel-option" onClick={() => alert('Abriendo chat con asesor...')}>
                Hablar con un asesor técnico
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
