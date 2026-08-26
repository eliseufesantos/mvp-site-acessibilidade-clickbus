# Deploy na Vercel

O código da aplicação está na subpasta `app/`. O arquivo `vercel.json` na raiz informa à Vercel como instalar as dependências, executar o build e publicar `app/dist`.

## Configuração recomendada

Ao importar o repositório na Vercel:

- mantenha **Root Directory** vazio, apontando para a raiz do repositório;
- use a branch `main` como **Production Branch**;
- deixe os comandos do projeto serem lidos do `vercel.json`;
- não são necessárias variáveis de ambiente para este MVP.

O build configurado equivale a:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app build
```

A versão do pnpm está fixada porque comandos de instalação personalizados sem uma versão explícita podem fazer a Vercel selecionar um pnpm antigo. O lockfile deste projeto usa o formato 9, compatível com pnpm 9 e 10.

A saída publicada é `app/dist`. A regra de `rewrites` direciona URLs da aplicação para `index.html`, permitindo que a SPA seja carregada ao acessar ou atualizar uma rota.

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

Após o deploy, valide busca, seleção de viagem, assento, checkout e os modos de alto contraste e idoso no endereço aberto pelo botão **Visit**.
