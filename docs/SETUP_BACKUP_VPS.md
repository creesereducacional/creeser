# Setup de Backup Automático - VPS + PostgreSQL

**Objetivo**: Backup automático diário do banco PostgreSQL com retenção de 30 dias

**Tempo estimado**: 20 minutos para configuração completa

---

## 1. Estrutura de Pastas para Backups

```bash
# SSH na VPS
ssh usuario@seu-ip-vps

# Criar estrutura
mkdir -p ~/backups/postgresql
mkdir -p ~/backups/logs
chmod 700 ~/backups  # Apenas owner pode acessar

# Criar pasta para scripts
mkdir -p ~/bin
```

---

## 2. Script de Backup (pg_dump)

**Arquivo**: `~/bin/backup-postgresql.sh`

```bash
#!/bin/bash

##############################################################################
# Script de Backup Automático - PostgreSQL
# Executa: diariamente via cron
# Retenção: 30 dias
##############################################################################

# Configurações
BACKUP_DIR="/home/usuario/backups/postgresql"
LOGS_DIR="/home/usuario/backups/logs"
DB_NAME="creeser_mvp"
DB_USER="creeser_user"
DB_HOST="localhost"
DB_PORT="5432"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/creeser_mvp_$TIMESTAMP.sql.gz"
LOG_FILE="$LOGS_DIR/backup_$TIMESTAMP.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Função para limpar backups antigos
cleanup_old_backups() {
    log "Removendo backups com mais de $RETENTION_DAYS dias..."
    
    find "$BACKUP_DIR" -name "creeser_mvp_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    if [ $? -eq 0 ]; then
        log "✓ Limpeza de backups antigos concluída"
    else
        log_error "Falha ao limpar backups antigos"
    fi
}

# Função para obter tamanho do banco
get_db_size() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
}

# Função principal de backup
realizar_backup() {
    log "Iniciando backup do banco: $DB_NAME"
    log "Host: $DB_HOST | Usuário: $DB_USER | Arquivo: $BACKUP_FILE"
    
    # Executar pg_dump com gzip
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --verbose \
        --no-password | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Backup concluído com sucesso"
        log "Tamanho do arquivo: $SIZE"
        
        # Registrar metadados
        echo "Backup: $BACKUP_FILE" >> "$LOG_FILE"
        echo "Tamanho: $SIZE" >> "$LOG_FILE"
        echo "Data: $(date)" >> "$LOG_FILE"
        
        return 0
    else
        log_error "Falha ao executar pg_dump"
        return 1
    fi
}

# Função para validar integridade do backup
validar_backup() {
    log "Validando integridade do backup..."
    
    # Testar se o arquivo gzip é válido
    gzip -t "$BACKUP_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Arquivo gzip válido"
        
        # Verificar se contém estrutura SQL
        if gzip -dc "$BACKUP_FILE" | head -20 | grep -q "PostgreSQL"; then
            log_success "Estrutura SQL detectada no backup"
            return 0
        else
            log_error "Estrutura SQL não encontrada no backup"
            return 1
        fi
    else
        log_error "Arquivo gzip corrompido"
        return 1
    fi
}

# Função para enviar notificação (opcional - email)
enviar_notificacao() {
    local status=$1
    local tamanho=$2
    
    # Se quiser enviar email, descomente e configure
    # echo "Backup $status - Tamanho: $tamanho - $(date)" | \
    #   mail -s "Backup PostgreSQL CREESER" seu-email@example.com
}

##############################################################################
# EXECUÇÃO PRINCIPAL
##############################################################################

echo ""
log "╔════════════════════════════════════════════════════════════════╗"
log "║          INICIANDO BACKUP AUTOMÁTICO - CREESER MVP             ║"
log "╚════════════════════════════════════════════════════════════════╝"

# Verificar se arquivo de senha existe (opcional mas recomendado)
if [ -f ~/.pgpass ]; then
    log "✓ Usando arquivo .pgpass para autenticação"
fi

# Obter tamanho do banco antes do backup
DB_SIZE=$(get_db_size)
log "Tamanho do banco antes do backup: $DB_SIZE"

# Realizar backup
if realizar_backup; then
    # Validar backup
    if validar_backup; then
        log_success "╔════════════════════════════════════════════════════════════════╗"
        log_success "║              BACKUP COMPLETADO COM SUCESSO                      ║"
        log_success "╚════════════════════════════════════════════════════════════════╝"
        
        # Listar último backup
        log ""
        log "Último backup criado:"
        ls -lh "$BACKUP_FILE"
        
        # Limpeza de backups antigos
        log ""
        cleanup_old_backups
        
        # Exibir estatísticas
        log ""
        log "ESTATÍSTICAS:"
        log "Total de backups: $(ls -1 $BACKUP_DIR/creeser_mvp_*.sql.gz 2>/dev/null | wc -l)"
        log "Espaço total usado: $(du -sh $BACKUP_DIR | cut -f1)"
        
        enviar_notificacao "SUCESSO" "$(du -h "$BACKUP_FILE" | cut -f1)"
        exit 0
    else
        log_error "╔════════════════════════════════════════════════════════════════╗"
        log_error "║          BACKUP CRIADO MAS VALIDAÇÃO FALHOU                     ║"
        log_error "╚════════════════════════════════════════════════════════════════╝"
        
        enviar_notificacao "FALHA NA VALIDAÇÃO" "N/A"
        exit 2
    fi
else
    log_error "╔════════════════════════════════════════════════════════════════╗"
    log_error "║              BACKUP FALHOU COMPLETAMENTE                       ║"
    log_error "╚════════════════════════════════════════════════════════════════╝"
    
    enviar_notificacao "FALHA" "N/A"
    exit 1
fi
```

