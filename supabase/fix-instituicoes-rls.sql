-- Script para corrigir RLS na tabela instituicoes
-- Execute este script se já criou a tabela com RLS habilitado

-- Desabilitar RLS se estiver habilitado
ALTER TABLE instituicoes DISABLE ROW LEVEL SECURITY;

-- Remover policies se existirem
DROP POLICY IF EXISTS "Todos podem ver instituicoes" ON instituicoes;
DROP POLICY IF EXISTS "Apenas admin pode inserir instituicoes" ON instituicoes;
DROP POLICY IF EXISTS "Apenas admin pode atualizar instituicoes" ON instituicoes;
DROP POLICY IF EXISTS "Apenas admin pode deletar instituicoes" ON instituicoes;
