import { useState, useEffect } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { dispararImpressaoA4 } from "../utils/printHelper";
import { useAgenda } from "../hooks/useAgenda";
import { formatarDataBR } from "../utils/dateFormats";

type ModoEventos = "registrar" | "documento";

const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", fontSize: 13, boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, textTransform: "uppercase" };

export function EventosParoquiaisPage({ paroquia }: { paroquia: Paroquia }) {
  const [modo, setModo] = useState<ModoEventos>("registrar");
  const [fonte, setFonte] = useState("Times New Roman");

  const { compromissos: eventos, carregarPorCategoria, salvarCompromisso, excluirCompromisso } = useAgenda();

  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    carregarPorCategoria("evento");
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data.trim()) {
      alert("Preencha pelo menos o Título e a Data do evento.");
      return;
    }
    const ok = await salvarCompromisso({ titulo, descricao, data, horario, local, categoria: "evento" });
    if (ok) {
      setTitulo(""); setData(""); setHorario(""); setLocal(""); setDescricao("");
      carregarPorCategoria("evento");
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm("Deseja excluir este evento?")) return;
    await excluirCompromisso(id);
    carregarPorCategoria("evento");
  }

  const handlePrint = () => dispararImpressaoA4("papel-eventos", fonte);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {(["registrar","documento"] as ModoEventos[]).map(m => (
          <button key={m} onClick={() => setModo(m)} style={{ borderRadius: 999, padding: "10px 22px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: modo === m ? "#1f3b73" : "#eef2f7", color: modo === m ? "white" : "#344054" }}>
            {m === "registrar" ? "Registrar" : "Imprimir"}
          </button>
        ))}
      </div>

      {modo === "registrar" && (
        <form onSubmit={handleSalvar} style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 24, display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f3b73" }}>Cadastrar Novo Evento</h3>

          <div>
            <label style={lbl}>Título do Evento *</label>
            <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Bazar Beneficente, Festa de São João..." required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>Data *</label>
              <input style={inp} type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Horário</label>
              <input style={inp} type="time" value={horario} onChange={e => setHorario(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Local</label>
            <input style={inp} value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex: Quadra Paroquial, Igreja Matriz..." />
          </div>

          <div>
            <label style={lbl}>Descrição / Observações</label>
            <textarea style={{ ...inp, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes do evento..." />
          </div>

          <button type="submit" style={{ padding: "12px", borderRadius: 10, border: "none", background: "#1f3b73", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Cadastrar Evento
          </button>
        </form>
      )}

      {modo === "registrar" && (
        <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1f3b73" }}>Eventos Cadastrados ({eventos.length})</h3>
          {eventos.length === 0 ? (
            <p style={{ color: "#98a2b3", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum evento cadastrado ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {eventos.map((ev) => (
                <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #eaecf0" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{ev.titulo}</div>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                      📅 {formatarDataBR(ev.data)}{ev.horario ? ` às ${ev.horario}` : ""}
                      {ev.local ? ` · 📍 ${ev.local}` : ""}
                    </div>
                    {ev.descricao && <div style={{ fontSize: 12, color: "#344054", marginTop: 4 }}>{ev.descricao}</div>}
                  </div>
                  <button onClick={() => handleExcluir(ev.id!)} style={{ background: "none", border: "none", color: "#fda29b", cursor: "pointer", fontSize: 18, paddingLeft: 10 }} title="Excluir">🗑</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {modo === "documento" && (
        <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <FontSelector fonteAtual={fonte} onChange={setFonte} />
            <button onClick={handlePrint} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>
              Imprimir Calendário
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", background: "#f2f4f7", padding: 30, borderRadius: 14 }}>
            <article
              id="papel-eventos"
              style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", fontFamily: `"${fonte}", serif`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
            >
              <DocumentHeader paroquia={paroquia} />
              <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, borderBottom: "2px solid #1f3b73", paddingBottom: 10, fontSize: 18, fontWeight: 800, color: "#1f3b73" }}>
                CALENDÁRIO DE EVENTOS PAROQUIAIS
              </h2>
              <div style={{ marginTop: 30 }}>
                {eventos.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#888" }}>Nenhum evento cadastrado.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: 12, width: "18%" }}>DATA</th>
                        <th style={{ border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: 12, width: "10%" }}>HORA</th>
                        <th style={{ border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: 12, width: "32%" }}>EVENTO</th>
                        <th style={{ border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: 12, width: "22%" }}>LOCAL</th>
                        <th style={{ border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: 12, width: "18%" }}>OBSERVAÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventos.map((ev) => (
                        <tr key={ev.id}>
                          <td style={{ border: "1px solid #000", padding: "8px 10px", fontSize: 11, textAlign: "center" }}>{formatarDataBR(ev.data)}</td>
                          <td style={{ border: "1px solid #000", padding: "8px 10px", fontSize: 11, textAlign: "center" }}>{ev.horario || "-"}</td>
                          <td style={{ border: "1px solid #000", padding: "8px 10px", fontSize: 11, fontWeight: 700 }}>{ev.titulo}</td>
                          <td style={{ border: "1px solid #000", padding: "8px 10px", fontSize: 11 }}>{ev.local || "-"}</td>
                          <td style={{ border: "1px solid #000", padding: "8px 10px", fontSize: 10, fontStyle: "italic" }}>{ev.descricao || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}
