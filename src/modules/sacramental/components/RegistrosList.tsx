import { useToast } from "@core/ui/Toast";
import { useState, useEffect, useRef, CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ask } from "@tauri-apps/plugin-dialog";
import { BookOpen } from "lucide-react";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { useWorkspace } from "@/layouts/WorkspaceContext";

interface Registro {
  id: number;
  tipo: string;
  nome_principal: string;
  data_sacramento: string;
  celebrante: string;
  comunidade: string;
  json_dados: string;
  created_at: string;
  livro?: string | null;
  folha?: string | null;
  assento?: string | null;
}

interface Props {
  tipo: string;
  busca: string;
  onSelecionar: (dados: Record<string, unknown>, registro: Registro) => void;
  recarregarKey?: number;
  onExcluir?: (id: number) => void;
  filtroComunidade?: string;
}

function extrairRef(r: Registro) {
  if (r.livro || r.folha || r.assento) {
    return { livro: r.livro || "", folha: r.folha || "", num: r.assento || "" };
  }
  try {
    const d = JSON.parse(r.json_dados || "{}");
    const flat = (d.batizando && typeof d.batizando === "object") ? d.batizando : d;
    return {
      livro: flat.livro  || flat.livroReg  || d.livroReg  || "",
      folha: flat.folha  || flat.folhaReg  || flat.pagina  || d.folhaReg || "",
      num:   flat.numero || flat.numReg    || flat.numeroFicha || d.numReg || "",
    };
  } catch {
    return { livro: "", folha: "", num: "" };
  }
}

function fmtData(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
}

const containerStyle: CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-card)",
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 24,
  boxShadow: "var(--shadow-card)",
};

const emptyStyle: CSSProperties = {
  padding: "28px 16px",
  textAlign: "center",
  fontSize: 13,
  color: "var(--text-tertiary)",
};

export function RegistrosList({ tipo, busca, onSelecionar, recarregarKey, onExcluir, filtroComunidade }: Props) {
  const { showToast } = useToast();
  const [registros, setRegistros]   = useState<Registro[]>([]);
  const [loading, setLoading]       = useState(true);
  const [anoFiltro, setAnoFiltro]   = useState<string | null>(null);
  const { selectItem, selectedItem } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarRegistros(); }, [tipo, recarregarKey]);

  async function carregarRegistros() {
    try {
      setLoading(true);
      const res = await SacramentalRepository.registros.findByTipo(tipo);
      setRegistros(res as Registro[]);
    } catch (e) {
      console.error("Erro ao carregar registros:", e);
    } finally {
      setLoading(false);
    }
  }

  async function excluirRegistro(id: number, nome: string) {
    const ok = await ask(
      `Deseja excluir o registro de "${nome}"? Esta ação não pode ser desfeita.`,
      { title: "Confirmar exclusão", kind: "warning" }
    );
    if (!ok) return;
    try {
      await SacramentalRepository.registros.softDelete(id);
      await carregarRegistros();
      onExcluir?.(id);
    } catch (e) {
      console.error("Erro ao excluir:", e);
      showToast("Erro ao excluir registro.", "error");
    }
  }

  /* ── Anos disponíveis para filtro ────────────────────────────── */
  const anos = [
    ...new Set(
      registros
        .map(r => r.data_sacramento?.substring(0, 4))
        .filter(Boolean)
    ),
  ].sort().reverse() as string[];

  /* ── Filtragem ───────────────────────────────────────────────── */
  const filtrados = registros
    .filter(r => !busca          || r.nome_principal?.toLowerCase().includes(busca.toLowerCase()))
    .filter(r => !filtroComunidade || r.comunidade?.toLowerCase().includes(filtroComunidade.toLowerCase()))
    .filter(r => !anoFiltro       || r.data_sacramento?.startsWith(anoFiltro));

  const selectedSacrId = selectedItem?.type === "sacramento" ? selectedItem.id : null;

  const virtualizer = useVirtualizer({
    count: filtrados.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 62,
    overscan: 10,
  });

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div style={containerStyle}>

      {/* ── Cabeçalho do acervo ──────────────────────────────────── */}
      <div style={{
        padding: "11px 14px",
        borderBottom: "1px solid var(--separator)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <BookOpen size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px",
          color: "var(--text-tertiary)", textTransform: "uppercase",
        }}>
          Acervo Histórico
        </span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {loading ? "—" : `${filtrados.length} ${filtrados.length === 1 ? "registro" : "registros"}`}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Chips de ano */}
        {anos.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              className={`sacr-year-chip${!anoFiltro ? " sacr-year-chip--on" : ""}`}
              onClick={() => setAnoFiltro(null)}
            >
              Todos
            </button>
            {anos.map(a => (
              <button
                key={a}
                className={`sacr-year-chip${anoFiltro === a ? " sacr-year-chip--on" : ""}`}
                onClick={() => setAnoFiltro(anoFiltro === a ? null : a)}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lista (virtualizada) ─────────────────────────────────── */}
      {loading ? (
        <div style={emptyStyle}>Carregando registros...</div>
      ) : filtrados.length === 0 ? (
        <div style={emptyStyle}>
          {busca || filtroComunidade || anoFiltro
            ? "Nenhum registro encontrado para os filtros aplicados."
            : "Nenhum registro cadastrado ainda."}
        </div>
      ) : (
        <div ref={scrollRef} style={{ maxHeight: 480, overflowY: "auto" }}>
          <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
            {virtualizer.getVirtualItems().map(vRow => {
              const r = filtrados[vRow.index];
              const ref    = extrairRef(r);
              const refStr = [
                ref.livro && `L. ${ref.livro}`,
                ref.folha && `F. ${ref.folha}`,
                ref.num   && `Nº ${ref.num}`,
              ].filter(Boolean).join(" · ");

              const isSel = selectedSacrId === r.id;
              const isLast = vRow.index === filtrados.length - 1;

              return (
                <div
                  key={r.id}
                  className={`sacr-row${isSel ? " sacr-row--sel" : ""}`}
                  style={{
                    position: "absolute", top: 0, left: 0, width: "100%",
                    transform: `translateY(${vRow.start}px)`,
                    height: vRow.size, boxSizing: "border-box",
                    borderBottom: isLast ? "none" : "1px solid var(--separator)",
                  }}
                  onClick={() => selectItem({
                    type: "sacramento",
                    id: r.id, tipo: r.tipo,
                    nomePrincipal: r.nome_principal,
                    dataSacramento: r.data_sacramento,
                    celebrante: r.celebrante,
                    comunidade: r.comunidade,
                    jsonDados: r.json_dados,
                  })}
                >
                  <div className="sacr-row-bar" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="sacr-row-name">{r.nome_principal || "—"}</span>
                      {refStr && <span className="sacr-ref-badge">{refStr}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 3 }}>
                      <span className="sacr-row-sub">
                        {[r.comunidade, r.celebrante].filter(Boolean).join(" · ")}
                      </span>
                      <span style={{ flex: 1 }} />
                      <span className="sacr-row-date">{fmtData(r.data_sacramento)}</span>
                    </div>
                  </div>
                  <div className="sacr-row-actions" onClick={e => e.stopPropagation()}>
                    <button className="sacr-action-btn" title="Editar" onClick={e => {
                      e.stopPropagation();
                      try { onSelecionar(JSON.parse(r.json_dados || "{}"), r); }
                      catch { onSelecionar({}, r); }
                    }}>✏️</button>
                    <button className="sacr-action-btn" title="Excluir" onClick={e => {
                      e.stopPropagation(); excluirRegistro(r.id, r.nome_principal || "sem nome");
                    }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
