# Modelo de dados

Os scripts oficiais para criar as tabelas são `001_senhas_fila.sql` e `002_autenticacao.sql`, nesta pasta. Execute os dois no banco informado por `DB_NAME`.

```mermaid
erDiagram
    ATENDENTES ||--o{ SESSOES_ATENDENTES : possui
    ATENDENTES {
        int id PK
        string login UK
        string nome
        string senha_hash
        string perfil
        boolean ativo
    }
    SESSOES_ATENDENTES {
        string token_hash PK
        int atendente_id FK
        datetime criada_em
        datetime expira_em
    }
    SENHAS {
        string numero PK
        string data_emissao
        string tipo
        int sequencia
        string status
        int guiche
        string atendente
        int chamadas
        datetime emitida_em
        datetime primeira_chamada_em
        datetime segunda_chamada_em
        datetime inicio_atendimento_em
        datetime finalizacao_em
        int ordem_chamada
    }
    ESTADO_FILA {
        int id PK
        boolean ultima_foi_sp
        string proximo_nao_sp
        int ordem_chamada
    }
```

`SENHAS.atendente` registra o nome do atendente no momento da chamada. Não há chave estrangeira entre essa coluna e `ATENDENTES`; a sessão identifica o usuário que executa a chamada.
