# Fluxo e dados

## Jornada

| Etapa | Ação | Resultado |
|---|---|---|
| Busca | informar origem, destino e data | lista de viagens |
| Viagem | filtrar e escolher opção | mapa de assentos |
| Assento | escolher lugar livre | dados do passageiro |
| Passageiro | preencher e aceitar aviso | confirmação simulada |

## Dados fictícios

As viagens ficam em `app/src/data/trips.ts`. O cenário principal usa:

- São Paulo (SP) → Rio de Janeiro (RJ);
- Expresso do Sul;
- saída às 22:30;
- classe Leito-cama;
- assento 54;
- total de R$ 129,90.

## Regras implementadas

- origem e destino não podem ser iguais;
- os filtros atualizam a lista imediatamente;
- assentos ocupados são desabilitados;
- o botão “Continuar” só habilita depois da escolha;
- nome deve ter pelo menos três caracteres;
- CPF fictício deve conter 11 números;
- nascimento deve usar `DD/MM/AAAA`;
- o aviso acadêmico deve ser confirmado.

O formulário não envia dados. O clique final apenas muda o estado local para a tela de confirmação.

