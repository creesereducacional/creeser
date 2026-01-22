# Guia PM2 Deployment - Produção VPS

**Objetivo**: Configurar PM2 para gerenciar backend Node.js com auto-restart ao boot

**Tempo estimado**: 15 minutos

---

## 1. Instalar PM2 Globalmente

```bash
# SSH na VPS
ssh usuario@seu-ip-vps

# Instalar PM2
sudo npm install -g pm2

# Verificar versão
pm2 -v
```

---

## 2. Iniciar Aplicação com PM2

```bash
# Navegar até projeto
cd ~/projects/creeser-backend

# Iniciar com PM2
pm2 start index.js --name "creeser-api" --env production

# Ou com mais detalhes
pm2 start index.js \
  --name "creeser-api" \
  --instances max \
  --exec-mode cluster \
  --env production \
  --watch \
  --ignore-watch "node_modules logs" \
  --max-memory-restart 500M
```

**Explicação dos flags**:
```
--name              : Nome da aplicação no PM2
--instances max     : Usar todos os cores do CPU (cluster mode)
--exec-mode cluster : Modo cluster (load balancing automático)
--env production    : Usar NODE_ENV=production
--watch             : Restart automático se arquivo mudar (dev)
--ignore-watch      : Não monitorar essas pastas
--max-memory-restart: Restart se consumir >500MB de RAM
```

---

## 3. Verificar Status

```bash
# Listar processos PM2
pm2 list

# Ver logs em tempo real
pm2 logs creeser-api

# Ver logs apenas de erro
pm2 logs creeser-api --err

# Monitoramento detalhado
pm2 monit
```

---

## 4. Arquivo de Configuração PM2 (Recomendado)

**Arquivo**: `~/projects/creeser-backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'creeser-api',
      script: './index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Auto restart
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logs
      output: './logs/out.log',
      error: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoramento
      watch: false, // disabled em production
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Variáveis extras
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'info'
      }
    }
  ],
  
  // Deploy (opcional)
  deploy: {
    production: {
      user: 'usuario',
      host: 'seu-ip-vps',
      ref: 'origin/main',
      repo: 'git@github.com:usuario/creeser.git',
      path: '/home/usuario/projects/creeser-backend',
      'post-deploy': 'npm install && pm2 restart ecosystem.config.js'
    }
  }
};
```

**Iniciar com arquivo de config**:
```bash
cd ~/projects/creeser-backend
pm2 start ecosystem.config.js
```

---

## 5. Auto-Start ao Boot

### Opção A: PM2 Native (Recomendado)

```bash
# Gerar script de auto-start
pm2 startup

# Salvar configuração atual do PM2
pm2 save

# Verificar se foi configurado
pm2 startup systemd

# Para desabilitar no futuro
pm2 unstartup
```

### Opção B: Systemd Service Manual

**Arquivo**: `/etc/systemd/system/creeser-api.service`

```ini
[Unit]
Description=CREESER API Backend
After=network.target

[Service]
Type=simple
User=usuario
WorkingDirectory=/home/usuario/projects/creeser-backend
ExecStart=/usr/bin/node /home/usuario/projects/creeser-backend/index.js
Restart=always
RestartSec=10
StandardOutput=append:/home/usuario/projects/creeser-backend/logs/out.log
StandardError=append:/home/usuario/projects/creeser-backend/logs/error.log
Environment="NODE_ENV=production"
Environment="PORT=3001"

[Install]
WantedBy=multi-user.target
```

**Ativar**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable creeser-api
sudo systemctl start creeser-api
sudo systemctl status creeser-api
```

---

## 6. Gerenciamento Básico

```bash
# Parar aplicação
pm2 stop creeser-api

# Iniciar novamente
pm2 start creeser-api

# Restart (reload zero-downtime em cluster mode)
pm2 reload creeser-api

# Restart forçado (vai derrubar conexões)
pm2 restart creeser-api

# Remover do PM2
pm2 delete creeser-api

# Parar todos os processos
pm2 kill
```

---

## 7. Monitoramento com PM2+

### 7.1 Conectar ao PM2+ (Monitoring Online)

```bash
# Criar conta em https://app.pm2.io
# Depois:

pm2 link <secret_key> <public_key>

# Ou
pm2 login

# Agora você pode monitorar em tempo real no app.pm2.io
```

### 7.2 Configurar Alertas Email

```bash
# Via PM2+ dashboard: https://app.pm2.io/api/notifications

# Ou via CLI
pm2 config set notify true
pm2 config set notify_email seu-email@example.com
```

---

## 8. Logging com PM2

```bash
# Ver logs em tempo real
pm2 logs creeser-api

# Ver últimas 100 linhas
pm2 logs creeser-api --lines 100

# Ver apenas stdout
pm2 logs creeser-api --out

# Ver apenas stderr
pm2 logs creeser-api --err

# Limpar logs
pm2 flush

# Salvar logs para análise
pm2 logs creeser-api > /tmp/logs-backup.txt
```

---

## 9. Restart e Zero-Downtime Deployment

### Em Cluster Mode (Recomendado para produção)

```bash
# Ecosystem config com cluster mode
pm2 start ecosystem.config.js --exec-mode cluster

# Reload zero-downtime (não mata conexões ativas)
pm2 reload creeser-api

