# Guia de Deploy: Cloudflare Pages 🚀

Este guia detalha o passo a passo para colocar seu site no ar usando a **Cloudflare Pages**, aproveitando a banda ilimitada e alta performance.

## Pré-requisitos
- Já ter feito o `git push` da branch `main2` para o seu **GitHub**.
- Ter em mãos a **Project URL** e a **Anon Key** do seu projeto no Supabase.

---

## Passo 1: Iniciar a Aplicação
1. Acesse o painel da Cloudflare.
2. No menu lateral, clique em **Workers & Pages**.
3. Clique no botão azul **Create application** (como mostrado no seu print).
4. Selecione a aba **Pages** e clique em **Connect to Git**.

## Passo 2: Selecionar o Repositório
1. Escolha sua conta do GitHub.
2. Selecione o repositório `Site_Gloliver_Lobo`.
3. Clique em **Begin setup**.

## Passo 3: Configurações de Build
Nesta tela, preencha os campos exatamente assim:
- **Project name**: `gloliverlobo` (ou o nome que preferir).
- **Production branch**: `main2` (⚠️ IMPORTANTE: Use a main2 que criamos).
- **Framework preset**: Selecione **Vite**.
- **Build command**: `npm run build`
- **Build output directory**: `dist`

## Passo 4: Variáveis de Ambiente (Supabase)
Antes de clicar em salvar, role para baixo até **Environment variables (advanced)**:
1. Clique em **+ Add variable**.
2. Adicione os seguintes nomes e valores (copie do seu arquivo `.env.local`):
   - `VITE_SUPABASE_URL` = (Sua URL do Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (Sua Anon Key do Supabase)
   - `VITE_WHATSAPP_URL` = `https://wa.me/message/CH4JV3TYBXDYP1`

## Passo 5: Salvar e Fazer Deploy
1. Clique em **Save and Deploy**.
2. A Cloudflare vai baixar seu código, instalar as dependências e gerar o site. Isso leva cerca de 2-3 minutos.
3. Ao finalizar, você receberá um link temporário (ex: `gloliverlobo.pages.dev`).

## Passo 6: Configurar o Domínio Próprio (`gloliverlobo.com`) - Método Recomendado

Este método é o mais potente (Cloudflare DNS), pois acelera o site e protege seu domínio.

### Parte A: No Cloudflare
1. Na tela que você está agora, escolha **Cloudflare DNS** e toque em **Begin DNS transfer**.
2. Digite `gloliverlobo.com`.
3. Escolha o plano **Free** (Gratuito).
4. O Cloudflare vai escanear seus registros atuais. Clique em **Continue**.
5. Ele vai te mostrar dois endereços de "Nameservers". Exemplo:
   - `alina.ns.cloudflare.com`
   - `dave.ns.cloudflare.com`
   *(Copie esses dois endereços)*.

### Parte B: Na Hostinger (Onde está o seu domínio)
1. Entre no painel da **Hostinger**.
2. Vá em **Domínios** > Clique em `gloliverlobo.com`.
3. Procure por **Nameservers** (ou Servidores de Nome) no menu lateral ou central.
4. Clique no botão **Alterar Nameservers** (ou Change Nameservers).
5. Selecione a opção para usar **Nameservers personalizados**.
6. Apague os que estiverem lá e cole os dois que o Cloudflare te deu.
7. **Salve as alterações**.

### Parte C: Finalizar
1. Volte ao Cloudflare e clique em **Done, check nameservers**.
2. **Tempo de espera**: Pode levar de 15 minutos a algumas horas para a Hostinger avisar o mundo que agora o Cloudflare manda no domínio. 
3. Assim que estiver ativo (você receberá um email do Cloudflare), o seu site `gloliverlobo.com` já estará apontando automaticamente para as suas Pages!

---

### Dicas Úteis 🚨
- **RESOLVENDO O ERRO DE BUILD**: O erro que você está vendo (`Installing bun none`) acontece porque a variável `BUN_VERSION` está ativa.
  1. Vá no painel da Cloudflare (Settings > Functions > Environment Variables ou Settings > Environment Variables).
  2. **DELETE** (remova) a variável `BUN_VERSION`. Não mude o valor, apenas apague-a completamente.
  3. Salve e clique em **Retry deployment**.
- **Forçar NPM**: Ao remover o `bun.lockb` e manter apenas o `package-lock.json`, a Cloudflare usará automaticamente o NPM. Não é necessário configurar variáveis extras para isso.
- **SPA Redirects**: Já incluímos o arquivo `public/_redirects` no código para garantir que as rotas do React funcionem após o deploy.
- **Atualizações**: Sempre que você fizer um novo `push` para a branch `main2`, a Cloudflare fará o deploy automático das mudanças.
