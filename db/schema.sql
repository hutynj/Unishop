-- ============================================================================
-- UniShop: Esquema de Base de Datos PostgreSQL / Supabase
-- Tablas: usuarios, cuentas_vinculadas, items_carrito, busquedas_guardadas
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados de dominio
CREATE TYPE marketplace_platform AS ENUM (
  'amazon',
  'vinted',
  'wallapop',
  'aliexpress',
  'ebay'
);

CREATE TYPE auth_sync_method AS ENUM (
  'oauth2',
  'extension_token'
);

CREATE TYPE product_condition AS ENUM (
  'new',
  'used',
  'refurbished'
);

-- ----------------------------------------------------------------------------
-- 1. Tabla: usuarios
-- Sincronizada con Supabase Auth (auth.users) o sesiones JWT propias.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  avatar_url TEXT,
  moneda_preferida CHAR(3) NOT NULL DEFAULT 'EUR',
  pais_envio CHAR(2) NOT NULL DEFAULT 'ES',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: cuentas_vinculadas
-- Almacena tokens cifrados (OAuth 2.0 o tokens de sesión sincronizados vía
-- extensión de navegador) para cada plataforma conectada por el usuario.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuentas_vinculadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma marketplace_platform NOT NULL,
  metodo_auth auth_sync_method NOT NULL DEFAULT 'oauth2',
  conectado BOOLEAN NOT NULL DEFAULT FALSE,
  identificador_cuenta TEXT, -- Email, @usuario o ID externo en el marketplace
  access_token_cifrado TEXT, -- Cifrado AES-256-GCM en backend / Supabase Vault
  refresh_token_cifrado TEXT,
  token_expira_en TIMESTAMPTZ,
  ultima_sincronizacion TIMESTAMPTZ,
  metadatos JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_usuario_plataforma UNIQUE (usuario_id, plataforma)
);

CREATE INDEX idx_cuentas_usuario_conectado
  ON cuentas_vinculadas (usuario_id, conectado);

-- ----------------------------------------------------------------------------
-- 3. Tabla: items_carrito
-- Carrito universal unificado con snapshot normalizado del producto origen
-- para cálculo inmediato de subtotales y checkout híbrido por tienda.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items_carrito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plataforma marketplace_platform NOT NULL,
  producto_externo_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  estado_producto product_condition NOT NULL DEFAULT 'new',
  precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  gasto_envio_estimado NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (gasto_envio_estimado >= 0),
  moneda CHAR(3) NOT NULL DEFAULT 'EUR',
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  imagen_url TEXT,
  url_producto TEXT NOT NULL,
  url_checkout_directo TEXT,
  estado_checkout TEXT NOT NULL DEFAULT 'en_carrito'
    CHECK (estado_checkout IN ('en_carrito', 'en_proceso', 'completado')),
  agregado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_carrito_item UNIQUE (usuario_id, plataforma, producto_externo_id)
);

CREATE INDEX idx_carrito_usuario_plataforma
  ON items_carrito (usuario_id, plataforma);

-- ----------------------------------------------------------------------------
-- 4. Tabla: busquedas_guardadas
-- Permite persistir consultas globales con todos sus filtros avanzados
-- y recibir alertas de bajada de precio o nuevos anuncios.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS busquedas_guardadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_alerta TEXT NOT NULL,
  termino_busqueda TEXT NOT NULL DEFAULT '',
  plataformas marketplace_platform[] NOT NULL DEFAULT ARRAY[
    'amazon', 'vinted', 'wallapop', 'aliexpress', 'ebay'
  ]::marketplace_platform[],
  filtro_estado TEXT NOT NULL DEFAULT 'all'
    CHECK (filtro_estado IN ('all', 'new', 'secondhand')),
  precio_min NUMERIC(10, 2) CHECK (precio_min IS NULL OR precio_min >= 0),
  precio_max NUMERIC(10, 2) CHECK (precio_max IS NULL OR precio_max >= 0),
  marca_modelo_exacto TEXT,
  orden_precio TEXT NOT NULL DEFAULT 'relevance'
    CHECK (orden_precio IN ('relevance', 'price_asc', 'price_desc')),
  notificar_nuevos BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_conteo_resultados INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_busquedas_usuario
  ON busquedas_guardadas (usuario_id, creado_en DESC);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) para Supabase
-- ----------------------------------------------------------------------------
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_vinculadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_carrito ENABLE ROW LEVEL SECURITY;
ALTER TABLE busquedas_guardadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo su perfil"
  ON usuarios FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Usuarios gestionan sus cuentas vinculadas"
  ON cuentas_vinculadas FOR ALL
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios gestionan su carrito universal"
  ON items_carrito FOR ALL
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios gestionan sus busquedas guardadas"
  ON busquedas_guardadas FOR ALL
  USING (auth.uid() = usuario_id);
