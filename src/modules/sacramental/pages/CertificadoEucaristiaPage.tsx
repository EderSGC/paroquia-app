import { useToast } from "@core/ui/Toast";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import { SacramentalRepository } from '../repository/sacramental.repository';

interface Props {
  paroquia: Paroquia;
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "#111827",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  transition: "all .2s ease",
  boxSizing: "border-box",
  boxShadow: `
    inset 0 1px 2px rgba(255,255,255,0.6),
    0 1px 2px rgba(15,23,42,0.04)
  `,
};

const labelStyle: CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#667085",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

export function CertificadoEucaristiaPage({ paroquia }: Props) {
  const { showToast } = useToast();
  const [fonteDocumento, setFonteDocumento] = useState("Times New Roman");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);

  const [form, setForm] = useState({
    fiel: "",
    dataEucaristia: "",
    local: "",
    celebrante: "",
    catequista: "",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    assinante: "",
    cargoAssinante: "Pároco",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const salvarNoBanco = async () => {
    if (!form.fiel) { showToast("Preencha o nome do fiel.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(form);
      const result = await SacramentalRepository.registros.upsert(
        "CERT_EUCARISTIA", form.fiel, form.dataEucaristia, form.celebrante, form.local, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Certidão atualizada com sucesso!" : "Certidão salva com sucesso!", "success");
    } catch (e) { showToast("Erro ao salvar.", "error"); console.error(e); }
  };

  return (
    <div
  style={{
    display: "grid",
    gap: 24,
    padding: 30,
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  }}
>
      <style>{`
          @media screen { #papel-eucaristia { display: none; } }
        `}</style>

      {/* BUSCA E LISTA */}
      <div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input style={{ flex: 1, padding: "13px 16px", borderRadius: "14px", border: "1px solid #d0d5dd", background: "rgba(255,255,255,0.92)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Buscar por nome do fiel..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => { setForm(f => ({ ...f, fiel: "", dataEucaristia: "" })); setEditandoId(null); }} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "13px 20px", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>+ Novo</button>
        </div>
        <RegistrosList tipo="CERT_EUCARISTIA" busca={busca} recarregarKey={recarregarKey}
          onExcluir={() => setEditandoId(null)}
          onSelecionar={(d, registro) => { setEditandoId(registro.id); setForm(f => ({ ...f, ...(d as Record<string, string>) })); }} />
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", padding: "10px 16px", background: "rgba(31,59,115,0.08)", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#1f3b73" }}>
            📖 Buscar nos Registros de Eucaristia (para preencher a certidão)
          </summary>
          <div style={{ paddingTop: "8px" }}>
            <RegistrosList tipo="EUCARISTIA" busca={busca} recarregarKey={0}
              onSelecionar={(d) => { const data = d as Record<string, string>; setForm(f => ({ ...f, fiel: data.nome || f.fiel, dataEucaristia: data.dataComunhao || f.dataEucaristia, local: data.local || f.local, catequista: data.catequista || f.catequista, celebrante: data.catequista || f.celebrante })); }} />
          </div>
        </details>
        <BuscarFielPastoral onSelecionar={f => { setForm(prev => ({ ...prev, fiel: f.nome })); setFielId(f.id); }} label="Buscar Fiel no Módulo Pastoral" />
      </div>

      {/* FORMULÁRIO DE ENTRADA */}
      <section
  style={{
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.6)",
    padding: 32,
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
  }}
>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Lembrança da Primeira Eucaristia</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Preencha os dados da criança para gerar o certificado oficial.
        </p>

        {/* 3. Inclusão do Seletor de Fontes */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector 
            fonteAtual={fonteDocumento} 
            onChange={(novaFonte) => setFonteDocumento(novaFonte)} 
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Nome da Criança</label>
            <input style={fieldStyle} value={form.fiel} onChange={(e) => updateField("fiel", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data da Comunhão</label>
            <input style={fieldStyle} value={form.dataEucaristia} onChange={(e) => updateField("dataEucaristia", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Igreja/Comunidade</label>
            <input style={fieldStyle} value={form.local} onChange={(e) => updateField("local", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Catequista</label>
            <input style={fieldStyle} value={form.catequista} onChange={(e) => updateField("catequista", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Celebrante</label>
            <input style={fieldStyle} value={form.celebrante} onChange={(e) => updateField("celebrante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Assinante</label>
            <input style={fieldStyle} value={form.assinante} onChange={(e) => updateField("assinante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Função</label>
            <select style={fieldStyle} value={form.cargoAssinante} onChange={(e) => updateField("cargoAssinante", e.target.value)}>
              <option value="Pároco">Pároco</option>
              <option value="Vigário">Vigário</option>
              <option value="Administrador Paroquial">Administrador Paroquial</option>
              <option value="Administrador de Área">Administrador de Área</option>
            </select>
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉVIA E IMPRESSÃO */}
      <section
  style={{
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.6)",
    padding: 32,
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
  }}
>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={salvarNoBanco} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", cursor: "pointer", fontWeight: 700 }}>{editandoId ? "💾 Atualizar" : "💾 Salvar"}</button>
          {editandoId && <button onClick={() => setEditandoId(null)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: 14, cursor: "pointer", padding: "13px 22px", fontWeight: 700 }}>✕ Novo</button>}
          <button onClick={() => gerarPDFDoPreview("papel-eucaristia", `Primeira Eucaristia — ${form.fiel || "Documento"}`)} style={{ background: "linear-gradient(135deg, #1f3b73 0%, #2b5fb8 100%)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", cursor: "pointer", fontWeight: 700, boxShadow: "0 10px 25px rgba(31,59,115,0.28)" }}>Imprimir Eucaristia</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", padding: 20, borderRadius: 16 }}>
          <article 
            id="papel-eucaristia" 
            style={{ 
              width: 794, 
              minHeight: 1123, 
              background: "white", 
              padding: "60px", 
              boxSizing: "border-box", 
              textAlign: "center", 
              // 4. APLICANDO A FONTE DINÂMICA
              fontFamily: `${fonteDocumento}, serif`, 
              display: "flex", 
              flexDirection: "column" 
            }}
          >
            <DocumentHeader paroquia={paroquia} />
            
            <h1 style={{ fontSize: "30px", color: "#1f3b73", marginTop: "60px", textTransform: "uppercase" }}>Lembrança da Primeira Eucaristia</h1>

            <div style={{ marginTop: "50px", fontSize: "18px", lineHeight: "1.8" }}>
              <p style={{ margin: 0 }}>Certificamos que</p>
              <h2 style={{ fontSize: "26pt", fontWeight: "bold", margin: "10px 0" }}>{form.fiel || "________________________________"}</h2>
              <p style={{ marginTop: "20px" }}>recebeu pela primeira vez o Pão da Vida no dia <strong>{form.dataEucaristia || "___/___/___"}</strong>,</p>
              <p>na <strong>{form.local || "________________"}</strong>,</p>
              <p>desta <strong>{paroquia.nome}</strong>.</p>
            </div>

            <div style={{ margin: "60px auto", maxWidth: "85%", fontStyle: "italic", color: "#374151", fontSize: "17px" }}>
              "Quem come a minha carne e bebe o meu sangue tem a vida eterna, e eu o ressuscitarei no último dia." (João 6:54)
            </div>

            <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "1fr 1fr", textAlign: "left", fontSize: "15px" }}>
              <div><strong>Catequista:</strong> {form.catequista || "________________"}</div>
              <div><strong>Celebrante:</strong> {form.celebrante || "________________"}</div>
            </div>

            <div style={{ marginTop: "auto", marginLeft: "auto", width: "300px", textAlign: "center" }}>
              <p style={{ fontSize: "14px", marginBottom: "50px" }}>{form.cidadeData}</p>
              <div style={{ borderTop: "1px solid #000", width: "100%", marginBottom: "5px" }} />
              <p style={{ margin: 0 }}><strong>{form.assinante || "Pe. Nome do Assinante"}</strong></p>
              <p style={{ margin: 0, fontSize: "14px" }}>{form.cargoAssinante}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}