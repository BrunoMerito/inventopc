-- System Mérito — Schema Supabase ATUALIZADO
-- Cole no: Supabase Dashboard → SQL Editor → New Query → Run

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

INSERT INTO usuarios (username, password_hash, nome, role) VALUES
  ('admin',   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Administrador', 'admin'),
  ('tecnico', 'b2d04a1a8ec2aa15bbb6fe67a50ef474b8f0fb9c72f57a9a02e3e41c8b8d85ff', 'Técnico de TI', 'tecnico')
ON CONFLICT (username) DO NOTHING;

-- ════════════════════════════════════════
-- TABELA: computadores (ATUALIZADA)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS computadores (
  id            BIGSERIAL PRIMARY KEY,
  hostname      TEXT NOT NULL,
  ip            TEXT DEFAULT '',
  mac           TEXT DEFAULT '',
  usuario       TEXT DEFAULT '',
  setor         TEXT DEFAULT '',
  -- Localidade e localização física
  localidade    TEXT DEFAULT 'escritorio' CHECK (localidade IN ('escritorio','stand','obra')),
  localizacao   TEXT DEFAULT '',
  so            TEXT DEFAULT '',
  so_versao     TEXT DEFAULT '',
  cpu           TEXT DEFAULT '',
  cpu_detalhes  TEXT DEFAULT '',
  ram           TEXT DEFAULT '',
  disco         TEXT DEFAULT '',
  fabricante    TEXT DEFAULT '',
  modelo        TEXT DEFAULT '',
  serial        TEXT DEFAULT '',
  tipo          TEXT DEFAULT 'desktop' CHECK (tipo IN ('desktop','notebook','servidor','impressora','switch','outro')),
  patrimonio    TEXT DEFAULT '',
  -- Acesso remoto
  vnc_port      INTEGER DEFAULT 5900,
  ws_port       INTEGER DEFAULT 8765,
  -- Status
  status        TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','manutencao')),
  obs           TEXT DEFAULT '',
  agente_versao TEXT DEFAULT '',
  registrado_em TIMESTAMPTZ DEFAULT NOW(),
  ultimo_visto  TIMESTAMPTZ
);

-- Adicionar colunas se já existir a tabela (migration)
ALTER TABLE computadores ADD COLUMN IF NOT EXISTS localidade   TEXT DEFAULT 'escritorio';
ALTER TABLE computadores ADD COLUMN IF NOT EXISTS localizacao  TEXT DEFAULT '';
ALTER TABLE computadores ADD COLUMN IF NOT EXISTS ws_port      INTEGER DEFAULT 8765;
ALTER TABLE computadores ADD COLUMN IF NOT EXISTS tipo         TEXT DEFAULT 'desktop';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_computadores_hostname   ON computadores(hostname);
CREATE INDEX IF NOT EXISTS idx_computadores_mac        ON computadores(mac);
CREATE INDEX IF NOT EXISTS idx_computadores_status     ON computadores(status);
CREATE INDEX IF NOT EXISTS idx_computadores_localidade ON computadores(localidade);

-- ════════════════════════════════════════
-- TABELA: tickets (ATUALIZADA)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tickets (
  id            BIGSERIAL PRIMARY KEY,
  protocolo     TEXT UNIQUE,
  titulo        TEXT NOT NULL,
  descricao     TEXT DEFAULT '',
  solicitante   TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  setor         TEXT DEFAULT '',
  categoria     TEXT DEFAULT '',
  prioridade    TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status        TEXT DEFAULT 'aberto' CHECK (status IN ('aberto','andamento','resolvido','fechado')),
  grupo         TEXT DEFAULT '',
  agente        TEXT DEFAULT '',
  tipo_equip    TEXT DEFAULT 'desktop',
  patrimonio    TEXT DEFAULT '',
  tags          TEXT[] DEFAULT '{}',
  historico     JSONB DEFAULT '[]',
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se já existir
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS grupo     TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS agente    TEXT DEFAULT '';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tags      TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_agente    ON tickets(agente);

-- Trigger protocolo
CREATE OR REPLACE FUNCTION gerar_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := '#' || LPAD(NEW.id::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_protocolo ON tickets;
CREATE TRIGGER trigger_protocolo
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION gerar_protocolo();

-- Trigger atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizado_tickets ON tickets;
CREATE TRIGGER trigger_atualizado_tickets
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ════════════════════════════════════════
-- TABELA: apps_instalados (loja)
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS apps_instalados (
  id             BIGSERIAL PRIMARY KEY,
  computador_id  BIGINT REFERENCES computadores(id) ON DELETE CASCADE,
  app_id         TEXT NOT NULL,
  app_nome       TEXT NOT NULL,
  status         TEXT DEFAULT 'instalando' CHECK (status IN ('instalando','instalado','erro')),
  instalado_em   TIMESTAMPTZ DEFAULT NOW(),
  instalado_por  TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_apps_computador ON apps_instalados(computador_id);

-- ════════════════════════════════════════
-- REALTIME (habilitar para updates ao vivo)
-- ════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE computadores;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ════════════════════════════════════════
-- DESABILITAR RLS (uso interno)
-- ════════════════════════════════════════
ALTER TABLE usuarios        DISABLE ROW LEVEL SECURITY;
ALTER TABLE computadores    DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets         DISABLE ROW LEVEL SECURITY;
ALTER TABLE apps_instalados DISABLE ROW LEVEL SECURITY;

-- Verificar tabelas criadas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
