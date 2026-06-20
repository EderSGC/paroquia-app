# Changelog — Sistema de Gestão Paroquial

Todas as alterações relevantes deste projeto estão documentadas neste arquivo.
Segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2025-06-12

### Adicionado

#### Módulos funcionais completos
- **Fiéis** — Cadastro, busca e gestão de fiéis com vínculo familiar e sacramental
- **Comunidades** — Cadastro de comunidades com coordenadores e tesoureiros
- **Famílias** — Cadastro de famílias com membros e situação pastoral
- **Grupos e Pastorais** — Gestão de grupos e movimentos paroquiais
- **Catequese** — Turmas, catequistas, matrículas, presenças e fichas de inscrição
- **Sacramentos** — Batismo, Crisma, Primeira Eucaristia, Matrimônio, Unção dos Enfermos, Óbitos e Exéquias
- **Financeiro** — Receitas, despesas, dízimos, caixas/contas e distribuição de partilha
- **Patrimônio** — Inventário de bens e histórico de manutenções
- **Agenda** — Reuniões, visitas, formações, reservas de espaço, eventos paroquiais, programa de missas e escala de ministros
- **Documentos** — Atas, cartas, memorandos, ofícios, autorizações, contratos, recibos, relatórios pastorais e fichas

#### Segurança e confiabilidade
- Sistema de **Backup** com nomenclatura automática `paroquia-backup-AAAA-MM-DD-HHMM.db`
- **Restauração de backup** com confirmação e reinício automático
- Rastreamento da data e local do último backup
- Atalho de teclado `Cmd+Shift+B` para backup rápido
- **Auditoria** completa com tabela `auditoria` — registra inclusões, alterações e exclusões
- Página de auditoria com filtros por usuário, módulo e período
- **Controle de usuários** com perfis: Pároco, Vigário, Secretária(o), Membro de Comunidade
- Proteção de rotas por perfil de acesso
- Sessão persistente com hash de senha seguro

#### Interface
- **Tela Sobre** com informações do sistema (versão, plataforma, copyright)
- Sistema de **abas** na tela de Configurações: Identidade, Backup, Partilha, Usuários, Auditoria
- Preview em tempo real dos documentos com seletor de fonte
- Impressão otimizada para A4 com cabeçalho institucional
- Modal de pré-visualização para documentos da Agenda
- Formulário + lista sempre visíveis em todos os módulos não-Agenda

#### Distribuição
- `tauri.conf.json` atualizado com metadados comerciais
- Suporte a build para Windows (.msi, .exe), macOS (.dmg) e Linux (.AppImage)
- Identificador oficial: `com.paroquia.sistema.gestao`
- Versão oficial: `1.0.0`

### Banco de dados
- 22 tabelas SQLite (adicionada: `auditoria`)
- Migrações automáticas sem perda de dados existentes

---

## [0.1.0] — 2025 (versão de desenvolvimento)

### Adicionado
- Estrutura inicial do projeto Tauri + React + TypeScript
- Módulos básicos: Fiéis, Catequese, Sacramentos, Financeiro
- Sistema de autenticação com login/logout
- Banco SQLite local com auto-migração
