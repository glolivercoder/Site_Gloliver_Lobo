# Planejamento de Deploy Free Tier (Sem PocketBase)

Como você optou por remover o PocketBase para facilitar o deploy em Free Tiers (Vercel/Netlify), aqui está a melhor estratégia para manter as funcionalidades de administração (músicas, fotos, fãs) de forma gratuita e simples.

## 1. Domínio Próprio (`gloliverlobo.com`)
**Todos** os grandes Free Tiers permitem o uso de domínio próprio gratuitamente:
- **Vercel**: Permite configurar seu domínio de forma simples com certificado SSL automático.
- **Netlify**: Também permite, com excelente gestão de DNS.
- **Cloudflare Pages**: Integrado ao Cloudflare, é possivelmente a melhor opção para performance e segurança do domínio.

## 2. O Problema do Supabase "Pausar"
Sim, o Supabase pausa projetos inativos após 1 semana no plano grátis. Para evitar isso, temos duas soluções simples:

### Solução A: Cron Job / Ping Externo (Fácil)
Podemos configurar um serviço grátis de "Uptime" (como **Cron-job.org** ou **GitHub Actions**) para fazer uma requisição simples ao banco de dados uma vez por dia. Isso conta como atividade e **impede que o banco seja pausado**.

### Solução B: Alternativa Turso + Cloudflare R2
Se preferir evitar o Supabase, podemos usar o **Turso** (SQLite na nuvem). 
- **Turso**: Não "pausa" o banco da mesma forma, mas tem limites de requisições.
- **Cloudflare R2**: Usaríamos para guardar as fotos e vídeos (10GB grátis).
- **Vantagem**: Menos chance de hibernação.

## 3. Recomendação Refinada (`gloliverlobo.com`)

| Hosting | Banco de Dados | Arquivos (Mídia) | Conclusão |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | **Supabase** | **Supabase Storage** | **RECOMENDADO**: Banda ilimitada e alta performance para o seu domínio. |
| **Vercel** | **Supabase** | **Supabase Storage** | Ótima UX, mas tem limites de largura de banda no free tier. |

## 4. Onde configurar o domínio `gloliverlobo.com`?

A configuração do domínio é feita em **duas etapas** após o primeiro deploy do site:

### Passo 1: No Painel do Hosting (Ex: Vercel ou Netlify)
1. Vá em **Settings** > **Domains**.
2. Clique em **Add** e digite `gloliverlobo.com`.
3. O painel vai te mostrar os registros de DNS (tipo A, CNAME ou Nameservers) que você precisa copiar.

### Passo 2: No seu Registrador de Domínio (Onde você comprou o domínio)
1. Entre no painel do seu domínio (Registro.br, GoDaddy, HostGator, etc).
2. Vá na seção de **Configuração de DNS**.
3. Aponte os registros para os valores que a Vercel/Netlify te forneceu no Passo 1.

---

### Próximos Passos:
1. **Ativar o Supabase**: Cole a chave Anon no arquivo `.env.local`.
2. **Deploy inicial**: Subiremos o site para a Vercel/Netlify usando um link temporário.
3. **Conectar o Domínio**: Assim que o site estiver no ar, faremos o Passo 1 e 2 acima.

---

### Próximos Passos Sugeridos:
1. Definir se deseja continuar com PocketBase ou migrar para algo nativo da Vercel/Netlify (como Supabase).
2. Se continuar com PocketBase, criar conta no Pockethost.io.
3. Atualizar a URL no arquivo `src/lib/pocketbase.ts` para apontar para o novo servidor.
