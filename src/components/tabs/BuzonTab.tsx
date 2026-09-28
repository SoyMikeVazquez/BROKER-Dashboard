"use client";
import React, { useEffect, useState } from 'react';
import { Mail, Phone, Clock, Search, Reply, Star, CheckCircle, Trash2, Send, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

export default function BuzonTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const MOCK_MESSAGES: Message[] = [
    { id: '1', name: 'Sofía Martínez Prado', email: 'sofia.martinez@gmail.com', phone: '5512348765', message: 'Hola, vi la publicación de Residencial Lomas de Coyoacán y me gustaría saber si aceptan créditos hipotecarios bancarios o de Infonavit. Quedo al tanto, gracias.', status: 'new', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: '2', name: 'Alejandro Ruiz Ortiz', email: 'ale.ruiz@hotmail.com', phone: '5543210987', message: 'Hola. Solicito cotización formal de las oficinas corporativas en Paseo de la Reforma. Requerimos espacio para 50 personas con sala de juntas amplia.', status: 'contacted', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: '3', name: 'Mariana Torres Valadez', email: 'mariana.torres@yahoo.com', phone: '6698765432', message: 'Buenas tardes. Me interesa la Villa Moderna en Mazatlán. ¿Es posible programar una visita virtual para el próximo viernes por la mañana?', status: 'new', created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
  ];

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setMessages(data);
        setSelectedMessage(data.length > 0 ? data[0] : null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedMockMessages = async () => {
    try {
      setLoading(true);
      const itemsToInsert = MOCK_MESSAGES.map(({ id, ...rest }) => ({
        ...rest,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(itemsToInsert);

      if (error) throw error;
      fetchMessages();
    } catch (err: any) {
      console.error('Error seeding messages:', err);
      alert(`No se pudieron sembrar los datos en Supabase: ${err.message || 'Verifica RLS o permisos.'}`);
      setMessages(MOCK_MESSAGES);
      setSelectedMessage(MOCK_MESSAGES[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (msg: Message) => {
    const nextStatus = msg.status === 'new' ? 'contacted' : 'new';
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: nextStatus })
        .eq('id', msg.id);

      if (error) throw error;

      const updated = messages.map(m => m.id === msg.id ? { ...m, status: nextStatus } : m);
      setMessages(updated);
      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage({ ...selectedMessage, status: nextStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este mensaje?')) return;
    try {
      await supabase.from('contacts').delete().eq('id', id);
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(updated[0] || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterUnread) {
      return matchesSearch && m.status === 'new';
    }
    return matchesSearch;
  });

  return (
    <div className="animate-fade">
      {/* Tab Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Buzón</h1>
          <p className="page-subtitle">Revisa las solicitudes y consultas que envían tus clientes desde el sitio web.</p>
        </div>
      </header>

      {/* Inbox Split View Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        
        {/* Left Side: Messages list */}
        <div className="section-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* List Search & Filters */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Buscar remitente o mensaje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="unreadFilter"
                checked={filterUnread}
                onChange={(e) => setFilterUnread(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="unreadFilter" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Mostrar sólo no leídos
              </label>
            </div>
          </div>

          {/* Messages Loop */}
          <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading && messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando buzón...</div>
            ) : filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Database size={32} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buzón vacío en Supabase</span>
                <button className="btn-primary-light" onClick={seedMockMessages} style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}>
                  Sembrar mensajes de prueba
                </button>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === 'new';
                return (
                  <div 
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    style={{
                      padding: '1.25rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--background)' : 'var(--surface)',
                      borderLeft: isUnread ? '4px solid var(--eb-accent-purple)' : '4px solid transparent',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: isUnread ? 'var(--text-main)' : 'var(--text-secondary)', 
                      fontWeight: isUnread ? 500 : 400,
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}>
                      {msg.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message details */}
        <div className="section-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Detail Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{selectedMessage.name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={14} color="var(--text-muted)" />
                      <span>{selectedMessage.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span>{selectedMessage.phone}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-secondary-light" 
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleToggleStatus(selectedMessage)}
                  >
                    <CheckCircle size={14} />
                    <span>{selectedMessage.status === 'new' ? 'Leído' : 'Marcar nuevo'}</span>
                  </button>
                  <button 
                    className="icon-button" 
                    style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)' }}
                    onClick={() => handleDelete(selectedMessage.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  <span>Enviado el {new Date(selectedMessage.created_at).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
                <div style={{ 
                  background: 'var(--background)', 
                  padding: '1.5rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Quick Response Panel */}
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--background)', display: 'flex', justifyContent: 'flex-start', gap: '1rem' }}>
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Contacto Broker&body=Hola ${selectedMessage.name}, gracias por escribirnos.`}
                  className="btn-primary-light"
                  style={{ textDecoration: 'none' }}
                >
                  <Reply size={16} />
                  <span>Responder por correo</span>
                </a>
                
                <a 
                  href={`https://wa.me/52${selectedMessage.phone}?text=Hola%20${encodeURIComponent(selectedMessage.name)}%2C%20contacto%20de%20Broker.`}
                  target="_blank"
                  className="btn-secondary-light"
                  style={{ textDecoration: 'none', borderColor: '#10b981', color: '#10b981' }}
                  rel="noreferrer"
                >
                  <Send size={16} />
                  <span>Enviar WhatsApp</span>
                </a>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Selecciona un mensaje para ver los detalles.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
