import { useToast } from "@core/ui/Toast";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { RegistrosList } from "../components/RegistrosList";
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

export function CertificadoMatrimonioPage({ paroquia }: Props) {
  const { showToast } = useToast();
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Times New Roman");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [form, setForm] = useState({
    esposo: "",
    esposa: "",
    dataMatrimonio: "",
    local: "",
    celebrante: "",
    funcaoCelebrante: "",
    testemunha1: "",
    testemunha2: "",
    livro: "",
    folha: "",
    termo: "",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    assinante: "",
    cargoAssinante: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const salvarNoBanco = async () => {
    if (!form.esposo && !form.esposa) { showToast("Preencha os nomes dos nubentes.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(form);
      const result = await SacramentalRepository.registros.upsert(
        "CERT_MATRIMONIO", `${form.esposo} & ${form.esposa}`, form.dataMatrimonio, form.celebrante, form.local, jsonDados,
        editandoId !== null ? editandoId : undefined
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
          @media screen { #papel-matrimonio { display: none; } }
        `}</style>

      {/* BUSCA E LISTA */}
      <div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input style={{ flex: 1, padding: "13px 16px", borderRadius: "14px", border: "1px solid #d0d5dd", background: "rgba(255,255,255,0.92)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Buscar por nome dos nubentes..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => setForm(f => ({ ...f, esposo: "", esposa: "" }))} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "13px 20px", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>+ Novo</button>
        </div>
        <RegistrosList tipo="CERT_MATRIMONIO" busca={busca} recarregarKey={recarregarKey}
          onExcluir={() => setEditandoId(null)}
          onSelecionar={(d, registro) => { setEditandoId(registro.id); setForm(f => ({ ...f, ...(d as Record<string, string>) })); }} />
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", padding: "10px 16px", background: "rgba(31,59,115,0.08)", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#1f3b73" }}>
            📖 Buscar nos Registros de Matrimônio (para preencher a certidão)
          </summary>
          <div style={{ paddingTop: "8px" }}>
            <RegistrosList tipo="MATRIMONIO" busca={busca} recarregarKey={0}
              onSelecionar={(d) => { const data = d as Record<string, string>; setForm(f => ({ ...f, esposo: data.noivoNome || f.esposo, esposa: data.noivaNome || f.esposa, dataMatrimonio: data.celDia || f.dataMatrimonio, local: data.celLocal || f.local, celebrante: data.ataCelebrante || f.celebrante, testemunha1: data.test1Nome || f.testemunha1, testemunha2: data.test2Nome || f.testemunha2, livro: data.livroReg || f.livro, folha: data.folhaReg || f.folha, termo: data.numReg || f.termo })); }} />
          </div>
        </details>
      </div>

      {/* SEÇÃO DE FORMULÁRIO */}
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
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Certidão de Matrimônio</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Insira os dados do casal para gerar o certificado oficial.
        </p>

        {/* 3. Inclusão do Seletor de Fontes com separador visual */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector 
            fonteAtual={fonteDocumento} 
            onChange={(novaFonte) => setFonteDocumento(novaFonte)} 
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Nome do Esposo (Noivo)</label>
            <input style={fieldStyle} value={form.esposo} onChange={(e) => updateField("esposo", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Nome da Esposa (Noiva)</label>
            <input style={fieldStyle} value={form.esposa} onChange={(e) => updateField("esposa", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data do Sacramento</label>
            <input style={fieldStyle} value={form.dataMatrimonio} onChange={(e) => updateField("dataMatrimonio", e.target.value)} placeholder="Ex: 15 de Maio de 2026" />
          </div>

          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Local da Celebração</label>
            <input style={fieldStyle} value={form.local} onChange={(e) => updateField("local", e.target.value)} placeholder="Ex: Igreja Matriz / Capela Santo Antônio" />
          </div>
          <div>
            <label style={labelStyle}>L / F / T</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={fieldStyle} placeholder="L" value={form.livro} onChange={(e) => updateField("livro", e.target.value)} />
              <input style={fieldStyle} placeholder="F" value={form.folha} onChange={(e) => updateField("folha", e.target.value)} />
              <input style={fieldStyle} placeholder="T" value={form.termo} onChange={(e) => updateField("termo", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Celebrante</label>
            <input style={fieldStyle} value={form.celebrante} onChange={(e) => updateField("celebrante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Função do Celebrante</label>
            <input style={fieldStyle} value={form.funcaoCelebrante} onChange={(e) => updateField("funcaoCelebrante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Testemunhas / Padrinhos</label>
            <div style={{ display: "flex", gap: 12 }}>
              <input style={fieldStyle} placeholder="Testemunha 1" value={form.testemunha1} onChange={(e) => updateField("testemunha1", e.target.value)} />
              <input style={fieldStyle} placeholder="Testemunha 2" value={form.testemunha2} onChange={(e) => updateField("testemunha2", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Assinante</label>
            <input style={fieldStyle} value={form.assinante} onChange={(e) => updateField("assinante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Assinante</label>
            <input style={fieldStyle} value={form.cargoAssinante} onChange={(e) => updateField("cargoAssinante", e.target.value)} />
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PRÉVIA */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia para impressão</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={salvarNoBanco} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{editandoId ? "💾 Atualizar" : "💾 Salvar"}</button>
            {editandoId && <button onClick={() => setEditandoId(null)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: 14, cursor: "pointer", padding: "13px 22px", fontWeight: 700 }}>✕ Novo</button>}
            <button onClick={() => gerarPDFDoPreview("papel-matrimonio", `Certidão de Matrimônio — ${form.esposo || "Documento"}`)} style={{ background: "linear-gradient(135deg, #1f3b73 0%, #2b5fb8 100%)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 25px rgba(31,59,115,0.28)" }}>Imprimir Certidão</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article
            id="papel-matrimonio"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", borderRadius: 8, padding: "48px 54px",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)", boxSizing: "border-box", color: "#111827",
              textAlign: "center", 
              // 4. Aplicação da fonte escolhida
              fontFamily: `${fonteDocumento}, serif`, 
              display: "flex", flexDirection: "column"
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <h1 style={{ fontSize: "26px", margin: "60px 0 30px", fontWeight: "bold", textTransform: "uppercase" }}>Certidão de Matrimônio</h1>
            
            <div style={{ fontSize: "14px", lineHeight: "2.2", textAlign: "center", flexGrow: 1 }}>
              <p>Certificamos que, perante a Igreja de Deus e as leis sagradas, uniram-se em matrimônio:</p>
              
              <div style={{ margin: "20px 0" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "5px 0" }}>{form.esposo || "_________________________"}</h2>
                <p style={{ margin: 0, fontStyle: "italic" }}>e</p>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "5px 0" }}>{form.esposa || "_________________________"}</h2>
              </div>

              <p style={{ marginTop: "20px" }}>
                A cerimônia foi realizada no dia <strong>{form.dataMatrimonio || "________"}</strong>, <br/>
                na <strong>{form.local || "________________"}</strong>, <br/>
                desta {paroquia.nome}.
              </p>

              <p style={{ marginTop: "15px" }}>
                <strong>Celebrada solenemente pelo</strong></p> <p>Revmo. <strong>{form.celebrante}</strong>.
              </p>

              <p style={{ marginTop: "30px" }}><strong>Foram testemunhas deste ato sagrado:</strong></p>
              <div style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0" }}>
                {form.testemunha1 || "________"} <br/>
                <span style={{ fontWeight: "normal", fontSize: "14px" }}><strong>e</strong></span> <br/>
                {form.testemunha2 || "________"}
              </div>

              <p style={{ marginTop: "40px", fontStyle: "italic", fontSize: "12px" }}>
                E para que este ato tenha validade jurídica e eclesiástica, foi lavrado o termo no <br/>
                livro nº {form.livro || "___"}, folha nº {form.folha || "___"}, sob o nº {form.termo || "___"}.
              </p>
            </div>

            <div style={{ 
              marginLeft: "auto", width: "fit-content", textAlign: "center", 
              display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 
            }}>
              <p style={{ fontSize: "12px", marginBottom: 40 }}>{form.cidadeData}</p>
              <div style={{ borderTop: "1px solid #000", width: 280, marginBottom: 10 }} />
              <strong style={{ fontSize: "14px" }}>{form.assinante || ""}</strong>
              <div style={{ fontSize: "12px" }}>{form.cargoAssinante}</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}