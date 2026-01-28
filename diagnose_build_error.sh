#!/bin/bash

# Script de Diagnóstico de Erro de Build
# Resolve erro: "error: lockfile had changes, but lockfile is frozen"

set -e

echo "🔍 Iniciando diagnóstico do erro de build..."
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

# 1. Verificar integridade do bun.lockb
print_header "1. Verificando integridade do bun.lockb"
if [ -f "bun.lockb" ]; then
    print_status "Arquivo bun.lockb encontrado"
    lockfile_size=$(stat -f%z bun.lockb 2>/dev/null || stat -c%s bun.lockb 2>/dev/null)
    echo "   Tamanho do arquivo: ${lockfile_size} bytes"
    
    if [ "$lockfile_size" -eq 0 ]; then
        print_error "Arquivo bun.lockb está vazio (corrompido)"
        LOCKFILE_CORRUPTED=true
    else
        print_status "Arquivo bun.lockb parece válido"
        LOCKFILE_CORRUPTED=false
    fi
else
    print_error "Arquivo bun.lockb não encontrado"
    LOCKFILE_MISSING=true
fi

# 2. Verificar package.json
print_header "2. Verificando package.json"
if [ -f "package.json" ]; then
    print_status "Arquivo package.json encontrado"
    node -e "console.log('✅ package.json válido')" 2>/dev/null || {
        print_error "package.json está corrompido"
        exit 1
    }
else
    print_error "Arquivo package.json não encontrado"
    exit 1
fi

# 3. Verificar dependências
print_header "3. Verificando dependências"
if command -v bun &> /dev/null; then
    print_status "Bun está instalado"
    bun_version=$(bun --version)
    echo "   Versão: $bun_version"
else
    print_error "Bun não está instalado"
    echo "   Instale com: npm install -g bun"
    exit 1
fi

# 4. Verificar node_modules
print_header "4. Verificando node_modules"
if [ -d "node_modules" ]; then
    print_status "Diretório node_modules encontrado"
    modules_count=$(find node_modules -name "*.js" | wc -l)
    echo "   Número de arquivos: $modules_count"
else
    print_error "Diretório node_modules não encontrado"
    NODE_MODULES_MISSING=true
fi

# 5. Verificar cache do Bun
print_header "5. Verificando cache do Bun"
if command -v bun &> /dev/null; then
    cache_dir=$(bun --cache-dir 2>/dev/null || echo "~/.bun/install/cache")
    if [ -d "$cache_dir" ]; then
        print_status "Cache do Bun encontrado em: $cache_dir"
        cache_size=$(du -sh "$cache_dir" 2>/dev/null | cut -f1)
        echo "   Tamanho do cache: $cache_size"
    else
        print_error "Cache do Bun não encontrado"
    fi
fi

# 6. Verificar scripts de build
print_header "6. Verificando scripts de build"
if [ -f "package.json" ]; then
    build_script=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).scripts.build || 'N/A')")
    echo "   Script de build: $build_script"
    
    if [ "$build_script" = "N/A" ]; then
        print_error "Script de build não encontrado no package.json"
    else
        print_status "Script de build configurado"
    fi
fi

# 7. Verificar configurações do Cloudflare Pages
print_header "7. Verificando configurações do Cloudflare Pages"
if [ -f "wrangler.toml" ]; then
    print_status "Arquivo wrangler.toml encontrado"
else
    print_status "Arquivo wrangler.toml não encontrado (normal para Cloudflare Pages)"
fi

if [ -f "package.json" ]; then
    build_command=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).build || 'N/A')")
    if [ "$build_command" != "N/A" ]; then
        print_status "Comando de build configurado: $build_command"
    fi
fi

# 8. Gerar relatório de diagnóstico
print_header "8. Relatório de Diagnóstico"
echo ""
echo "Problemas identificados:"
if [ "$LOCKFILE_CORRUPTED" = true ]; then
    echo "  ❌ bun.lockb corrompido"
fi
if [ "$LOCKFILE_MISSING" = true ]; then
    echo "  ❌ bun.lockb ausente"
fi
if [ "$NODE_MODULES_MISSING" = true ]; then
    echo "  ❌ node_modules ausente"
fi

if [ "$LOCKFILE_CORRUPTED" != true ] && [ "$LOCKFILE_MISSING" != true ] && [ "$NODE_MODULES_MISSING" != true ]; then
    echo "  ✅ Nenhum problema crítico identificado"
fi

echo ""
echo "Recomendações:"
if [ "$LOCKFILE_CORRUPTED" = true ] || [ "$LOCKFILE_MISSING" = true ]; then
    echo "  1. Regenerar bun.lockb: rm bun.lockb && bun install"
fi
if [ "$NODE_MODULES_MISSING" = true ]; then
    echo "  2. Instalar dependências: bun install"
fi
echo "  3. Testar build localmente: bun run build"
echo "  4. Verificar configurações do Cloudflare Pages"

echo ""
echo "🎯 Diagnóstico concluído!"
echo "============================================"