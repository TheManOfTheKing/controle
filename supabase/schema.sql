-- ============================================================
-- Sistema de Gestão Escolar — Schema Completo
-- Arquivo: supabase/schema.sql
-- Versão: 1.0.0 — 2026-06-03
--
-- Este arquivo é a FONTE DA VERDADE do schema atual.
-- Deve refletir o estado completo do banco em produção.
-- Para mudanças incrementais, crie migrations em:
--   supabase/migrations/NNN_descricao.sql
--
-- Para aplicar do zero:
--   Cole este conteúdo no SQL Editor do Supabase e execute.
-- ============================================================


-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Atualiza automaticamente a coluna atualizado_em no UPDATE
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;




-- ============================================================
-- TABELA: profiles
-- Perfis de acesso dos usuários do sistema.
-- Vinculado 1:1 a auth.users. Criado automaticamente
-- via trigger on_auth_user_created ao registrar usuário.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'viewer'
                            CHECK (role IN ('admin', 'editor', 'viewer')),
  telas_acesso  TEXT[]      DEFAULT '{}',
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_atualizado_em
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Função get_my_role() criada APÓS profiles (referencia esta tabela)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário vê o próprio perfil; admin vê todos
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (id = auth.uid() OR get_my_role() = 'admin');

-- Usuário atualiza o próprio perfil; admin atualiza qualquer um
CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (id = auth.uid() OR get_my_role() = 'admin');


-- ============================================================
-- TABELA: professores
-- Cadastro dos professores. Base para aulas e pagamentos.
-- Soft delete: ativo = false (nunca DELETE físico).
-- ============================================================

CREATE TABLE IF NOT EXISTS professores (
  id            UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT        NOT NULL,
  email         TEXT        UNIQUE,
  telefone      TEXT,
  especialidade TEXT,
  documento     TEXT,       -- CPF ou equivalente
  cep           TEXT,
  logradouro    TEXT,
  numero        TEXT,
  complemento   TEXT,
  bairro        TEXT,
  cidade        TEXT,
  estado        TEXT,
  endereco      TEXT,
  observacoes   TEXT,
  instagram_handle TEXT,
  foto_url      TEXT,
  pix_tipo      TEXT        CHECK (pix_tipo IN ('cpf','cnpj','email','telefone','aleatoria') OR pix_tipo IS NULL),
  pix_chave     TEXT,
  is_whatsapp   BOOLEAN     DEFAULT false,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_professores_atualizado_em
  BEFORE UPDATE ON professores
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE INDEX IF NOT EXISTS idx_professores_ativo ON professores (ativo);

ALTER TABLE professores ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY professores_select ON professores
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escrita: admin e editor
CREATE POLICY professores_write ON professores
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));


-- ============================================================
-- TABELA: aulas
-- Registro de aulas ao vivo.
-- FK professor_id: SET NULL se professor for desativado.
-- Soft delete: status = 'cancelada' (nunca DELETE físico).
-- ============================================================

CREATE TABLE IF NOT EXISTS aulas (
  id                UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id      UUID        REFERENCES professores(id) ON DELETE SET NULL,
  monitor_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo            TEXT        NOT NULL,
  descricao         TEXT,
  data_hora         TIMESTAMPTZ NOT NULL,
  duracao_minutos   INTEGER     NOT NULL DEFAULT 60,
  link_transmissao  TEXT,
  status            TEXT        NOT NULL DEFAULT 'agendada'
                                CHECK (status IN ('agendada', 'realizada', 'cancelada', 'reagendada', 'em_andamento', 'confirmada', 'material_enviado', 'material_postado', 'aula_postada')),
  gravacao_url      TEXT,       -- preenchido apenas quando status = 'realizada'
  observacoes       TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_aulas_atualizado_em
  BEFORE UPDATE ON aulas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE INDEX IF NOT EXISTS idx_aulas_professor ON aulas (professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data     ON aulas (data_hora);
CREATE INDEX IF NOT EXISTS idx_aulas_status   ON aulas (status);
CREATE INDEX IF NOT EXISTS idx_aulas_monitor ON aulas (monitor_id);

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY aulas_select ON aulas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escrita: admin e editor
CREATE POLICY aulas_write ON aulas
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));


-- ============================================================
-- TABELA: pagamentos
-- Controle financeiro de pagamentos a professores.
-- FK professor_id e aula_id: SET NULL se referência for removida.
-- Soft delete: status = 'cancelado' (nunca DELETE físico).
--
-- NOTA: status 'atrasado' é calculado no frontend.
-- O banco armazena apenas: pendente, pago, cancelado.
-- ============================================================

CREATE TABLE IF NOT EXISTS pagamentos (
  id              UUID          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID          REFERENCES professores(id) ON DELETE SET NULL,
  aula_id         UUID          REFERENCES aulas(id) ON DELETE SET NULL,
  descricao       TEXT          NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  data_vencimento DATE          NOT NULL,
  data_pagamento  DATE,         -- preenchido ao marcar como 'pago'
  status          TEXT          NOT NULL DEFAULT 'pendente'
                                CHECK (status IN ('pendente', 'pago', 'cancelado')),
  metodo          TEXT          CHECK (metodo IN ('pix', 'transferencia', 'dinheiro', 'outro')),
  comprovante_url TEXT,         -- futuro: Supabase Storage (v1.1)
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pagamentos_atualizado_em
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venc   ON pagamentos (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_prof   ON pagamentos (professor_id);

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY pagamentos_select ON pagamentos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escrita: admin e editor
CREATE POLICY pagamentos_write ON pagamentos
  FOR ALL
  USING (get_my_role() IN ('admin', 'editor'));

-- VIEW: pagamentos_com_status
-- View que injeta o status "atrasado" calculado em tempo real
CREATE OR REPLACE VIEW pagamentos_com_status AS
SELECT 
  p.*,
  CASE 
    WHEN p.status = 'pendente' AND p.data_vencimento < CURRENT_DATE THEN 'atrasado'
    ELSE p.status
  END as status_calculado
FROM pagamentos p;


-- ============================================================
-- TABELA: pessoal
-- Dados internos da equipe. ACESSO EXCLUSIVO: admin.
-- Sem FKs com outras tabelas — tabela independente.
--
-- ⚠ CONFIDENCIAL: campo salario nunca deve ser exibido
-- em listagens nem exportado em CSV.
-- ============================================================

CREATE TABLE IF NOT EXISTS pessoal (
  id              UUID          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT          NOT NULL,
  cargo           TEXT,
  email           TEXT,
  telefone        TEXT,
  documento       TEXT,         -- CPF ou equivalente
  salario         NUMERIC(10,2),-- CONFIDENCIAL: nunca exibir em listagens
  data_admissao   DATE,
  data_demissao   DATE,
  status          TEXT          NOT NULL DEFAULT 'ativo'
                                CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
  observacoes     TEXT,
  is_whatsapp     BOOLEAN       DEFAULT false,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pessoal_atualizado_em
  BEFORE UPDATE ON pessoal
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE INDEX IF NOT EXISTS idx_pessoal_status ON pessoal (status);

ALTER TABLE pessoal ENABLE ROW LEVEL SECURITY;

-- Acesso total: somente admin
CREATE POLICY pessoal_admin_only ON pessoal
  FOR ALL
  USING (get_my_role() = 'admin');


-- ============================================================
-- TRIGGER: cria profile automaticamente após registro
-- Disparado quando um novo usuário é criado em auth.users.
-- Role padrão: 'viewer'. Admin deve ser configurado via SQL:
--   UPDATE profiles SET role = 'admin' WHERE email = '...';
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'viewer'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
