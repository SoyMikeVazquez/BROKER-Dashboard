-- Script SQL para actualizar la restricción de estados en la tabla 'contacts' de Supabase
-- Copia y pega este código dentro de la pestaña "SQL Editor" de tu panel de Supabase y haz clic en RUN.

ALTER TABLE public.contacts 
  DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check 
  CHECK (status IN ('new', 'contacted', 'waiting', 'closing', 'closed', 'read'));
