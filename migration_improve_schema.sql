-- CreateEnum
-- AlterTable "Empresa"
ALTER TABLE "Empresa" ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "corPrimaria" TEXT NOT NULL DEFAULT '#0066cc',
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN "planoPagamento" TEXT,
ADD COLUMN "limiteUsuarios" INTEGER,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Empresa_deletedAt_idx" ON "Empresa"("deletedAt");

-- AlterTable "Unidade"
ALTER TABLE "Unidade" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Unidade_deletedAt_idx" ON "Unidade"("deletedAt");

-- AlterTable "Usuario"
ALTER TABLE "Usuario" ADD COLUMN "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "telefoneVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autenticacao2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Usuario_empresaId_tipo_idx" ON "Usuario"("empresaId", "tipo");
CREATE INDEX "Usuario_empresaId_ativo_idx" ON "Usuario"("empresaId", "ativo");
CREATE INDEX "Usuario_deletedAt_idx" ON "Usuario"("deletedAt");

-- AlterTable "Funcionario"
ALTER TABLE "Funcionario" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Funcionario_deletedAt_idx" ON "Funcionario"("deletedAt");

-- AlterTable "Professor"
ALTER TABLE "Professor" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Professor_deletedAt_idx" ON "Professor"("deletedAt");

-- AlterTable "Aluno"
ALTER TABLE "Aluno" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Aluno_deletedAt_idx" ON "Aluno"("deletedAt");

-- AlterTable "Curso"
ALTER TABLE "Curso" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Curso_deletedAt_idx" ON "Curso"("deletedAt");

-- AlterTable "Turma"
ALTER TABLE "Turma" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Turma_deletedAt_idx" ON "Turma"("deletedAt");

-- AlterTable "Matricula"
ALTER TABLE "Matricula" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Matricula_deletedAt_idx" ON "Matricula"("deletedAt");

-- AlterTable "Disciplina"
ALTER TABLE "Disciplina" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Disciplina_deletedAt_idx" ON "Disciplina"("deletedAt");

-- AlterTable "Avaliacao"
ALTER TABLE "Avaliacao" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Avaliacao_deletedAt_idx" ON "Avaliacao"("deletedAt");

-- AlterTable "Nota"
ALTER TABLE "Nota" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Nota_empresaId_alunoId_turmaId_idx" ON "Nota"("empresaId", "alunoId", "turmaId");
CREATE INDEX "Nota_disciplinaId_avaliacaoId_idx" ON "Nota"("disciplinaId", "avaliacaoId");
CREATE INDEX "Nota_deletedAt_idx" ON "Nota"("deletedAt");

-- AlterTable "Falta"
ALTER TABLE "Falta" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Falta_deletedAt_idx" ON "Falta"("deletedAt");

-- AlterTable "Documento"
ALTER TABLE "Documento" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Documento_deletedAt_idx" ON "Documento"("deletedAt");

-- AlterTable "EmailEnviado"
ALTER TABLE "EmailEnviado" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "EmailEnviado_deletedAt_idx" ON "EmailEnviado"("deletedAt");

-- AlterTable "Forum"
ALTER TABLE "Forum" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Forum_deletedAt_idx" ON "Forum"("deletedAt");

-- AlterTable "Noticia"
ALTER TABLE "Noticia" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Noticia_deletedAt_idx" ON "Noticia"("deletedAt");

-- AlterTable "SchemaCustomizado"
ALTER TABLE "SchemaCustomizado" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "SchemaCustomizado_deletedAt_idx" ON "SchemaCustomizado"("deletedAt");

-- AlterTable "DadosDinamicos"
ALTER TABLE "DadosDinamicos" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "DadosDinamicos_deletedAt_idx" ON "DadosDinamicos"("deletedAt");

-- AlterTable "AuditoriaLog"
ALTER TABLE "AuditoriaLog" ADD COLUMN "versao" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "AuditoriaLog_tabela_registroId_idx" ON "AuditoriaLog"("tabela", "registroId");

-- AddForeignKey to AuditoriaLog (nova relação com Empresa)
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