**Tornar executável**:
```bash
chmod +x ~/bin/backup-postgresql.sh
```

---

## 3. Configurar Autenticação PostgreSQL (opcional mas recomendado)

**Arquivo**: `~/.pgpass`

```
localhost:5432:creeser_mvp:creeser_user:sua_senha_forte_aqui
```

**Configurar permissões**:
```bash
chmod 600 ~/.pgpass
```

Isso permite que pg_dump execute sem solicitar senha interativamente.

---

## 4. Configurar Cron Job

### Opção A: Backup Diário às 02:00 (madrugada)

```bash
# Abrir crontab
crontab -e

# Adicionar esta linha
0 2 * * * /home/usuario/bin/backup-postgresql.sh
```

**Explicação do cron**:
```
0    = minuto (0)
2    = hora (2 AM)
*    = dia do mês (qualquer)
*    = mês (qualquer)
*    = dia da semana (qualquer)
```

### Opção B: Backup Múltiplas Vezes ao Dia

```bash
# Diário às 02:00, 08:00, 14:00 e 20:00
0 2,8,14,20 * * * /home/usuario/bin/backup-postgresql.sh

# Ou a cada 6 horas
0 */6 * * * /home/usuario/bin/backup-postgresql.sh
```

### Opção C: Backup por Hora (mais frequente)

```bash
# A cada 1 hora
0 * * * * /home/usuario/bin/backup-postgresql.sh

# A cada 4 horas
0 */4 * * * /home/usuario/bin/backup-postgresql.sh
```

---

## 5. Verificar Se Cron Está Funcionando

```bash
# Listar cron jobs
crontab -l

# Ver logs do cron (Linux)
grep CRON /var/log/syslog

# Ou em systemd
journalctl -u cron

# Verificar se backup foi criado
ls -lh ~/backups/postgresql/

# Ver último log de backup
tail -f ~/backups/logs/backup_*.log
```

---

## 6. Restaurar Backup (quando necessário)

### Restaurar Banco Inteiro

```bash
# Parar aplicação (importante!)
sudo systemctl stop creeser-backend  # ou pm2 stop all

# Descompactar e restaurar
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | \
  psql -h localhost -U creeser_user -d creeser_mvp

# Ou em um novo banco
createdb -U postgres creeser_mvp_restored
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | \
  psql -h localhost -U creeser_user -d creeser_mvp_restored

# Reiniciar aplicação
sudo systemctl start creeser-backend  # ou pm2 start all
```

### Restaurar Tabela Específica

```bash
# Extrair schema de uma tabela
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | \
  grep -A 50 "CREATE TABLE usuario" > /tmp/usuario_table.sql

# Fazer restore dessa tabela
psql -h localhost -U creeser_user -d creeser_mvp < /tmp/usuario_table.sql
```

### Verificar Integridade do Backup Antes de Restaurar

