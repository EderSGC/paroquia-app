# 🔄 Auto-Migração Universal de Schema

## 📋 Visão Geral

O sistema de **Auto-Migração Universal** foi implementado no arquivo `src/database.ts` para garantir que o banco de dados esteja sempre sincronizado com a estrutura esperada definida no código.

### ✨ Características Principais

- ✅ **Validação Automática**: Verifica a estrutura de todas as tabelas ao inicializar
- ✅ **Criação de Tabelas Faltantes**: Cria automaticamente tabelas que não existem
- ✅ **Adição de Colunas**: Adiciona automaticamente colunas ausentes em tabelas existentes
- ✅ **Schema Centralizado**: Todas as definições de tabelas estão em um único lugar (`EXPECTED_SCHEMA`)
- ✅ **Logs Detalhados**: Relatório completo de migração na inicialização
- ✅ **Sem Perda de Dados**: Nunca remove dados, apenas adiciona estrutura

---

## 📦 Estrutura do Schema Definido

O schema esperado inclui as seguintes tabelas:

### 1. **fieis**
Registro de fiéis da paróquia.
```
- id (PK)
- nome (obrigatório)
- dataNascimento
- data_nascimento
- telefone
- comunidade
- isDizimista (padrão: '0')
- pai_mae_responsavel
- sacramentos
```

### 2. **comunidades**
Comunidades e capelas associadas à paróquia.
```
- id (PK)
- nome (obrigatório)
- cnpj
- endereco
- coordenador_nome
- coordenador_tel
- tesoureiro_nome
- tesoureiro_tel
- secretario_nome
- secretario_tel
```

### 3. **usuarios**
Usuários com acesso ao sistema.
```
- id (PK)
- email
- senha
- nome
- nivel
```

### 4. **lancamentos**
Registros financeiros (dízimos, ofertas, despesas).
```
- id (PK)
- fiel_id (FK para fieis)
- categoria
- descricao
- valor
- metodo
- data
- tipo
- origem (padrão: 'PAROQUIA')
- created_at (padrão: CURRENT_TIMESTAMP)
```

### 5. **patrimonio_bens**
Inventário de bens patrimoniais.
```
- id (PK)
- nome (obrigatório)
- categoria
- localizacao
- comunidade_id
- data_aquisicao
- valor_estimado
- estado_conservacao
- foto_path
- documento_path
- observacoes
```

### 6. **patrimonio_manutencoes**
Histórico de manutenções dos bens.
```
- id (PK)
- bem_id (FK para patrimonio_bens)
- data_manutencao
- descricao
- prestador_servico
- valor_gasto
- observacoes
```

### 7. **familias**
Agrupamento de fiéis em núcleos familiares.
```
- id (PK)
- sobrenome (obrigatório)
- endereco
- comunidade
- recebe_caritas (padrão: 0)
- observacoes
```

### 8. **membros_familia**
Vínculos entre famílias e fiéis.
```
- id (PK)
- familia_id (FK para familias)
- fiel_id (FK para fieis)
- parentesco
- situacao_sacramental
- participacao_pastoral
```

### 9. **catequese_turmas**
Turmas de catequese.
```
- id (PK)
- nome (obrigatório)
- etapa
- ano
- comunidade
- horario
```

### 10. **catequese_matriculas**
Matrículas de fiéis em turmas de catequese.
```
- id (PK)
- fiel_id (FK para fieis)
- turma_id (FK para catequese_turmas)
- situacao
- docs_entregues
- frequencia
- observacoes
```

### 11. **catequistas**
Catequistas do programa.
```
- id (PK)
- nome
- telefone
- comunidade
- disponibilidade
```

### 12. **catequese_presencas**
Registro de presenças nas aulas de catequese.
```
- id (PK)
- matricula_id (FK para catequese_matriculas)
- data
- presente
- justificativa
```

---

## 🔧 Como Funciona

### 1️⃣ **Inicialização**
Quando a aplicação inicia e `getDb()` é chamado:

```typescript
const db = await getDb();
```

### 2️⃣ **Validação de Schema**
O sistema executa `validateAndSyncSchema()` que:

- Itera sobre cada tabela definida em `EXPECTED_SCHEMA`
- Verifica se a tabela existe no banco
- Se não existir → **Cria a tabela inteira**
- Se existir → Verifica **coluna por coluna**

### 3️⃣ **Adição de Colunas Ausentes**
Para cada coluna no schema esperado:

- Verifica se existe na tabela
- Se não existir → Executa `ALTER TABLE` para adicioná-la
- Se der erro → Registra um aviso (coluna pode já existir com nome ligeiramente diferente)

### 4️⃣ **Relatório de Migração**
Ao final, exibe um relatório detalhado:

```
============================================================
📊 RELATÓRIO DE MIGRAÇÃO DE SCHEMA
============================================================
✅ [CRIADA] Tabela 'fieis'
✅ [ATUALIZADA] Tabela 'lancamentos' - Colunas adicionadas: origem, created_at
✅ [OK] Tabela 'comunidades' - Nenhuma alteração necessária
============================================================
✅ Schema sincronizado com sucesso!
```

---

## 🚀 Usando o Sistema de Auto-Migração

### ✅ Adicionar Uma Nova Coluna

1. **Abra** `src/database.ts`
2. **Localize** a tabela em `EXPECTED_SCHEMA`
3. **Adicione** o novo campo ao array `columns`:

```typescript
{
  name: "nova_coluna",
  type: "TEXT",
  default: "'valor_padrao'"  // opcional
}
```

4. **Salve o arquivo** - Na próxima inicialização, a coluna será criada automaticamente!

### ✅ Criar Uma Nova Tabela

1. **Abra** `src/database.ts`
2. **Adicione** um novo objeto `TableSchema` ao array `EXPECTED_SCHEMA`:

