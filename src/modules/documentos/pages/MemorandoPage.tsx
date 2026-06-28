import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { PagedPreview } from "@core/components/PagedPreview";
import { RichTextEditor, plainTextToHtml } from "@core/components/RichTextEditor";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface MemorandoPageProps {
  paroquia: Paroquia;
}

interface MemorandoForm {
  numero: string;
  destinatario: string;
  cargoDestinatario: string;
  assunto: string;
  cidadeData: string;
  saudacao: string;
  corpo: string;
  despedida: string;
  signatario: string;
  cargoSignatario: string;
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d6dbe7",
  background: "#fff",
  color: "#1a1d2e",
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#667085",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export function MemorandoPage({ paroquia }: MemorandoPageProps) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [espacamento, setEspacamento] = useState(1.8);

  const [form, setForm] = useState<MemorandoForm>({
    numero: "001/2026",
    destinatario: "",
    cargoDestinatario: "",
    assunto: "",
    // Data automática para facilitar sua rotina em Manaus
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    saudacao: "Prezado(a),",
    corpo:
      "Escreva aqui o texto do memorando. Este espaço pode ser usado para orientações pastorais, convites, comunicações internas ou registros administrativos da paróquia.",
    despedida: "Sem mais para o momento, renovo votos de estima e consideração.",
    signatario: "",
    cargoSignatario: "Secretaria Paroquial",
  });

  const corpoHtml = useMemo(() => plainTextToHtml(form.corpo), [form.corpo]);
  const despedidaHtml = useMemo(() => plainTextToHtml(form.despedida), [form.despedida]);

  function updateField<K extends keyof MemorandoForm>(key: K, value: MemorandoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("memorando");

  useEffect(() => {
    if (proximoNumero && !form.numero) updateField("numero", proximoNumero);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numero,
      assunto: form.assunto,
      destinatario: form.destinatario,
      signatario: form.signatario,
      data_emissao: new Date().toISOString().split("T")[0],
      json_dados: JSON.stringify(form),
    });
  }

  function handleEditar(reg: DocumentoRegistro) {
    try {
      const dados = JSON.parse(reg.json_dados || "{}");
      if (Object.keys(dados).length > 0) {
        setForm(dados);
        iniciarEdicao(reg.id);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { /* json inválido */ }
  }

  async function imprimir() {
    await gerarPDFDoPreview("papel-memorando", form.assunto || "Memorando");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* SEÇÃO DE FORMULÁRIO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Memorando paroquial</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Configure o estilo visual e preencha os dados para gerar o documento oficial.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Espaçamento entre linhas</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ label: "1.0", value: 1 }, { label: "1.5", value: 1.5 }, { label: "1.8", value: 1.8 }, { label: "2.0", value: 2 }].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setEspacamento(opt.value)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: espacamento === opt.value ? "1px solid #1f3b73" : "1px solid #d6dbe7", background: espacamento === opt.value ? "#1f3b73" : "#fff", color: espacamento === opt.value ? "#fff" : "#475467" }}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Número do Memorando</label>
            <input style={fieldStyle} value={form.numero} onChange={(e) => updateField("numero", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Assunto</label>
            <input style={fieldStyle} value={form.assunto} onChange={(e) => updateField("assunto", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Destinatário</label>
            <input style={fieldStyle} value={form.destinatario} onChange={(e) => updateField("destinatario", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Destinatário</label>
            <input style={fieldStyle} value={form.cargoDestinatario} onChange={(e) => updateField("cargoDestinatario", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Saudação Inicial</label>
            <input style={fieldStyle} value={form.saudacao} onChange={(e) => updateField("saudacao", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Texto do Memorando</label>
            <RichTextEditor value={corpoHtml} onChange={(html) => updateField("corpo", html)} minHeight={160} lineHeight={espacamento} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Despedida</label>
            <RichTextEditor value={despedidaHtml} onChange={(html) => updateField("despedida", html)} minHeight={88} lineHeight={espacamento} />
          </div>
          <div>
            <label style={labelStyle}>Assinatura</label>
            <input style={fieldStyle} value={form.signatario} onChange={(e) => updateField("signatario", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Assinante</label>
            <input style={fieldStyle} value={form.cargoSignatario} onChange={(e) => updateField("cargoSignatario", e.target.value)} />
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PRÉVIA */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia para impressão</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleRegistrar}
              type="button"
              style={{ background: "#0e9f6e", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {editandoId !== null ? "💾 Salvar Edição" : "✓ Registrar Documento"}
            </button>
            <button
              onClick={imprimir}
              type="button"
              style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              🖨 Imprimir / PDF
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <PagedPreview
            id="papel-memorando"
            style={{
              width: 794, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "48px 54px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 28, fontSize: 14, lineHeight: espacamento, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                <strong>Memorando nº {form.numero || "____/____"}</strong>
                <span>{form.cidadeData}</span>
              </div>

              <div style={{ marginTop: 26 }}>
                <strong>Destinatário:</strong> {form.destinatario || "________________________________"}
              </div>
              <div>
                <strong>Cargo:</strong> {form.cargoDestinatario || "________________________________"}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Assunto:</strong> {form.assunto || "________________________________"}
              </div>

              <p style={{ marginTop: 28 }}>{form.saudacao}</p>

              <div
                style={{ textAlign: "justify", lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: form.corpo }}
              />

              <div
                style={{ marginTop: 22 }}
                dangerouslySetInnerHTML={{ __html: form.despedida }}
              />

              {/* signature spacer removed */}

              <div style={{ 
                marginLeft: "auto", width: "fit-content", textAlign: "center", 
                display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 
              }}>
                <div style={{ borderTop: "1px solid #98a2b3", width: 280, marginBottom: 10 }} />
                <strong>{form.signatario || "Nome do responsável"}</strong>
                <div style={{ fontSize: 13 }}>{form.cargoSignatario}</div>
              </div>
            </div>
          </PagedPreview>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Memorando"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}