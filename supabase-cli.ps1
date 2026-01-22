# ============================================================================
# SUPABASE CLI - SCRIPT DE AUTOMAÇÃO
# ============================================================================
# Objetivo: Automatizar operações de BD com Supabase via CLI
# Data: 22 de janeiro de 2026
# Versão: 1.0
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('status', 'pull', 'push', 'migration', 'reset', 'update')]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$MigrationName = ""
)

# Cores para output
$colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error   = 'Red'
    Info    = 'Cyan'
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Success', 'Warning', 'Error', 'Info')]
        [string]$Type = 'Info'
    )
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Test-Supabase {
    Write-Log "🔍 Verificando Supabase CLI..." -Type Info
    try {
        $version = npx supabase --version 2>&1
        Write-Log "✅ Supabase CLI disponível: $version" -Type Success
        return $true
    }
    catch {
        Write-Log "❌ Erro: Supabase CLI não encontrado!" -Type Error
        return $false
    }
}

function Show-Status {
    Write-Log "`n📊 STATUS DO PROJETO SUPABASE" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    
    npx supabase status
    
    Write-Log "`n✅ Verificação concluída!" -Type Success
}

function Pull-Schema {
    Write-Log "`n📥 PUXANDO SCHEMA DO SUPABASE" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    
    Write-Log "Sincronizando schema remoto para local..." -Type Info
    npx supabase db pull
    
    Write-Log "`n✅ Schema sincronizado!" -Type Success
    Write-Log "📁 Verifique: supabase/schema.sql e supabase/migrations/" -Type Info
}

function Push-Schema {
    Write-Log "`n📤 FAZENDO PUSH DO SCHEMA PARA SUPABASE" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    
    Write-Log "⚠️  ATENÇÃO: Você está prestes a aplicar alterações ao BD!" -Type Warning
    Write-Host "Deseja continuar? (S/N): " -NoNewline
    $continue = Read-Host
    
    if ($continue -ne 'S' -and $continue -ne 's') {
        Write-Log "❌ Operação cancelada." -Type Warning
        return
    }
    
    npx supabase db push
    
    Write-Log "`n✅ Schema enviado!" -Type Success
}

function Create-Migration {
    if ([string]::IsNullOrEmpty($MigrationName)) {
        Write-Log "❌ Nome da migration é obrigatório!" -Type Error
        Write-Log "Uso: .\supabase-cli.ps1 -Action migration -MigrationName 'seu_nome'" -Type Info
        return
    }
    
    Write-Log "`n➕ CRIANDO NOVA MIGRATION" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    Write-Log "Nome: $MigrationName" -Type Info
    
    npx supabase migration new $MigrationName
    
    Write-Log "`n✅ Migration criada!" -Type Success
    Write-Log "📝 Edite o arquivo em: supabase/migrations/" -Type Info
    Write-Log "Depois faça: .\supabase-cli.ps1 -Action push" -Type Info
}

function Reset-Database {
    Write-Log "`n🔄 RESETANDO BANCO DE DADOS" -Type Warning
    Write-Log "═══════════════════════════════════════════════════" -Type Warning
    
    Write-Host "⚠️  CUIDADO: Todos os dados serão PERDIDOS!" -ForegroundColor Red
    Write-Host "Deseja continuar? (S/N): " -NoNewline
    $continue = Read-Host
    
    if ($continue -ne 'S' -and $continue -ne 's') {
        Write-Log "❌ Operação cancelada." -Type Warning
        return
    }
    
    npx supabase db reset
    
    Write-Log "`n✅ BD resetado!" -Type Success
}

function Update-CLI {
    Write-Log "`n🔄 ATUALIZANDO SUPABASE CLI" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    
    Write-Log "Baixando versão mais recente..." -Type Info
    npm install -g supabase@latest
    
    $newVersion = npx supabase --version 2>&1
    Write-Log "`n✅ CLI atualizado para: $newVersion" -Type Success
}

function Show-Help {
    Write-Log "`n🚀 SUPABASE CLI - AUTOMAÇÃO" -Type Info
    Write-Log "═══════════════════════════════════════════════════" -Type Info
    Write-Host @"
SINTAXE:
    .\supabase-cli.ps1 -Action <ação> [-MigrationName <nome>]

AÇÕES DISPONÍVEIS:
    status      → Ver status do projeto Supabase
    pull        → Puxar schema remoto para local
    push        → Enviar schema local para Supabase
    migration   → Criar nova migration (requer -MigrationName)
    reset       → Resetar BD (remove todos dados)
    update      → Atualizar CLI para versão mais recente

EXEMPLOS:
    # Ver status
    .\supabase-cli.ps1 -Action status

    # Sincronizar schema
    .\supabase-cli.ps1 -Action pull

    # Criar migration
    .\supabase-cli.ps1 -Action migration -MigrationName "adicionar_campo_nome"

    # Fazer push (aplicar alterações)
    .\supabase-cli.ps1 -Action push

    # Resetar BD
    .\supabase-cli.ps1 -Action reset

    # Atualizar CLI
    .\supabase-cli.ps1 -Action update

"@
}

# ============================================================================
# EXECUÇÃO
# ============================================================================

Write-Host "`n"
Write-Log "╔═══════════════════════════════════════════════════╗" -Type Info
Write-Log "║     SUPABASE CLI - AUTOMAÇÃO DE BD               ║" -Type Info
Write-Log "╚═══════════════════════════════════════════════════╝" -Type Info

# Verificar se Supabase CLI está disponível
if (-not (Test-Supabase)) {
    Write-Log "`nPara instalar, execute:" -Type Warning
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Executar ação
switch ($Action) {
    'status'   { Show-Status }
    'pull'     { Pull-Schema }
    'push'     { Push-Schema }
    'migration' { Create-Migration }
    'reset'    { Reset-Database }
    'update'   { Update-CLI }
    'help'     { Show-Help }
    default    { Show-Help }
}

Write-Host "`n"
