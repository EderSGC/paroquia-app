use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};
use font_kit::source::SystemSource;
use font_kit::family_name::FamilyName;
use font_kit::properties::{Properties, Weight};
use font_kit::handle::Handle;

#[tauri::command]
fn navegar(window: tauri::Window, modulo: String) {
    let _ = window.emit("navegar", modulo);
}

#[tauri::command]
fn buscar_fontes_sistema() -> Vec<String> {
    let source = SystemSource::new();
    if let Ok(fonts) = source.all_families() {
        let mut lista = fonts;
        lista.sort();
        lista
    } else {
        vec!["Arial".into(), "Times New Roman".into(), "Courier New".into()]
    }
}

#[tauri::command]
fn imprimir_pdf(pdf_bytes: Vec<u8>, nome_arquivo: String) -> Result<String, String> {
    let raw_nome = if nome_arquivo.is_empty() { "documento.pdf".to_string() } else { nome_arquivo };
    let nome = std::path::Path::new(&raw_nome).file_name().unwrap_or_default().to_string_lossy().to_string();
    let tmp = std::env::temp_dir().join(&nome);
    std::fs::write(&tmp, &pdf_bytes).map_err(|e| format!("Erro ao criar arquivo temporário: {}", e))?;
    let caminho_str = tmp.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-a").arg("Preview")
            .arg(&caminho_str)
            .spawn()
            .map_err(|e| format!("Erro ao abrir Preview: {}", e))?;

        let caminho_clone = caminho_str.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_secs(2));
            let script = format!(
                r#"tell application "Preview"
    activate
    delay 0.5
    tell application "System Events"
        keystroke "p" using command down
    end tell
end tell"#
            );
            let _ = std::process::Command::new("osascript")
                .arg("-e").arg(&script)
                .output();
            let _ = caminho_clone;
        });
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&caminho_str)
            .spawn()
            .map_err(|e| format!("Erro ao abrir: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &caminho_str])
            .spawn()
            .map_err(|e| format!("Erro ao abrir: {}", e))?;
    }

    Ok("Documento aberto para impressão".into())
}

