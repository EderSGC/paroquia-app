import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTheme } from "@core/hooks/useTheme";
import { useToast } from "@core/ui/Toast";
import { fazerBackup, restaurarBackup } from "@core/services/backup.service";

import type { Paroquia, Usuario, PapelUsuario } from "@core/types/app.types";
import { canAccessModule, hasPermission } from "@core/auth/permissions";

import { WorkspaceProvider, useWorkspace, type ModuleId } from "./WorkspaceContext";
import { ItemDetailPanel } from "@/components/ui/ItemDetailPanel";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { ContextPanel } from "@/components/ui/ContextPanel";

// Módulos legados — reutilizados como workspace content
import { DashboardV2 } from "@/modules/dashboard/DashboardV2";
import { DashboardPanel } from "@/modules/dashboard/DashboardPanel";
import { FinanceiroPanel } from "@/modules/financeiro/FinanceiroPanel";
import { SacramentalPanel } from "@/modules/sacramental/SacramentalPanel";
import { CatequesePanel } from "@/modules/catequese/CatequesePanel";
import { PastoralPanel } from "@/modules/pastoral/PastoralPanel";
import { AgendaPanel } from "@/modules/agenda/AgendaPanel";
import { PatrimonioPanel } from "@/modules/patrimonio/PatrimonioPanel";
import { ConfiguracoesPanel } from "@/modules/configuracoes/ConfiguracoesPanel";
import { DocumentosPage } from "@/modules/documentos";
import { AgendaPage } from "@/modules/agenda/pages/AgendaPage";
import { FinanceiroPage } from "@/modules/financeiro";
import { SacramentalModule } from "@/modules/sacramental/SacramentalModule";
import { PastoralModule } from "@/modules/pastoral/PastoralModule";
import { CatequeseModule } from "@/modules/catequese/CatequeseModule";
import { PatrimonioPage } from "@/modules/patrimonio/pages/PatrimonioPage";
import { SystemConfigPage } from "@/modules/shell/pages/SystemConfigPage";
import { SobrePage } from "@/modules/shell/pages/SobrePage";
import { FichaDoFielPage } from "@/modules/pastoral/pages/FichaDoFielPage";

interface Props {
  paroquia: Paroquia;
  usuario: Usuario;
  onParoquiaUpdate: (p: Paroquia) => void;
  onLogout: () => void;
}

// Módulos pastorais que o PastoralModule gerencia internamente
const PASTORAL_ABAS: Record<string, string> = {
  fieis:       "FIÉIS",
  familias:    "FAMÍLIAS",
  grupos:      "GRUPOS",
  pastorais:   "PASTORAIS",
  comunidades: "COMUNIDADES",
};

// Módulos sacramentais que o SacramentalModule gerencia
const SACRAMENTAL_MODS: Record<string, string> = {
  batismo:    "BATISMO",
  eucaristia: "EUCARISTIA",
  crisma:     "CRISMA",
  matrimonio: "MATRIMONIO",
  uncao:      "UNCAO",
  obitos:     "OBITOS",
};

function canAccess(papel: string, mod: string): boolean {
  const base = SACRAMENTAL_MODS[mod] ? "sacramentos" : mod;
  return canAccessModule(papel as PapelUsuario, base);
}

