# Paróquia App

Aplicativo desktop nativo construído com Tauri + React + TypeScript para apoiar a rotina de uma paróquia em três frentes principais:

- financeiro
- pastoral
- sacramental

O objetivo do sistema é funcionar como um programa instalável para macOS, Windows e Linux, oferecendo uma base única para cadastro, operação interna e acompanhamento das atividades paroquiais.

## Stack

- Frontend: React 19 + TypeScript + Vite
- Desktop shell: Tauri 2
- Estado local: Zustand
- Banco local: SQLite via plugin SQL do Tauri

## Scripts

- `npm run dev`: inicia o frontend em desenvolvimento
- `npm run build`: gera a build de produção do frontend
- `npm run tauri dev`: inicia o app desktop em desenvolvimento
- `cargo check` em `src-tauri`: valida o backend Rust

## Situação Atual

Nesta revisão, a estrutura foi alinhada para usar os módulos de autenticação, shell e banco de dados de forma consistente, eliminando arquivos vazios que impediam a compilação do frontend.
