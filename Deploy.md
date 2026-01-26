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

## Passo 6: Configurar o Domínio Próprio (`gloliverlobo.com`)
1. No painel do seu projeto na Cloudflare Pages, vá na aba **Custom domains**.
2. Clique em **Set up a custom domain**.
3. Digite `gloliverlobo.com` e clique em **Continue**.
4. Se o seu domínio já está na Cloudflare, ele vai configurar o DNS automaticamente. Se não estiver, ele te dará os registros CNAME para você colar no seu provedor de domínio.

---

### Dicas Úteis
- **Erro de Lockfile**: Se o build falhar dizendo algo sobre `bun.lockb` ou `frozen lockfile`, eu já removi esse arquivo do código. Certifique-se de que NÃO existe a variável `BUN_VERSION` configurada no painel da Cloudflare (ou remova-a se você a adicionou).
- **Forçar NPM**: Ao remover o `bun.lockb` e manter apenas o `package-lock.json`, a Cloudflare usará automaticamente o NPM. Não é necessário configurar variáveis extras para isso.
- **SPA Redirects**: Já incluímos o arquivo `public/_redirects` no código para garantir que as rotas do React funcionem após o deploy.
- **Atualizações**: Sempre que você fizer um novo `push` para a branch `main2`, a Cloudflare fará o deploy automático das mudanças.