/* ─── Inner layout (needs WorkspaceContext) ────────────────────────────── */
function WorkspaceShell({ paroquia, usuario, onParoquiaUpdate, onLogout }: Props) {
  const { activeModule, subPage, navigate, panelOpen, selectedItem } = useWorkspace();
  const { isDark, setTheme } = useTheme();
  const { showToast } = useToast();

  const comunidadeId   = usuario.comunidade_id   ?? null;
  const comunidadeNome = usuario.comunidade_nome  ?? null;

  // Native macOS menu events
  useEffect(() => {
    const unNav  = listen<string>("navegar", e => {
      const [mod, sub] = e.payload.split(":");
      navigate(mod as ModuleId, sub);
    });
    const unSobre    = listen("menu_sobre",    () => navigate("__sobre" as ModuleId));
    const unBackup   = listen("menu_backup",   () => {
      fazerBackup()
        .then(p => showToast(`Backup salvo: ${p}`, "success"))
        .catch(e => { if (e?.message !== "CANCELLED") showToast("Erro ao fazer backup.", "error"); });
    });
    const unRestaura = listen("menu_restaurar", async () => {
      if (!confirm("Substituir todos os dados atuais pelo backup? Esta ação não pode ser desfeita.")) return;
      try { await restaurarBackup(); showToast("Backup restaurado.", "success"); }
      catch (e) { if ((e as Error)?.message !== "CANCELLED") showToast("Erro ao restaurar.", "error"); }
    });
    return () => {
      unNav.then(fn => fn());
      unSobre.then(fn => fn());
      unBackup.then(fn => fn());
      unRestaura.then(fn => fn());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Render workspace content ────────────────────────────────────── */
  function renderWorkspace() {
    const mod = activeModule as string;

    if (!canAccess(usuario.papel, mod)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 36 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Acesso restrito</div>
          <div style={{ fontSize: 13 }}>Você não tem permissão para este módulo.</div>
        </div>
      );
    }

    if (mod === "ficha" && subPage) {
      const fichaId = Number(subPage);
      return (
        <FichaDoFielPage
          fielId={fichaId}
          usuarioNome={usuario.nome}
          onVoltar={() => navigate("fieis")}
          onNavFiel={(id) => navigate("ficha", String(id))}
        />
      );
    }
    if (mod === "dashboard")  return <DashboardV2 paroquia={paroquia} usuario={usuario} />;
    if (mod === "config")     return <SystemConfigPage paroquia={paroquia} usuario={usuario} onParoquiaUpdated={onParoquiaUpdate} />;
    if (mod === "documentos") return <DocumentosPage paroquia={paroquia} abaPadrao={subPage} />;
    if (mod === "agenda")     return <AgendaPage paroquia={paroquia} abaPadrao={subPage} />;
    if (mod === "financeiro") return <FinanceiroPage paroquia={paroquia} usuario={usuario} abaPadrao={subPage} />;
    if (mod === "patrimonio") return <PatrimonioPage comunidadeFixa={comunidadeId} />;
    if (mod === "catequese")  return <CatequeseModule paroquia={paroquia} comunidadeId={comunidadeId} comunidadeNome={comunidadeNome} abaPadrao={subPage} />;

    // Módulos sacramentais — key força remount ao trocar de sacramento
    if (SACRAMENTAL_MODS[mod]) {
      return <SacramentalModule key={mod} paroquia={paroquia} abaPadrao={SACRAMENTAL_MODS[mod]} />;
    }

    // Módulos pastorais — key força remount ao trocar de aba
    if (PASTORAL_ABAS[mod]) {
      return (
        <PastoralModule
          key={mod + (subPage ?? "")}
          paroquia={paroquia}
          abaPadrao={subPage ?? PASTORAL_ABAS[mod]}
          comunidadeId={comunidadeId}
          comunidadeNome={comunidadeNome}
        />
      );
    }

    return null;
  }

  /* ── Render context panel content ────────────────────────────────── */
  function renderPanelTitle(): string {
    if (selectedItem) {
      if (selectedItem.type === "fiel") return selectedItem.nome.split(" ").slice(0, 2).join(" ");
      if (selectedItem.type === "sacramento") return selectedItem.nomePrincipal || "Sacramento";
      if (selectedItem.type === "lancamento") return selectedItem.tipoLanc === "ENTRADA" ? "Receita" : "Despesa";
      if (selectedItem.type === "patrimonio") return selectedItem.nome;
    }
    const titles: Record<string, string> = {
      dashboard:  "Resumo Paroquial",
      fieis:      "Comunidade",
      familias:   "Comunidade",
      comunidades:"Comunidade",
      grupos:     "Comunidade",
      pastorais:  "Pastoral",
      catequese:  "Catequese",
      batismo:    "Sacramentos",
      eucaristia: "Sacramentos",
      crisma:     "Sacramentos",
      matrimonio: "Sacramentos",
      uncao:      "Sacramentos",
      obitos:     "Sacramentos",
      financeiro: "Financeiro",
      patrimonio: "Patrimônio",
      agenda:     "Agenda",
      documentos: "Documentos",
      ficha: "Ficha do Fiel",
    };
    return titles[activeModule] ?? "Visão Geral";
  }

  function renderPanel() {
    const mod = activeModule as string;
    if (selectedItem) return <ItemDetailPanel />;
    if (mod === "dashboard")   return <DashboardPanel />;
    if (mod === "financeiro")  return <FinanceiroPanel usuario={usuario} />;
    if (mod === "catequese")   return <CatequesePanel comunidadeNome={comunidadeNome} />;
    if (SACRAMENTAL_MODS[mod]) return <SacramentalPanel />;
    if (PASTORAL_ABAS[mod])    return <PastoralPanel comunidadeNome={comunidadeNome} />;
    if (mod === "ficha")       return <PastoralPanel comunidadeNome={comunidadeNome} />;
    if (mod === "agenda")      return <AgendaPanel />;
    if (mod === "patrimonio")  return <PatrimonioPanel comunidadeId={comunidadeId} />;
    if (mod === "configuracoes") return <ConfiguracoesPanel />;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, padding: "24px 0" }}>
        <div style={{ fontSize: 28, opacity: 0.25 }}>⬚</div>
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.5 }}>
          Selecione um item<br />para ver detalhes
        </div>
      </div>
    );
  }

  return (
    <>
      {activeModule === ("__sobre" as ModuleId) && (
        <SobrePage onFechar={() => navigate("dashboard")} />
      )}

      <div
        className="app-workspace"
        style={{
          display: "flex",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
          color: "var(--text-primary)",
        }}
      >
        {/* Column 1 — Sidebar (190px, fixed) */}
        <AppSidebar
          paroquia={paroquia}
          usuario={usuario}
          isDark={isDark}
          onLogout={onLogout}
          onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
        />

        {/* Column 2 — Workspace (flex-basis:0 + flex-grow:1, sempre ocupa o espaço restante)
            Dashboard: transparente (contemplativo).
            Módulos operacionais: superfície 90% opaca, vidro fosco. */}
        <div
          className="workspace-main mac-scrollbar"
          data-surface="workspace"
          style={{
            flex: "1 1 0px",
            display: "flex",
            flexDirection: "column",
            width: 0,
            minWidth: 0,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            zIndex: 1,
            margin: "8px 6px 0 6px",
            borderRadius: "14px 14px 0 0",
            background: activeModule === "dashboard"
              ? "transparent"
              : isDark
              ? "rgba(10, 22, 54, 0.96)"
              : "linear-gradient(180deg, rgba(248,250,252,0.96), rgba(242,246,251,0.96))",
            backdropFilter: activeModule === "dashboard" ? undefined : "blur(10px)",
            WebkitBackdropFilter: activeModule === "dashboard" ? undefined : "blur(10px)",
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          }}
        >
          {renderWorkspace()}
        </div>

        {/* Column 3 — Context Panel (320px, collapsible) */}
        <ContextPanel title={renderPanelTitle()}>
          {renderPanel()}
        </ContextPanel>
      </div>
    </>
  );
}

/* ─── Public entry — wraps with WorkspaceProvider ──────────────────────── */
export function MacOSWorkspaceLayout({ paroquia, usuario, onParoquiaUpdate, onLogout }: Props) {
  const isAdmin = hasPermission(usuario.papel, "configuracoes", "gerenciar_usuarios");
  const initialModule = isAdmin ? "dashboard" : "pastorais";

  return (
    <WorkspaceProvider initialModule={initialModule} paroquia={paroquia}>
      <WorkspaceShell
        paroquia={paroquia}
        usuario={usuario}
        onParoquiaUpdate={onParoquiaUpdate}
        onLogout={onLogout}
      />
    </WorkspaceProvider>
  );
}
