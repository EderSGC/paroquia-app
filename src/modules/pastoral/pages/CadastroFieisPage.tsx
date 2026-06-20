import { useState, useRef, useMemo } from "react";
import { Search, UserPlus, Printer, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { printWithTitle } from "@core/utils/pdfGenerator";
import { usePastoral } from "../hooks/usePastoral";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { useWorkspace } from "@/layouts/WorkspaceContext";
import { useToast } from "@core/ui/Toast";
import type { Paroquia } from '../../../core/types/app.types';
import type { Fiel } from '../../../core/types/entities';

interface Props {
  paroquia?: Paroquia | null;
  comunidadeFiltro?: string | null;
}

/* ─── Avatar por iniciais ──────────────────────────────────────── */
function Avatar({ nome, size = 36 }: { nome: string; size?: number }) {
  const initials = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const hue = [...nome].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue}, 52%, 50%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: "#fff",
      userSelect: "none",
    }}>
      {initials || "?"}
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────────────── */
export function CadastroFieisPage({ paroquia, comunidadeFiltro = null }: Props) {
  const {
    fielDraft, atualizarDraft, salvarFiel, limparDraft,
    fieis, editarFiel, excluirFiel, comunidades,
  } = usePastoral();
  const { selectItem, selectedItem } = useWorkspace();
  const { showToast } = useToast();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);

  const isBloqueado = comunidadeFiltro != null;
  const selectedFielId = selectedItem?.type === "fiel" ? selectedItem.id : null;

  const maskPhone = (v: string) => {
    if (!v) return "";
    v = v.replace(/\D/g, "").substring(0, 11);
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  const maskCpf = (v: string) => {
    if (!v) return "";
    v = v.replace(/\D/g, "").substring(0, 11);
    if (v.length > 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    if (v.length > 6) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    if (v.length > 3) return `${v.slice(0, 3)}.${v.slice(3)}`;
    return v;
  };

  /* ── Chips de comunidades únicas ────────────────────────────── */
  const comunidadesUnicas = [
    ...new Set(fieis.map(f => f.comunidade).filter(Boolean)),
  ].sort() as string[];
  const chips = ["todos", "dizimistas", ...comunidadesUnicas];

  /* ── Filtro + ordenação ─────────────────────────────────────── */
  const fieisAtivos = fieis
    .filter(f => {
      const matchBusca  = !busca || f.nome?.toLowerCase().includes(busca.toLowerCase());
      const matchCom    = !isBloqueado || f.comunidade === comunidadeFiltro;
      const matchFiltro =
        filtro === "todos"      ? true :
        filtro === "dizimistas" ? Number(f.isDizimista) === 1 :
        f.comunidade === filtro;
      return matchBusca && matchCom && matchFiltro;
    })
    .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"));

  /* ── Flat list com headers para virtualização ────────────────── */
  type VItem = { type: "letter"; letra: string } | { type: "fiel"; fiel: Fiel };
  const flatItems = useMemo<VItem[]>(() => {
    const grupos = new Map<string, Fiel[]>();
    fieisAtivos.forEach(f => {
      const letra = f.nome?.trim()[0]?.toUpperCase() ?? "#";
      if (!grupos.has(letra)) grupos.set(letra, []);
      grupos.get(letra)!.push(f);
    });
    const letras = [...grupos.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const items: VItem[] = [];
    for (const l of letras) {
      items.push({ type: "letter", letra: l });
      for (const f of grupos.get(l)!) items.push({ type: "fiel", fiel: f });
    }
    return items;
  }, [fieisAtivos]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => flatItems[i].type === "letter" ? 28 : 52,
    overscan: 15,
  });

  /* ── Handlers ───────────────────────────────────────────────── */
  function handleSelect(f: Fiel) {
    selectItem({
      type: "fiel", id: f.id, nome: f.nome,
      comunidade: f.comunidade ?? undefined, isDizimista: Number(f.isDizimista) === 1,
      data_nascimento: f.data_nascimento ?? undefined, telefone: f.telefone ?? undefined,
      email: f.email ?? undefined, endereco: f.endereco ?? undefined,
    });
  }

  function handleNovo() { limparDraft(); setShowForm(true); }

  function handleEditar(e: React.MouseEvent, f: Fiel) {
    e.stopPropagation(); editarFiel(f); setShowForm(true);
  }

  function handleExcluir(e: React.MouseEvent, id: number) {
    e.stopPropagation(); excluirFiel(id);
  }

  async function handleSave() {
    if (!fielDraft.nome?.trim()) { showToast("O nome é obrigatório!", "error"); return; }
    const result = await salvarFiel();
    if (result.cpfInvalido) {
      showToast("CPF inválido. Verifique os números digitados.", "error");
      return;
    }
    if (result.duplicado) {
      showToast("Fiel com mesmo nome e dados já existe.", "info");
    } else if (result.ok) {
      showToast("Registro salvo com sucesso!", "success");
    } else {
      showToast("Erro ao salvar no banco de dados.", "error");
    }
    setShowForm(false);
  }

  const chipLabel = (c: string) =>
    c === "todos" ? "Todos" : c === "dizimistas" ? "Dizimistas" : c;

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)", overflow: "hidden" }}>

      <style>{`
        /* Print */
        @page { size: A4; margin: 1.5cm; }
        @media screen { #fieis-print { display: none !important; } }
        @media print {
          body * { visibility: hidden; background: transparent !important; }
          #fieis-print, #fieis-print * { visibility: visible; }
          #fieis-print { position: absolute; left: 0; top: 0; width: 98%; display: block !important; margin: 0; padding: 0; }
          #fieis-print h2 { text-align: center; font-size: 18pt; color: #1f3b73; margin: 25px 0 15px; }
          #fieis-print table { width: 100%; border-collapse: collapse; font-size: 11pt; }
          #fieis-print th, #fieis-print td { border: 1px solid #000; padding: 8px; text-align: left; }
          #fieis-print th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        }

        /* Chips */
        .fiel-chip {
          border-radius: 999px; padding: 4px 13px;
          border: 1px solid var(--separator);
          font-size: 11.5px; font-weight: 500;
          cursor: pointer; background: transparent; color: var(--text-secondary);
          white-space: nowrap; flex-shrink: 0; font-family: inherit;
          transition: background 100ms, color 100ms, border-color 100ms;
        }
        .fiel-chip:hover { background: var(--bg-hover); }
        .fiel-chip--on {
          background: var(--accent) !important; color: #fff !important;
          border-color: var(--accent) !important; font-weight: 600;
        }

        /* Contact rows */
        .fiel-row {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 14px; border-radius: 9px; cursor: pointer;
          transition: background 80ms ease;
        }
        .fiel-row:hover { background: var(--bg-hover); }
        .fiel-row--sel { background: var(--accent) !important; }
        .fiel-row--sel .fr-name { color: #fff !important; }
        .fiel-row--sel .fr-sub  { color: rgba(255,255,255,0.70) !important; }

        /* Actions on hover */
        .fr-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 120ms; flex-shrink: 0; }
        .fiel-row:hover .fr-actions { opacity: 1; }
        .fiel-row--sel .fr-actions  { opacity: 1; }

        /* Letter header sticky */
        .fiel-letter {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.6px;
          color: var(--text-tertiary);
          padding: 8px 14px 3px;
          position: sticky; top: 0; z-index: 1;
          background: var(--bg-app);
        }

        .fiel-search:focus { border-color: var(--accent) !important; outline: none; box-shadow: 0 0 0 3px rgba(0,122,255,0.12); }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px 10px",
        background: "var(--bg-header)", backdropFilter: "var(--blur-sm)",
        borderBottom: "1px solid var(--separator)", flexShrink: 0,
      }}>
        {/* Search + action buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={13} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-tertiary)", pointerEvents: "none",
            }} />
            <input
              className="fiel-search"
              placeholder="Pesquisar fiéis..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{
                width: "100%", paddingLeft: 32, paddingRight: 10, height: 34,
                borderRadius: 9, border: "1px solid var(--separator)",
                background: "var(--bg-elevated)", color: "var(--text-primary)",
                fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
                transition: "border-color 150ms, box-shadow 150ms",
              }}
            />
          </div>
          <button
            onClick={handleNovo}
            style={{
              height: 34, padding: "0 14px",
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 9, fontWeight: 600, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              transition: "opacity 120ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <UserPlus size={13} />
            Novo Fiel
          </button>
          <button
            title="Imprimir lista"
            onClick={() => printWithTitle("Lista de Fiéis")}
            style={{
              height: 34, width: 34, flexShrink: 0,
              background: "var(--bg-surface)", border: "1px solid var(--separator)",
              borderRadius: 9, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)", transition: "background 120ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-surface)")}
          >
            <Printer size={13} />
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {chips.map(c => (
            <button
              key={c}
              className={`fiel-chip${filtro === c ? " fiel-chip--on" : ""}`}
              onClick={() => setFiltro(c)}
            >
              {chipLabel(c)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Count bar ───────────────────────────────────────────── */}
      <div style={{
        padding: "5px 16px", fontSize: 11, color: "var(--text-tertiary)",
        fontWeight: 500, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
      }}>
        {fieisAtivos.length === fieis.length
          ? `${fieis.length} fiéis`
          : `${fieisAtivos.length} de ${fieis.length} fiéis`}
        {isBloqueado && (
          <span style={{
            background: "var(--bg-surface)", border: "1px solid var(--separator)",
            borderRadius: 4, padding: "1px 7px",
            fontSize: 10, fontWeight: 600, color: "var(--text-secondary)",
          }}>
            🔒 {comunidadeFiltro}
          </span>
        )}
      </div>

      {/* ── Contact list (virtualizada) ──────────────────────────── */}
      <div ref={scrollRef} className="mac-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 8px 0" }}>
        {fieisAtivos.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: 220, gap: 8,
          }}>
            <div style={{ fontSize: 32, opacity: 0.25 }}>👤</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Nenhum fiel encontrado
            </div>
            {busca && <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Tente outra busca</div>}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
            {virtualizer.getVirtualItems().map(vRow => {
              const item = flatItems[vRow.index];
              if (item.type === "letter") {
                return (
                  <div key={`L-${item.letra}`} className="fiel-letter" style={{
                    position: "absolute", top: 0, left: 0, width: "100%",
                    transform: `translateY(${vRow.start}px)`,
                    height: vRow.size,
                  }}>
                    {item.letra}
                  </div>
                );
              }
              const f = item.fiel;
              const sel = selectedFielId === f.id;
              return (
                <div
                  key={f.id}
                  className={`fiel-row${sel ? " fiel-row--sel" : ""}`}
                  style={{
                    position: "absolute", top: 0, left: 0, width: "100%",
                    transform: `translateY(${vRow.start}px)`,
                    height: vRow.size, boxSizing: "border-box",
                  }}
                  onClick={() => handleSelect(f)}
                >
                  <Avatar nome={f.nome || "?"} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fr-name" style={{
                      fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {f.nome}
                    </div>
                    <div className="fr-sub" style={{
                      fontSize: 11, color: "var(--text-secondary)", marginTop: 1,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {[f.comunidade, Number(f.isDizimista) === 1 ? "Dizimista" : ""].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="fr-actions">
                    <button title="Editar" onClick={e => handleEditar(e, f)} style={actionBtn(sel)}>✏️</button>
                    <button title="Excluir" onClick={e => handleExcluir(e, f.id)} style={actionBtn(sel)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de formulário ──────────────────────────────────── */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.40)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-card)",
            borderRadius: 18, padding: "24px 24px 20px", width: 480,
            boxShadow: "0 28px 80px rgba(0,0,0,0.30)",
            animation: "panel-fade-in 220ms cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {fielDraft.id ? "Editar Fiel" : "Novo Fiel"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "var(--bg-hover)", border: "none", borderRadius: 8,
                  width: 28, height: 28, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-secondary)", transition: "background 120ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-alt)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labS}>NOME COMPLETO</label>
                <input style={inS} value={fielDraft.nome || ""} onChange={e => atualizarDraft("nome", e.target.value)} />
              </div>
              <div>
                <label style={labS}>DATA DE NASCIMENTO</label>
                <input type="date" style={inS} value={fielDraft.data_nascimento || ""} onChange={e => atualizarDraft("data_nascimento", e.target.value)} />
              </div>
              <div>
                <label style={labS}>TELEFONE</label>
                <input style={inS} placeholder="(00) 00000-0000" value={fielDraft.telefone || ""} onChange={e => atualizarDraft("telefone", maskPhone(e.target.value))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labS}>E-MAIL</label>
                <input type="email" style={inS} placeholder="email@exemplo.com" value={fielDraft.email || ""} onChange={e => atualizarDraft("email", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labS}>ENDEREÇO</label>
                <input style={inS} placeholder="Rua, Número, Bairro" value={fielDraft.endereco || ""} onChange={e => atualizarDraft("endereco", e.target.value)} />
              </div>
              <div>
                <label style={labS}>CPF</label>
                <input style={inS} placeholder="000.000.000-00" value={fielDraft.cpf || ""} onChange={e => atualizarDraft("cpf", maskCpf(e.target.value))} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labS}>COMUNIDADE</label>
                <select style={inS} value={fielDraft.comunidade || ""} onChange={e => atualizarDraft("comunidade", e.target.value)}>
                  <option value="">Selecione...</option>
                  {comunidades.map(c => (
                    <option key={c.nome} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={!!fielDraft.isDizimista} onChange={e => atualizarDraft("isDizimista", e.target.checked)} />
                  Dizimista Ativo
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "9px 18px", background: "var(--bg-hover)",
                  border: "1px solid var(--separator)", borderRadius: 9,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "var(--text-secondary)", fontFamily: "inherit", transition: "background 120ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-alt)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-hover)")}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "9px 20px", background: "var(--accent)",
                  border: "none", borderRadius: 9,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#fff", fontFamily: "inherit", transition: "opacity 120ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Salvar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Área de impressão (invisível na tela) ─────────────────── */}
      <div id="fieis-print">
        {paroquia && <DocumentHeader paroquia={paroquia} />}
        <h2>LISTAGEM GERAL DE FIÉIS</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>Contato / Endereço</th><th>Comunidade</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fieis.map(f => (
              <tr key={f.id}>
                <td>{f.nome}</td>
                <td>
                  <div>{f.telefone || "---"}</div>
                  <div style={{ fontSize: "12px" }}>{f.email || ""}</div>
                  <div style={{ fontSize: "12px" }}>{f.endereco || ""}</div>
                </td>
                <td>{f.comunidade}</td>
                <td>{Number(f.isDizimista) === 1 ? "Dizimista" : "---"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Estilos locais ────────────────────────────────────────────── */
const labS: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 600, letterSpacing: "0.3px",
  color: "var(--text-secondary)", display: "block", marginBottom: 5,
};
const inS: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8,
  border: "1px solid var(--separator)",
  background: "var(--bg-surface)", color: "var(--text-primary)",
  fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
};
const actionBtn = (sel: boolean): React.CSSProperties => ({
  background: sel ? "rgba(255,255,255,0.18)" : "var(--bg-surface)",
  border: sel ? "1px solid rgba(255,255,255,0.25)" : "1px solid var(--separator)",
  borderRadius: 7, width: 27, height: 27, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 13, padding: 0,
});
