// src/modules/documentos/pages/CartasPage.tsx
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

interface CartasPageProps {
  paroquia: Paroquia;
}

// Estrutura de dados específica para o documento de correspondência/carta
interface CartaForm {
  numeroProtocolo: string;
  destinatario: string;
  enderecoDestinatario: string;
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

export function CartasPage({ paroquia }: CartasPageProps) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [espacamento, setEspacamento] = useState(1.8);

  const [form, setForm] = useState<CartaForm>({
    numeroProtocolo: "",
    destinatario: "",
    enderecoDestinatario: "",
    assunto: "Carta de Recomendação / Apresentação",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    saudacao: "Prezado irmão em Cristo,",
    corpo: "Apresentamos por meio desta correspondência os dados necessários ou recomendações pastorais referentes ao fiel ou à situação indicada. Este espaço é flexível para qualquer tipo de comunicação externa da paróquia.",
    despedida: "Fraternalmente em Cristo,",
    signatario: "",
    cargoSignatario: "Pároco",
  });

  const corpoHtml = useMemo(() => plainTextToHtml(form.corpo), [form.corpo]);
  const despedidaHtml = useMemo(() => plainTextToHtml(form.despedida), [form.despedida]);

  function updateField<K extends keyof CartaForm>(key: K, value: CartaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("carta");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", proximoNumero);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
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
    await gerarPDFDoPreview("papel-carta", form.assunto || "Carta Paroquial");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* PAINEL DE CONFIGURAÇÃO E FORMULÁRIO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Correspondência / Carta Paroquial</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Preencha os campos abaixo para formatar a correspondência oficial da paróquia.
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
            <label style={labelStyle}>Número de Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} placeholder={proximoNumero || "Ex: 001/2026"} />
          </div>
          <div>
            <label style={labelStyle}>Destinatário (A/C ou Nome)</label>
            <input style={fieldStyle} value={form.destinatario} onChange={(e) => updateField("destinatario", e.target.value)} placeholder="Ex: Ilmo. Sr. Fulano de Tal" />
          </div>
          <div>
            <label style={labelStyle}>Assunto / Referência</label>
            <input style={fieldStyle} value={form.assunto} onChange={(e) => updateField("assunto", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Endereço ou Local de Destino (Opcional)</label>
            <input style={fieldStyle} value={form.enderecoDestinatario} onChange={(e) => updateField("enderecoDestinatario", e.target.value)} placeholder="Ex: Paróquia São José - Diocese de..." />
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
            <label style={labelStyle}>Corpo da Carta</label>
            <RichTextEditor value={corpoHtml} onChange={(html) => updateField("corpo", html)} minHeight={180} lineHeight={espacamento} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Mensagem de Despedida</label>
            <RichTextEditor value={despedidaHtml} onChange={(html) => updateField("despedida", html)} minHeight={88} lineHeight={espacamento} />
          </div>
          <div>
            <label style={labelStyle}>Nome do Assinante</label>
            <input style={fieldStyle} value={form.signatario} onChange={(e) => updateField("signatario", e.target.value)} placeholder="Ex: Pe. João Maria" />
          </div>
          <div>
            <label style={labelStyle}>Cargo ou Título</label>
            <input style={fieldStyle} value={form.cargoSignatario} onChange={(e) => updateField("cargoSignatario", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO EM FOLHA DIGITAL */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia da Carta</h3>
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
            id="papel-carta"
            style={{
              width: 794, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "60px 64px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`
            }}
          >
            {/* Cabeçalho padrão unificado da Paróquia */}
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 40, fontSize: 15, lineHeight: espacamento, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              {/* Alinhamento da data à direita, comum em cartas formais */}
              <div style={{ textAlign: "right", marginBottom: 35 }}>
                {form.cidadeData}
              </div>

              {/* Destinatário da correspondência */}
              <div style={{ marginBottom: 25 }}>
                {form.destinatario && <div>To: <strong>{form.destinatario}</strong></div>}
                {form.enderecoDestinatario && <div style={{ color: "#374151", fontSize: 14 }}>{form.enderecoDestinatario}</div>}
              </div>

              {form.assunto && (
                <div style={{ marginBottom: 30 }}>
                  <strong>Ref:</strong> {form.assunto}
                </div>
              )}

              <p style={{ marginBottom: 20 }}>{form.saudacao}</p>

              {/* Parágrafos da carta justificados */}
              <div
                style={{ textAlign: "justify", textIndent: "50px", lineHeight: espacamento }}
                dangerouslySetInnerHTML={{ __html: form.corpo }}
              />

              <div
                style={{ marginTop: 30, marginBottom: 50 }}
                dangerouslySetInnerHTML={{ __html: form.despedida }}
              />

              {/* Espaçador flexível para empurrar a assinatura para o rodapé da folha */}
              {/* signature spacer removed */}

              {/* Bloco centralizado de assinatura */}
              <div style={{ 
                margin: "0 auto", width: "fit-content", textAlign: "center", 
                display: "flex", flexDirection: "column", alignItems: "center"
              }}>
                <div style={{ borderTop: "1px solid #71717a", width: 300, marginBottom: 8 }} />
                <strong>{form.signatario || "Nome do Responsável"}</strong>
                <div style={{ fontSize: 14, color: "#3f3f46" }}>{form.cargoSignatario}</div>
              </div>
            </div>
          </PagedPreview>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Carta"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}