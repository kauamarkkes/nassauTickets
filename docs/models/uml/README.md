# Fluxo e estados da senha

```mermaid
stateDiagram-v2
    [*] --> AGUARDANDO: emissão
    AGUARDANDO --> CHAMADA: chamar próxima
    CHAMADA --> CHAMADA_NOVAMENTE: chamar novamente
    CHAMADA --> EM_ATENDIMENTO: iniciar
    CHAMADA_NOVAMENTE --> EM_ATENDIMENTO: iniciar
    CHAMADA_NOVAMENTE --> NÃO_COMPARECEU: ausência
    EM_ATENDIMENTO --> ATENDIDA: finalizar
```

O esquema também admite o estado `EMITIDA`, mas a emissão atual grava diretamente `AGUARDANDO`. O painel consulta chamadas concluídas ou ativas pela ordem de chamada e não calcula a próxima senha.
