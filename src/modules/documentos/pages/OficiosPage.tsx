import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
// src/modules/documentos/pages/OficiosPage.tsx
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

interface OficiosPageProps {
  paroquia: Paroquia;
}

// 1. Definição da estrutura de dados do formulário oficial de ofício
interface OficioForm {
  numeroProtocolo: string;
  vocativoTratamento: string;
  destinatarioNome: string;
  cargoDestinatario: string;
  instituicaoDestino: string;
  assunto: string;
  cidadeData: string;
  corpoTexto: string;
  despedidaFormal: string;
  signatarioNome: string;
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

export function OficiosPage({ paroquia }: OficiosPageProps) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [espacamento, setEspacamento] = useState(1.8);

  const [form, setForm] = useState<OficioForm>({
    numeroProtocolo: "Ofício nº 001/2026",
    vocativoTratamento: "Ao Ilustríssimo Senhor,",
    destinatarioNome: "",
    cargoDestinatario: "",
    instituicaoDestino: "",
    assunto: "Solicitação de Apoio / Parceria Institucional",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    corpoTexto: "Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria para expor e solicitar o que segue. Este espaço é destinado à redação formal do teor do ofício emitido pela administração paroquial.",
    despedidaFormal: "Aproveitamos a oportunidade para renovar nossos protestos de estima e distinta consideração.",
    signatarioNome: "",
    cargoSignatario: "Pároco",
  });

  const corpoHtml = useMemo(() => plainTextToHtml(form.corpoTexto), [form.corpoTexto]);
  const despedidaHtml = useMemo(() => plainTextToHtml(form.despedidaFormal), [form.despedidaFormal]);

  function updateField<K extends keyof OficioForm>(key: K, value: OficioForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("oficio");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Ofício nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.assunto,
      destinatario: form.destinatarioNome,
      signatario: form.signatarioNome,
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
    await gerarPDFDoPreview("papel-oficio", form.assunto || "Ofício");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FORMULÁRIO ADMINISTRATIVO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Ofício Paroquial</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Emita correspondências oficiais externas para autoridades e órgãos institucionais.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <FontSelector
            fonteAtual={fonteDocumento}
            onChange={(novaFonte) => setFonteDocumento(novaFonte)}
          />
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Espaçamento entre linhas
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { label: "1.0", value: 1 },
                { label: "1.5", value: 1.5 },
                { label: "1.8", value: 1.8 },
                { label: "2.0", value: 2 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEspacamento(opt.value)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: espacamento === opt.value ? "1px solid #1f3b73" : "1px solid #d6dbe7",
                    background: espacamento === opt.value ? "#1f3b73" : "#fff",
                    color: espacamento === opt.value ? "#fff" : "#475467",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Número de Controle / Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Assunto Resumido</label>
            <input style={fieldStyle} value={form.assunto} onChange={(e) => updateField("assunto", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Pronome de Tratamento / Vocativo</label>
            <input style={fieldStyle} value={form.vocativoTratamento} onChange={(e) => updateField("vocativoTratamento", e.target.value)} placeholder="Ex: A Sua Excelência Reverendíssima," />
          </div>
          <div>
            <label style={labelStyle}>Nome da Autoridade Destinatária</label>
            <input style={fieldStyle} value={form.destinatarioNome} onChange={(e) => updateField("destinatarioNome", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Destinatário</label>
            <input style={fieldStyle} value={form.cargoDestinatario} onChange={(e) => updateField("cargoDestinatario", e.target.value)} placeholder="Ex: Secretário de Cultura" />
          </div>
          <div>
            <label style={labelStyle}>Instituição / Órgão Público</label>
            <input style={fieldStyle} value={form.instituicaoDestino} onChange={(e) => updateField("instituicaoDestino", e.target.value)} placeholder="Ex: Prefeitura Municipal de Manaus" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cidade e Localidade da Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Texto de Teor Principal do Ofício</label>
            <RichTextEditor value={corpoHtml} onChange={(html) => updateField("corpoTexto", html)} minHeight={180} lineHeight={espacamento} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Fechamento / Despedida Cortês</label>
            <RichTextEditor value={despedidaHtml} onChange={(html) => updateField("despedidaFormal", html)} minHeight={70} lineHeight={espacamento} />
          </div>
          <div>
            <label style={labelStyle}>Nome do Emitente / Autoridade Paroquial</label>
            <input style={fieldStyle} value={form.signatarioNome} onChange={(e) => updateField("signatarioNome", e.target.value)} placeholder="Ex: Pe. Éder de Souza" />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Emitente</label>
            <input style={fieldStyle} value={form.cargoSignatario} onChange={(e) => updateField("cargoSignatario", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização do Ofício Impresso</h3>
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
            id="papel-oficio"
            style={{
              width: 794, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "64px 64px 50px 76px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 40, fontSize: 15, lineHeight: espacamento, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              {/* Identificação de número e data no topo do corpo */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
                <strong>{form.numeroProtocolo}</strong>
                <span>{form.cidadeData}</span>
              </div>

              {/* Assunto formal indexado */}
              <div style={{ marginBottom: 35 }}>
                <strong>Assunto:</strong> {form.assunto}
              </div>

              {/* Endereçamento e bloco de vocativo oficial */}
              <div style={{ marginBottom: 30, lineHeight: "1.5" }}>
                <div>{form.vocativoTratamento}</div>
                {form.destinatarioNome && <div style={{ fontWeight: "bold" }}>{form.destinatarioNome}</div>}
                {form.cargoDestinatario && <div>{form.cargoDestinatario}</div>}
                {form.instituicaoDestino && <div style={{ color: "#4b5563" }}>{form.instituicaoDestino}</div>}
              </div>

              {/* Corpo de parágrafos com recuo de parágrafo clássico de digitação oficial */}
              <div
                style={{ textAlign: "justify", textIndent: "50px", marginBottom: 30, lineHeight: espacamento }}
                dangerouslySetInnerHTML={{ __html: form.corpoTexto }}
              />

              {/* Despedida de cortesia */}
              <div
                style={{ textAlign: "justify", marginBottom: 50 }}
                dangerouslySetInnerHTML={{ __html: form.despedidaFormal }}
              />

              {/* signature spacer removed */}

              {/* Assinatura formalizada e centralizada */}
              <div style={{ 
                margin: "0 auto", width: "fit-content", textAlign: "center", 
                display: "flex", flexDirection: "column", alignItems: "center"
              }}>
                <div style={{ borderTop: "1px solid #71717a", width: 320, marginBottom: 8 }} />
                <strong>{form.signatarioNome || "Nome do Responsável Legal"}</strong>
                <div style={{ fontSize: 14, color: "#3f3f46" }}>{form.cargoSignatario}</div>
              </div>
            </div>
          </PagedPreview>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Ofício"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}