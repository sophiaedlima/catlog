CREATE TABLE usuario (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(120) NOT NULL,
    email               VARCHAR(160) NOT NULL UNIQUE,
    telefone            VARCHAR(20)  NOT NULL,
    senha_hash          VARCHAR(100) NOT NULL,
    perfil              VARCHAR(10)  NOT NULL CHECK (perfil IN ('TUTOR', 'CUIDADOR')),
    apresentacao        VARCHAR(300),
    raio_atendimento_km INTEGER      NOT NULL DEFAULT 10,
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE endereco (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    apelido     VARCHAR(60)  NOT NULL,
    cep         VARCHAR(9)   NOT NULL,
    logradouro  VARCHAR(160) NOT NULL,
    numero      VARCHAR(20)  NOT NULL,
    complemento VARCHAR(80),
    bairro      VARCHAR(100) NOT NULL,
    cidade      VARCHAR(100) NOT NULL,
    uf          CHAR(2)      NOT NULL,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    principal   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_endereco_usuario ON endereco (usuario_id);

CREATE TABLE gato (
    id                 BIGSERIAL PRIMARY KEY,
    tutor_id           BIGINT      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    nome               VARCHAR(60) NOT NULL,
    raca               VARCHAR(60),
    sexo               VARCHAR(5)  NOT NULL CHECK (sexo IN ('MACHO', 'FEMEA')),
    data_nascimento    DATE,
    foto_url           VARCHAR(500),
    cuidados_especiais VARCHAR(500),
    criado_em          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gato_tutor ON gato (tutor_id);

CREATE TABLE item_saude (
    id             BIGSERIAL PRIMARY KEY,
    gato_id        BIGINT       NOT NULL REFERENCES gato (id) ON DELETE CASCADE,
    tipo           VARCHAR(10)  NOT NULL CHECK (tipo IN ('VACINA', 'VERMIFUGO', 'REMEDIO')),
    nome           VARCHAR(80)  NOT NULL,
    data_aplicacao DATE         NOT NULL,
    proxima_dose   DATE,
    instrucoes     VARCHAR(300)
);
CREATE INDEX idx_item_saude_gato ON item_saude (gato_id);

CREATE TABLE registro_peso (
    id           BIGSERIAL PRIMARY KEY,
    gato_id      BIGINT       NOT NULL REFERENCES gato (id) ON DELETE CASCADE,
    peso_kg      NUMERIC(5, 2) NOT NULL CHECK (peso_kg BETWEEN 0.5 AND 15),
    data_medicao DATE         NOT NULL
);
CREATE INDEX idx_registro_peso_gato ON registro_peso (gato_id, data_medicao);

CREATE TABLE visita (
    id                  BIGSERIAL PRIMARY KEY,
    tutor_id            BIGINT      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    cuidador_id         BIGINT      NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    endereco_id         BIGINT      NOT NULL REFERENCES endereco (id),
    inicio              TIMESTAMPTZ NOT NULL,
    duracao_minutos     INTEGER     NOT NULL CHECK (duracao_minutos BETWEEN 30 AND 120),
    instrucoes          VARCHAR(500),
    situacao            VARCHAR(15) NOT NULL CHECK (situacao IN ('SOLICITADA', 'ACEITA', 'RECUSADA', 'CANCELADA',
                                                                 'EXPIRADA', 'EM_ANDAMENTO', 'CONCLUIDA')),
    motivo_cancelamento VARCHAR(300),
    cancelada_por       VARCHAR(10),
    checkin_em          TIMESTAMPTZ,
    checkin_latitude    DOUBLE PRECISION,
    checkin_longitude   DOUBLE PRECISION,
    concluida_em        TIMESTAMPTZ,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_visita_cuidador ON visita (cuidador_id, inicio);
CREATE INDEX idx_visita_tutor ON visita (tutor_id, inicio);
CREATE INDEX idx_visita_situacao ON visita (situacao, inicio);

CREATE TABLE visita_gato (
    visita_id BIGINT NOT NULL REFERENCES visita (id) ON DELETE CASCADE,
    gato_id   BIGINT NOT NULL REFERENCES gato (id) ON DELETE CASCADE,
    PRIMARY KEY (visita_id, gato_id)
);

CREATE TABLE relatorio_visita (
    id            BIGSERIAL PRIMARY KEY,
    visita_id     BIGINT      NOT NULL UNIQUE REFERENCES visita (id) ON DELETE CASCADE,
    alimentou     BOOLEAN     NOT NULL,
    trocou_agua   BOOLEAN     NOT NULL,
    limpou_caixa  BOOLEAN     NOT NULL,
    medicou       BOOLEAN     NOT NULL,
    observacoes   VARCHAR(1000),
    registrado_em TIMESTAMPTZ NOT NULL
);

CREATE TABLE foto_relatorio (
    id           BIGSERIAL PRIMARY KEY,
    relatorio_id BIGINT       NOT NULL REFERENCES relatorio_visita (id) ON DELETE CASCADE,
    url          VARCHAR(500) NOT NULL,
    ordem        INTEGER      NOT NULL
);

CREATE TABLE notificacao (
    id         BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    visita_id  BIGINT REFERENCES visita (id) ON DELETE CASCADE,
    titulo     VARCHAR(100) NOT NULL,
    mensagem   VARCHAR(300) NOT NULL,
    entregue   BOOLEAN      NOT NULL DEFAULT FALSE,
    criada_em  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_notificacao_pendente ON notificacao (usuario_id, entregue);
