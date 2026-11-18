# Fluxo e estados da senha

```mermaid
stateDiagram-v2
    [*] --> AGUARDANDO: emissão
    AGUARDANDO --> CHAMADA: chamar próxima
    AGUARDANDO --> ENCERRADA: fim do expediente
    CHAMADA --> CHAMADA_NOVAMENTE: chamar novamente
    CHAMADA --> EM_ATENDIMENTO: iniciar
    CHAMADA_NOVAMENTE --> EM_ATENDIMENTO: iniciar
    CHAMADA_NOVAMENTE --> NÃO_COMPARECEU: ausência
    EM_ATENDIMENTO --> ATENDIDA: finalizar
```

O esquema também admite o estado `EMITIDA`, mas a emissão atual grava diretamente `AGUARDANDO`. Senhas pendentes de dias anteriores ou do dia atual depois das 17h são encerradas sem contar como atendidas. O painel consulta chamadas concluídas ou ativas pela ordem de chamada e não calcula a próxima senha.

## Atores e casos de uso

```mermaid
flowchart LR
    Cliente --> Emitir[Emitir senha SP, SG ou SE]
    Cliente --> Painel[Consultar painel]
    Atendente --> Login[Entrar e sair]
    Atendente --> Chamar[Chamar e rechamar]
    Atendente --> Atendimento[Iniciar e finalizar atendimento]
    Atendente --> Ausencia[Registrar não comparecimento]
    Gestor --> Login
    Gestor --> Relatorio[Consultar resumo e relatório]
    Gestor --> Usuarios[Gerenciar usuários]
    Gestor --> Fila[Escolher preferência SE ou SG]
```
