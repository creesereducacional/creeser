#!/bin/bash

##############################################################################
# Script de Aplicação de Migration - Prisma Schema Improvements
# Execução: LOCAL + VPS
# Data: 27/12/2025
##############################################################################

set -e  # Parar se erro

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Aplicação de Melhorias - Prisma Schema v6.16.1          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# PARTE 1: LOCAL - Gerar Migration
# ============================================================================

echo -e "${YELLOW}\n▶ PARTE 1: Gerando Migration Localmente...${NC}\n"

# Verificar se está na pasta certa
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Erro: package.json não encontrado${NC}"
    echo "Execute este script na raiz do projeto creeser-backend"
    exit 1
fi

echo "✓ package.json encontrado"

# Verificar se prisma/schema.prisma.improved existe
if [ ! -f "prisma/schema.prisma.improved" ]; then
    echo -e "${RED}✗ Erro: prisma/schema.prisma.improved não encontrado${NC}"
    echo "Verifique se o arquivo existe no repositório"
    exit 1
fi

echo "✓ prisma/schema.prisma.improved encontrado"

# Backup do schema atual
echo -e "\n${YELLOW}▶ Fazendo backup do schema.prisma atual...${NC}"
cp prisma/schema.prisma prisma/schema.prisma.backup
echo -e "${GREEN}✓ Backup em: prisma/schema.prisma.backup${NC}"

# Copiar schema melhorado
echo -e "\n${YELLOW}▶ Copiando schema melhorado...${NC}"
cp prisma/schema.prisma.improved prisma/schema.prisma
echo -e "${GREEN}✓ Schema.prisma atualizado${NC}"

# Gerar migration
echo -e "\n${YELLOW}▶ Gerando migration com Prisma...${NC}"
echo "Executando: npx prisma migrate dev --name improve_schema"
echo ""

npx prisma migrate dev --name improve_schema

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao gerar migration${NC}"
    echo "Revertendo schema.prisma"
    cp prisma/schema.prisma.backup prisma/schema.prisma
    exit 1
fi

echo -e "${GREEN}✓ Migration gerada com sucesso!${NC}"

# Verificar migration criada
MIGRATION_DIR=$(ls -dt prisma/migrations/*/ | head -1)
if [ -z "$MIGRATION_DIR" ]; then
    echo -e "${RED}✗ Erro: Pasta de migration não encontrada${NC}"
    exit 1
fi

echo -e "\n${YELLOW}▶ Migration criada:${NC}"
ls -la "$MIGRATION_DIR"

# Mostrar SQL gerado
echo -e "\n${YELLOW}▶ SQL gerado:${NC}"
head -30 "${MIGRATION_DIR}migration.sql"
echo "... (continua)"

# Commit
echo -e "\n${YELLOW}▶ Commitando mudanças...${NC}"
git add prisma/
git commit -m "feat: improve schema with soft deletes, indexes, and new fields

- Add deletedAt (soft delete) to all tables
- Add new fields to Empresa (logoUrl, corPrimaria, timeZone, planoPagamento, limiteUsuarios)
- Add verification fields to Usuario (emailVerificado, telefoneVerificado, autenticacao2FA)
- Add optimized composite indexes (Usuario, Nota, AuditoriaLog)
- Add direct relation AuditoriaLog to Empresa

Migration: improve_schema"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao fazer commit${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Committed${NC}"

# Push
echo -e "\n${YELLOW}▶ Fazendo push para origin main...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao fazer push${NC}"
    echo "Verifique sua conexão com GitHub"
    exit 1
fi

echo -e "${GREEN}✓ Pushed${NC}"

# ============================================================================
# PARTE 2: VPS - Aplicar Migration
# ============================================================================

echo -e "\n${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              PARTE 2: Aplicando em Produção (VPS)               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Perguntar se quer continuar
read -p "Continuar para aplicar em produção? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Abortado. Para aplicar manualmente na VPS:${NC}"
    echo ""
    echo "ssh usuario@seu-ip-vps"
    echo "cd ~/projects/creeser-backend"
    echo "git pull origin main"
    echo "npx prisma migrate deploy"
    echo "npx prisma generate"
    echo "pm2 restart creeser-api"
    exit 0
fi

# Perguntar IP da VPS
read -p "IP ou hostname da VPS: " VPS_HOST
read -p "Usuário SSH (padrão: usuario): " VPS_USER
VPS_USER=${VPS_USER:-usuario}

echo -e "\n${YELLOW}▶ Conectando à VPS ($VPS_USER@$VPS_HOST)...${NC}"

# Comando para executar na VPS
VPS_COMMAND="
set -e
cd ~/projects/creeser-backend
echo 'Puxando atualizações...'
git pull origin main
echo 'Aplicando migrations...'
npx prisma migrate deploy
echo 'Gerando cliente Prisma...'
npx prisma generate
echo 'Restarting backend...'
pm2 restart creeser-api
echo 'Aguardando 3s...'
sleep 3
echo 'Verificando status...'
pm2 status creeser-api
echo '✓ Concluído!'
"

# Executar na VPS
ssh "$VPS_USER@$VPS_HOST" bash -c "$VPS_COMMAND"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao aplicar na VPS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Aplicado na VPS com sucesso!${NC}"

# Health check
echo -e "\n${YELLOW}▶ Fazendo health check...${NC}"
sleep 2

HEALTH=$(curl -s http://$VPS_HOST:3001/health | grep -o '"status":"ok"' || echo "")

if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}✓ Health check OK${NC}"
else
    echo -e "${YELLOW}⚠ Health check não respondeu (pode estar reiniciando)${NC}"
fi

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo -e "\n${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✓ CONCLUÍDO COM SUCESSO!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${GREEN}Resumo:${NC}"
echo "  ✓ Schema.prisma atualizado"
echo "  ✓ Migration gerada localmente"
echo "  ✓ Commit feito e push para GitHub"
echo "  ✓ Migration aplicada na VPS"
echo "  ✓ Backend reiniciado"
echo ""

echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Atualizar seu código para usar deletedAt em queries"
echo "  2. Usar .update() para soft delete em vez de .delete()"
echo "  3. Testar novas funcionalidades"
echo ""

echo -e "${BLUE}Referência: APLICANDO_MELHORIAS_SCHEMA.md${NC}"
echo ""
