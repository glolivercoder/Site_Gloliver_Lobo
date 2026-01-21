# Opções de Deploy Gratuito - Site Gloliver Lobo

Este documento analisa plataformas de hospedagem gratuita (free tier) compatíveis com o site Gloliver Lobo.

## 📊 Tamanho do Projeto

| Métrica | Valor |
|---------|-------|
| **Build Size** | ~2.5 MB |
| **Tecnologia** | React + Vite (SPA) |
| **Tipo** | Site estático (após build) |

---

## 🗄️ Análise de Banco de Dados

### Resultado: ✅ **100% Compatível com Free Tiers**

O site **NÃO usa banco de dados externo/servidor**. Toda a persistência de dados é feita no **lado do cliente (browser)**.

### Tecnologias de Armazenamento Utilizadas:

| Tecnologia | Uso | Localização |
|------------|-----|-------------|
| **IndexedDB** | Arquivos de mídia (áudio/vídeo) | Navegador do usuário |
| **localStorage** | Configurações e preferências | Navegador do usuário |

### Detalhes Técnicos:

```
📁 src/utils/storage.ts  → IndexedDB para arquivos de mídia
📁 src/lib/storage.ts    → Wrapper com biblioteca 'idb'
```

**Limites configurados no código:**
- Máximo por arquivo: **25 MB**
- Armazenamento total: **256 MB** (auto-limpeza de arquivos antigos)
- Expira após: **7 dias** sem uso

### Implicações para Deploy:

| Aspecto | Status |
|---------|--------|
| Precisa de servidor de BD? | ❌ Não |
| Precisa de backend? | ❌ Não |
| Funciona em hospedagem estática? | ✅ Sim |
| Dados persistem entre sessões? | ✅ Sim (no navegador) |
| Dados sincronizam entre dispositivos? | ❌ Não (local apenas) |

### Dependências no `package.json` (não usadas em produção):

```json
"better-sqlite3": "^12.4.1",  // ❌ Não está sendo usado
"typeorm": "^0.3.27",         // ❌ Não está sendo usado
"idb": "^8.0.0"               // ✅ Usado para IndexedDB
```

> **Nota:** As bibliotecas `better-sqlite3` e `typeorm` estão no package.json mas **não são importadas em nenhum arquivo**. Podem ser removidas para reduzir o bundle size.

---

## ✅ Plataformas Compatíveis (Recomendadas)

### 1. Vercel ⭐ (Mais Recomendado)

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim (até 50 por projeto) |
| **Armazenamento** | 1 GB (arquivos estáticos) |
| **Bandwidth** | 100 GB/mês |
| **SSL/HTTPS** | ✅ Automático e gratuito |
| **Deploy automático** | ✅ Via GitHub/GitLab |

**Compatibilidade**: ✅ **PERFEITO** - Suporte nativo a Vite/React

**Deploy**:
```bash
npm i -g vercel
vercel --prod
```

---

### 2. Netlify ⭐

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim, com SSL |
| **Armazenamento** | 10 GB |
| **Bandwidth** | 100 GB/mês |
| **Build Minutes** | 300 min/mês |
| **SSL/HTTPS** | ✅ Automático |

**Compatibilidade**: ✅ **PERFEITO** - Excelente para projetos React

**Deploy**:
```bash
npm run build
# Arraste a pasta 'dist' no netlify.com ou use CLI
npx netlify deploy --prod --dir=dist
```

---

### 3. Cloudflare Pages ⭐

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim (até 100 por projeto) |
| **Armazenamento** | Ilimitado (sites estáticos) |
| **Bandwidth** | **Ilimitado** |
| **Requests** | Ilimitado |
| **CDN Global** | ✅ Incluso |
| **SSL/HTTPS** | ✅ Automático |

**Compatibilidade**: ✅ **EXCELENTE** - Melhor custo-benefício (tudo ilimitado!)

**Deploy**:
1. Conecte o repositório GitHub no painel Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`

---

### 4. GitHub Pages

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim |
| **Armazenamento** | 1 GB (repo + site) |
| **Bandwidth** | 100 GB/mês (soft limit) |
| **SSL/HTTPS** | ✅ Automático |

**Compatibilidade**: ✅ **BOA** - Requer configuração de SPA fallback

**Limitação**: Apenas repositórios públicos no plano Free

**Deploy**:
```bash
npm run build
# Use gh-pages ou GitHub Actions
```

---

### 5. Firebase Hosting (Google)

| Recurso | Free Tier (Spark) |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim |
| **Armazenamento** | 10 GB |
| **Bandwidth** | 10 GB/mês |
| **SSL/HTTPS** | ✅ Automático |

**Compatibilidade**: ✅ **BOA** - Ótimo para projetos Google Cloud

**Deploy**:
```bash
npm i -g firebase-tools
firebase init hosting
firebase deploy
```

---

### 6. Render

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim |
| **Armazenamento** | N/A (static) |
| **Bandwidth** | 100 GB/mês |
| **SSL/HTTPS** | ✅ Automático |
| **CDN Global** | ✅ Incluso |

**Compatibilidade**: ✅ **BOA**

---

### 7. Surge.sh

| Recurso | Free Tier |
|---------|-----------|
| **Domínio Próprio** | ✅ Sim |
| **Armazenamento** | Ilimitado (publish) |
| **SSL** | ✅ Para *.surge.sh |

**Compatibilidade**: ✅ **SIMPLES** - Ideal para deploys rápidos

**Deploy**:
```bash
npm run build
npx surge dist
```

---

## 📋 Comparativo Rápido

| Plataforma | Domínio Próprio | Storage | Bandwidth | Melhor Para |
|------------|-----------------|---------|-----------|-------------|
| **Cloudflare Pages** | ✅ | ∞ | **∞** | Projetos pessoais |
| **Vercel** | ✅ | 1 GB | 100 GB | React/Next.js |
| **Netlify** | ✅ | 10 GB | 100 GB | JAMstack |
| GitHub Pages | ✅ | 1 GB | 100 GB | Open source |
| Firebase | ✅ | 10 GB | 10 GB | Google ecosystem |
| Render | ✅ | - | 100 GB | Full-stack apps |
| Surge | ✅ | ∞ | - | Deploys rápidos |

---

## 🏆 Recomendação Final

Para o site **Gloliver Lobo** (2.5 MB), recomendo:

### 1º Lugar: **Cloudflare Pages**
- Bandwidth e storage ilimitados
- CDN global ultra-rápido
- Integração fácil com GitHub

### 2º Lugar: **Vercel**
- Melhor DX (Developer Experience)
- Preview deployments automáticos
- Suporte nativo a Vite

### 3º Lugar: **Netlify**
- Interface amigável
- Forms e Functions gratuitos
- Boa documentação

---

## 🔧 Configuração de Domínio Próprio

Todas as plataformas acima requerem:

1. **Registro de domínio** (comprar em Namecheap, GoDaddy, Hostinger, etc.)
2. **Configurar DNS**:
   - Adicionar registros A ou CNAME
   - Apontar para servidores da plataforma escolhida
3. **Verificar** no painel da plataforma
4. SSL é gerado automaticamente (Let's Encrypt)

---

## 📝 Próximos Passos

1. Escolher uma plataforma
2. Comprar um domínio (opcional, pode usar subdomínio gratuito)
3. Conectar repositório GitHub
4. Configurar build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Deploy!
