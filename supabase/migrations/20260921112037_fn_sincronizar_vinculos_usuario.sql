-- ============================================================
-- FASE 7.2.3 — RPC Transacional: fn_sincronizar_vinculos_usuario
-- ============================================================
-- Atualiza atomicamente os campos cadastrais do usuário e
-- sincroniza a tabela usuario_instituicoes dentro de uma
-- única transação PostgreSQL, evitando estados parciais
-- nas 3-4 chamadas REST separadas do PUT anterior.
--
-- Parâmetros:
--   p_usuario_id            INTEGER   — ID do usuário alvo
--   p_is_grupo_admin        BOOLEAN   — TRUE = operador é grupo_admin
--   p_operador_instituicao_id UUID    — UUID da instituição do operador
--                                       (ignorado quando p_is_grupo_admin = TRUE)
--   p_campos_cadastrais     JSONB     — Campos a atualizar em "usuarios"
--                                       (apenas campos permitidos são aplicados)
--   p_vinculos              JSONB     — Array JSONB com os vínculos pretendidos:
--                                       [{"instituicao_id": UUID, "unidade_id": INT|null}, ...]
--
-- Retorna:
--   JSONB com { ok: true, legado_instituicao_id, legado_unidade_id }
--   Em caso de violação de regra, lança RAISE EXCEPTION (rollback automático).
--
-- Segurança:
--   SECURITY DEFINER — executa com os privilégios do owner da função.
--   A autorização do operador é feita ANTES desta chamada, no handler Node.js.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_sincronizar_vinculos_usuario(
  p_usuario_id              INTEGER,
  p_is_grupo_admin          BOOLEAN,
  p_operador_instituicao_id UUID,
  p_campos_cadastrais       JSONB,
  p_vinculos                JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original            usuarios%ROWTYPE;
  v_vinculo             JSONB;
  v_inst_id             UUID;
  v_unidade_id          INTEGER;
  v_inst_count          INTEGER;
  v_unidade_inst_id     UUID;
  v_novos_vinculos      JSONB[];
  v_db_vinculos         JSONB[];
  v_db_vinculo          RECORD;
  v_preservados         JSONB[];
  v_vinc_do_operador    JSONB;
  v_legado_inst_id      UUID;
  v_legado_unidade_id   INTEGER;
  v_inst_vistas         UUID[];
  v_vinc_original_inst  BOOLEAN;
  v_prim_vinculo        JSONB;
  v_vinc_op             JSONB;
  i                     INTEGER;
BEGIN
  -- 1. Bloquear linha do usuário para evitar condições de corrida
  SELECT * INTO v_original
  FROM usuarios
  WHERE id = p_usuario_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USUARIO_NAO_ENCONTRADO: Usuário % não existe.', p_usuario_id;
  END IF;

  -- 2. Atualizar campos cadastrais autorizados (apenas os presentes no JSONB)
  IF p_campos_cadastrais ? 'nomecompleto' THEN
    UPDATE usuarios SET nomecompleto = p_campos_cadastrais->>'nomecompleto' WHERE id = p_usuario_id;
  ELSIF p_campos_cadastrais ? 'nome' THEN
    UPDATE usuarios SET nome = p_campos_cadastrais->>'nome' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'email' THEN
    UPDATE usuarios SET email = p_campos_cadastrais->>'email' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'cpf' THEN
    UPDATE usuarios SET cpf = p_campos_cadastrais->>'cpf' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'datanascimento' THEN
    UPDATE usuarios SET datanascimento = (p_campos_cadastrais->>'datanascimento')::DATE WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'whatsapp' THEN
    UPDATE usuarios SET whatsapp = p_campos_cadastrais->>'whatsapp' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'tipo' THEN
    UPDATE usuarios SET tipo = p_campos_cadastrais->>'tipo' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'perfil' THEN
    UPDATE usuarios SET perfil = p_campos_cadastrais->>'perfil' WHERE id = p_usuario_id;
  END IF;

  IF p_campos_cadastrais ? 'status' THEN
    UPDATE usuarios SET status = p_campos_cadastrais->>'status' WHERE id = p_usuario_id;
  END IF;

  -- 3. Processar vínculos (somente se p_vinculos for fornecido)
  IF p_vinculos IS NOT NULL THEN

    v_inst_vistas    := ARRAY[]::UUID[];
    v_novos_vinculos := ARRAY[]::JSONB[];

    -- 3a. Validar cada vínculo enviado
    FOR i IN 0 .. jsonb_array_length(p_vinculos) - 1 LOOP
      v_vinculo := p_vinculos->i;

      IF v_vinculo->>'instituicao_id' IS NULL OR v_vinculo->>'instituicao_id' = '' THEN
        RAISE EXCEPTION 'VINCULO_SEM_INSTITUICAO: Vínculo na posição % não possui instituicao_id.', i;
      END IF;

      v_inst_id := (v_vinculo->>'instituicao_id')::UUID;

      IF v_inst_id = ANY(v_inst_vistas) THEN
        RAISE EXCEPTION 'INSTITUICAO_DUPLICADA: A instituição % aparece mais de uma vez.', v_inst_id;
      END IF;
      v_inst_vistas := array_append(v_inst_vistas, v_inst_id);

      SELECT COUNT(*) INTO v_inst_count FROM instituicoes WHERE id = v_inst_id;
      IF v_inst_count = 0 THEN
        RAISE EXCEPTION 'INSTITUICAO_NAO_ENCONTRADA: A instituição % não existe.', v_inst_id;
      END IF;

      v_unidade_id := NULL;
      IF v_vinculo->>'unidade_id' IS NOT NULL
         AND v_vinculo->>'unidade_id' <> ''
         AND v_vinculo->>'unidade_id' <> 'null' THEN
        v_unidade_id := (v_vinculo->>'unidade_id')::INTEGER;
        SELECT u.instituicao_id INTO v_unidade_inst_id
        FROM unidades u WHERE u.id = v_unidade_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'UNIDADE_NAO_ENCONTRADA: A unidade % não existe.', v_unidade_id;
        END IF;
        IF v_unidade_inst_id <> v_inst_id THEN
          RAISE EXCEPTION 'UNIDADE_INSTITUICAO_INVALIDA: Unidade % não pertence à instituição %.', v_unidade_id, v_inst_id;
        END IF;
      END IF;

      v_novos_vinculos := array_append(v_novos_vinculos,
        jsonb_build_object('instituicao_id', v_inst_id, 'unidade_id', v_unidade_id)
      );
    END LOOP;

    -- Carregar vínculos atuais do banco
    v_db_vinculos := ARRAY[]::JSONB[];
    FOR v_db_vinculo IN
      SELECT ui.id, ui.instituicao_id, ui.unidade_id
      FROM usuario_instituicoes ui
      WHERE ui.usuario_id = p_usuario_id
    LOOP
      v_db_vinculos := array_append(v_db_vinculos,
        jsonb_build_object('id', v_db_vinculo.id,
                           'instituicao_id', v_db_vinculo.instituicao_id,
                           'unidade_id', v_db_vinculo.unidade_id)
      );
    END LOOP;

    -- 3b. Determinar lista final conforme escopo
    IF p_is_grupo_admin THEN
      IF array_length(v_novos_vinculos, 1) IS NULL THEN
        RAISE EXCEPTION 'USUARIO_SEM_VINCULO: O usuário deve possuir ao menos um vínculo institucional.';
      END IF;

      -- Remover do banco o que não foi enviado
      FOR i IN 1 .. COALESCE(array_length(v_db_vinculos, 1), 0) LOOP
        DECLARE
          db_inst UUID   := (v_db_vinculos[i]->>'instituicao_id')::UUID;
          db_id   BIGINT := (v_db_vinculos[i]->>'id')::BIGINT;
          j       INTEGER;
          achou   BOOLEAN := FALSE;
        BEGIN
          FOR j IN 1 .. COALESCE(array_length(v_novos_vinculos, 1), 0) LOOP
            IF (v_novos_vinculos[j]->>'instituicao_id')::UUID = db_inst THEN
              achou := TRUE;
              EXIT;
            END IF;
          END LOOP;
          IF NOT achou THEN
            DELETE FROM usuario_instituicoes WHERE id = db_id;
          END IF;
        END;
      END LOOP;

    ELSE
      -- instituicao_admin: preserva vínculos de outras instituições do banco
      IF p_operador_instituicao_id IS NULL THEN
        RAISE EXCEPTION 'OPERADOR_SEM_INSTITUICAO: Instituição do operador não definida.';
      END IF;

      v_preservados      := ARRAY[]::JSONB[];
      v_vinc_do_operador := NULL;

      -- Identificar o vínculo que o operador quer definir para sua instituição
      FOR i IN 1 .. COALESCE(array_length(v_novos_vinculos, 1), 0) LOOP
        IF (v_novos_vinculos[i]->>'instituicao_id')::UUID = p_operador_instituicao_id THEN
          v_vinc_do_operador := v_novos_vinculos[i];
          EXIT;
        END IF;
      END LOOP;

      -- Preservar/remover o vínculo do operador no banco
      FOR i IN 1 .. COALESCE(array_length(v_db_vinculos, 1), 0) LOOP
        DECLARE
          db_inst UUID   := (v_db_vinculos[i]->>'instituicao_id')::UUID;
          db_id   BIGINT := (v_db_vinculos[i]->>'id')::BIGINT;
        BEGIN
          IF db_inst <> p_operador_instituicao_id THEN
            v_preservados := array_append(v_preservados, v_db_vinculos[i]);
          ELSE
            IF v_vinc_do_operador IS NULL THEN
              DELETE FROM usuario_instituicoes WHERE id = db_id;
            END IF;
          END IF;
        END;
      END LOOP;

      -- Lista final = preservados de outras instituições + vínculo do operador
      v_novos_vinculos := v_preservados;
      IF v_vinc_do_operador IS NOT NULL THEN
        v_novos_vinculos := array_append(v_novos_vinculos, v_vinc_do_operador);
      END IF;

      IF array_length(v_novos_vinculos, 1) IS NULL THEN
        RAISE EXCEPTION 'USUARIO_SEM_VINCULO: O usuário deve possuir ao menos um vínculo institucional.';
      END IF;
    END IF;

    -- 3c. Upsert da lista final
    FOR i IN 1 .. COALESCE(array_length(v_novos_vinculos, 1), 0) LOOP
      DECLARE
        up_inst UUID    := (v_novos_vinculos[i]->>'instituicao_id')::UUID;
        up_unid INTEGER := CASE
          WHEN v_novos_vinculos[i]->>'unidade_id' IS NOT NULL
           AND v_novos_vinculos[i]->>'unidade_id' <> 'null'
          THEN (v_novos_vinculos[i]->>'unidade_id')::INTEGER
          ELSE NULL
        END;
      BEGIN
        INSERT INTO usuario_instituicoes (usuario_id, instituicao_id, unidade_id, updated_at)
        VALUES (p_usuario_id, up_inst, up_unid, NOW())
        ON CONFLICT (usuario_id, instituicao_id)
        DO UPDATE SET unidade_id = EXCLUDED.unidade_id, updated_at = NOW();
      END;
    END LOOP;

    -- 4. Atualizar campos legados (instituicao_id / unidade_id em usuarios)
    v_legado_inst_id    := NULL;
    v_legado_unidade_id := NULL;

    IF p_is_grupo_admin THEN
      v_legado_inst_id := (v_novos_vinculos[1]->>'instituicao_id')::UUID;
      IF v_novos_vinculos[1]->>'unidade_id' IS NOT NULL
         AND v_novos_vinculos[1]->>'unidade_id' <> 'null' THEN
        v_legado_unidade_id := (v_novos_vinculos[1]->>'unidade_id')::INTEGER;
      END IF;
    ELSE
      v_vinc_original_inst := FALSE;
      FOR i IN 1 .. COALESCE(array_length(v_novos_vinculos, 1), 0) LOOP
        IF (v_novos_vinculos[i]->>'instituicao_id')::UUID = v_original.instituicao_id THEN
          v_vinc_original_inst := TRUE;
          v_prim_vinculo := v_novos_vinculos[i];
          EXIT;
        END IF;
      END LOOP;

      IF v_vinc_original_inst AND v_prim_vinculo IS NOT NULL THEN
        v_legado_inst_id := v_original.instituicao_id;
        IF v_prim_vinculo->>'unidade_id' IS NOT NULL
           AND v_prim_vinculo->>'unidade_id' <> 'null' THEN
          v_legado_unidade_id := (v_prim_vinculo->>'unidade_id')::INTEGER;
        ELSE
          v_legado_unidade_id := v_original.unidade_id;
        END IF;
      ELSE
        v_vinc_op := NULL;
        FOR i IN 1 .. COALESCE(array_length(v_novos_vinculos, 1), 0) LOOP
          IF (v_novos_vinculos[i]->>'instituicao_id')::UUID = p_operador_instituicao_id THEN
            v_vinc_op := v_novos_vinculos[i];
            EXIT;
          END IF;
        END LOOP;

        v_prim_vinculo := COALESCE(v_vinc_op, v_novos_vinculos[1]);
        v_legado_inst_id := (v_prim_vinculo->>'instituicao_id')::UUID;
        IF v_prim_vinculo->>'unidade_id' IS NOT NULL
           AND v_prim_vinculo->>'unidade_id' <> 'null' THEN
          v_legado_unidade_id := (v_prim_vinculo->>'unidade_id')::INTEGER;
        END IF;
      END IF;
    END IF;

    UPDATE usuarios
    SET instituicao_id = v_legado_inst_id,
        unidade_id     = v_legado_unidade_id
    WHERE id = p_usuario_id;

  END IF; -- fim do bloco de vínculos

  -- 5. Retornar confirmação
  RETURN jsonb_build_object(
    'ok',                    true,
    'legado_instituicao_id', v_legado_inst_id,
    'legado_unidade_id',     v_legado_unidade_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION fn_sincronizar_vinculos_usuario(INTEGER, BOOLEAN, UUID, JSONB, JSONB)
  IS 'Atualiza atomicamente campos cadastrais e sincroniza usuario_instituicoes. '
     'Deve ser chamada após as validações de autorização no handler Node.js. '
     'FASE 7.2.3 — Creeser.';