```typescript
{
  name: "nova_tabela",
  columns: [
    { name: "id", type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
    { name: "campo1", type: "TEXT", notNull: true },
    { name: "campo2", type: "INTEGER", default: "0" }
  ]
}
```

3. **Salve o arquivo** - A tabela será criada na próxima inicialização!

---

## 🔍 Debugging e Logs

Os logs são exibidos no **console do aplicativo**. Para visualizá-los:

- **Desenvolvimento**: Abra o DevTools do Tauri (`Ctrl+Shift+I` ou `Cmd+Option+I`)
- **Produção**: Verifique os arquivos de log do Tauri

### Exemplo de Log Completo:

```
🔍 Iniciando validação e sincronização de schema...
✅ Tabela 'fieis' criada/verificada.
✅ Coluna 'isDizimista' adicionada à tabela 'fieis'
✅ Tabela 'comunidades' criada/verificada.
✅ Tabela 'usuarios' criada/verificada.
✅ Coluna 'nivel' adicionada à tabela 'usuarios'
✅ Tabela 'lancamentos' criada/verificada.
✅ Coluna 'origem' adicionada à tabela 'lancamentos'
...
============================================================
📊 RELATÓRIO DE MIGRAÇÃO DE SCHEMA
============================================================
✅ [CRIADA] Tabela 'fieis'
✅ [ATUALIZADA] Tabela 'usuarios' - Colunas adicionadas: nivel
✅ [OK] Tabela 'lancamentos' - Nenhuma alteração necessária
...
============================================================
✅ Schema sincronizado com sucesso!
```

---

## ⚠️ Limitações e Considerações

### SQLite ALTER TABLE Limitations

SQLite tem limitações em operações de ALTER TABLE:

- ✅ **Suportado**: Adicionar colunas novas
- ✅ **Suportado**: Renomear tabelas
- ❌ **NÃO Suportado**: Remover colunas (sem recriação)
- ❌ **NÃO Suportado**: Mudar tipo de dados de uma coluna existente

**Solução**: Se precisar modificar uma coluna existente:
1. Crie uma nova coluna com tipo diferente
2. Copie os dados com conversão
3. Deixe a coluna antiga (para compatibilidade)

### Exemplo - Adicionar Nova Coluna com Tipo Diferente:

```typescript
// Em EXPECTED_SCHEMA
{ name: "novo_campo_type", type: "INTEGER" }

// Depois, em um hook ou componente, se necessário converter:
await db.execute(`
  UPDATE tabela 
  SET novo_campo_type = CAST(campo_antigo AS INTEGER)
  WHERE novo_campo_type IS NULL
`);
```

---

## 🔐 Boas Práticas

### 1. **Sempre Defina Defaults Apropriados**
```typescript
{ name: "ativo", type: "INTEGER", default: "1" }
{ name: "data_criacao", type: "DATETIME", default: "CURRENT_TIMESTAMP" }
```

### 2. **Mantenha Nomes de Colunas Consistentes**
Prefira snake_case para novos campos:
- ✅ `data_nascimento`
- ✅ `coordenador_nome`
- ❌ `dataNascimento` (mistura estilos)

### 3. **Documente Novos Campos**
Quando adicionar à `EXPECTED_SCHEMA`, adicione um comentário:

```typescript
// Campo para rastrear alterações
{ name: "updated_at", type: "DATETIME", default: "CURRENT_TIMESTAMP" }
```

### 4. **Use Tipos Apropriados**
- `TEXT`: Textos, datas (como strings)
- `INTEGER`: Números inteiros, booleanos (0/1)
- `REAL`: Números decimais
- `DATETIME`: Timestamps

---

## 📞 Troubleshooting

### Problema: "Tabela já existe" ao inicializar

**Causa**: Arquivo `pastoral.db` antigo com schema incompleto.

**Solução**:
1. Feche a aplicação
2. Delete `pastoral.db` (se backup não for necessário)
3. Reinicie - banco será criado do zero com schema completo

### Problema: "Coluna já existe" com nome diferente

**Causa**: Mesma coluna com nomes ligeiramente diferentes (ex: `dataNascimento` e `data_nascimento`).

**Solução**:
1. Verifique qual nome está sendo usado nos módulos
2. Mantenha ambas em `EXPECTED_SCHEMA` por compatibilidade
3. Gradualmente migre o código para um único nome

### Problema: Migrations não são aplicadas

**Verificação**:
1. Abra DevTools do Tauri
2. Procure por "Schema sincronizado com sucesso!"
3. Se não houver, verifique erros no console
4. Reinicie a aplicação

---

## 📚 Referência Rápida

### Estrutura Completa de um Field

```typescript
{
  name: "nome_coluna",           // Nome exato da coluna no BD
  type: "TEXT",                  // Tipo de dados
  default: "'valor'",            // Valor padrão (opcional, com quotes se string)
  notNull: true                  // Requer NOT NULL (opcional)
}
```

### Tipos de Dados SQLite

- `INTEGER`: -2147483648 to 2147483647
- `REAL`: 8-byte IEEE floating point
- `TEXT`: UTF-8 text
- `BLOB`: Binary data
- `DATETIME`: Timestamps (TEXT format)
- `DATE`: ISO 8601 format (TEXT)

---

## ✅ Checklist de Implementação

- [x] Schema centralizado definido
- [x] Validação automática de tabelas
- [x] Adição automática de colunas
- [x] Relatório detalhado de migração
- [x] Tratamento de erros robusto
- [x] Documentação completa
- [ ] Testes de migration (próximas versões)
- [ ] Interface Web para gerenciar schema (futuro)

---

**Data de Implementação**: 21 de maio de 2026  
**Versão**: 1.0.0  
**Status**: ✅ Produção