```bash
# Listar conteúdo do backup sem descompactar
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | head -50

# Contar linhas SQL
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | wc -l

# Procurar tabela específica
gunzip -c ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz | grep "CREATE TABLE usuario"
```

---

## 7. Script de Restauração Automática (opcional)

**Arquivo**: `~/bin/restore-postgresql.sh`

```bash
#!/bin/bash

##############################################################################
# Script de Restauração de Backup - PostgreSQL
# Uso: ./restore-postgresql.sh <caminho-do-backup> [novo-nome-banco]
##############################################################################

BACKUP_FILE="${1}"
NEW_DB_NAME="${2:-creeser_mvp_restored}"
DB_USER="creeser_user"
DB_HOST="localhost"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <caminho-do-backup> [novo-nome-banco]"
    echo "Exemplo: $0 ~/backups/postgresql/creeser_mvp_20250101_020000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erro: Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          INICIANDO RESTAURAÇÃO DO BACKUP                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Arquivo: $BACKUP_FILE"
echo "Novo banco: $NEW_DB_NAME"
echo ""

# Confirmar antes de restaurar
read -p "Tem certeza que deseja restaurar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 1
fi

# Criar novo banco
echo "Criando novo banco: $NEW_DB_NAME..."
createdb -U postgres "$NEW_DB_NAME"

# Restaurar
echo "Restaurando dados..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -U "$DB_USER" -d "$NEW_DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Restauração concluída com sucesso!"
    echo ""
    echo "Próximos passos:"
    echo "1. Testar o banco: psql -h localhost -U $DB_USER -d $NEW_DB_NAME"
    echo "2. Se tudo ok, fazer backup do banco atual: pg_dump ... > backup_anterior.sql"
    echo "3. Fazer drop do banco atual: dropdb -U postgres creeser_mvp"
    echo "4. Renomear novo banco: ALTER DATABASE $NEW_DB_NAME RENAME TO creeser_mvp;"
else
    echo ""
    echo "✗ Erro ao restaurar backup!"
    echo "  Deletando banco parcialmente restaurado..."
    dropdb -U postgres "$NEW_DB_NAME"
    exit 1
fi
```

```bash
chmod +x ~/bin/restore-postgresql.sh
```

---

## 8. Monitoramento de Backups

**Script**: `~/bin/monitor-backups.sh`

```bash
#!/bin/bash

BACKUP_DIR="/home/usuario/backups/postgresql"
DISK_QUOTA_GB=50  # Alerta se passar de 50GB

echo "═══════════════════════════════════════════════════════════════"
echo "ESTATÍSTICAS DE BACKUP - CREESER MVP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Total de backups
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/creeser_mvp_*.sql.gz 2>/dev/null | wc -l)
echo "✓ Total de backups: $TOTAL_BACKUPS"

# Espaço total
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "✓ Espaço total: $TOTAL_SIZE"

# Backup mais recente
LATEST=$(ls -t "$BACKUP_DIR"/creeser_mvp_*.sql.gz 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    LATEST_DATE=$(ls -lh "$LATEST" | awk '{print $6, $7, $8}')
    LATEST_SIZE=$(ls -lh "$LATEST" | awk '{print $5}')
    echo "✓ Último backup: $LATEST_DATE ($LATEST_SIZE)"
fi

# Backup mais antigo
OLDEST=$(ls -t "$BACKUP_DIR"/creeser_mvp_*.sql.gz 2>/dev/null | tail -1)
if [ -n "$OLDEST" ]; then
    OLDEST_DATE=$(ls -lh "$OLDEST" | awk '{print $6, $7, $8}')
    echo "✓ Backup mais antigo: $OLDEST_DATE"
fi

# Verificar se há backup de hoje
TODAY=$(date +%Y%m%d)
if ls "$BACKUP_DIR"/creeser_mvp_"$TODAY"_*.sql.gz 1>/dev/null 2>&1; then
    echo "✓ Backup de hoje: SIM"
else
    echo "✗ Backup de hoje: NÃO (ALERTA!)"
fi

# Alertar se usar muito espaço
SIZE_GB=$(du -sh "$BACKUP_DIR" | awk '{print $1}' | sed 's/G//')
if (( $(echo "$SIZE_GB > $DISK_QUOTA_GB" | bc -l) )); then
    echo ""
    echo "⚠ ALERTA: Uso de disco acima do limite ($SIZE_GB GB > $DISK_QUOTA_GB GB)"
    echo "  Considere ajustar RETENTION_DAYS em backup-postgresql.sh"
fi

echo ""
echo "Últimos 5 backups:"
ls -lhS "$BACKUP_DIR"/creeser_mvp_*.sql.gz 2>/dev/null | head -5 | awk '{print $5, $6, $7, $8, $9}'
```