# Graceful reload: aguarda requisições terminarem antes de matar
pm2 gracefulReload creeser-api
```

**Como funciona**:
```
1. PM2 inicia nova instância do código novo
2. Dirigi tráfego para nova instância
3. Aguarda conexões antigas terminarem (gracefully)
4. Mata instância antiga
5. Repete para todas as instâncias
```

---

## 10. Scaling Dinâmico

```bash
# Aumentar instâncias em runtime
pm2 scale creeser-api 8  # 8 instâncias

# Diminuir
pm2 scale creeser-api 4  # 4 instâncias

# Ver número atual
pm2 list
```

---

## 11. Observabilidade - Métricas

```bash
# Dashboard interativo
pm2 monit

# Informações detalhadas
pm2 info creeser-api

# Histórico de restarts
pm2 show creeser-api

# Exportar config atual
pm2 describe creeser-api > config.json
```

---

## 12. Troubleshooting

### Aplicação não inicia

```bash
# Verificar se Node.js está instalado
node -v

# Verificar permissões
ls -la ~/projects/creeser-backend/

# Ver erro detalhado
pm2 logs creeser-api --err

# Iniciar com debug
pm2 start index.js --name "creeser-api" --no-daemon

# Se trava, matar processo
pm2 kill
```

### Auto-start não funciona após reboot

```bash
# Verificar se PM2 startup foi configurado
pm2 startup

# Ver status de systemd
systemctl status pm2-usuario

# Recriar startup
pm2 startup
pm2 save
```

### Muita memória

```bash
# Ver consumo por instância
pm2 monit

# Usar max-memory-restart em ecosystem.config.js
"max_memory_restart": "500M"

# Ou restartar periodicamente
"cron_restart": "0 0 * * *"  # Toda meia-noite
```

### Arquivo de log muito grande

```bash
# Ver tamanho dos logs
du -sh ~/projects/creeser-backend/logs/

# Limpar logs antigos
rm ~/projects/creeser-backend/logs/*

# Ou comprimir
gzip ~/projects/creeser-backend/logs/*.log
```

---

## 13. Checklist Deployment com PM2

- [ ] PM2 instalado globalmente
- [ ] Node.js versão 18+ instalado
- [ ] Aplicação testada localmente (`npm start`)
- [ ] .env configurado corretamente na VPS
- [ ] Pasta de logs criada
- [ ] Aplicação iniciada com PM2: `pm2 start ecosystem.config.js`
- [ ] Verificado com `pm2 list` - status "online"
- [ ] Testado `curl http://localhost:3001/health`
- [ ] Configurado auto-start: `pm2 startup` + `pm2 save`
- [ ] Testado reboot da VPS
- [ ] Aplicação reiniciou automaticamente
- [ ] Verificado com `pm2 list`
- [ ] Logs sendo gravados: `tail -f logs/out.log`

---

## 14. Processo Completo de Deploy

```bash
# 1. SSH na VPS
ssh usuario@seu-ip-vps

# 2. Navegar e parar app atual (se existe)
cd ~/projects/creeser-backend
pm2 stop creeser-api

# 3. Atualizar código
git pull origin main
# Ou copiar novo código
scp -r ./dist usuario@seu-ip-vps:/home/usuario/projects/creeser-backend/

# 4. Instalar dependências
npm install

# 5. Rodar migrations
npx prisma migrate deploy

# 6. Restart com zero-downtime (se cluster mode)
pm2 reload creeser-api
# Ou se primeira vez
pm2 start ecosystem.config.js

# 7. Verificar
pm2 logs creeser-api
curl http://localhost:3001/health

# 8. Confirmar sucesso
pm2 list
```

---

## 15. Backup de Configuração PM2

```bash
# Salvar lista de processos PM2
pm2 save

# Restaurar em outra máquina
pm2 resurrect

# Exportar config para documentação
pm2 dump

# Ver arquivo de dump
cat ~/.pm2/dump.pm2

# Usar git para versionamento
cd ~/projects/creeser-backend
git add ecosystem.config.js
git commit -m "Add PM2 config for production deployment"
git push
```

---

## 16. Monitoramento Contínuo (Script Bash)

**Arquivo**: `~/bin/check-api-health.sh`

```bash
#!/bin/bash

API_URL="http://localhost:3001/health"
MAX_RETRIES=3
RETRY_DELAY=5

check_health() {
    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")
        
        if [ "$response" -eq 200 ]; then
            echo "[$(date)] ✓ API Health: OK"
            exit 0
        else
            echo "[$(date)] ✗ API Health: FAIL (HTTP $response)"
            
            if [ $i -lt $MAX_RETRIES ]; then
                echo "  Retry $i/$MAX_RETRIES em ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo "[$(date)] CRÍTICO: API não respondendo!"
    pm2 restart creeser-api
    exit 1
}

check_health
```

```bash
chmod +x ~/bin/check-api-health.sh

# Adicionar ao crontab para rodar a cada 5 minutos
# */5 * * * * /home/usuario/bin/check-api-health.sh >> /tmp/api-health.log 2>&1
```

---

## 17. Próximas Etapas

**MVP na VPS completo**:
1. ✓ Backend rodando com PM2
2. ✓ Auto-start ao boot
3. ✓ Logs sendo monitorados
4. ✓ Backup automático configurado (SETUP_BACKUP_VPS.md)

**Validação**:
- Testar isolação multi-tenant
- Testar rate limiting
- Testar autenticação JWT
- Usar `GUIA_TESTES_MULTITENANT.md`

**Quando MVP validado**:
- Usar `CHECKLIST_MIGRACAO_SUPABASE.md` para migrar

---

**Status**: PM2 pronto para produção ✓

Quando quiser testar, roda `pm2 start ecosystem.config.js` e avisa!
