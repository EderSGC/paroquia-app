import { useState } from "react";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";

interface Props {
  registros: DocumentoRegistro[];
  loading: boolean;
  tipoLabel: string;
  onExcluir: (id: number) => void;
  onEditar?: (registro: DocumentoRegistro) => void;
}

export function RegistrosDocumentoPanel({ registros, loading, tipoLabel, onExcluir, onEditar }: Props) {
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [avisoId, setAvisoId] = useState<number | null>(null);

  function formatarData(iso: string) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("T")[0].split("-");
    if (!y) return iso;
    return `${d}/${m}/${y}`;
  }

  function handleEditarClick(r: DocumentoRegistro, e: React.MouseEvent) {
    e.stopPropagation();
    if (!onEditar) return;
    if (!r.json_dados) {
      setAvisoId(r.id);
      setTimeout(() => setAvisoId(null), 3500);
      return;
    }
    onEditar(r);
  }

  function handleRemoverClick(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmandoId(id);
  }

  function confirmarRemocao(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmandoId(null);
    onExcluir(id);
  }

  function cancelarRemocao(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmandoId(null);
  }

  return (
    <section style={{ background: "var(--dm-card-bg)", borderRadius: 18, border: "1px solid var(--dm-card-border)", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: "#eef2ff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>📋</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: "#1a1d2e" }}>Registros de {tipoLabel}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>
            {registros.length === 0
              ? "Nenhum documento registrado ainda."
              : `${registros.length} documento${registros.length > 1 ? "s" : ""} registrado${registros.length > 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      {loading && <p style={{ color: "#667085", fontSize: 14 }}>Carregando...</p>}

      {!loading && registros.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <style>{`
            .reg-row:hover { background: var(--dm-table-hover) !important; }
            .btn-acao {
              border-radius: 8px; padding: 4px 10px; font-size: 12px;
              cursor: pointer; font-weight: 600; white-space: nowrap; border: none;
            }
            .btn-editar { background: var(--dm-badge-bg); color: var(--dm-badge-color); border: 1px solid var(--dm-input-border) !important; }
            .btn-editar:hover { background: var(--dm-table-hover); }
            .btn-editar.sem-dados { background: var(--dm-table-row-alt); color: var(--dm-label-color); border: 1px solid var(--dm-card-border) !important; }
            .btn-remover { background: rgba(217, 45, 32, 0.12); color: #d92d20; border: 1px solid rgba(217, 45, 32, 0.25) !important; }
            .btn-remover:hover { background: rgba(217, 45, 32, 0.20); }
            .btn-confirmar { background: #d92d20; color: white; border: none; }
            .btn-confirmar:hover { background: #b91c1c; }
            .btn-cancelar { background: var(--dm-table-row-alt); color: var(--dm-input-color); border: 1px solid var(--dm-card-border); }
            .btn-cancelar:hover { background: var(--dm-table-head-bg); }
          `}</style>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "var(--dm-input-color)" }}>
            <thead>
              <tr style={{ background: "var(--dm-table-head-bg)" }}>
                {["Nº Protocolo", "Assunto", "Destinatário", "Assinante", "Emissão", "Registrado em", "Ações"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: "left", fontWeight: 700,
                    color: "var(--dm-label-color)", fontSize: 11, textTransform: "uppercase",
                    letterSpacing: "0.05em", borderBottom: "1px solid var(--dm-card-border)", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r, idx) => (
                <tr
                  key={r.id}
                  className="reg-row"
                  style={{
                    background: idx % 2 === 0 ? "transparent" : "var(--dm-table-row-alt)",
                    borderBottom: "1px solid var(--dm-separator)",
                    transition: "background 0.15s",
                    cursor: onEditar ? "pointer" : "default",
                  }}
                  onClick={(e) => { if (onEditar && r.json_dados) { e.stopPropagation(); onEditar(r); } }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--dm-badge-color)", whiteSpace: "nowrap" }}>
                    {r.numero_protocolo || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.assunto || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.destinatario || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.signatario || "—"}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatarData(r.data_emissao)}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "var(--dm-label-color)" }}>{formatarData(r.created_at)}</td>
                  <td style={{ padding: "8px 12px", whiteSpace: "nowrap", minWidth: 180 }} onClick={(e) => e.stopPropagation()}>

                    {/* Aviso sem dados */}
                    {avisoId === r.id && (
                      <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>
                        ⚠️ Registre novamente para editar
                      </span>
                    )}

                    {/* Confirmação de remoção */}
                    {confirmandoId === r.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#374151", marginRight: 4 }}>Remover?</span>
                        <button className="btn-acao btn-confirmar" onClick={(e) => confirmarRemocao(r.id, e)}>
                          Sim
                        </button>
                        <button className="btn-acao btn-cancelar" onClick={cancelarRemocao}>
                          Não
                        </button>
                      </div>
                    ) : (
                      avisoId !== r.id && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {onEditar && (
                            <button
                              className={`btn-acao btn-editar${!r.json_dados ? " sem-dados" : ""}`}
                              title={r.json_dados ? "Carregar para edição" : "Registre novamente para habilitar edição"}
                              onClick={(e) => handleEditarClick(r, e)}
                            >
                              ✏️ Editar
                            </button>
                          )}
                          <button
                            className="btn-acao btn-remover"
                            onClick={(e) => handleRemoverClick(r.id, e)}
                          >
                            🗑 Remover
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
