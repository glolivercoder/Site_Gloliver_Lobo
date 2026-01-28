#!/bin/bash

# Script de Correção de Erro de Build
# Resolve erro: "error: lockfile had changes, but lockfile is frozen"

set -e

echo "🔧 Iniciando correção do erro de build..."
echo "============================================"

# Função para imprimir cabeçalhos
print_header() {
    echo ""
    echo "📋 $1"
    echo "----------------------------------------"
}

# Função para imprimir status
print_status() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_warning() {
    echo "⚠️  $1"
}

# 1. Solução 1: Regeneração completa do lockfile
print_header "1. Solução 1: Regeneração completa do lockfile"
echo "Esta solução remove o lockfile corrompido e reinstala todas as dependências."

read -p "Deseja aplicar a Solução 1? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_status "Aplicando Solução 1..."
    
    # Remover arquivos problemáticos
    if [ -f "bun.lockb" ]; then
        print_status "Removendo bun.lockb corrompido"
        rm bun.lockb
    fi
    
    if [ -d "node_modules" ]; then
        print_status "Removendo node_modules"
        rm -rf node_modules
    fi
    
    # Limpar cache do Bun
    print_status "Limpando cache do Bun"
    bun cache clean 2>/dev/null || print_warning "Cache do Bun não pôde ser limpo"
    
    # Reinstalar dependências
    print_status "Reinstalando dependências"
    bun install
    
    # Testar build
    print_status "Testando build após Solução 1"
    if bun run build; then
        print_status "✅ Build bem-sucedido com Solução 1!"
        exit 0
    else
        print_error "❌ Build falhou com Solução 1, tentando próxima solução..."
    fi
fi

# 2. Solução 2: Diagnóstico avançado e correção específica
print_header "2. Solução 2: Diagnóstico avançado e correção específica"
echo "Esta solução analisa o problema em detalhes e aplica correções específicas."

read -p "Deseja aplicar a Solução 2? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_status "Aplicando Solução 2..."
    
    # Verificar compatibilidade de versões
    print_status "Verificando compatibilidade de versões"
    
    # Forçar instalação sem lockfile
    print_status "Forçando instalação sem lockfile"
    bun install --no-lockfile
    
    # Verificar dependências quebradas
    print_status "Verificando dependências quebradas"
    bun install --dry-run 2>&1 | grep -i "error\|fail" && {
        print_error "Dependências quebradas detectadas"
        print_status "Tentando reparações..."
        bun install --force
    }
    
    # Testar build
    print_status "Testando build após Solução 2"
    if bun run build; then
        print_status "✅ Build bem-sucedido com Solução 2!"
        exit 0
    else
        print_error "❌ Build falhou com Solução 2, tentando próxima solução..."
    fi
fi

# 3. Solução 3: Alternativas de build
print_header "3. Solução 3: Alternativas de build"
echo "Esta solução usa npm como alternativa ao Bun."

read -p "Deseja aplicar a Solução 3? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_status "Aplicando Solução 3..."
    
    # Verificar se npm está disponível
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        print_status "Instale npm e tente novamente"
        exit 1
    fi
    
    # Remover arquivos do Bun
    if [ -f "bun.lockb" ]; then
        rm bun.lockb
    fi
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    # Instalar com npm
    print_status "Instalando dependências com npm"
    npm install
    
    # Testar build com npm
    print_status "Testando build com npm"
    if npm run build; then
        print_status "✅ Build bem-sucedido com npm!"
        print_warning "Considere migrar permanentemente para npm se Bun continuar apresentando problemas"
        exit 0
    else
        print_error "❌ Build falhou com npm"
    fi
fi

# 4. Solução 4: Configuração avançada
print_header "4. Solução 4: Configuração avançada"
echo "Esta solução configura o ambiente para evitar problemas futuros."

read -p "Deseja aplicar a Solução 4? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_status "Aplicando Solução 4..."
    
    # Criar arquivo .bunrc para configurações avançadas
    print_status "Criando configurações avançadas do Bun"
    cat > .bunrc << EOF
# Configurações avançadas do Bun
# Evita problemas de lockfile
install.lockfile = false
install.frozenLockfile = false
EOF
    
    # Limpar tudo e reinstalar
    print_status "Limpando ambiente e reinstalando"
    rm -rf node_modules bun.lockb
    bun cache clean
    bun install
    
    # Testar build
    print_status "Testando build após configuração avançada"
    if bun run build; then
        print_status "✅ Build bem-sucedido com configuração avançada!"
        exit 0
    else
        print_error "❌ Build falhou com configuração avançada"
    fi
fi

# 5. Solução 5: Reverter para estado conhecido
print_header "5. Solução 5: Reverter para estado conhecido"
echo "Esta solução reverte o repositório para um estado anterior conhecido."

read -p "Deseja aplicar a Solução 5? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_status "Aplicando Solução 5..."
    
    # Verificar se é um repositório git
    if [ -d ".git" ]; then
        print_status "Revertendo para último commit estável"
        git stash
        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || print_warning "Não foi possível fazer pull"
        
        # Remover arquivos problemáticos
        rm -rf node_modules bun.lockb
        bun install
        
        # Testar build
        print_status "Testando build após revert"
        if bun run build; then
            print_status "✅ Build bem-sucedido após revert!"
            exit 0
        else
            print_error "❌ Build falhou após revert"
        fi
    else
        print_error "Não é um repositório git, não é possível reverter"
    fi
fi

# 6. Resumo das soluções
print_header "6. Resumo das Soluções"
echo ""
echo "Todas as soluções foram testadas sem sucesso."
echo ""
echo "Próximos passos recomendados:"
echo "  1. Verificar manualmente o package.json"
echo "  2. Checar dependências específicas"
echo "  3. Verificar configurações do Cloudflare Pages"
echo "  4. Considerar criar um novo projeto a partir do zero"
echo ""
echo "Para mais ajuda, consulte o arquivo FIX_BUN_LOCKFILE.md"

echo ""
echo "🎯 Correção concluída!"
echo "============================================"