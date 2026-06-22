import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { dispararImpressaoA4 } from "../utils/printHelper";

interface Missa {
  id: string;
  data: string;
  local: string;
  horario: string;
  celebrante: string;
}

const STORAGE_KEY = "programa_missas_draft";

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

export function ProgramaMissasPage({ paroquia }: { paroquia: Paroquia }) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [missas, setMissas] = useState<Missa[]>([
    { id: "1", data: "", local: "", horario: "", celebrante: "" },
  ]);
  const [mesAno, setMesAno] = useState(getMesAtual);
  const [salvo, setSalvo] = useState(false);

  const carregouRef = useRef(false);

  // Carrega rascunho salvo ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { missas: m, mesAno: ma } = JSON.parse(raw);
        if (Array.isArray(m)) setMissas(m);
        if (ma) setMesAno(ma);
      }
    } catch {}
    carregouRef.current = true;
  }, []);

  // Salva automaticamente ao modificar (só após carregamento)
  useEffect(() => {
    if (!carregouRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ missas, mesAno }));
    setSalvo(true);
    const t = setTimeout(() => setSalvo(false), 1500);
    return () => clearTimeout(t);
  }, [missas, mesAno]);

  const addLinha = () => {
    setMissas([...missas, { id: crypto.randomUUID(), data: "", local: "", horario: "", celebrante: "" }]);
  };

  const updateMissa = (id: string, field: keyof Missa, value: string) => {
    setMissas(missas.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const limpar = () => {
    if (!confirm("Deseja limpar toda a programação atual para começar um novo mês?")) return;
    const novas = [{ id: crypto.randomUUID(), data: "", local: "", horario: "", celebrante: "" }];
    setMissas(novas);
    setMesAno(getMesAtual());
    localStorage.removeItem(STORAGE_KEY);
  };

  const tratarImpressao = () => {
    dispararImpressaoA4("papel-agenda", fonteDocumento);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 24, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, color: "#1f3b73", fontWeight: 700, margin: 0 }}>Lançar Programação</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {salvo && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Rascunho salvo</span>}
            <button onClick={limpar} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #fda29b", background: "#fff1f0", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Novo Mês
            </button>
          </div>
        </div>

        <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte: string) => setFonteDocumento(novaFonte)} />

        <div style={{ marginBottom: 24, marginTop: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", textAlign: "center", display: "block", marginBottom: 8 }}>
            Mês / Ano
          </label>
          <input
            style={{ ...areaStyle, minHeight: "40px", fontWeight: 800, fontSize: 16, border: "2px solid #1f3b73" }}
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value.toUpperCase())}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {missas.map((m, idx) => (
            <div key={m.id} style={{ background: "#f9fafb", border: "1px solid #eaecf0", padding: "20px 12px 12px", borderRadius: 12, position: "relative" }}>
              <span style={{ fontSize: 9, color: "#98a2b3", fontWeight: 800, position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)" }}>
                DIA #{idx + 1}
              </span>
              <button
                onClick={() => setMissas(missas.filter((x) => x.id !== m.id))}
                style={{ position: "absolute", top: 6, right: 8, color: "#fda29b", border: "none", background: "none", cursor: "pointer" }}
              >
                ✕
              </button>
              <div style={{ display: "grid", gap: 8 }}>
                <textarea style={areaStyle} placeholder="Data / Festa" value={m.data} onChange={(e) => updateMissa(m.id, "data", e.target.value)} />
                <textarea style={{ ...areaStyle, fontWeight: 700 }} placeholder="Locais (Um por linha)" value={m.local} onChange={(e) => updateMissa(m.id, "local", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <textarea style={{ ...areaStyle, color: "#d946ef", fontWeight: 700 }} placeholder="Horários" value={m.horario} onChange={(e) => updateMissa(m.id, "horario", e.target.value)} />
                  <textarea style={areaStyle} placeholder="Celebrantes" value={m.celebrante} onChange={(e) => updateMissa(m.id, "celebrante", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addLinha} style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 10, cursor: "pointer", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 800 }}>
          + Adicionar Dia
        </button>
      </section>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: "#667085" }}>Prévia do Documento</h3>
          <button onClick={tratarImpressao} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>
            Imprimir Programação
          </button>
        </div>

        <div style={{ background: "#f2f4f7", padding: "30px", borderRadius: 14, display: "flex", justifyContent: "center" }}>
          <article
            id="papel-agenda"
            style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", boxShadow: "0 10px 20px rgba(0,0,0,0.05)", fontFamily: `"${fonteDocumento}", sans-serif` }}
          >
            <DocumentHeader paroquia={paroquia} />
            <h2 style={{ textAlign: "center", fontSize: 18, margin: "40px 0 25px 0", textTransform: "uppercase", fontWeight: 800, textDecoration: "underline", color: "#1f3b73" }}>
              PROGRAMAÇÃO DE MISSAS - {mesAno}
            </h2>
            <div id="conteudo-documento">
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ width: "22%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2" }}>DATA / FESTA</th>
                    <th style={{ width: "40%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2" }}>COMUNIDADE / LOCAL</th>
                    <th style={{ width: "13%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2" }}>HORÁRIO</th>
                    <th style={{ width: "25%", border: "1.5px solid #000", padding: "10px", backgroundColor: "#f2f2f2" }}>PRESIDENTE</th>
                  </tr>
                </thead>
                <tbody>
                  {missas.map((m) => (
                    <tr key={m.id}>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontSize: "11px" }}>{m.data}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontWeight: 700, fontSize: "11px" }}>{m.local}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontWeight: 800, fontSize: "11px" }}>{m.horario}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center", verticalAlign: "middle", whiteSpace: "pre-wrap", fontSize: "11px" }}>{m.celebrante}</td>
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
