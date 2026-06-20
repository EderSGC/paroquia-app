import { useState, useEffect } from "react";
import { getDb } from "@core/database";
import { FielSelector } from "@core/components/FielSelector";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { ModeToggle, type ModoPagina } from "@core/components/ModeToggle";

import { formatarDataBR } from "../utils/dateFormats";
import { dispararImpressaoA4 } from "../utils/printHelper";

interface ReservaRow {
  id: number;
  titulo: string;
  descricao?: string | null;
  data: string;
  horario: string;
  nome_solicitante?: string | null;
  tel_solicitante?: string | null;
}

interface Props {
  paroquia: Paroquia;
}

export function ReservasPage({ paroquia }: Props) {
  const [modo, setModo] = useState<ModoPagina>("registrar");
  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [fonte, setFonte] = useState("Times New Roman");
  const [reservaSelecionada, setReservaSelecionada] = useState<ReservaRow | null>(null);

  const [espaco, setEspaco] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [fielId, setFielId] = useState<number | null>(null);

  async function carregarReservas() {
    try {
      const db = await getDb();
      const dados = await db.select<ReservaRow[]>(`
        SELECT r.*, f.nome as nome_solicitante, f.telefone as tel_solicitante
        FROM agenda_compromissos r
        LEFT JOIN fieis f ON r.fiel_id = f.id
        WHERE r.categoria = 'reserva'
        ORDER BY r.data DESC, r.horario DESC
      `);
      setReservas(dados);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    }
  }

  useEffect(() => {
    carregarReservas();
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!espaco || !finalidade || !data || !horarioInicio || !horarioFim) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (horarioFim < horarioInicio) {
      alert("O horário de término não pode ser anterior ao horário de início.");
      return;
    }
    try {
      const db = await getDb();
      const horarioCombinado = `${horarioInicio} às ${horarioFim}`;
      await db.execute(`
        INSERT INTO agenda_compromissos (titulo, descricao, data, horario, local, categoria, fiel_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [espaco, finalidade, data, horarioCombinado, espaco, "reserva", fielId]);

      setEspaco(""); setFinalidade(""); setData(""); setHorarioInicio(""); setHorarioFim(""); setFielId(null);
      alert("Espaço reservado com sucesso!");
      await carregarReservas();
    } catch (error) {
      console.error("Erro ao salvar reserva:", error);
      alert("Erro ao gravar a reserva no sistema.");
    }
  }

  const handlePrint = () => dispararImpressaoA4("papel-reserva", fonte);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ModeToggle modo={modo} onChange={setModo} />

      {/* FORMULÁRIO (modo registrar) */}
      {modo === "registrar" && (
      <form onSubmit={handleSalvar} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 14 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 16, fontWeight: 700 }}>Solicitar Reserva</h3>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Local / Espaço *
          <select value={espaco} onChange={(e) => setEspaco(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", background: "white", fontSize: 13 }}>
            <option value="">Selecione o espaço...</option>
            <option value="Igreja Matriz">Igreja Matriz</option>
            <option value="Salão Paroquial">Salão Paroquial</option>
            <option value="Auditório Principal">Auditório Principal</option>
            <option value="Cozinha Paroquial">Cozinha Paroquial</option>
            <option value="Sala 1 - Catequese">Sala 1 - Catequese</option>
            <option value="Sala 2 - Catequese">Sala 2 - Catequese</option>
            <option value="Sala 3 - Catequese">Sala 3 - Catequese</option>
            <option value="Quadra Poliesportiva">Quadra Poliesportiva</option>
          </select>
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Finalidade do Uso *
          <input type="text" value={finalidade} onChange={(e) => setFinalidade(e.target.value)} placeholder="Ex: Casamento, Assembleia, Ensaio..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Data da Reserva *
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Horário Início *
            <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Horário Término *
            <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Solicitante da Reserva (Fiel)
          <div style={{ marginTop: 4 }}>
            <FielSelector value={fielId ?? ""} onChange={(id) => setFielId(id ? Number(id) : null)} label="Selecione o solicitante" placeholder="Selecione um fiel..." />
          </div>
        </label>

        <button type="submit" style={{ background: "#1f3b73", color: "white", border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginTop: 4 }}>
          Confirmar Reserva de Espaço
        </button>
      </form>
      )}

      {/* LISTA (modo buscar) */}
      {modo === "buscar" && (
      <div style={{ background: "white", padding: 20, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 10 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 14, fontWeight: 700 }}>Reservas Registradas</h3>
        {reservas.length === 0 ? (
          <p style={{ color: "#667085", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum espaço reservado no momento.</p>
        ) : reservas.map((item) => (
          <div key={item.id} onClick={() => setReservaSelecionada(item)} style={{ padding: 12, border: "1px solid #eaecf0", borderRadius: 10, cursor: "pointer", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s ease" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "white", color: "#1f3b73", border: "1px solid #eaecf0" }}>{item.titulo}</span>
              <h4 style={{ margin: "6px 0 2px", color: "#101828", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.descricao}</h4>
              <p style={{ margin: 0, fontSize: 11, color: "#475467" }}>📅 {formatarDataBR(item.data)} | ⏰ {item.horario}h</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3b73", padding: "4px 8px", background: "white", borderRadius: 6, border: "1px solid #d0d5dd", marginLeft: 8, whiteSpace: "nowrap" }}>Recibo 👁️</span>
          </div>
        ))}
      </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO A4 */}
      {reservaSelecionada && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setReservaSelecionada(null)}>
        <div style={{ background: "white", borderRadius: 18, padding: 24, maxWidth: 860, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <FontSelector fonteAtual={fonte} onChange={setFonte} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrint} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>Imprimir Termo / Recibo</button>
              <button onClick={() => setReservaSelecionada(null)} style={{ background: "#f1f5f9", color: "#475467", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>✕ Fechar</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", background: "#f2f4f7", padding: 20, borderRadius: 14 }}>
            <article id="papel-reserva" style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", fontFamily: `"${fonte}", serif`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
              <DocumentHeader paroquia={paroquia} />
              <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, borderBottom: "2px solid #1f3b73", paddingBottom: 10, fontSize: 18, fontWeight: 800, color: "#1f3b73" }}>
                AUTORIZAÇÃO DE USO DE ESPAÇO PAROQUIAL
              </h2>
              <div style={{ marginTop: 30, fontSize: "16px", display: "grid", gap: "14px", lineHeight: "1.6" }}>
                <p><strong>Espaço Reservado:</strong> <span style={{ color: "#1f3b73", fontWeight: "bold" }}>{reservaSelecionada.titulo.toUpperCase()}</span></p>
                <p><strong>Data do Uso:</strong> {formatarDataBR(reservaSelecionada.data)}</p>
                <p><strong>Período/Horário:</strong> {reservaSelecionada.horario}h</p>
                <p><strong>Finalidade/Evento:</strong> {reservaSelecionada.descricao}</p>
                <p><strong>Solicitante Responsável:</strong> {reservaSelecionada.nome_solicitante || "Uso Interno / Secretaria"}</p>
                {reservaSelecionada.tel_solicitante && <p><strong>Telefone de Contato:</strong> {reservaSelecionada.tel_solicitante}</p>}
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #e4e7ec", fontSize: "14px", color: "#344054", marginTop: "30px" }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#1f3b73" }}>Regras e Termos de Uso do Espaço:</p>
                  <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.5" }}>
                    <li>Zelar pela limpeza e conservação dos móveis e equipamentos.</li>
                    <li>Apagar as luzes e desligar as centrais de ar-condicionado ao sair.</li>
                    <li>Entregar as chaves de volta na secretaria paroquial imediatamente após o término.</li>
                  </ol>
                </div>
                <div style={{ marginTop: "80px", display: "flex", justifyContent: "space-around" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #667085", width: "200px", marginBottom: "5px" }}></div>
                    <p style={{ fontSize: "12px", color: "#475467", margin: 0 }}>Assinatura do Solicitante</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #667085", width: "200px", marginBottom: "5px" }}></div>
                    <p style={{ fontSize: "12px", color: "#475467", margin: 0 }}>Visto da Secretaria / Pároco</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
