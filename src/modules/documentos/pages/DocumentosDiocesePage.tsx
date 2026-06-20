// src/modules/documentos/pages/DocumentosDiocesePage.tsx
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface DocumentosDiocesePageProps {
  paroquia: Paroquia;
}

// 1. Definição da estrutura de dados para documentos de chancelaria
interface DioceseDocumentoForm {
  numeroProtocoloInterno: string;
  numeroDecretoOriginal: string;
  tituloDocumento: string;
  nomeClerigo: string;
  funcaoCargo: string;
  prazoVigencia: string;
  corpoTextoProvisao: string;
  cidadeDataRegistro: string;
  bispoNome: string;
  chancelerNome: string;
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

export function DocumentosDiocesePage({ paroquia }: DocumentosDiocesePageProps) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<DioceseDocumentoForm>({
    numeroProtocoloInterno: "Reg. Diocese nº 012/2026",
    numeroDecretoOriginal: "Decreto nº 045/2026-A",
    tituloDocumento: "PROVISÃO CANÔNICA DE VIGÁRIO PAROQUIAL",
    nomeClerigo: "REVDO. PADRE Nome do Sacerdote",
    funcaoCargo: "Vigário Paroquial desta circunscrição, com todas as faculdades e deveres inerentes ao cargo, conforme as normas do Direito Canônico",
    prazoVigencia: "pelo período de 03 (três) anos, devendo renovar-se ou expirar conforme as determinações supervenientes",
    corpoTextoProvisao: "Atendendo às necessidades espirituais e pastorais do povo de Deus nesta porção territorial, e tendo em vista as qualidades de zelo apostólico, prudência e idoneidade do candidato, resolvemos por bem emitir o presente ato oficial.",
    cidadeDataRegistro: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    bispoNome: "DOM Nome do Bispo Diocesano",
    chancelerNome: "Côn. / Pe. Nome do Chanceler da Cúria",
  });

  function updateField<K extends keyof DioceseDocumentoForm>(key: K, value: DioceseDocumentoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("diocese");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocoloInterno) updateField("numeroProtocoloInterno", `Reg. Diocese nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocoloInterno,
      assunto: form.tituloDocumento,
      destinatario: form.nomeClerigo,
      signatario: form.bispoNome,
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
    await gerarPDFDoPreview("papel-diocese", form.tituloDocumento || "Documento Diocesano");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* PAINEL FORMULÁRIO DE TRANSCRICAO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Documentos da Diocese (Transcrição)</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Insira os dados originais do documento emitido pela Cúria. O sistema gerará a formatação oficial para arquivamento na paróquia.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Protocolo de Arquivamento Interno</label>
            <input style={fieldStyle} value={form.numeroProtocoloInterno} onChange={(e) => updateField("numeroProtocoloInterno", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Número do Decreto / Provisão Original</label>
            <input style={fieldStyle} value={form.numeroDecretoOriginal} onChange={(e) => updateField("numeroDecretoOriginal", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Título do Documento Diocesano</label>
            <input style={fieldStyle} value={form.tituloDocumento} onChange={(e) => updateField("tituloDocumento", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Nome do Clérigo / Beneficiário</label>
            <input style={fieldStyle} value={form.nomeClerigo} onChange={(e) => updateField("nomeClerigo", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Função / Cargo Concedido</label>
            <textarea style={{ ...fieldStyle, minHeight: 45 }} value={form.funcaoCargo} onChange={(e) => updateField("funcaoCargo", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Prazo de Vigência da Provisão</label>
            <input style={fieldStyle} value={form.prazoVigencia} onChange={(e) => updateField("prazoVigencia", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Corpo de Texto / Considerações do Decreto</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.corpoTextoProvisao} onChange={(e) => updateField("corpoTextoProvisao", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Cidade e Data do Registro</label>
            <input style={fieldStyle} value={form.cidadeDataRegistro} onChange={(e) => updateField("cidadeDataRegistro", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Nome do Bispo Diocesano</label>
            <input style={fieldStyle} value={form.bispoNome} onChange={(e) => updateField("bispoNome", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Nome do Chanceler da Cúria</label>
            <input style={fieldStyle} value={form.chancelerNome} onChange={(e) => updateField("chancelerNome", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO EM PAPEL A4 */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização do Arquivo Diocesano</h3>
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
            id="papel-diocese"
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
              
              {/* Alinhamento simétrico de Protocolo e Data */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 35, fontSize: 13, color: "#4b5563", borderBottom: "1px dashed #d1d5db", paddingBottom: 8 }}>
                <span><strong>Prot. Interno:</strong> {form.numeroProtocoloInterno}</span>
                <span><strong>Registro em:</strong> {form.cidadeDataRegistro}</span>
              </div>

              {/* Identificação do Decreto Original */}
              <div style={{ textAlign: "center", fontSize: 13, textTransform: "uppercase", fontWeight: 700, color: "#1f3b73", marginBottom: 30 }}>
                DOCUMENTO TRANSCRETO DA CÚRIA DIOCESANA • {form.numeroDecretoOriginal}
              </div>

              {/* Título solene da Provisão */}
              <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 35, letterSpacing: "0.05em", fontWeight: "bold" }}>
                {form.tituloDocumento.toUpperCase()}
              </h3>

              {/* Parágrafo 1: Fórmula de Saudação e Considerandos */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                Fazemos saber a todos que este presente instrumento virem ou tomarem conhecimento que, {form.corpoTextoProvisao}
              </p>

              {/* Parágrafo 2: Nomeação e Função */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                Por força deste decreto, declaramos NOMEADO e PROVIDO no cargo o <strong>{form.nomeClerigo.toUpperCase()}</strong>, que exercerá a função de {form.funcaoCargo}.
              </p>

              {/* Parágrafo 3: Vigência */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 40px 0" }}>
                O candidato desempenhará seu encargo eclesiástico {form.prazoVigencia}, prestando a profissão de fé e o juramento de fidelidade na forma da lei da Santa Igreja.
              </p>

              {/* signature spacer removed */}

              {/* Assinaturas Paralelas da Cúria (Bispo e Chanceler) */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 60 }}>
                {/* Coluna 1 — Bispo */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ borderTop: "1px solid #71717a", marginBottom: 6 }} />
                  <div style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {form.bispoNome || "Bispo Diocesano"}
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>Autoridade Emitente</div>
                </div>

                {/* Coluna 2 — Chanceler */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ borderTop: "1px solid #71717a", marginBottom: 6 }} />
                  <div style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {form.chancelerNome || "Chanceler da Cúria"}
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>Dou fé - Chancelaria</div>
                </div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Documento da Diocese"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}