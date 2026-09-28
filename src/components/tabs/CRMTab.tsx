"use client";
import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  Phone, 
  Clock, 
  Search, 
  RefreshCw, 
  Plus, 
  Copy, 
  Check, 
  AlertTriangle, 
  X, 
  User, 
  Clipboard, 
  ExternalLink,
  ChevronRight,
  Building2
} from 'lucide-react';
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

const COLUMNS = [
  { id: 'new', label: 'Nuevo contacto', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.04)', borderColor: '#3b82f6' },
  { id: 'contacted', label: 'Contactado', color: '#d97706', bg: 'rgba(217, 119, 6, 0.04)', borderColor: '#f59e0b' },
  { id: 'waiting', label: 'Espera de respuesta', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.04)', borderColor: '#8b5cf6' },
  { id: 'closing', label: 'Cerrando venta', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.04)', borderColor: '#6366f1' },
  { id: 'closed', label: 'Venta cerrada', color: '#059669', bg: 'rgba(5, 150, 105, 0.04)', borderColor: '#10b981' },
];

export default function CRMTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag and Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Add Contact Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState('new');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SQL code to display
  const SQL_MIGRATION_CODE = `ALTER TABLE public.contacts 
  DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check 
  CHECK (status IN ('new', 'contacted', 'waiting', 'closing', 'closed', 'read'));`;

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
      console.error('Error fetching properties list:', err);
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
        // Map legacy 'read' status to 'contacted' for rendering in CRM columns
        const mappedData = data.map(c => ({
          ...c,
          status: c.status === 'read' ? 'contacted' : c.status
        }));
        setContacts(mappedData);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const contactId = draggingId || e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);

    if (!contactId) return;

    const contactToMove = contacts.find(c => c.id === contactId);
    if (!contactToMove || contactToMove.status === targetStatus) return;

    // Save previous state for rollback
    const originalContacts = [...contacts];

    // Optimistic UI update
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: targetStatus } : c));

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: targetStatus })
        .eq('id', contactId);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating status in DB:', err);
      // Revert optimistic update
      setContacts(originalContacts);

      // Check if it's a constraint check failure
      if (err.code === '23514' || (err.message && err.message.includes('contacts_status_check'))) {
        setIsSqlModalOpen(true);
      } else {
        alert(`No se pudo actualizar el estado: ${err.message || 'Error desconocido'}`);
      }
    }
  };

  // Add Contact Form Submit
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      
      const newRecord = {
        name: newName,
        email: newEmail,
        phone: newPhone,
        message: newMessage || 'Contacto creado desde el Tablero CRM',
        status: newStatus,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([newRecord])
        .select();

      if (error) throw error;

      // Close modal and refresh lists
      setIsAddModalOpen(false);
      resetForm();
      fetchContacts();
    } catch (err: any) {
      console.error('Error adding contact:', err);
      if (err.code === '23514' || (err.message && err.message.includes('contacts_status_check'))) {
        setIsSqlModalOpen(true);
      } else {
        alert(`No se pudo agregar el contacto: ${err.message || 'Error del servidor'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewMessage('');
    setNewStatus('new');
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_CODE);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.message && c.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Tablero CRM</h1>
          <p className="page-subtitle">Arrastra y suelta tus contactos para gestionar las etapas de venta en tiempo real.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn-secondary-light"
            onClick={fetchContacts}
            disabled={loading}
            title="Recargar datos de Supabase"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
          <button 
            className="btn-primary-light"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            <span>Agregar Contacto</span>
          </button>
        </div>
      </header>

      {/* Toolbar Search */}
      <div className="toolbar-controls" style={{ margin: 0, padding: '0.75rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '400px', width: '100%' }}>
          <Search className="search-input-icon" size={16} />
          <input 
            type="text" 
            className="search-input-field" 
            placeholder="Buscar por nombre, correo, teléfono o mensaje..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="crm-board-scroll-container">
        <div className="crm-board">
          {COLUMNS.map(col => {
            const colContacts = filteredContacts.filter(c => c.status === col.id);
            const isOver = dragOverColumn === col.id;

            return (
              <div 
                key={col.id} 
                className={`crm-column ${isOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{ backgroundColor: col.bg }}
              >
                {/* Column Header */}
                <div className="crm-column-header" style={{ borderTopColor: col.borderColor }}>
                  <div className="crm-column-title-wrapper">
                    <span className="crm-column-dot" style={{ backgroundColor: col.color }} />
                    <h4 className="crm-column-title">{col.label}</h4>
                  </div>
                  <span className="crm-column-count">{colContacts.length}</span>
                </div>

                {/* Column Body / Cards List */}
                <div className="crm-cards-list">
                  {colContacts.length === 0 ? (
                    <div className="crm-empty-state">
                      <p>Arrastra contactos aquí</p>
                    </div>
                  ) : (
                    colContacts.map(contact => (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact.id)}
                        onDragEnd={handleDragEnd}
                        className={`crm-card ${draggingId === contact.id ? 'is-dragging' : ''}`}
                      >
                        <div className="crm-card-header">
                          <h5 className="crm-card-name">{contact.name}</h5>
                          <User size={14} color="var(--text-muted)" />
                        </div>

                        {contact.message && (
                          <p className="crm-card-message" title={contact.message}>
                            {contact.message}
                          </p>
                        )}

                        {/* Linked Property of Interest */}
                        {(contact.project_id || contact.id_propiety) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.72rem',
                            color: 'var(--eb-accent-purple)',
                            backgroundColor: 'var(--eb-accent-purple-bg)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 500,
                            width: 'fit-content',
                            marginTop: '0.1rem',
                            marginBottom: '0.1rem'
                          }}>
                            <Building2 size={11} style={{ flexShrink: 0 }} />
                            <span style={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              maxWidth: '180px' 
                            }} title={properties[contact.project_id || ''] || properties[contact.id_propiety || '']}>
                              {properties[contact.project_id || ''] || properties[contact.id_propiety || ''] || 'Cargando propiedad...'}
                            </span>
                          </div>
                        )}

                        <div className="crm-card-details">
                          {contact.email && (
                            <a 
                              href={`mailto:${contact.email}`} 
                              className="crm-card-detail-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail size={12} />
                              <span>{contact.email}</span>
                            </a>
                          )}
                          {contact.phone && (
                            <a 
                              href={`tel:${contact.phone}`} 
                              className="crm-card-detail-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone size={12} />
                              <span>{contact.phone}</span>
                            </a>
                          )}
                        </div>

                        <div className="crm-card-footer">
                          <Clock size={11} />
                          <span>
                            {contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Recién'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SQL Migration Instruction Modal */}
      {isSqlModalOpen && (
        <div className="crm-modal-backdrop">
          <div className="crm-modal-card sql-modal-width">
            <div className="crm-modal-header danger-theme">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--error)" />
                <h3 style={{ color: 'var(--error)' }}>Configuración de Base de Datos Requerida</h3>
              </div>
              <button className="crm-close-btn" onClick={() => setIsSqlModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="crm-modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Para poder guardar este nuevo estado en la base de datos de Supabase, es necesario actualizar la restricción de estados en tu tabla <code>contacts</code>.
              </p>
              
              <div className="sql-box-container">
                <div className="sql-box-header">
                  <span>Consulta SQL</span>
                  <button className="sql-copy-btn" onClick={copySqlToClipboard}>
                    {sqlCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{sqlCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="sql-code-block">
                  <code>{SQL_MIGRATION_CODE}</code>
                </pre>
              </div>

              <div className="sql-instructions">
                <h5>Pasos para actualizar en Supabase:</h5>
                <ol>
                  <li>Copia el script SQL de arriba usando el botón <strong>Copiar</strong>.</li>
                  <li>Ve a tu panel web de <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--eb-accent-purple)', fontWeight: 600, textDecoration: 'underline' }}>Supabase <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>.</li>
                  <li>Haz clic en la pestaña <strong>SQL Editor</strong> en la barra lateral izquierda.</li>
                  <li>Presiona en <strong>New query</strong> para abrir un editor vacío.</li>
                  <li>Pega el código copiado y haz clic en el botón verde <strong>Run</strong> (Ejecutar).</li>
                </ol>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button className="btn-secondary-light" onClick={() => setIsSqlModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="crm-modal-backdrop">
          <form onSubmit={handleAddContact} className="crm-modal-card">
            <div className="crm-modal-header">
              <h3>Agregar Nuevo Contacto</h3>
              <button type="button" className="crm-close-btn" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="crm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="input-label-light">Nombre del contacto *</label>
                <input 
                  type="text" 
                  className="form-input-light" 
                  style={{ paddingLeft: '0.75rem' }}
                  placeholder="Ej. Sofía Martínez Prado" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="input-label-light">Correo electrónico</label>
                  <input 
                    type="email" 
                    className="form-input-light"
                    style={{ paddingLeft: '0.75rem' }} 
                    placeholder="Ej. sofia@gmail.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label-light">Teléfono</label>
                  <input 
                    type="tel" 
                    className="form-input-light" 
                    style={{ paddingLeft: '0.75rem' }}
                    placeholder="Ej. 5512348765" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label-light">Estado inicial</label>
                <select 
                  className="form-select-light" 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="input-label-light">Mensaje o nota</label>
                <textarea 
                  className="form-input-light" 
                  style={{ paddingLeft: '0.75rem', height: '80px', resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Mensaje de interés del cliente o notas sobre el prospecto..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="crm-modal-footer">
              <button 
                type="button" 
                className="btn-secondary-light" 
                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary-light"
                disabled={isSubmitting || !newName.trim()}
              >
                {isSubmitting ? 'Guardando...' : 'Crear Contacto'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