```bash
chmod +x ~/bin/monitor-backups.sh

# Executar
~/bin/monitor-backups.sh
```

---

## 9. Cron para Monitoramento

```bash
# Adicionar ao crontab para rodar toda segunda às 09:00
crontab -e

# Adicionar:
0 9 * * 1 /home/usuario/bin/monitor-backups.sh >> /home/usuario/backups/logs/monitor.log 2>&1
```

---

## 10. Checklist de Implementação

- [ ] Criar pasta `~/backups/postgresql` e `~/backups/logs`
- [ ] Copiar script `backup-postgresql.sh` e fazer `chmod +x`
- [ ] Configurar `.pgpass` com credenciais (opcional)
- [ ] Testar backup manualmente: `~/bin/backup-postgresql.sh`
- [ ] Verificar arquivo criado: `ls -lh ~/backups/postgresql/`
- [ ] Configurar cron job
- [ ] Verificar se cron está rodando: `crontab -l`
- [ ] Monitorar logs nos próximos dias
- [ ] Testar restauração em banco de teste
- [ ] Documentar processo de restauração para equipe

---

## 11. Troubleshooting

### Erro: "pg_dump: command not found"
```bash
# PostgreSQL client não está no PATH
# Instalar ou adicionar ao PATH
export PATH="/usr/lib/postgresql/15/bin:$PATH"

# Ou adicionar ao .bashrc
echo 'export PATH="/usr/lib/postgresql/15/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Erro: "psql: FATAL: Ident authentication failed"
```bash
# Editar /etc/postgresql/15/main/pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Alterar de "ident" para "md5" ou "scram-sha-256"
# Depois recarregar PostgreSQL
sudo systemctl reload postgresql
```

### Erro: "Permission denied" ao criar arquivo
```bash
# Verificar permissões
ls -la ~/backups/

# Garantir que pasta é gravável
chmod 755 ~/backups/postgresql
chmod 755 ~/backups/logs
```

### Cron não está executando
```bash
# Verificar se cron está ativo
sudo systemctl status cron

# Ver logs
sudo journalctl -u cron -n 50

# Verificar PATH em crontab
# Pode ser diferente do bash - adicionar PATH explícito no cron:
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * /home/usuario/bin/backup-postgresql.sh
```

### Backup muito lento
```bash
# Usar --format=plain é mais lento
# Para production, considere formato custom (mais rápido, mais compressível)
# Alterar em backup-postgresql.sh:
# --format=plain \  (lento mas simples)
# --format=custom \ (rápido e comprimido)

# Com custom format, precisa restaurar com pg_restore
```

---

## 12. Comandos Úteis

```bash
# Monitorar espaço de disco
df -h

# Ver tamanho de cada banco
sudo -u postgres psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database ORDER BY pg_database_size(datname) DESC;"

# Comprimir manualmente (se arquivo SQL já existe)
gzip -9 arquivo.sql  # -9 é máxima compressão

# Descompactar sem deletar original
gunzip -c arquivo.sql.gz > arquivo.sql

# Transferir backup para outro servidor
scp ~/backups/postgresql/creeser_mvp_*.sql.gz usuario@backup-server:/backups/

# Agendar com anacron (executa mesmo que máquina tenha desligado)
# /etc/cron.d/cron.weekly
@weekly /home/usuario/bin/backup-postgresql.sh
```

---

## 13. Próximas Etapas

**Agora que backup está configurado**:
1. ✓ Backup automático diário (via cron)
2. → Próximo: `GUIA_PM2_DEPLOYMENT.md` (PM2 para iniciar ao boot)
3. → Depois: MVP validado e pronto para produção

**Quando tiver MVP validado**:
- Usar `CHECKLIST_MIGRACAO_SUPABASE.md` para migrar para Supabase

---

**Status**: Configuração de backup pronta para produção ✓

Quando quiser continuar com PM2, avisa!
