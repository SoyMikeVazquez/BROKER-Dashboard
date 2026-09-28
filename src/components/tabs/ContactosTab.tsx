"use client";
import React, { useEffect, useState } from 'react';
import { Mail, Phone, Clock, Search, Users, CheckCircle, RefreshCw, Database, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
  id_propiety?: string;
  project_id?: string | null;
}

export default function ContactosTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'Sofía Martínez Prado', email: 'sofia.martinez@gmail.com', phone: '5512348765', message: 'Interesada en el departamento de Lomas de Coyoacán. ¿Siguen disponibles visitas esta semana?', status: 'new', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), id_propiety: '3bd128d7-256d-446b-b3f2-c81af233681c' },
    { id: '2', name: 'Alejandro Ruiz Ortiz', email: 'ale.ruiz@hotmail.com', phone: '5543210987', message: 'Solicita informes sobre la tasa de interés para adquirir oficina en Paseo de la Reforma.', status: 'contacted', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: '3', name: 'Mariana Torres Valadez', email: 'mariana.torres@yahoo.com', phone: '6698765432', message: 'Me interesa agendar una llamada virtual para el proyecto Villa Moderna Mazatlán.', status: 'new', created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
  ];

  useEffect(() => {
    fetchContacts();
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('propiedades')
        .select('id, titulo');
      if (error) throw error;
      if (data) {
        const map: { [id: string]: string } = {};
        data.forEach(p => {
          map[p.id] = p.titulo;
        });
        setProperties(map);
      }
    } catch (err) {
      console.error('Error fetching properties list in ContactosTab:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setContacts(data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedMockContacts = async () => {
    try {
      setLoading(true);
      // Remove ID field so Supabase auto-generates the UUID
      const itemsToInsert = MOCK_CONTACTS.map(({ id, ...rest }) => ({
        ...rest,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(itemsToInsert);

      if (error) throw error;
      fetchContacts();
    } catch (err: any) {
      console.error('Error seeding contacts:', err);
      alert(`No se pudieron sembrar los datos en Supabase: ${err.message || 'Verifica RLS o permisos.'}`);
      // Local fallback for testing convenience
      setContacts(MOCK_CONTACTS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'new' ? 'contacted' : 'new';
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;

      // Update state locally
      setContacts(contacts.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Contactos</h1>
          <p className="page-subtitle">Gestiona y responde a los interesados de tus proyectos en tiempo real.</p>
        </div>
        <button 
          className="btn-secondary-light"
          onClick={fetchContacts}
          title="Sincronizar contactos"
        >
          <RefreshCw size={16} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Toolbar Controls */}
      <div className="toolbar-controls">
        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={16} />
          <input 
            type="text" 
            className="search-input-field" 
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List Card */}
      <div className="section-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Cargando contactos de Supabase...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Database size={48} color="var(--text-muted)" />
            <h4>Tabla 'contacts' vacía en Supabase</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
              La conexión funciona correctamente, pero no hay registros en la base de datos. Haz clic abajo para sembrar contactos de prueba.
            </p>
            <button className="btn-primary-light" onClick={seedMockContacts}>
              Sembrar contactos de prueba
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table-main">
              <thead>
                <tr>
                  <th className="table-th">Interesado</th>
                  <th className="table-th">Contacto</th>
                  <th className="table-th">Mensaje recibido</th>
                  <th className="table-th">Fecha de Registro</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="table-tr">
                    <td className="table-td">
                      <div style={{ fontWeight: 600 }}>{contact.name}</div>
                      {(contact.project_id || contact.id_propiety) && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.72rem', 
                          color: 'var(--eb-accent-purple)', 
                          marginTop: '0.35rem',
                          fontWeight: 500
                        }}>
                          <Building2 size={10} style={{ flexShrink: 0 }} />
                          <span title={properties[contact.project_id || ''] || properties[contact.id_propiety || '']}>
                            {properties[contact.project_id || ''] || properties[contact.id_propiety || ''] || 'Cargando propiedad...'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="table-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Mail size={12} color="var(--text-muted)" />
                          <span>{contact.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Phone size={12} color="var(--text-muted)" />
                          <span>{contact.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-td" style={{ maxWidth: '300px' }}>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4'
                      }}>
                        {contact.message}
                      </p>
                    </td>
                    <td className="table-td" style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>
                          {contact.created_at ? new Date(contact.created_at).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`badge-pill ${contact.status === 'new' ? 'new' : 'contacted'}`}>
                        {contact.status === 'new' ? 'Nuevo prospecto' : 'Contactado'}
                      </span>
                    </td>
                    <td className="table-td">
                      <button 
                        className="btn-secondary-light"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                        onClick={() => handleUpdateStatus(contact.id, contact.status)}
                      >
                        <CheckCircle size={12} />
                        <span>Marcar como {contact.status === 'new' ? 'Leído' : 'Nuevo'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
