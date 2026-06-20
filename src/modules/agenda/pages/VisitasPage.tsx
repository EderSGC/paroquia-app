import { useState, useEffect } from "react";
import { useAgenda } from "../hooks/useAgenda";
import { FielSelector } from "@core/components/FielSelector";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { ModeToggle, type ModoPagina } from "@core/components/ModeToggle";
import { formatarDataBR } from "../utils/dateFormats";
import { dispararImpressaoA4 } from "../utils/printHelper";
import type { CompromissoAgenda } from "../types/agenda.types";

interface Props {
  paroquia: Paroquia;
}

export function VisitasPage({ paroquia }: Props) {
  const [modo, setModo] = useState<ModoPagina>("registrar");
  const { compromissos, carregarPorCategoria, salvarCompromisso } = useAgenda();

  const [fonte, setFonte] = useState("Arial");
  const [visitaSelecionada, setVisitaSelecionada] = useState<CompromissoAgenda | null>(null);
  
  const [objetivo, setObjetivo] = useState(""); 
  const [observacoes, setObservacoes] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [endereco, setEndereco] = useState("");
  const [fielId, setFielId] = useState<number | null>(null);

  useEffect(() => {
    carregarPorCategoria('visita');
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!objetivo || !data || !horario || !endereco) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const sucesso = await salvarCompromisso({
      titulo: objetivo,
      descricao: observacoes,
      data,
      horario,
      local: endereco,
      categoria: 'visita',
      fiel_id: fielId
    });

   if (sucesso === true) {
      setObjetivo(""); 
      setObservacoes(""); 
      setData(""); 
      setHorario(""); 
      setEndereco(""); 
      setFielId(null);
      alert("Visita pastoral agendada!");
      carregarPorCategoria('visita');
    }
  }

  const handlePrint = () => dispararImpressaoA4("papel-visita", fonte);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ModeToggle modo={modo} onChange={setModo} />

      {/* FORMULÁRIO (modo registrar) */}
      {modo === "registrar" && (
      <form onSubmit={handleSalvar} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 14 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 16, fontWeight: 700 }}>Agendar Visita</h3>
        <input type="text" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Objetivo" style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
          <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        </div>
        <FielSelector value={fielId ?? ""} onChange={(id) => setFielId(id ? Number(id) : null)} label="Selecione o fiel" placeholder="Selecione..." />
        <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" style={{ padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        <button type="submit" style={{ background: "#1f3b73", color: "white", padding: 12, borderRadius: 8, border: "none" }}>Salvar</button>
      </form>
      )}

      {/* LISTA (modo buscar) */}
      {modo === "buscar" && (
      <div style={{ background: "white", padding: 20, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 10 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 14, fontWeight: 700 }}>Visitas Registradas</h3>
        {compromissos.length === 0 ? (
          <p style={{ color: "#667085", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhuma visita agendada.</p>
        ) : compromissos.map((item) => (
          <div key={item.id} onClick={() => setVisitaSelecionada(item)} style={{ padding: 12, border: "1px solid #eaecf0", borderRadius: 10, cursor: "pointer", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{item.titulo}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475467" }}>{formatarDataBR(item.data)} | {item.horario}h | {item.local}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3b73", padding: "4px 8px", background: "white", borderRadius: 6, border: "1px solid #d0d5dd", whiteSpace: "nowrap" }}>Ver 👁️</span>
          </div>
        ))}
      </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO A4 */}
      {visitaSelecionada && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setVisitaSelecionada(null)}>
        <div style={{ background: "white", borderRadius: 18, padding: 24, maxWidth: 860, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <FontSelector fonteAtual={fonte} onChange={setFonte} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrint} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>Imprimir Guia</button>
              <button onClick={() => setVisitaSelecionada(null)} style={{ background: "#f1f5f9", color: "#475467", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>✕ Fechar</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", background: "#f2f4f7", padding: 20, borderRadius: 14 }}>
            <article id="papel-visita" style={{ width: "210mm", minHeight: "297mm", padding: "40px", background: "white", fontFamily: `"${fonte}", serif`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
              <DocumentHeader paroquia={paroquia} />
              <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, borderBottom: "2px solid #1f3b73" }}>ROTEIRO DE VISITA PASTORAL</h2>
              <div style={{ marginTop: 30, fontSize: "16px", lineHeight: "1.8" }}>
                <p><strong>Objetivo:</strong> {visitaSelecionada.titulo}</p>
                <p><strong>Data:</strong> {formatarDataBR(visitaSelecionada.data)} às {visitaSelecionada.horario}h</p>
                <p><strong>Fiel:</strong> {visitaSelecionada.nome_fiel || "Não informado"}</p>
                <p><strong>Endereço:</strong> {visitaSelecionada.local}</p>
                <div style={{ marginTop: 20, padding: 15, background: "#fdfaf7", border: "1px solid #feedec" }}>
                  <p><strong>Observações:</strong></p>
                  <p>{visitaSelecionada.descricao || "Nenhuma observação."}</p>
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