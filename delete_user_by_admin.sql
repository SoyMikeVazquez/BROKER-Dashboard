-- Script SQL para permitir a los administradores eliminar otros usuarios (tanto de la tabla pública 'users' como de la tabla 'auth.users' de Supabase).
-- Copia y pega este código dentro de la pestaña "SQL Editor" de tu panel de Supabase y haz clic en RUN.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios elevados de superusuario
AS $$
DECLARE
  caller_is_admin BOOLEAN;
BEGIN
  -- 1. Verificar si el usuario que llama (auth.uid()) es realmente un administrador
  SELECT isadmin INTO caller_is_admin
  FROM public.users
  WHERE iduser = auth.uid();

  -- 2. Si es administrador, proceder con la eliminación
  IF caller_is_admin = TRUE THEN
    -- Eliminar primero de public.users
    DELETE FROM public.users WHERE iduser = target_user_id;
    
    -- Eliminar después de auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Solo los administradores autorizados pueden eliminar usuarios.';
  END IF;
END;
$$;
