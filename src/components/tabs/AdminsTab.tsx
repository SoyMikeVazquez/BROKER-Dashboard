"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { 
  Shield, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Search, 
  RefreshCw, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2,
  Database,
  Trash2
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a secondary Supabase client that does not persist session in localStorage.
// This allows registering users from the browser without logging out the current admin.
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }
});

interface AdminUser {
  iduser: string;
  names: string;
  email: string;
  phone: number | null;
  isadmin: boolean;
  created_at: string;
}

interface AdminsTabProps {
  user?: any;
}

export default function AdminsTab({ user }: AdminsTabProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      supabase.auth.getUser().then(({ data: { user: gotUser } }) => {
        if (gotUser) setCurrentUser(gotUser);
      });
    }
  }, [user]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoadingList(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('isadmin', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAdmins(data || []);
    } catch (err: any) {
      console.error('Error fetching admin list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }

      // Check if email already exists in public.users table before signing up
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('iduser')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.warn('Error checking existing email in users table:', checkError);
      }

      if (existingUser) {
        throw new Error('El correo electrónico ya está registrado como administrador o usuario.');
      }

      // 1. Register the user in Supabase Auth using the non-persistent auth client
      const { data: authData, error: signUpError } = await authClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            names: name,
            phone: phone || null,
            isAdmin: true
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario en Supabase Auth.');
      }

      // 2. Insert or update the profile in the public 'users' table (using upsert to prevent conflicts with database triggers)
      const { error: insertError } = await supabase
        .from('users')
        .upsert([
          {
            iduser: authData.user.id,
            names: name,
            email: email.trim().toLowerCase(),
            phone: phone ? parseInt(phone, 10) || null : null,
            isadmin: true
          }
        ]);

      if (insertError) {
        console.error('Error inserting admin record in users table:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`El usuario de Auth se creó, pero no se pudo registrar en la base de datos: ${insertError.message} (Código: ${insertError.code})`);
      }

      setSuccess(`Administrador "${name}" creado exitosamente.`);
      
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      
      // Reload admins list
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el administrador. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (targetId: string, targetEmail: string) => {
    if (currentUser && currentUser.id === targetId) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al administrador "${targetEmail}"? Esta acción borrará al usuario del sistema de autenticación y de la base de datos.`)) {
      return;
    }

    setLoadingList(true);
    try {
      // 1. Try to delete using database RPC
      const { error: rpcError } = await supabase.rpc('delete_user_by_admin', { 
        target_user_id: targetId 
      });

      if (rpcError) {
        console.warn('RPC delete failed, falling back to direct public.users table deletion:', rpcError);
        
        // 2. Fallback: direct table deletion
        const { error: dbError } = await supabase
          .from('users')
          .delete()
          .eq('iduser', targetId);

        if (dbError) throw dbError;
        
        alert('Se eliminó el perfil de la base de datos, pero el usuario de autenticación debe ser eliminado manualmente en el panel de Supabase Auth.');
      } else {
        alert('Administrador eliminado con éxito.');
      }
      
      fetchAdmins();
    } catch (err: any) {
      console.error('Error deleting admin:', err);
      alert(`No se pudo eliminar el administrador: ${err.message || err}`);
    } finally {
      setLoadingList(false);
    }
  };

  // Filter list of admins
  const filteredAdmins = admins.filter(admin => 
    (admin.names?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (admin.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Administradores</h1>
          <p className="page-subtitle">Registra nuevas cuentas de administrador y gestiona el personal con acceso al sistema.</p>
        </div>
        <button 
          className="btn-secondary-light"
          onClick={fetchAdmins}
          disabled={loadingList}
          title="Sincronizar administradores"
        >
          <RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Two Column Layout: Form and List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Create Admin Form */}
        <div className="section-panel" style={{ padding: '2rem' }}>
          <div className="section-panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--eb-accent-purple-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--eb-accent-purple)' }}>
              <Shield size={20} />
            </div>
            <h3 className="section-panel-title" style={{ fontSize: '1.2rem' }}>Nuevo Administrador</h3>
          </div>

          {error && (
            <div className="error-alert" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-alert" style={{ marginBottom: '1.25rem' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Full Name */}
            <div className="form-group">
              <label className="input-label-light" htmlFor="admin-name">Nombre Completo</label>
              <div className="input-wrapper">
                <User className="input-icon-light" size={18} />
                <input 
                  type="text" 
                  id="admin-name" 
                  className="form-input-light" 
                  placeholder="Ej. Juan Pérez" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="input-label-light" htmlFor="admin-phone">Teléfono (Opcional)</label>
              <div className="input-wrapper">
                <Phone className="input-icon-light" size={18} />
                <input 
                  type="tel" 
                  id="admin-phone" 
                  className="form-input-light" 
                  placeholder="Ej. 5512345678" 
                  value={phone}
                  onChange={(e) => {
                    // Only allow numbers
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="input-label-light" htmlFor="admin-email">Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon-light" size={18} />
                <input 
                  type="email" 
                  id="admin-email" 
                  className="form-input-light" 
                  placeholder="nombre@broker.com.mx" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="input-label-light" htmlFor="admin-password">Contraseña (Mínimo 6 caracteres)</label>
              <div className="input-wrapper">
                <Lock className="input-icon-light" size={18} />
                <input 
                  type="password" 
                  id="admin-password" 
                  className="form-input-light" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary-light" 
              style={{ width: '100%', marginTop: '0.5rem' }} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Creando administrador...</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Crear Cuenta</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Side: Admins List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search bar */}
          <div className="toolbar-controls" style={{ margin: 0, padding: 0 }}>
            <div className="search-input-wrapper" style={{ width: '100%' }}>
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Buscar administrador por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="section-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingList && admins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Cargando administradores...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Database size={44} color="var(--text-muted)" />
                <h4>No se encontraron administradores</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '350px' }}>
                  {searchQuery ? 'Prueba ajustando los términos de búsqueda o registra un nuevo administrador.' : 'No hay cuentas registradas con perfil de administrador.'}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table-main">
                  <thead>
                    <tr>
                      <th className="table-th">Administrador</th>
                      <th className="table-th">Contacto</th>
                      <th className="table-th">Fecha Registro</th>
                      <th className="table-th" style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((admin) => (
                      <tr key={admin.iduser} className="table-tr">
                        <td className="table-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="user-avatar" style={{ flexShrink: 0 }}>
                              {admin.names ? admin.names.substring(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{admin.names || 'Sin nombre'}</div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                                <Shield size={10} />
                                <span>Admin</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="table-td">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-main)' }}>{admin.email}</span>
                            {admin.phone && (
                              <span style={{ color: 'var(--text-secondary)' }}>{admin.phone}</span>
                            )}
                          </div>
                        </td>
                        <td className="table-td" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          {currentUser && currentUser.id !== admin.iduser && (
                            <button
                              onClick={() => handleDeleteAdmin(admin.iduser, admin.email)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: 'var(--radius-sm)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'var(--transition)',
                                backgroundColor: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--error-bg)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Eliminar Administrador"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
