# Protótipos das telas

Os quadros abaixo registram a organização das telas entregues. A implementação visual está em `frontend/src/pages` e `frontend/src/styles/global.css`.

## Totem público

```text
┌──────────────────────────────────────────────┐
│ nassauTickets                                │
│ Escolha o tipo de atendimento                │
│ [Prioritária SP] [Geral SG] [Exames SE]      │
│ Número emitido ou mensagem de erro           │
└──────────────────────────────────────────────┘
```

## Painel público

```text
┌──────────────────────────────────────────────┐
│ Senha chamada: 261118-SP001                  │
│ Guichê: 1                                    │
│ Últimas chamadas: até quatro anteriores      │
│ Aviso de falha e nova tentativa, se preciso  │
└──────────────────────────────────────────────┘
```

## Terminal do atendente

```text
┌──────────────────────────────────────────────┐
│ Fila SP / SG / SE                            │
│ Guichê [ 1 ]    Senha atual                  │
│ [Chamar] [Rechamar] [Iniciar]                │
│ [Finalizar] [Não compareceu]                 │
└──────────────────────────────────────────────┘
```

## Área do gestor

```text
┌──────────────────────────────────────────────┐
│ Filtros: datas, tipo, situação e guichê      │
│ Totais e gráficos do período                 │
│ Relatório detalhado e últimas chamadas      │
│ Usuários, redefinição de senha e ordem fila  │
└──────────────────────────────────────────────┘
```

Em telas estreitas, os blocos são reorganizados em coluna pelo CSS responsivo.
