-- InventoPC — Schema Supabase
-- Cole este SQL no: Supabase Dashboard → SQL Editor → New Query → Run

-- ════════════════════════════════════════
-- TABELA: usuarios
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS usuarios (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome          TEXT DEFAULT '',
  role          TEXT DEFAULT 'tecnico' CHECK (role IN ('admin','tecnico','visualizador')),
  telefone      TEXT DEFAULT '',
  ativo         BOOLEAN DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Usuário admin padrão (senha: admin123)
INSERT INTO usuarios (username, password_hash, nome, role)
VALUES (
  'admin',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- admin123
  'Administrador',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Usuário técnico padrão (senha: tec2024)
INSERT INTO usuarios (username, password_hash, nome, role)
VALUES (
  'tecnico',
  'b2d04a1a8ec2aa15bbb6fe67a50ef474b8f0fb9c72f57a9a02e3e41c8b8d85ff', -- tec2024
  'Técnico de TI',
  'tecnico'
) ON CONFLICT (username) DO NOTHING;


-- ════════════════════════════════════════
-- TABELA: computadores
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS computadores (
  id            BIGSERIAL PRIMARY KEY,
  hostname      TEXT NOT NULL,
  ip            TEXT DEFAULT '',
  mac           TEXT DEFAULT '',
  usuario       TEXT DEFAULT '',
  setor         TEXT DEFAULT '',
  so            TEXT DEFAULT '',
  so_versao     TEXT DEFAULT '',
  cpu           TEXT DEFAULT '',
  cpu_detalhes  TEXT DEFAULT '',
  ram           TEXT DEFAULT '',
  disco         TEXT DEFAULT '',
  fabricante    TEXT DEFAULT '',
  modelo        TEXT DEFAULT '',
  serial        TEXT DEFAULT '',
  vnc_port      INTEGER DEFAULT 5900,
  tipo          TEXT DEFAULT 'desktop' CHECK (tipo IN ('desktop','notebook','servidor','outro')),
  patrimonio    TEXT DEFAULT '',   -- Apenas notebooks
  status        TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','manutencao')),
  obs           TEXT DEFAULT '',
  agente_versao TEXT DEFAULT '',
  registrado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_visto  TIMESTAMPTZ
);

-- Index para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_computadores_hostname ON computadores(hostname);
CREATE INDEX IF NOT EXISTS idx_computadores_mac      ON computadores(mac);
CREATE INDEX IF NOT EXISTS idx_computadores_status   ON computadores(status);


-- ════════════════════════════════════════
-- TABELA: tickets (helpdesk)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tickets (
  id            BIGSERIAL PRIMARY KEY,
  protocolo     TEXT UNIQUE,
  titulo        TEXT NOT NULL,
  descricao     TEXT DEFAULT '',
  solicitante   TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  setor         TEXT DEFAULT '',
  prioridade    TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status        TEXT DEFAULT 'aberto' CHECK (status IN ('aberto','andamento','resolvido','fechado')),
  tipo_equip    TEXT DEFAULT 'desktop',
  patrimonio    TEXT DEFAULT '',
  historico     JSONB DEFAULT '[]',
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em DESC);

-- Auto-gerar protocolo via trigger
CREATE OR REPLACE FUNCTION gerar_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := 'TKT-' || LPAD(NEW.id::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_protocolo
BEFORE INSERT ON tickets
FOR EACH ROW EXECUTE FUNCTION gerar_protocolo();


-- ════════════════════════════════════════
-- ROW LEVEL SECURITY (opcional mas recomendado)
-- ════════════════════════════════════════
-- Desabilite RLS para uso interno simples:
ALTER TABLE usuarios     DISABLE ROW LEVEL SECURITY;
ALTER TABLE computadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      DISABLE ROW LEVEL SECURITY;

-- Para verificar as tabelas criadas:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
