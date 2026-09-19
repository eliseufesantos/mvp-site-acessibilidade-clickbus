# Deploy na Vercel

O código da aplicação está na subpasta `app/`. O arquivo `vercel.json` na raiz informa à Vercel como instalar as dependências, executar o build e publicar `app/dist`.

## Configuração recomendada

Ao importar o repositório na Vercel:

- mantenha **Root Directory** vazio, apontando para a raiz do repositório;
- use a branch `main` como **Production Branch**;
- deixe os comandos do projeto serem lidos do `vercel.json`;
- não são necessárias variáveis para a jornada fictícia nem para os controles locais; Gemini e Rybená reais só são ativados quando suas variáveis de servidor abaixo existem.

O build configurado equivale a:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app build
```

A versão do pnpm está fixada porque comandos de instalação personalizados sem uma versão explícita podem fazer a Vercel selecionar um pnpm antigo. O lockfile deste projeto usa o formato 9, compatível com pnpm 9 e 10.

A saída publicada é `app/dist`. As funções Vercel canônicas ficam em `api/accessibility/` na raiz e compartilham os handlers de `app/server/accessibility/`. A regra de `rewrites` exclui `/api/` e direciona somente as demais URLs para `index.html`.

## Rybená sob demanda

Um token temporário vinculado ao domínio autorizado da demonstração foi recebido fora do repositório. A implementação usa somente esta variável no servidor:

```text
RYBENA_ACCESS_TOKEN=<credencial temporária>
```

Configure-a em **Settings > Environment Variables** apenas no projeto Vercel que atende `mvp-site-acessibilidade-clickbus-lovat.vercel.app` e somente no ambiente necessário. O handler aceita exclusivamente HTTPS nesse hostname exato; localhost, domínios padrão dos projetos, aliases e previews são recusados. Não use prefixo `VITE_`, não grave o valor em `.env*`, código, documentação, comandos compartilhados ou logs. Remova ou rotacione a variável quando a credencial expirar.

O frontend não lê a variável. Após a pessoa solicitar uma tradução, o loader chama `GET /api/accessibility/rybena`; a função valida `RYBENA_ACCESS_TOKEN` e responde `no-store`, `Cross-Origin-Resource-Policy: same-origin` e `nosniff` com a URL fixa do CDN contendo `token`, `mode=api` e `doNotTrack=true`. Sem configuração válida, retorna `503`; método diferente de `GET` retorna `405`. O fetch expira em 10 s. Download do script, preparação e espera do runtime expiram em 15 s por etapa; erro, timeout ou tag sem os globals esperados removem a tag para permitir nova tentativa manual, sem retry automático.

O protocolo do fornecedor torna a URL tokenizada observável na rede do navegador após a ação explícita. Por isso, não salve HAR, prints de rede ou logs com a URL completa; a proteção operacional depende do vínculo ao domínio e da validade curta, não de sigilo no navegador. `127.0.0.1` pode continuar não autorizado.

Estado atual: handler, URL e contrato do adaptador com runtime falso passaram localmente; a rota sem token teve smoke `503`/`405`. Fetch no navegador, injeção da tag, download do CDN, globals, preparação e player permanecem `NOT RUN`, assim como configuração de `RYBENA_ACCESS_TOKEN` na Vercel, deploy e smoke no domínio autorizado. Após o deploy, registre sem expor a URL:

1. nenhuma requisição à Rybená ocorre antes da ação explícita;
2. sem a variável, o endpoint retorna JSON `503` com `cache-control: no-store`;
3. com a variável e no hostname exato, exercite fetch, injeção, download e preparação; o runtime/player deve ficar disponível ou a falha finita deve ser informada sem quebrar o núcleo;
4. tradução de um alvo público e controles de abrir/fechar, pausa, retomada, parada e velocidade refletem o estado real;
5. nenhuma credencial aparece no repositório, bundle estático, logs ou evidências;
6. funcionamento técnico não é apresentado como homologação linguística; a avaliação com pessoas surdas sinalizantes permanece pendente.

## Gemini no servidor

Escolha primeiro qual dos dois projetos Vercel ligados ao repositório é o canônico. Depois, em **Settings > Environment Variables**, configure no projeto escolhido e somente nos ambientes necessários:

```text
ACCESSIBILITY_LLM_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
ACCESSIBILITY_LLM_MODEL=gemini-flash-latest
ACCESSIBILITY_LLM_API_KEY=<segredo>
```

Não use prefixo `VITE_`, não grave a chave em arquivo do projeto e não cole o valor em logs ou comandos versionados. O alias `gemini-flash-latest` muda ao longo do tempo; depois de confirmar os modelos disponíveis na conta, prefira um identificador estável para uma apresentação reproduzível.

Controles opcionais do handler:

```text
ACCESSIBILITY_ALLOWED_ORIGINS=https://dominio-da-apresentacao.example
ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE=12
ACCESSIBILITY_LLM_REQUESTS_PER_DAY=200
```

Same-origin já é aceito sem allowlist adicional. Os contadores são por instância aquecida e servem apenas como defesa em profundidade. Antes de liberar um deployment público, configure também quota/budget e alerta de cobrança no projeto Google, além de rate limit persistente ou WAF na Vercel. Restrinja a chave à Gemini API quando esse controle estiver disponível para o tipo de chave usado.

`ACCESSIBILITY_ALLOWED_ORIGINS` serve apenas para validar a origem através de um proxy confiável quando ela diverge da URL interna recebida pela função. Ela não adiciona cabeçalhos CORS nem responde a preflight; mantenha frontend e API same-origin neste MVP.

Após o deployment, faça um smoke controlado e registre separadamente:

1. um `POST /api/accessibility/plan` same-origin, com `Content-Type: application/json` e corpo válido, retorna JSON `503` sem variáveis, nunca `index.html`;
2. com as variáveis, um pedido fictício válido retorna contrato `2.0` e nenhuma ação comercial;
3. origem indevida retorna `403`, corpo acima de 16 KiB retorna `413` e excesso retorna `429` sem nova chamada ao provedor;
4. logs e bundle não contêm chave, prompt ou resposta bruta;
5. modelo efetivo, data, latência, tokens e resultado ficam na matriz de validação, sem registrar conteúdo pessoal.

## Se aparecer `404: NOT_FOUND`

Essa página é gerada pela própria Vercel e indica que o endereço acessado não está associado a um deployment ativo. Verifique no painel:

1. Abra **Deployments** e confirme que o último deployment está com estado **Ready**.
2. Abra o deployment pela opção **Visit**; não reutilize uma URL antiga copiada de outro projeto ou deployment removido.
3. Em **Settings > Domains**, confirme que o domínio está vinculado a este projeto.
4. Em **Settings > Git**, confirme que a **Production Branch** é `main`.
5. Faça um novo deployment após enviar a configuração deste repositório para `main`.

Se o painel tiver sido configurado anteriormente com **Root Directory = app**, há duas opções válidas:

- recomendada: limpe o campo e use o `vercel.json` da raiz;
- alternativa: mantenha `app` como raiz e configure manualmente `Build Command = pnpm build` e `Output Directory = dist`.

Não misture as duas configurações, pois os caminhos podem ser duplicados (`app/app`).

## Se aparecer `Ignoring not compatible lockfile`

Confirme que o deployment está usando o `vercel.json` atual, cujo `installCommand` começa com `npx --yes pnpm@10.28.0`. A versão explícita evita que a Vercel descarte `app/pnpm-lock.yaml` e falhe com `Headless installation requires a pnpm-lock.yaml file`.

## Validação local

Antes do deploy:

```bash
pnpm --dir app typecheck
pnpm --dir app build
```

Após o deploy, valide busca, seleção de viagem, assento, checkout e os modos de alto contraste e idoso no endereço aberto pelo botão **Visit**. Quando `RYBENA_ACCESS_TOKEN` estiver configurada, execute também o smoke controlado acima no domínio autorizado, sem capturar a URL tokenizada.
