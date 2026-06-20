import { createContext, useContext, useState, type ReactNode } from "react";

export type ModuleId =
  | "dashboard" | "agenda"
  | "fieis" | "familias" | "comunidades" | "grupos"
  | "pastorais" | "catequese"
  | "batismo" | "eucaristia" | "crisma" | "matrimonio" | "uncao" | "obitos"
  | "financeiro" | "patrimonio"
  | "documentos" | "config";

export type SelectedItem =
  | {
      type: "fiel";
      id: number;
      nome: string;
      comunidade?: string;
      isDizimista?: boolean;
      data_nascimento?: string;
      telefone?: string;
      email?: string;
      endereco?: string;
    }
  | {
      type: "sacramento";
      id: number;
      tipo: string;
      nomePrincipal: string;
      dataSacramento: string;
      celebrante: string;
      comunidade: string;
      jsonDados: string;
    }
  | {
      type: "lancamento";
      id: number;
      tipoLanc: "ENTRADA" | "SAIDA";
      valor: number;
      descricao: string;
      data: string;
      categoria?: string;
      origem?: string;
    }
  | {
      type: "patrimonio";
      id: number;
      nome: string;
      categoria: string;
      localizacao?: string;
      valorEstimado?: number;
      estadoConservacao?: string;
      dataAquisicao?: string;
      observacoes?: string;
    };

interface WorkspaceCtx {
  activeModule: ModuleId;
  subPage?: string;
  navigate: (mod: ModuleId | string, sub?: string) => void;
  panelOpen: boolean;
  togglePanel: () => void;
  selectedItem: SelectedItem | null;
  selectItem: (item: SelectedItem | null) => void;
}

const Ctx = createContext<WorkspaceCtx>({
  activeModule: "dashboard",
  navigate: () => {},
  panelOpen: true,
  togglePanel: () => {},
  selectedItem: null,
  selectItem: () => {},
});

function loadPanelPref(): boolean {
  try { return localStorage.getItem("ws-panel-open") !== "false"; } catch { return true; }
}

export function WorkspaceProvider({ initialModule = "dashboard", children }: {
  initialModule?: string;
  children: ReactNode;
}) {
  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule as ModuleId);
  const [subPage, setSubPage] = useState<string | undefined>();
  const [panelOpen, setPanelOpen] = useState(loadPanelPref);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  function navigate(mod: ModuleId | string, sub?: string) {
    setActiveModule(mod as ModuleId);
    setSubPage(sub);
    setSelectedItem(null); // limpa seleção ao trocar de módulo
  }

  function togglePanel() {
    setPanelOpen(prev => {
      const next = !prev;
      try { localStorage.setItem("ws-panel-open", String(next)); } catch {}
      return next;
    });
  }

  function selectItem(item: SelectedItem | null) {
    setSelectedItem(item);
    if (item && !panelOpen) {
      setPanelOpen(true);
      try { localStorage.setItem("ws-panel-open", "true"); } catch {}
    }
  }

  return (
    <Ctx.Provider value={{ activeModule, subPage, navigate, panelOpen, togglePanel, selectedItem, selectItem }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  return useContext(Ctx);
}
