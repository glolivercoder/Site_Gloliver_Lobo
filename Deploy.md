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

---

## 🛠️ Corrigindo o redirecionamento para Localhost
Se o site te levar para `localhost:3000` ou para um endereço estranho (como `supabase.co/site...`) após o login, verifique:

1. No **Supabase Dashboard**, vá em **Authentication** > **URL Configuration**.
2. No campo **Site URL**, coloque o endereço LIMPO do seu site (Sem asteriscos `/**`).
   - ✅ CORRETO: `https://sitegloliverlobo.pages.dev`
   - ❌ ERRADO: `https://sitegloliverlobo.pages.dev/**`
3. No campo **Redirect URIs**, aí sim você coloca a versão com asteriscos:
   - `https://sitegloliverlobo.pages.dev/**`
   - `https://www.gloliverlobo.com/**`
4. Clique em **Save**.

---

## ⏰ Mantendo o Supabase "Acordado" (Cron-job.org)
No plano gratuito, o Supabase entra em "pausa" após 1 semana sem uso. Use o **Cron-job.org** para evitar isso:

1. Crie uma conta no [Cron-job.org](https://cron-job.org/).
2. Clique em **Create Cronjob**.
3. **Title**: `Ping Supabase Gloliver`
4. **URL**: `https://trgvxjbazxripssubgit.supabase.co/rest/v1/profiles?select=id&limit=1`
5. **Execution schedule**: A cada **2 dias** (ou diariamente).
6. **Advanced Settings (Headers)**: Clique em "Add header" e adicione estes dois:
   - `apikey`: (Sua VITE_SUPABASE_ANON_KEY)
   - `Authorization`: `Bearer (Sua VITE_SUPABASE_ANON_KEY)`
7. Clique em **Create**.

*Isso fará uma pequena consulta automática ao seu banco de dados, mantendo-o sempre ativo e pronto para os fãs!*

---

## 🔵 Configurando o Login com Facebook
Para o Facebook funcionar no Supabase, os passos são parecidos com o Google:

1. Acesse o [Meta for Developers](https://developers.facebook.com/).
2. Crie um novo App do tipo **"Permitir que as pessoas façam login com a conta do Facebook"**.
4. Dentro de **Facebook Login** > **Configurações**, procure o campo **"URIs de redirecionamento do OAuth válidos"** (Fica logo no início) e adicione:
   - `https://trgvxjbazxripssubgit.supabase.co/auth/v1/callback`
5. **Acesso Avançado (Obrigatório)**:
   - No menu lateral, vá em **Análise do app** > **Permissões e recursos**.
   - Procure por `public_profile` e clique em **Get Advanced Access** (Obter acesso avançado).
   - Faça o mesmo para a permissão `email`.
6. Vá em **Configurações > Básico** para configurar os Domínios e pegar o **App ID**.
6. No **Supabase Dashboard**, vá em **Authentication > Providers > Facebook** e cole os códigos.

### ⚠️ Resolvendo domínios que desaparecem:
Se você salvar e os domínios sumirem do campo **"Domínios do aplicativo"**, é porque falta configurar a Plataforma:
1. No final da mesma página (**Configurações > Básico**), clique em **"+ Adicionar plataforma"**.
2. Selecione **Site**.
3. No campo **URL do site**, coloque `https://site-gloliver-lobo.pages.dev` (⚠️ Verifique se o seu tem o hífen `-` ou não).
4. Agora sim, clique em **Salvar Alterações** no final da página.

### 🚩 Erro "OAuth state parameter missing":
Se você logar e o site voltar com esse erro na URL, significa que o endereço onde você começou o login é diferente do endereço para onde o site voltou.
- **A Solução**: Escolha APENAS UM endereço para o seu site (ou o com hífen ou o sem hífen).
- No **Supabase**, no **Google Console** e no **Meta for Developers**, use sempre o mesmo.
- Se o seu site termina em `sitegloliverlobo.pages.dev` (sem hífen), use esse em todos os lugares.
- Se você já tem o domínio `gloliverlobo.com` ativo, use ele em todos os lugares.

### 🚩 Erro "Domínio não incluído" (O Hífen):
No seu último erro, a URL estava sem hífen (`sitegloliverlobo`), mas na sua configuração você colocou com hífen (`site-gloliver-lobo`).
- Verifique qual é o endereço **real** que aparece na barra do seu navegador quando você abre o site.
- Se o seu site for `site-gloliver-lobo.pages.dev`, ele deve ter o hífen em **TODOS** os lugares (Supabase, Cloudflare e Meta).

### Sobre o "Portfólio de Empresa":
- **Não é obrigatório para começar**. Você pode criar o App como um desenvolvedor individual.
- A Meta só exige o "Portfólio de Empresa" e a **Verificação de Empresa** se o seu site pedir dados sensíveis (como lista de amigos ou postar no mural).
- Para um Login simples (Nome e E-mail), você pode seguir como **Individual**.
- **Importante**: Enquanto o App estiver em modo "Desenvolvimento", só você poderá logar. Para o público usar, você precisará mudar para modo **"Ao vivo" (Live)** no topo do painel da Meta.
