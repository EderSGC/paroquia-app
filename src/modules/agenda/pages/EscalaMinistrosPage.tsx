import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { dispararImpressaoA4 } from "../utils/printHelper";

interface Escala {
  id: string;
  data: string;
  local: string;
  ministros: string;
  observacao: string;
}

const STORAGE_KEY = "escala_ministros_draft";

const MESES = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
function getMesAtual() {
  const d = new Date();
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

const areaStyle: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #d6dbe7",
  fontSize: 14,
  boxSizing: "border-box",
  fontFamily: "inherit",
  resize: "vertical",
  minHeight: "45px",
  textAlign: "center",
};

export function EscalaMinistrosPage({ paroquia }: { paroquia: Paroquia }) {
  const [fonte, setFonte] = useState("Times New Roman");
  const [periodo, setPeriodo] = useState(getMesAtual);
  const [escalas, setEscalas] = useState<Escala[]>([
    { id: "1", data: "", local: "", ministros: "", observacao: "" }
  ]);
  const [salvo, setSalvo] = useState(false);

  // Carrega rascunho salvo ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { escalas: e, periodo: p } = JSON.parse(raw);
        if (Array.isArray(e)) setEscalas(e);
        if (p) setPeriodo(p);
      }
    } catch {}
  }, []);

  // Salva automaticamente ao modificar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ escalas, periodo }));
    setSalvo(true);
    const t = setTimeout(() => setSalvo(false), 1500);
    return () => clearTimeout(t);
  }, [escalas, periodo]);

  const addLinha = () => {
    setEscalas([...escalas, { id: crypto.randomUUID(), data: "", local: "", ministros: "", observacao: "" }]);
  };

  const updateEscala = (id: string, field: keyof Escala, value: string) => {
    setEscalas(escalas.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const limpar = () => {
    if (!confirm("Deseja limpar toda a escala atual para começar um novo período?")) return;
    const novas = [{ id: crypto.randomUUID(), data: "", local: "", ministros: "", observacao: "" }];
    setEscalas(novas);
    setPeriodo(getMesAtual());
    localStorage.removeItem(STORAGE_KEY);
  };

  const tratarImpressao = () => {
    dispararImpressaoA4("papel-escala", fonte);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 24, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, color: "#1f3b73", fontWeight: 700, margin: 0 }}>Lançar Escala</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {salvo && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Rascunho salvo</span>}
            <button onClick={limpar} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #fda29b", background: "#fff1f0", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Novo Período
            </button>
          </div>
        </div>

        <FontSelector fonteAtual={fonte} onChange={setFonte} />

        <div style={{ marginBottom: 24, marginTop: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", textAlign: "center", display: "block", marginBottom: 8 }}>
            Período da Escala
          </label>
          <input
            style={{ ...areaStyle, minHeight: "40px", fontWeight: 800, fontSize: 16, border: "2px solid #1f3b73" }}
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value.toUpperCase())}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {escalas.map((item, idx) => (
            <div key={item.id} style={{ background: "#f9fafb", border: "1px solid #eaecf0", padding: "20px 12px 12px", borderRadius: 12, position: "relative" }}>
              <span style={{ fontSize: 9, color: "#98a2b3", fontWeight: 800, position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" }}>
                ITEM DA ESCALA #{idx + 1}
              </span>
              <button
                onClick={() => setEscalas(escalas.filter((x) => x.id !== item.id))}
                style={{ position: "absolute", top: 6, right: 8, color: "#fda29b", border: "none", background: "none", cursor: "pointer" }}
              >
                ✕
              </button>
              <div style={{ display: "grid", gap: 8 }}>
                <textarea style={areaStyle} placeholder="Data / Hora" value={item.data} onChange={(e) => updateEscala(item.id, "data", e.target.value)} />
                <textarea style={{ ...areaStyle, fontWeight: 700 }} placeholder="Local / Comunidade" value={item.local} onChange={(e) => updateEscala(item.id, "local", e.target.value)} />
                <textarea style={{ ...areaStyle, minHeight: "80px" }} placeholder="Nomes dos Ministros" value={item.ministros} onChange={(e) => updateEscala(item.id, "ministros", e.target.value)} />
                <textarea style={{ ...areaStyle, fontSize: 12 }} placeholder="Observações" value={item.observacao} onChange={(e) => updateEscala(item.id, "observacao", e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={addLinha} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 10, cursor: "pointer", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 800 }}>
          + Adicionar à Escala
        </button>
      </section>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: "#667085" }}>Pré-visualização do Documento</h3>
          <button onClick={tratarImpressao} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>
            Imprimir Escala
          </button>
        </div>

        <div style={{ background: "#f2f4f7", padding: "30px", borderRadius: 14, display: "flex", justifyContent: "center" }}>
          <article
            id="papel-escala"
            style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", boxShadow: "0 10px 20px rgba(0,0,0,0.05)", fontFamily: `"${fonte}", serif` }}
          >
            <DocumentHeader paroquia={paroquia} />
            <h2 style={{ textAlign: "center", fontSize: 18, margin: "40px 0 25px 0", textTransform: "uppercase", fontWeight: 800, textDecoration: "underline", color: "#1f3b73" }}>
              ESCALA DE MINISTROS EXTRAORDINÁRIOS - {periodo}
            </h2>
            <div id="conteudo-documento">
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ width: "20%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: "11px", color: "#000", fontWeight: "bold" }}>DATA / HORA</th>
                    <th style={{ width: "25%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: "11px", color: "#000", fontWeight: "bold" }}>COMUNIDADE</th>
                    <th style={{ width: "35%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: "11px", color: "#000", fontWeight: "bold" }}>MINISTROS</th>
                    <th style={{ width: "20%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2", fontSize: "11px", color: "#000", fontWeight: "bold" }}>OBSERVAÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {escalas.map((item) => (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontSize: "11px" }}>{item.data}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontWeight: 700, fontSize: "11px" }}>{item.local}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontSize: "11px" }}>{item.ministros}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontSize: "10px", fontStyle: "italic" }}>{item.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
