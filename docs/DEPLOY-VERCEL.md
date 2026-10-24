# Deploy na Vercel

O app fica em `app/`, mas o deploy parte da raiz.

## Configuração

O `vercel.json` da raiz é a configuração canônica:

- **Root Directory:** vazio;
- **Production Branch:** `main`;
- **instalação:** `npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile`;
- **build:** `npx --yes pnpm@10.28.0 --dir app build`;
- **saída:** `app/dist`;
- **funções:** wrappers em `api/accessibility/`, que compartilham os handlers de `app/server/accessibility/`;
- **rewrite SPA:** exclui `/api/` e envia o resto a `/index.html`.

Três arquivos da raiz sustentam as funções. Se algum deles faltar, elas quebram em produção:

| Arquivo | Por quê |
| --- | --- |
| `package.json` | declara `"type": "module"`; sem ele, a saída carrega como CommonJS e o `import` falha na carga (`FUNCTION_INVOCATION_FAILED` / `ERR_REQUIRE_ESM`) |
| `tsconfig.json` | compila `api/` com resolução `Bundler` e tipos de `app/node_modules`, para a Vercel não aplicar `NodeNext` aos imports internos |
| `.vercelignore` | começa com `*` e re-inclui só o necessário. **Preserve `!package.json` e `!tsconfig.json`**: foi a falta do primeiro que derrubou as funções até 19/09/2026 |

A versão do pnpm está fixada porque um comando de instalação sem versão explícita pode levar a Vercel a escolher um pnpm antigo e descartar o lockfile.

## Variáveis de ambiente

Nenhuma é necessária para a jornada nem para os controles locais. Configure em **Settings > Environment Variables**, só no projeto e nos ambientes necessários:

```text
# Gemini
ACCESSIBILITY_LLM_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
ACCESSIBILITY_LLM_MODEL=<modelo>
ACCESSIBILITY_LLM_API_KEY=<segredo>

# opcionais
ACCESSIBILITY_ALLOWED_ORIGINS=<origens extras, quando um proxy confiável muda a origem>
ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE=12
ACCESSIBILITY_LLM_REQUESTS_PER_DAY=200

# Rybená — somente no projeto que atende o domínio autorizado
RYBENA_ACCESS_TOKEN=<credencial temporária>
```

- **Segredos:**
  - nunca use o prefixo `VITE_`;
  - nunca grave os valores em `.env*`, código, documentação, comandos compartilhados ou logs;
  - remova ou rotacione o token da Rybená quando ele expirar.
- **Modelo:** prefira um identificador estável para a apresentação. Aliases como `gemini-flash-latest` mudam com o tempo. A disponibilidade varia muito entre modelos; veja a medição em [VALIDACAO.md](VALIDACAO.md).
- **Origens:** `ACCESSIBILITY_ALLOWED_ORIGINS` só valida a origem; não habilita CORS nem preflight. Mantenha frontend e API na mesma origem.
- **Antes de expor publicamente:** configure quota, budget e alerta de cobrança no projeto Google, além de rate limit persistente ou WAF na Vercel. A quota do handler é por instância e serve só como defesa em profundidade.

## Smoke depois do deploy

Registre o resultado em [VALIDACAO.md](VALIDACAO.md), sem conteúdo pessoal e **sem a URL tokenizada da Rybená**: não salve HAR nem capturas de rede que a contenham.

1. `GET` nas rotas de IA devolve `405 application/json`, nunca `index.html` nem `X-Vercel-Error`.
2. `POST` sem `Origin` devolve `403`; `text/plain` devolve `415`; corpo acima de 16 KiB devolve `413`.
3. Com as variáveis do Gemini, um pedido fictício válido devolve um plano no contrato 2.2, sem ação comercial.
4. Sem as variáveis, a rota devolve `503` finito.
5. `GET /api/accessibility/rybena` no domínio autorizado devolve `200` com a URL do CDN, e nenhuma requisição à Rybená ocorre antes do clique.
6. Logs e bundle não contêm chave, token, prompt nem resposta bruta.

Funcionamento técnico da Rybená não é homologação linguística.

## Projetos Vercel

Há dois projetos ligados ao mesmo repositório: `mvp-site-acessibilidade-clickbus` e `mvp-site-acessibilidade-clickbus-5xk5`. Um push pode disparar dois previews. Não exclua nem desconecte nenhum deles antes de decidir qual é o canônico.

## Problemas conhecidos

**`404: NOT_FOUND`.** A página é da própria Vercel: o endereço não está ligado a um deployment ativo. Confira:

1. em **Deployments**, se o último está **Ready**;
2. se você abriu o endereço pelo botão **Visit**, e não uma URL antiga;
3. em **Settings > Domains**, se o domínio está ligado a este projeto;
4. em **Settings > Git**, se a Production Branch é `main`.

Se o painel tiver **Root Directory = `app`**, limpe o campo e use o `vercel.json` da raiz. Não misture as duas configurações: os caminhos acabam duplicados (`app/app`).

**`Ignoring not compatible lockfile`.** Confirme que o deployment usa o `vercel.json` atual, cujo `installCommand` começa com `npx --yes pnpm@10.28.0`.

**`FUNCTION_INVOCATION_FAILED`.** Confira o `.vercelignore` e o `"type": "module"` do `package.json` da raiz (veja a tabela acima). Antes de declarar um deploy saudável, consulte os logs da Vercel.