#[tauri::command]
fn buscar_arquivo_fonte(familia: String) -> (Option<String>, Option<String>) {
    let source = SystemSource::new();
    let names = &[FamilyName::Title(familia)];

    let normal = source
        .select_best_match(names, &Properties::new())
        .ok()
        .and_then(|h| if let Handle::Path { path, .. } = h { Some(path.to_string_lossy().into_owned()) } else { None });

    let mut bold_props = Properties::new();
    bold_props.weight = Weight::BOLD;
    let bold = source
        .select_best_match(names, &bold_props)
        .ok()
        .and_then(|h| if let Handle::Path { path, .. } = h { Some(path.to_string_lossy().into_owned()) } else { None });

    (normal, bold)
}

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "criar tabelas iniciais",
            sql: "
                CREATE TABLE IF NOT EXISTS fieis (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, telefone TEXT);
                CREATE TABLE IF NOT EXISTS dizimos (id INTEGER PRIMARY KEY AUTOINCREMENT, fiel_id INTEGER, valor REAL NOT NULL, data TEXT NOT NULL, metodo TEXT NOT NULL, FOREIGN KEY(fiel_id) REFERENCES fieis(id));
                CREATE TABLE IF NOT EXISTS movimentacoes (id INTEGER PRIMARY KEY AUTOINCREMENT, categoria TEXT NOT NULL, descricao TEXT, valor REAL NOT NULL, data TEXT NOT NULL, metodo TEXT NOT NULL, tipo TEXT NOT NULL);
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:paroquia.db", migrations)
                .build(),
        )
        .setup(|app| {
            let handle = app.handle();
            let menu = Menu::new(handle)?;

            // ── 1. PARÓQUIA (app menu — primeiro à esquerda no macOS) ──────
            let item_sobre    = MenuItem::with_id(handle, "sobre",  "Sobre o Sistema Paroquial", true, None::<&str>)?;
            let item_config   = MenuItem::with_id(handle, "config", "Configurações...",          true, Some("CmdOrCtrl+,"))?;
            let item_sair     = MenuItem::with_id(handle, "sair",   "Sair",                      true, Some("CmdOrCtrl+q"))?;
            let sub_app = Submenu::with_id_and_items(
                handle, "app", "Paróquia", true,
                &[
                    &item_sobre,
                    &PredefinedMenuItem::separator(handle)?,
                    &item_config,
                    &PredefinedMenuItem::separator(handle)?,
                    &item_sair,
                ],
            )?;

            // ── 2. ARQUIVO ───────────────────────────────────────────────
            let item_novo_doc   = MenuItem::with_id(handle, "documentos",       "Novo Documento",   true, Some("CmdOrCtrl+n"))?;
            let item_novo_fiel  = MenuItem::with_id(handle, "fieis_novo",        "Cadastrar Fiel",   true, Some("CmdOrCtrl+shift+n"))?;
            let item_backup     = MenuItem::with_id(handle, "menu_backup",       "Fazer Backup",     true, Some("CmdOrCtrl+shift+b"))?;
            let item_restaurar  = MenuItem::with_id(handle, "menu_restaurar",    "Restaurar Backup", true, None::<&str>)?;
            let item_fechar     = PredefinedMenuItem::close_window(handle, Some("Fechar Janela"))?;
            let sub_arquivo = Submenu::with_id_and_items(
                handle, "arquivo", "Arquivo", true,
                &[
                    &item_novo_doc,
                    &item_novo_fiel,
                    &PredefinedMenuItem::separator(handle)?,
                    &item_backup,
                    &item_restaurar,
                    &PredefinedMenuItem::separator(handle)?,
                    &item_fechar,
                ],
            )?;

            // ── 3. EDITAR (Cmd+C/V/Z etc.) ───────────────────────────────
            let sub_editar = Submenu::with_id_and_items(
                handle, "editar", "Editar", true,
                &[
                    &PredefinedMenuItem::undo(handle, None)?,
                    &PredefinedMenuItem::redo(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::cut(handle, None)?,
                    &PredefinedMenuItem::copy(handle, None)?,
                    &PredefinedMenuItem::paste(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::select_all(handle, None)?,
                ],
            )?;

            // ── 4. MÓDULOS ────────────────────────────────────────────────
            let item_painel = MenuItem::with_id(handle, "dashboard", "Painel", true, Some("CmdOrCtrl+1"))?;

            // Pastoral
            let item_fieis       = MenuItem::with_id(handle, "fieis",       "Fiéis",       true, None::<&str>)?;
            let item_familias    = MenuItem::with_id(handle, "familias",    "Famílias",    true, None::<&str>)?;
            let item_comunidades = MenuItem::with_id(handle, "comunidades", "Comunidades", true, None::<&str>)?;
            let item_grupos      = MenuItem::with_id(handle, "grupos",      "Grupos",      true, None::<&str>)?;
            let item_pastorais   = MenuItem::with_id(handle, "pastorais",   "Pastorais",   true, None::<&str>)?;
            let sub_pastoral = Submenu::with_id_and_items(handle, "sub_pastoral", "Pastoral", true, &[
                &item_fieis, &item_familias, &item_comunidades,
                &PredefinedMenuItem::separator(handle)?,
                &item_grupos, &item_pastorais,
            ])?;

            // Catequese
            let item_cat_turmas     = MenuItem::with_id(handle, "catequese:TURMAS",     "Turmas",        true, None::<&str>)?;
            let item_cat_inscricao  = MenuItem::with_id(handle, "catequese:INSCRIÇÃO",  "Matrículas",    true, None::<&str>)?;
            let item_cat_presenca   = MenuItem::with_id(handle, "catequese:PRESENÇA",   "Presenças",     true, None::<&str>)?;
            let item_cat_catequistas= MenuItem::with_id(handle, "catequese:CATEQUISTAS","Catequistas",   true, None::<&str>)?;
            let sub_catequese = Submenu::with_id_and_items(handle, "sub_catequese", "Catequese", true, &[
                &item_cat_turmas, &item_cat_inscricao,
                &item_cat_presenca, &item_cat_catequistas,
            ])?;

            // Sacramentos
            let item_sac_batismo   = MenuItem::with_id(handle, "sacramentos:BATISMO",    "Batismo",           true, None::<&str>)?;
            let item_sac_crisma    = MenuItem::with_id(handle, "sacramentos:CRISMA",     "Crisma",            true, None::<&str>)?;
            let item_sac_eucar     = MenuItem::with_id(handle, "sacramentos:EUCARISTIA", "1ª Eucaristia",     true, None::<&str>)?;
            let item_sac_matrim    = MenuItem::with_id(handle, "sacramentos:MATRIMÔNIO", "Matrimônio",        true, None::<&str>)?;
            let item_sac_obitos    = MenuItem::with_id(handle, "sacramentos:ÓBITOS",     "Óbitos e Exéquias", true, None::<&str>)?;
            let sub_sacramentos = Submenu::with_id_and_items(handle, "sub_sacramentos", "Sacramentos", true, &[
                &item_sac_batismo, &item_sac_crisma, &item_sac_eucar,
                &item_sac_matrim,
                &PredefinedMenuItem::separator(handle)?,
                &item_sac_obitos,
            ])?;

            // Financeiro
            let item_fin_caixas   = MenuItem::with_id(handle, "financeiro:caixas",    "Caixas/Contas",  true, None::<&str>)?;
            let item_fin_dizimo   = MenuItem::with_id(handle, "financeiro:dizimo",    "Dízimo",         true, None::<&str>)?;
            let item_fin_relat    = MenuItem::with_id(handle, "financeiro:relatorios","Relatórios",     true, None::<&str>)?;
            let sub_financeiro = Submenu::with_id_and_items(handle, "sub_financeiro", "Financeiro", true, &[
                &item_fin_caixas, &item_fin_dizimo, &item_fin_relat,
            ])?;

            // Patrimônio
            let item_patrimonio = MenuItem::with_id(handle, "patrimonio", "Patrimônio", true, Some("CmdOrCtrl+6"))?;

            // Agenda
            let item_ag_eventos  = MenuItem::with_id(handle, "agenda:eventos",  "Eventos Paroquiais",  true, None::<&str>)?;
            let item_ag_reunioes = MenuItem::with_id(handle, "agenda:reunioes", "Reuniões",            true, None::<&str>)?;
            let item_ag_visitas  = MenuItem::with_id(handle, "agenda:visitas",  "Visitas Pastorais",   true, None::<&str>)?;
            let item_ag_formacoes= MenuItem::with_id(handle, "agenda:formacoes","Formações",           true, None::<&str>)?;
            let item_ag_reservas = MenuItem::with_id(handle, "agenda:reservas", "Reservas de Espaço",  true, None::<&str>)?;
            let item_ag_missas   = MenuItem::with_id(handle, "agenda:missas",   "Programa de Missas",  true, None::<&str>)?;
            let item_ag_escala   = MenuItem::with_id(handle, "agenda:escala",   "Escala de Ministros", true, None::<&str>)?;
            let sub_agenda = Submenu::with_id_and_items(handle, "sub_agenda", "Agenda", true, &[
                &item_ag_eventos, &item_ag_reunioes, &item_ag_visitas,
                &item_ag_formacoes, &item_ag_reservas,
                &PredefinedMenuItem::separator(handle)?,
                &item_ag_missas, &item_ag_escala,
            ])?;

            // Documentos
            let item_doc_ata      = MenuItem::with_id(handle, "documentos:ata",        "Ata Paroquial",      true, None::<&str>)?;
            let item_doc_carta    = MenuItem::with_id(handle, "documentos:cartas",     "Cartas",             true, None::<&str>)?;
            let item_doc_memo     = MenuItem::with_id(handle, "documentos:memorando",  "Memorando",          true, None::<&str>)?;
            let item_doc_oficio   = MenuItem::with_id(handle, "documentos:oficios",    "Ofícios",            true, None::<&str>)?;
            let item_doc_contrato = MenuItem::with_id(handle, "documentos:contratos",  "Contratos",          true, None::<&str>)?;
            let item_doc_recibo   = MenuItem::with_id(handle, "documentos:recibos",    "Recibos",            true, None::<&str>)?;
            let item_doc_licenca  = MenuItem::with_id(handle, "documentos:licencas",   "Licenças",           true, None::<&str>)?;
            let item_doc_autorizac= MenuItem::with_id(handle, "documentos:autorizacoes","Autorizações",      true, None::<&str>)?;
            let item_doc_ficha    = MenuItem::with_id(handle, "documentos:ficha",      "Ficha de Inscrição", true, None::<&str>)?;
            let item_doc_relat    = MenuItem::with_id(handle, "documentos:relatorios_pastorais","Relatórios Pastorais", true, None::<&str>)?;
            let sub_documentos = Submenu::with_id_and_items(handle, "sub_documentos", "Documentos", true, &[
                &item_doc_ata, &item_doc_carta, &item_doc_memo, &item_doc_oficio,
                &PredefinedMenuItem::separator(handle)?,
                &item_doc_contrato, &item_doc_recibo, &item_doc_licenca, &item_doc_autorizac,
                &PredefinedMenuItem::separator(handle)?,
                &item_doc_ficha, &item_doc_relat,
            ])?;

            let sub_modulos = Submenu::with_id_and_items(
                handle, "modulos", "Módulos", true,
                &[
                    &item_painel,
                    &PredefinedMenuItem::separator(handle)?,
                    &sub_pastoral,
                    &sub_catequese,
                    &sub_sacramentos,
                    &PredefinedMenuItem::separator(handle)?,
                    &sub_financeiro,
                    &item_patrimonio,
                    &PredefinedMenuItem::separator(handle)?,
                    &sub_agenda,
                    &sub_documentos,
                ],
            )?;

            // ── 5. AJUDA ─────────────────────────────────────────────────
            let item_ajuda_sobre = MenuItem::with_id(handle, "sobre", "Sobre o Sistema Paroquial", true, None::<&str>)?;
            let sub_ajuda = Submenu::with_id_and_items(
                handle, "ajuda", "Ajuda", true,
                &[&item_ajuda_sobre],
            )?;

            // ── 6. JANELA ────────────────────────────────────────────────
            let sub_janela = Submenu::with_id_and_items(
                handle, "janela", "Janela", true,
                &[
                    &PredefinedMenuItem::minimize(handle, None)?,
                    &PredefinedMenuItem::maximize(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::fullscreen(handle, None)?,
                ],
            )?;

            // ── Monta o menu na ordem correta ────────────────────────────
            menu.append_items(&[
                &sub_app,
                &sub_arquivo,
                &sub_editar,
                &sub_modulos,
                &sub_ajuda,
                &sub_janela,
            ])?;
            app.set_menu(menu)?;

            // ── Handler: trata cliques do menu ───────────────────────────
            app.on_menu_event(|app, event| {
                let id = event.id().as_ref();
                match id {
                    "sair"  => { app.exit(0); }
                    "sobre" => {
                        // Apenas abre uma janela de about simples
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.emit("menu_sobre", ());
                        }
                    }
                    "fieis_novo" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.emit("navegar", "fieis".to_string());
                        }
                    }
                    "menu_backup" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.emit("menu_backup", ());
                        }
                    }
                    "menu_restaurar" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.emit("menu_restaurar", ());
                        }
                    }
                    // Qualquer outro ID (módulos simples ou compostos "modulo:aba") navega no frontend
                    id => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.emit("navegar", id.to_string());
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![navegar, buscar_fontes_sistema, buscar_arquivo_fonte, imprimir_pdf])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("Erro ao iniciar o sistema: {}", e);
            std::process::exit(1);
        });
}
