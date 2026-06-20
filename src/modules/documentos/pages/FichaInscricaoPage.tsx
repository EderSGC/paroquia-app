import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 6) return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
  if (v.length > 2) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
  return v;
};

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface FichaInscricaoPageProps {
  paroquia: Paroquia;
}

interface FichaForm {
  numeroProtocolo: string;
  atividade: string;
  nome: string;
  nascimento: string;
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
  observacoes: string;
  assinaturaResponsavel: string;
  cargoResponsavel: string;
  parocoVigario: string;
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

export function FichaInscricaoPage({ paroquia }: FichaInscricaoPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<FichaForm>({
    numeroProtocolo: "",
    atividade: "Catequese",
    nome: "",
    nascimento: "",
    endereco: "",
    telefone: "",
    email: "",
    responsavel: "",
    observacoes: "",
    assinaturaResponsavel: "",
    cargoResponsavel: "",
    parocoVigario: "",
  });

  function updateField<K extends keyof FichaForm>(key: K, value: FichaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("ficha");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", proximoNumero);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.atividade,
      destinatario: form.nome,
      signatario: form.assinaturaResponsavel,
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
    await gerarPDFDoPreview("papel-ficha", `Ficha de Inscrição - ${form.atividade || "Atividade"}`);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

      {/* SEÇÃO DE FORMULÁRIO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Ficha de Inscrição</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Modelo base para inscrições em atividades da comunidade.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Nº Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Atividade</label>
            <input style={fieldStyle} value={form.atividade} onChange={(e) => updateField("atividade", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Nome Completo</label>
            <input style={fieldStyle} value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data de Nascimento</label>
            <input type="date" style={fieldStyle} value={form.nascimento} onChange={(e) => updateField("nascimento", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input style={fieldStyle} placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => updateField("telefone", maskPhone(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input style={fieldStyle} value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>
              Responsável <span style={{ color: "#e53e3e" }}>*</span>{" "}
              <span style={{ fontWeight: 400, fontSize: 11, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>(Pai/Mãe)</span>
            </label>
            <input style={fieldStyle} value={form.responsavel} onChange={(e) => updateField("responsavel", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Endereço</label>
            <input style={fieldStyle} value={form.endereco} onChange={(e) => updateField("endereco", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Observações</label>
            <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Assinatura do Responsável</label>
            <input style={fieldStyle} value={form.assinaturaResponsavel} onChange={(e) => updateField("assinaturaResponsavel", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Assinante</label>
            <input style={fieldStyle} value={form.cargoResponsavel} onChange={(e) => updateField("cargoResponsavel", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Pároco / Vigário</label>
            <input style={fieldStyle} placeholder="Nome do Pároco ou Vigário" value={form.parocoVigario} onChange={(e) => updateField("parocoVigario", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉVIA */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia para Impressão</h3>
            <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 13 }}>Modelo pronto para arquivo físico ou digital.</p>
          </div>
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

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16, overflowX: "auto" }}>
          <article
            id="papel-ficha"
            ref={printRef}
            style={{
              width: 794,
              minHeight: 1123,
              background: "white",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8,
              padding: "40px 56px 40px 64px",
              boxSizing: "border-box",
              color: "#111827",
              display: "flex",
              flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            {/* Título compacto logo abaixo do cabeçalho */}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <h1 style={{ margin: 0, fontSize: 20, color: "#1f3b73" }}>Ficha de Inscrição</h1>
              <div style={{ marginTop: 2, color: "#475467", fontSize: 13 }}>{form.atividade}</div>
              {form.numeroProtocolo && (
                <div style={{ marginTop: 2, fontSize: 11, color: "#94a3b8" }}>Nº {form.numeroProtocolo}</div>
              )}
            </div>

            {/* Campos em duas colunas para aproveitar a largura */}
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px" }}>
              {[
                ["Nome Completo", form.nome],
                ["Data de Nascimento", form.nascimento ? new Date(form.nascimento + "T12:00:00").toLocaleDateString("pt-BR") : ""],
                ["Telefone", form.telefone],
                ["E-mail", form.email],
                ["Responsável", form.responsavel],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}
                  </div>
                  <div style={{ borderBottom: "1px solid #d0d5dd", minHeight: 28, paddingTop: 4, fontSize: 13 }}>
                    {value || " "}
                  </div>
                </div>
              ))}
            </div>

            {/* Campos de largura total */}
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {[
                ["Endereço", form.endereco],
                ["Observações", form.observacoes],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}
                  </div>
                  <div style={{ borderBottom: "1px solid #d0d5dd", minHeight: 28, paddingTop: 4, fontSize: 13 }}>
                    {value || " "}
                  </div>
                </div>
              ))}
            </div>

            {/* Assinaturas fixadas no rodapé via marginTop: auto */}
            <div style={{ marginTop: "auto", paddingTop: 40 }}>
              {/* Linha 1: Inscrito + Responsável */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 36 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #98a2b3", marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Assinatura do Inscrito(a)</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #98a2b3", marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {form.assinaturaResponsavel || "Assinatura do Responsável"}
                  </div>
                  {form.cargoResponsavel && (
                    <div style={{ fontSize: 11, color: "#475467", marginTop: 3 }}>{form.cargoResponsavel}</div>
                  )}
                </div>
              </div>
              {/* Linha 2: Pároco / Vigário centralizado */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ textAlign: "center", width: "40%" }}>
                  <div style={{ borderTop: "1px solid #98a2b3", marginBottom: 6 }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {form.parocoVigario || "Pároco / Vigário"}
                  </div>
                  <div style={{ fontSize: 11, color: "#475467", marginTop: 3 }}>Pároco / Vigário</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Ficha de Inscrição"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}
