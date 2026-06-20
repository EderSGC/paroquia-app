// src/modules/documentos/pages/AutorizacoesPage.tsx
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface AutorizacoesPageProps {
  paroquia: Paroquia;
}

// 1. Definição da estrutura de dados com os campos separados solicitados
interface AutorizacaoForm {
  numeroProtocolo: string;
  tituloDocumento: string;
  autorizadorDados: string;
  autorizadoDados: string;
  finalidadePermissao: string;
  prazoDataEvento: string;
  cidadeData: string;
  parocoNome: string;
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

export function AutorizacoesPage({ paroquia }: AutorizacoesPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<AutorizacaoForm>({
    numeroProtocolo: "Autorização nº 001/2026",
    tituloDocumento: "AUTORIZAÇÃO ADMINISTRATIVA / PASTORAL",
    autorizadorDados: "NOME DO AUTORIZADOR (PAI/MÃE OU RESPONSÁVEL), portador do RG nº _____ e do CPF nº _____, residente nesta comarca.",
    autorizadoDados: "NOME DO AUTORIZADO (OU MENOR), portador do RG/Certidão nº _____",
    finalidadePermissao: "participar do Retiro Espiritual de Jovens / Acampamento Paroquial, com direito a participar de todas as atividades recreativas e espirituais sob a tutela da equipe organizadora.",
    prazoDataEvento: "durante o período de __ a __ de ____________ de 2026.",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    parocoNome: "",
  });

  function updateField<K extends keyof AutorizacaoForm>(key: K, value: AutorizacaoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("autorizacao");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Autorização nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.tituloDocumento,
      destinatario: form.autorizadoDados.substring(0, 80),
      signatario: form.parocoNome,
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
    await gerarPDFDoPreview("papel-autorizacao", form.tituloDocumento || "Autorização");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* PAINEL FORMULÁRIO DE ENTRADA */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Gerador de Autorizações</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Preencha os dados específicos das partes. O sistema estruturará as cláusulas e conectivos textuais automaticamente na folha.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Número de Controle / Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Título do Documento</label>
            <input style={fieldStyle} value={form.tituloDocumento} onChange={(e) => updateField("tituloDocumento", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>1. Quem Autoriza (Dados do Responsável / Autorizador)</label>
            <textarea style={{ ...fieldStyle, minHeight: 55 }} value={form.autorizadorDados} onChange={(e) => updateField("autorizadorDados", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>2. Quem é Autorizado (Dados do Beneficiário / Objeto)</label>
            <textarea style={{ ...fieldStyle, minHeight: 55 }} value={form.autorizadoDados} onChange={(e) => updateField("autorizadoDados", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>3. Finalidade (Autorizo a...)</label>
            <textarea style={{ ...fieldStyle, minHeight: 60 }} value={form.finalidadePermissao} onChange={(e) => updateField("finalidadePermissao", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>4. Prazo / Duração do Evento</label>
            <textarea style={{ ...fieldStyle, minHeight: 45 }} value={form.prazoDataEvento} onChange={(e) => updateField("prazoDataEvento", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cidade, Localidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nome do Pároco / Vigário (Para a segunda assinatura)</label>
            <input style={fieldStyle} value={form.parocoNome} onChange={(e) => updateField("parocoNome", e.target.value)} placeholder="Deixe em branco para assinar manualmente" />
          </div>
        </div>
      </section>

      {/* PRÉVIA DA FOLHA DE IMPRESSÃO A4 */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização da Autorização</h3>
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

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article
            id="papel-autorizacao"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "64px 64px 64px 76px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 15, lineHeight: 1.9
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              {/* 2. Cabeçalho simétrico com Protocolo à esquerda e Data à direita */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, fontSize: 14 }}>
                <strong>{form.numeroProtocolo}</strong>
                <span>{form.cidadeData}</span>
              </div>

              {/* Título do documento centralizado */}
              <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 45, letterSpacing: "0.05em", textDecoration: "underline" }}>
                {form.tituloDocumento.toUpperCase()}
              </h3>

              {/* Corpo do texto montado com os blocos e conectivos gramaticais */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 20px 0" }}>
                Eu, {form.autorizadorDados || "__________________________________________________"}, na qualidade de responsável legal, **AUTORIZO** expressamente que {form.autorizadoDados || "__________________________________________________"} possa {form.finalidadePermissao || "__________________________________________________."}
              </p>

              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 40px 0" }}>
                A presente autorização é concedida de forma específica e por prazo determinado, possuindo validade estrita {form.prazoDataEvento || "___________________________."}
              </p>

              {/* signature spacer removed */}

              {/* 3. Bloco de Assinaturas Paralelas (Autorizador e Pároco/Vigário) */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 50, marginTop: 60 }}>
                <div style={{ textAlign: "center", width: "46%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13 }}>
                    AUTORIZADOR / RESPONSÁVEL
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Assinatura Física</div>
                </div>

                <div style={{ textAlign: "center", width: "46%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13 }}>
                    VISTO / ANUÊNCIA PAROQUIAL
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
                    {form.parocoNome || "Pároco / Vigário Paroquial"}
                  </div>
                </div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Autorização"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}