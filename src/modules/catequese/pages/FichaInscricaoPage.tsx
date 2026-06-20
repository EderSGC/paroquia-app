import { printWithTitle } from "@core/utils/pdfGenerator";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useCatequese } from "../hooks/useCatequese";

interface FichaInscricaoPageProps { paroquia: Paroquia; }
interface FichaForm {
  id?: number;
  atividade: string; nome: string; nascimento: string; endereco: string;
  telefone: string; email: string; responsavel: string; observacoes: string;
}

const fieldStyle: CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #d6dbe7", background: "#fff", color: "#1a1d2e", fontSize: 14, boxSizing: "border-box" };
const labelStyle: CSSProperties = { display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em" };

export function FichaInscricaoPage({ paroquia }: FichaInscricaoPageProps) {
  const { fichas, salvarFicha, excluirFicha } = useCatequese();
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<FichaForm>({
    atividade: "Catequese", nome: "", nascimento: "", endereco: "", telefone: "", email: "", responsavel: "", observacoes: ""
  });

  const handleDataChange = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{2})/, "$1/$2");
    updateField("nascimento", v);
  };

  const handleTelChange = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{4})/, "($1) $2");
    updateField("telefone", v);
  };

  function updateField<K extends keyof FichaForm>(key: K, value: FichaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const handleSalvar = async () => {
    await salvarFicha(form);
    setForm({ atividade: "Catequese", nome: "", nascimento: "", endereco: "", telefone: "", email: "", responsavel: "", observacoes: "" });
  };

  function imprimir() { printWithTitle("Ficha de Inscrição - Catequese"); }

  const fichasFiltradas = busca
    ? fichas.filter(f => f.nome?.toLowerCase().includes(busca.toLowerCase()))
    : fichas;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <style>{`
        @media print {
          body > *:not(#root) { display: none !important; }
          #root > *:not(div) { display: none !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; visibility: visible !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 98% !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <section className="no-print" style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28, flex: 1 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Ficha de inscrição</h2>
          <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 24 }}>
            <div><label style={labelStyle}>Atividade</label><input style={fieldStyle} value={form.atividade} onChange={(e) => updateField("atividade", e.target.value)} /></div>
            <div><label style={labelStyle}>Nome completo</label><input style={fieldStyle} value={form.nome} onChange={(e) => updateField("nome", e.target.value)} /></div>
            <div><label style={labelStyle}>Data de nascimento</label><input style={fieldStyle} placeholder="dd/mm/aaaa" value={form.nascimento} onChange={(e) => handleDataChange(e.target.value)} /></div>
            <div><label style={labelStyle}>Telefone</label><input style={fieldStyle} placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => handleTelChange(e.target.value)} /></div>
            <div><label style={labelStyle}>E-mail</label><input style={fieldStyle} value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
            <div><label style={labelStyle}>Responsável</label><input style={fieldStyle} value={form.responsavel} onChange={(e) => updateField("responsavel", e.target.value)} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Endereço</label><input style={fieldStyle} value={form.endereco} onChange={(e) => updateField("endereco", e.target.value)} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Observações</label><textarea style={{ ...fieldStyle, minHeight: 100 }} value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} /></div>
          </div>
          <button onClick={handleSalvar} style={{ marginTop: 20, background: "#1f3b73", color: "white", padding: "12px 24px", border: "none", borderRadius: 10, cursor: "pointer" }}>Registrar Ficha</button>
        </section>

        <section className="no-print" style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28, width: 300, flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 12px" }}>Inscrições Salvas</h3>
          <input style={{ ...fieldStyle, marginBottom: 15 }} placeholder="🔍 Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>{fichasFiltradas.map(f => (
              <tr key={f.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10, cursor: 'pointer' }} onClick={() => setForm({ id: f.id, atividade: f.atividade || "Catequese", nome: f.nome || "", nascimento: f.nascimento || "", endereco: f.endereco || "", telefone: f.telefone || "", email: f.email || "", responsavel: f.responsavel || "", observacoes: f.observacoes || "" })}>{f.nome}</td>
                <td style={{ padding: 10 }}>
                  <button onClick={() => setForm({ id: f.id, atividade: f.atividade || "Catequese", nome: f.nome || "", nascimento: f.nascimento || "", endereco: f.endereco || "", telefone: f.telefone || "", email: f.email || "", responsavel: f.responsavel || "", observacoes: f.observacoes || "" })} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 10 }}>✏️</button>
                  <button onClick={() => excluirFicha(f.id)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>🗑️</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      </div>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <h3>Prévia para impressão</h3>
          <button onClick={imprimir} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", cursor: "pointer" }}>Imprimir / Salvar em PDF</button>
        </div>
        <div className="print-area" style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article ref={printRef} style={{ width: 794, background: "white", padding: "48px 54px", boxSizing: "border-box", fontFamily: `${fonteDocumento}, sans-serif`, color: "#111827" }}>
            <DocumentHeader paroquia={paroquia} />
            <h1 style={{ textAlign: "center", fontSize: 24, marginTop: 28 }}>Ficha de Inscrição</h1>
            <div style={{ textAlign: "center", color: "#475467" }}>{form.atividade}</div>
            <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
              {[["Nome completo", form.nome], ["Data de nascimento", form.nascimento], ["Endereço", form.endereco], ["Telefone", form.telefone], ["E-mail", form.email], ["Responsável", form.responsavel], ["Observações", form.observacoes]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>{l}</div><div style={{ borderBottom: "1px solid #d0d5dd", minHeight: 34, paddingTop: 8 }}>{v || " "}</div></div>
              ))}
            </div>
            <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #98a2b3", marginBottom: 10 }} />Assinatura do inscrito(a)</div>
              <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #98a2b3", marginBottom: 10 }} />Assinatura do responsável</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}