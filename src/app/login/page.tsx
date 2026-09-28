"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, User, Phone, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/');
      }
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLoggingIn) {
        // Log in flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        router.replace('/');
      } else {
        // Sign up flow
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              names: name,
              phone: phone,
              isAdmin: true // Setting local metadata state
            }
          }
        });
        if (signUpError) throw signUpError;

        // If user created, save metadata directly in 'users' table
        if (authData.user) {
          const { error: insertError } = await supabase.from('users').insert([
            {
              iduser: authData.user.id,
              names: name,
              email: email,
              phone: phone ? parseInt(phone, 10) || null : null,
              isadmin: true
            }
          ]);
          if (insertError) {
            console.error('Error inserting user profile:', insertError);
            // Don't throw, let them log in anyway since auth was created
          }
        }

        setSuccessMsg('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
        setIsLoggingIn(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Form Side */}
      <div className="login-form-side">
        <div className="login-form-card">
          <div className="login-logo">
            <div className="logo-text-placeholder" style={{ color: '#ffffff', fontSize: '1.85rem' }}>
              Broker<span>.</span>
            </div>
          </div>
          
          <h2 className="login-title">
            Panel de Administración
          </h2>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="success-alert" style={{ background: '#064e3b', borderColor: '#059669', color: '#a7f3d0' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!isLoggingIn && (
              <>
                <div className="form-group">
                  <label className="input-label" htmlFor="name">Nombre Completo</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      id="name" 
                      className="form-input" 
                      placeholder="Juan Pérez" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLoggingIn}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label" htmlFor="phone">Teléfono</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={18} />
                    <input 
                      type="tel" 
                      id="phone" 
                      className="form-input" 
                      placeholder="5512345678" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="input-label" htmlFor="email">Correo Electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  id="email" 
                  className="form-input" 
                  placeholder="nombre@ejemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  id="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
              <LogIn size={18} />
              <span>{loading ? 'Procesando...' : (isLoggingIn ? 'Iniciar Sesión' : 'Registrarse')}</span>
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#a8a29e' }}>
            <span>
              {isLoggingIn ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            </span>{' '}
            <button 
              type="button" 
              className="btn-link"
              onClick={() => {
                setIsLoggingIn(!isLoggingIn);
                setError(null);
                setSuccessMsg(null);
              }}
            >
              {isLoggingIn ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Side */}
      <div className="login-visual-side">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200" 
          alt="Luxury Home Design" 
          className="login-bg-image"
        />
        <div className="login-overlay">
          <h3 className="login-overlay-title">Encuentra y gestiona tu próximo proyecto inmobiliario</h3>
          <p className="login-overlay-text">
            Accede a un panel completo de administración para brokers: gestiona propiedades, realiza un seguimiento de leads y optimiza tus ventas.
          </p>
        </div>
      </div>
    </div>
  );
}
