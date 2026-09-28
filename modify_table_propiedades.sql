-- Script SQL para actualizar la tabla 'propiedades' en Supabase
-- Copia y pega todo este código dentro de la pestaña "SQL Editor" en tu panel de Supabase y haz clic en RUN.

ALTER TABLE public.propiedades 
  ADD COLUMN IF NOT EXISTS calle text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS colonia text,
  ADD COLUMN IF NOT EXISTS delegacion_municipio text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS tipo_operacion text DEFAULT 'Venta', -- 'Venta' o 'Renta'
  ADD COLUMN IF NOT EXISTS metros_terreno numeric,
  ADD COLUMN IF NOT EXISTS metros_construccion numeric,
  ADD COLUMN IF NOT EXISTS medios_banos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estacionamientos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alberca boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terraza boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS elevador boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bodega boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cuarto_servicio boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seguridad boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS estatus_legal text, -- 'Libre de gravamen', 'Acepta créditos', etc.
  ADD COLUMN IF NOT EXISTS cuota_mantenimiento numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detalles_mantenimiento text,
  ADD COLUMN IF NOT EXISTS imagenes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS tour_virtual_url text,
  ADD COLUMN IF NOT EXISTS plano_arquitectonico_url text;

-- Habilitar RLS si no está habilitado (opcional)
-- ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso anónimo provisionales si es necesario para pruebas
-- CREATE POLICY "Permitir lectura publica" ON public.propiedades FOR SELECT TO anon USING (true);
-- CREATE POLICY "Permitir insercion publica" ON public.propiedades FOR INSERT TO anon WITH CHECK (true);
