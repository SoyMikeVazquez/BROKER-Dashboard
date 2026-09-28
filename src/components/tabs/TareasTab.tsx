"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, PlusCircle } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

export default function TareasTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('broker_dashboard_tasks');
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing tasks:', e);
      }
    } else {
      // Default tasks
      const defaultTasks: Task[] = [
        { id: '1', text: 'Enviar propuesta comercial para Lomas de Coyoacán', completed: false, priority: 'high', created_at: new Date().toISOString() },
        { id: '2', text: 'Llamar a Mariana Torres para agendar cita virtual', completed: false, priority: 'medium', created_at: new Date().toISOString() },
        { id: '3', text: 'Revisar documentación de Residencial Coyoacán', completed: true, priority: 'low', created_at: new Date().toISOString() }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('broker_dashboard_tasks', JSON.stringify(defaultTasks));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('broker_dashboard_tasks', JSON.stringify(newTasks));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(),
      text: taskText.trim(),
      completed: false,
      priority,
      created_at: new Date().toISOString()
    };

    saveTasks([newTask, ...tasks]);
    setTaskText('');
    setPriority('medium');
  };

  const handleToggleTask = (id: string) => {
    saveTasks(
      tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const handleDeleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const getPriorityStyle = (p: 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'high':
        return { label: 'Alta', color: '#ef4444', bg: '#fef2f2' };
      case 'medium':
        return { label: 'Media', color: '#f59e0b', bg: '#fffbeb' };
      case 'low':
        return { label: 'Baja', color: '#3b82f6', bg: '#eff6ff' };
    }
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Tareas</h1>
          <p className="page-subtitle">Organiza tus actividades diarias y haz un seguimiento de tus pendientes.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Create Task Form */}
        <section className="section-panel">
          <div className="section-panel-header">
            <h3 className="section-panel-title">Nueva Actividad</h3>
          </div>
          
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="input-label-light">¿Qué tienes que hacer?</label>
              <textarea 
                className="form-input-light" 
                placeholder="Ej. Enviar contratos de compraventa..."
                rows={3}
                style={{ resize: 'none', fontFamily: 'inherit' }}
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label-light">Prioridad</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['high', 'medium', 'low'] as const).map(p => {
                  const style = getPriorityStyle(p);
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid',
                        borderColor: isSelected ? style.color : 'var(--border)',
                        backgroundColor: isSelected ? style.bg : 'var(--surface)',
                        color: isSelected ? style.color : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onClick={() => setPriority(p)}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary-light" style={{ width: '100%' }}>
              <PlusCircle size={18} />
              <span>Agregar tarea</span>
            </button>
          </form>
        </section>

        {/* Right Side: Task Checklist */}
        <section className="section-panel">
          <div className="section-panel-header">
            <h3 className="section-panel-title">Lista de Pendientes</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {tasks.filter(t => !t.completed).length} pendientes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No tienes tareas programadas. ¡Buen trabajo!
              </div>
            ) : (
              tasks.map((task) => {
                const priorityInfo = getPriorityStyle(task.priority);
                return (
                  <div 
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid',
                      borderColor: task.completed ? 'var(--border)' : '#e2e8f0',
                      backgroundColor: task.completed ? 'var(--background)' : 'var(--surface)',
                      opacity: task.completed ? 0.65 : 1,
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flexGrow: 1 }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: task.completed ? 'var(--success)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          marginTop: '0.15rem'
                        }}
                        onClick={() => handleToggleTask(task.id)}
                      >
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <p style={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: 'var(--text-main)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          lineHeight: '1.4'
                        }}>
                          {task.text}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: priorityInfo.bg,
                            color: priorityInfo.color,
                            textTransform: 'uppercase'
                          }}>
                            {priorityInfo.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(task.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      style={{
                        color: 'var(--error)',
                        backgroundColor: 'transparent',
                        padding: '0.25rem'
                      }}
                      onClick={() => handleDeleteTask(task.id)}
                      title="Eliminar tarea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
