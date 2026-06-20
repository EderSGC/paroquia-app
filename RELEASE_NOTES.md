# Release Notes — v1.0.0

**Sistema de Gestão Paroquial**
Data de lançamento: 12 de junho de 2025

---

## O que há de novo nesta versão

### Sistema completo e pronto para uso

Esta é a primeira versão estável do Sistema de Gestão Paroquial, com todos os
módulos funcionais e preparada para distribuição em ambientes de produção.

### Destaques

#### 💾 Backup e Restauração
O sistema agora possui backup profissional com:
- Nomenclatura automática por data e hora
- Escolha da pasta de destino
- Restauração com substituição segura do banco atual
- Rastreamento do último backup realizado
- Atalho `Cmd+Shift+B` (macOS) para backup rápido pelo menu

#### 🔍 Auditoria
Rastreie todas as operações realizadas no sistema:
- Registro automático de inclusões, alterações e exclusões
- Filtros por usuário, módulo e período
- Visível somente para o Pároco

#### ⛪ Tela Sobre
Menu **Paróquia > Sobre** ou **Ajuda > Sobre** exibe informações da versão,
plataforma e copyright do sistema.

#### 📋 Configurações reorganizadas
A tela de configurações foi reorganizada em abas para facilitar a navegação:
- **Identidade** — dados da paróquia e logos
- **Backup** — backup e restauração
- **Partilha** — distribuição percentual (somente Pároco)
- **Usuários** — gestão de acessos (somente Pároco)
- **Auditoria** — histórico de operações (somente Pároco)

---

## Requisitos do sistema

| Plataforma | Requisito mínimo |
|---|---|
| Windows | Windows 10 (64-bit) |
| macOS | macOS 10.15 Catalina |
| Linux | Ubuntu 20.04 / distribuição equivalente |

---

## Arquivos de instalação

| Plataforma | Arquivo |
|---|---|
| Windows (instalador) | `Sistema-de-Gestao-Paroquial_1.0.0_x64-setup.exe` |
| Windows (MSI) | `Sistema-de-Gestao-Paroquial_1.0.0_x64_pt-BR.msi` |
| macOS | `Sistema-de-Gestao-Paroquial_1.0.0_x64.dmg` |
| Linux | `Sistema-de-Gestao-Paroquial_1.0.0_amd64.AppImage` |

Para gerar os instaladores: `npm run tauri build`

---

## Notas de atualização

Esta versão **cria automaticamente** a tabela `auditoria` no banco de dados
existente na primeira execução. Nenhum dado existente é removido.

---

## Suporte

Em caso de problemas, verifique:
1. O banco de dados está acessível (não corrompido)
2. Faça um backup antes de qualquer atualização
3. Permissões de escrita na pasta de dados do aplicativo
