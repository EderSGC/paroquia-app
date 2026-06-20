// src/modules/documentos/pages/DocumentosComunidadesPage.tsx
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface DocumentosComunidadesPageProps {
  paroquia: Paroquia;
}

// 1. Definição da estrutura de dados estável com campo de texto manual
interface ComunidadeDocForm {
  numeroProtocolo: string;
  tituloDocumento: string;
  comunidadeNome: string;
  coordenadorNome: string;
  objetivoDocumento: string;
  corpoTexto: string;
  cidadeData: string;
  padreNome: string;
  padreCargoTitulo: string;
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

export function DocumentosComunidadesPage({ paroquia }: DocumentosComunidadesPageProps) {
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<ComunidadeDocForm>({
    numeroProtocolo: "Comunidade nº 024/2026",
    tituloDocumento: "DIRETRIZ E NOMEAÇÃO DE CONSELHO COMUNITÁRIO",
    comunidadeNome: "Comunidade São José", // Preenchimento inicial padrão por texto
    coordenadorNome: "NOME DO COORDENADOR DA COMUNIDADE",
    objetivoDocumento: "estabelecer as diretrizes para a gestão pastoral, administrative e financeira da referida comunidade para o próximo biênio.",
    corpoTexto: "Reunidos em assembleia comunitária com os fiéis e lideranças locais, determinamos que a nova equipe de coordenação assumirá os trabalhos de evangelização, manutenção do patrimônio sagrado e assistência aos mais necessitados, caminhando em perfeita comunhão com as diretrizes da Paróquia e da Diocese.",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    padreNome: "",
    padreCargoTitulo: "Pároco / Vigário",
  });

  function updateField<K extends keyof ComunidadeDocForm>(key: K, value: ComunidadeDocForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("comunidade");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Comunidade nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.tituloDocumento,
      destinatario: form.comunidadeNome,
      signatario: form.coordenadorNome,
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
    await gerarPDFDoPreview("papel-comunidade", form.tituloDocumento || "Documento de Comunidade");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FORMULÁRIO DE ENTRADA CONFIGURADO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Documentos de Comunidades e Capelas</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Emita atas, nomeações ou orientações específicas para as capelas da paróquia digitando o nome da comunidade manualmente.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Número de Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>

          {/* 2. Campo refatorado de Select para Input de Texto Manual */}
          <div>
            <label style={labelStyle}>Nome da Comunidade / Capela (Manual)</label>
            <input 
              style={fieldStyle} 
              value={form.comunidadeNome} 
              onChange={(e) => updateField("comunidadeNome", e.target.value)} 
              placeholder="Ex: Capela Sant'Ana"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Título do Documento</label>
            <input style={fieldStyle} value={form.tituloDocumento} onChange={(e) => updateField("tituloDocumento", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nome do Coordenador / Responsável Local</label>
            <input style={fieldStyle} value={form.coordenadorNome} onChange={(e) => updateField("coordenadorNome", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Objetivo do Documento (Este documento visa...)</label>
            <textarea style={{ ...fieldStyle, minHeight: 50 }} value={form.objetivoDocumento} onChange={(e) => updateField("objetivoDocumento", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Corpo do Texto / Determinações da Ata</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.corpoTexto} onChange={(e) => updateField("corpoTexto", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cidade e Data de Emissão</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Nome do Padre (Assinatura)</label>
            <input style={fieldStyle} placeholder="Ex: Pe. Éder de Souza Gomes Cordeiro" value={form.padreNome} onChange={(e) => updateField("padreNome", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Cargo / Título do Padre</label>
            <input style={fieldStyle} placeholder="Ex: Pároco / Vigário Paroquial" value={form.padreCargoTitulo} onChange={(e) => updateField("padreCargoTitulo", e.target.value)} />
          </div>
        </div>
      </section>

      {/* PRÉ-VISUALIZAÇÃO EM FOLHA A4 */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Folha de Impressão Oficial</h3>
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
            id="papel-comunidade"
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
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, fontSize: 14 }}>
                <strong>{form.numeroProtocolo}</strong>
                <span>{form.cidadeData}</span>
              </div>

              <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 20, letterSpacing: "0.05em", fontWeight: "bold" }}>
                {form.tituloDocumento.toUpperCase()}
              </h3>

              {/* Subtítulo dinâmico alimentado pelo input manual */}
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "#1f3b73", marginBottom: 40, textTransform: "uppercase" }}>
                REF: {form.comunidadeNome || "____________________"}
              </div>

              {/* Parágrafo 1 */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                Para fins de coordenação e organização pastoral, a Paróquia, por meio de seu representante legal, emite a presente instrução dirigida à <strong>{(form.comunidadeNome || "____________________").toUpperCase()}</strong>, sob a liderança direta do(a) Coordenador(a) <strong>{form.coordenadorNome.toUpperCase()}</strong>. Este ato oficial visa {form.objetivoDocumento}
              </p>

              {/* Parágrafo 2 */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 40px 0" }}>
                {form.corpoTexto}
              </p>

              {/* signature spacer removed */}

              {/* Assinaturas */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 60 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ borderTop: "1px solid #71717a", marginBottom: 6 }} />
                  <div style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", lineHeight: 1.4 }}>
                    {form.padreNome || form.padreCargoTitulo || "Pároco / Vigário"}
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>
                    {form.padreCargoTitulo || "Pároco / Vigário"}
                  </div>
                </div>

                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ borderTop: "1px solid #71717a", marginBottom: 6 }} />
                  <div style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", lineHeight: 1.4 }}>
                    {form.coordenadorNome || "Coordenador(a)"}
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>Ciência do Coordenador</div>
                </div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Documento de Comunidade"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}