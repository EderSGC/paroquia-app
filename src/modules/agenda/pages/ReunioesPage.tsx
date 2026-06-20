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

export function ReunioesPage({ paroquia }: Props) {
  const [modo, setModo] = useState<ModoPagina>("registrar");
  // 1. Hook para dados
  const { compromissos: reunioes, carregarPorCategoria, salvarCompromisso } = useAgenda();
  
  // 2. Estados mantidos (os que estavam dando erro "não encontrado")
  const [fonte, setFonte] = useState("Arial");
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState<CompromissoAgenda | null>(null);
  const [titulo, setTitulo] = useState("");
  const [pauta, setPauta] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [fielId, setFielId] = useState<string>("");

  useEffect(() => {
    carregarPorCategoria('reuniao');
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    const sucesso = await salvarCompromisso({
      titulo, descricao: pauta, data, horario, local, categoria: 'reuniao', fiel_id: Number(fielId) || null
    });

    if (sucesso) {
      setTitulo(""); setPauta(""); setData(""); setHorario(""); setLocal(""); setFielId("");
      alert("Reunião agendada!");
      carregarPorCategoria('reuniao');
    }
  }

  const handlePrint = () => {
    dispararImpressaoA4("papel-reuniao", fonte);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ModeToggle modo={modo} onChange={setModo} />

      {/* FORMULÁRIO (modo registrar) */}
      {modo === "registrar" && (
      <form onSubmit={handleSalvar} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 14 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 16, fontWeight: 700 }}>Agendar Nova Reunião</h3>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Título da Reunião *
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reunião de Catequistas, Conselho..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Data *
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Horário *
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Local / Sala *
          <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Sala 3 da Catequese, Salão Paroquial" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Coordenador / Responsável pela Reunião
          <input
            type="text"
            value={fielId ?? ""}
            onChange={(e) => setFielId(e.target.value)}
            placeholder="Digite o nome do responsável..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }}
          />
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Pauta / Assuntos (Descritivo)
          <textarea value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder="Digite os tópicos que serão discutidos na reunião..." rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
        </label>

        <button type="submit" style={{ background: "#1f3b73", color: "white", border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginTop: 4 }}>
          Salvar na Agenda
        </button>
      </form>
      )}

      {/* LISTA DE REUNIÕES (modo buscar) */}
      {modo === "buscar" && (
      <div style={{ background: "white", padding: 20, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 12 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 14, fontWeight: 700 }}>Reuniões Registradas</h3>

        {reunioes.length === 0 ? (
          <p style={{ color: "#667085", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhuma reunião agendada.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reunioes.map((item) => (
              <div
                key={item.id}
                onClick={() => setReuniaoSelecionada(item)}
                style={{ padding: 12, border: "1px solid #eaecf0", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", cursor: "pointer", transition: "all 0.15s ease" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, color: "#101828", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#475467" }}>
                    📅 {formatarDataBR(item.data)} às {item.horario}h | 📍 {item.local}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3b73", padding: "4px 8px", background: "white", borderRadius: 6, border: "1px solid #d0d5dd", marginLeft: 8, whiteSpace: "nowrap" }}>
                  Ver Pauta 👁️
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO A4 */}
      {reuniaoSelecionada && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setReuniaoSelecionada(null)}>
        <div style={{ background: "white", borderRadius: 18, padding: 24, maxWidth: 860, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#667085" }}>Documento Oficial de Reunião</h3>
              <FontSelector fonteAtual={fonte} onChange={setFonte} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrint} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>
                Imprimir Documento de Pauta
              </button>
              <button onClick={() => setReuniaoSelecionada(null)} style={{ background: "#f1f5f9", color: "#475467", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>
                ✕ Fechar
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", background: "#f2f4f7", padding: 20, borderRadius: 14 }}>
            <article
              id="papel-reuniao"
              style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", fontFamily: `"${fonte}", serif`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
            >
              <DocumentHeader paroquia={paroquia} />
              <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, borderBottom: "2px solid #1f3b73", paddingBottom: 10, fontSize: 18, fontWeight: 800, color: "#1f3b73" }}>
                PAUTA DE REUNIÃO OFICIAL
              </h2>
              <div style={{ marginTop: 30, fontSize: "16px", display: "grid", gap: "14px", lineHeight: "1.6" }}>
                <p style={{ fontSize: "20px", color: "#1f3b73", margin: "0 0 10px 0" }}>
                  <strong>Reunião: {reuniaoSelecionada.titulo.toUpperCase()}</strong>
                </p>
                <p style={{ margin: 0 }}><strong>Data da Reunião:</strong> {formatarDataBR(reuniaoSelecionada.data)} às {reuniaoSelecionada.horario}h</p>
                <p style={{ margin: 0 }}><strong>Local / Sala:</strong> {reuniaoSelecionada.local}</p>
                <p style={{ margin: 0 }}><strong>Coordenador Responsável:</strong> {reuniaoSelecionada.nome_fiel || "Geral / Não definido"}</p>
                {reuniaoSelecionada.telefone_fiel && <p style={{ margin: 0 }}><strong>Telefone de Contato:</strong> {reuniaoSelecionada.telefone_fiel}</p>}
                <hr style={{ border: 0, borderTop: "1px solid #e4e7ec", margin: "10px 0" }} />
                <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Assuntos e Cronograma da Pauta:</strong></p>
                  <div style={{ background: "#f9fafb", padding: "15px", borderRadius: "8px", border: "1px solid #eaecf0", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                    {reuniaoSelecionada.descricao || "Nenhuma pauta detalhada foi registrada para esta reunião."}
                  </div>
                </div>
                <div style={{ marginTop: "80px", textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #667085", width: "250px", margin: "0 auto" }}></div>
                  <p style={{ fontSize: "13px", color: "#475467", marginTop: "5px", marginBottom: 0 }}>Assinatura do Responsável</p>
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