#!/bin/bash

# Script de Verificação de Build
# Valida se o build está funcionando corretamente

set -e

echo "🔍 Iniciando verificação do build..."
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

# 1. Verificar dependências
print_header "1. Verificando dependências"
if [ -f "package.json" ]; then
    print_status "package.json encontrado"
    
    # Verificar se as dependências estão instaladas
    if [ -d "node_modules" ]; then
        print_status "node_modules encontrado"
        modules_count=$(find node_modules -name "*.js" | wc -l)
        echo "   Número de módulos: $modules_count"
    else
        print_error "node_modules não encontrado"
        print_status "Instalando dependências..."
        bun install
    fi
else
    print_error "package.json não encontrado"
    exit 1
fi

# 2. Verificar lockfile
print_header "2. Verificando lockfile"
if [ -f "bun.lockb" ]; then
    print_status "bun.lockb encontrado"
    lockfile_size=$(stat -f%z bun.lockb 2>/dev/null || stat -c%s bun.lockb 2>/dev/null)
    echo "   Tamanho: ${lockfile_size} bytes"
    
    if [ "$lockfile_size" -eq 0 ]; then
        print_error "bun.lockb está vazio"
        exit 1
    fi
else
    print_warning "bun.lockb não encontrado (pode ser normal com --no-lockfile)"
fi

# 3. Verificar scripts de build
print_header "3. Verificando scripts de build"
if [ -f "package.json" ]; then
    build_script=$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).scripts.build || 'N/A')")
    echo "   Script de build: $build_script"
    
    if [ "$build_script" = "N/A" ]; then
        print_error "Script de build não configurado"
        exit 1
    fi
fi

# 4. Testar build localmente
print_header "4. Testando build localmente"
echo "Executando: bun run build"

if bun run build; then
    print_status "✅ Build local bem-sucedido!"
    
    # Verificar se a pasta de build foi criada
    if [ -d "dist" ]; then
        print_status "Pasta dist criada"
        build_files=$(find dist -type f | wc -l)
        echo "   Arquivos gerados: $build_files"
    elif [ -d "build" ]; then
        print_status "Pasta build criada"
        build_files=$(find build -type f | wc -l)
        echo "   Arquivos gerados: $build_files"
    else
        print_warning "Pasta de build não encontrada (pode ser configurada de forma diferente)"
    fi
else
    print_error "❌ Build local falhou"
    echo ""
    echo "Soluções recomendadas:"
    echo "  1. Execute: ./diagnose_build_error.sh"
    echo "  2. Execute: ./fix_build_error.sh"
    echo "  3. Consulte: FIX_BUN_LOCKFILE.md"
    exit 1
fi

# 5. Verificar configurações do Cloudflare Pages
print_header "5. Verificando configurações do Cloudflare Pages"
echo "Verificando compatibilidade com Cloudflare Pages..."

# Verificar se há arquivos de configuração
if [ -f "wrangler.toml" ]; then
    print_status "wrangler.toml encontrado"
else
    print_status "wrangler.toml não encontrado (normal para Cloudflare Pages)"
fi

# Verificar se há arquivo de configuração do Cloudflare
if [ -f "_redirects" ]; then
    print_status "_redirects encontrado"
fi

if [ -f "_headers" ]; then
    print_status "_headers encontrado"
fi

# 6. Verificar compatibilidade de versões
print_header "6. Verificando compatibilidade de versões"
bun_version=$(bun --version)
echo "   Versão do Bun: $bun_version"

node_version=$(node --version)
echo "   Versão do Node: $node_version"

# Verificar se as versões são compatíveis
if [[ "$bun_version" =~ ^1\.[0-9]+\.[0-9]+$ ]]; then
    print_status "Versão do Bun compatível"
else
    print_warning "Versão do Bun pode ser incompatível"
fi

# 7. Verificar arquivos críticos
print_header "7. Verificando arquivos críticos"
critical_files=("index.html" "vite.config.ts" "tailwind.config.ts")

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file encontrado"
    else
        print_warning "$file não encontrado"
    fi
done

# 8. Testar ambiente de produção
print_header "8. Testando ambiente de produção"
echo "Verificando se o build está pronto para produção..."

if [ -d "dist" ] || [ -d "build" ]; then
    print_status "Build pronto para produção"
    
    # Verificar se há arquivos HTML
    html_files=$(find dist build 2>/dev/null -name "*.html" | wc -l)
    if [ "$html_files" -gt 0 ]; then
        print_status "$html_files arquivos HTML encontrados"
    else
        print_warning "Nenhum arquivo HTML encontrado"
    fi
    
    # Verificar se há arquivos JS
    js_files=$(find dist build 2>/dev/null -name "*.js" | wc -l)
    if [ "$js_files" -gt 0 ]; then
        print_status "$js_files arquivos JavaScript encontrados"
    else
        print_warning "Nenhum arquivo JavaScript encontrado"
    fi
    
    # Verificar se há arquivos CSS
    css_files=$(find dist build 2>/dev/null -name "*.css" | wc -l)
    if [ "$css_files" -gt 0 ]; then
        print_status "$css_files arquivos CSS encontrados"
    else
        print_warning "Nenhum arquivo CSS encontrado"
    fi
else
    print_error "Build não encontrado"
    exit 1
fi

# 9. Resumo da verificação
print_header "9. Resumo da Verificação"
echo ""
echo "✅ Verificação concluída com sucesso!"
echo ""
echo "Status do build:"
echo "  ✅ Dependências instaladas"
echo "  ✅ Build local bem-sucedido"
echo "  ✅ Arquivos de produção gerados"
echo "  ✅ Configurações compatíveis"
echo ""
echo "Próximos passos:"
echo "  1. Commitar as alterações"
echo "  2. Push para o repositório"
echo "  3. O Cloudflare Pages fará o deploy automaticamente"
echo ""
echo "Se o deploy falhar, consulte os logs do Cloudflare Pages"
echo "e execute novamente: ./diagnose_build_error.sh"

echo ""
echo "🎯 Verificação concluída!"
echo "============================================"