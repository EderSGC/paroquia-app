import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
// src/modules/documentos/pages/ContratosPage.tsx
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface ContratosPageProps {
  paroquia: Paroquia;
}

// 1. Estrutura de dados dividida por cláusulas e partes livres
interface ContratoForm {
  numeroProtocolo: string;
  tituloContrato: string;
  primeiraParteQualificacao: string; // Contratante livre
  segundaParteQualificacao: string;  // Contratado livre
  clausulaObjeto: string;
  clausulaValor: string;
  clausulaPrazo: string;
  clausulaForo: string;
  cidadeData: string;
  testemunha1: string;
  testemunha2: string;
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

export function ContratosPage({ paroquia }: ContratosPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<ContratoForm>({
    numeroProtocolo: "",
    tituloContrato: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
    primeiraParteQualificacao: `PARÓQUIA ${paroquia.nome ? paroquia.nome.toUpperCase() : "_____"}, pessoa jurídica de direito privado, inscrita sob o CNPJ nº _____, com sede na cidade de ${paroquia.cidade || "_____"}, neste ato representada pelo seu Pároco Administrador.`,
    segundaParteQualificacao: "NOME DA EMPRESA OU PRESTADOR, pessoa física/jurídica, residente e domiciliado na cidade de _____, inscrito sob o CPF/CNPJ nº _____, doravante denominado CONTRATADO.",
    clausulaObjeto: "O presente contrato tem por objeto a prestação de serviços de manutenção e reforma nas dependências da paróquia, conforme especificações técnicas acordadas entre as partes.",
    clausulaValor: "Pelo objeto deste contrato, o CONTRATANTE pagará ao CONTRATADO o valor total de R$ _____, dividido em _____ parcelas mensais via transferência bancária.",
    clausulaPrazo: "O presente instrumento terá vigência a partir da data de sua assinatura, com previsão de término para o dia __ de ____________ de 20__.",
    clausulaForo: "Fica eleito o Foro da Comarca de Manaus/AM para dirimir quaisquer dúvidas ou litígios oriundos deste instrumento.",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    testemunha1: "",
    testemunha2: "",
  });

  function updateField<K extends keyof ContratoForm>(key: K, value: ContratoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("contrato");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Contrato nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.tituloContrato,
      destinatario: form.segundaParteQualificacao.substring(0, 80),
      signatario: "",
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
    await gerarPDFDoPreview("papel-contrato", form.tituloContrato || "Contrato");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FORMULÁRIO DE DIGITAÇÃO POR CLÁUSULAS */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Gerador de Contratos</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Preencha as informações das partes e as cláusulas abaixo para gerar o esqueleto automatizado do contrato.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Número de Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} placeholder={proximoNumero || "Ex: Contrato nº 001/2026"} />
          </div>
          <div>
            <label style={labelStyle}>Título do Instrumento Contratual</label>
            <input style={fieldStyle} value={form.tituloContrato} onChange={(e) => updateField("tituloContrato", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Primeira Parte (Contratante - Qualificação Livre)</label>
            <textarea style={{ ...fieldStyle, minHeight: 70 }} value={form.primeiraParteQualificacao} onChange={(e) => updateField("primeiraParteQualificacao", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Segunda Parte (Contratado - Qualificação Livre)</label>
            <textarea style={{ ...fieldStyle, minHeight: 70 }} value={form.segundaParteQualificacao} onChange={(e) => updateField("segundaParteQualificacao", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cláusula Primeira: Do Objeto</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.clausulaObjeto} onChange={(e) => updateField("clausulaObjeto", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cláusula Segunda: Do Valor e Pagamento</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.clausulaValor} onChange={(e) => updateField("clausulaValor", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cláusula Terceira: Do Prazo e Vigência</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.clausulaPrazo} onChange={(e) => updateField("clausulaPrazo", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cláusula Quarta: Do Foro</label>
            <textarea style={{ ...fieldStyle, minHeight: 60 }} value={form.clausulaForo} onChange={(e) => updateField("clausulaForo", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Localidade, Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Testemunha 1 (Opcional)</label>
            <input style={fieldStyle} value={form.testemunha1} onChange={(e) => updateField("testemunha1", e.target.value)} placeholder="Nome e CPF" />
          </div>

          <div>
            <label style={labelStyle}>Testemunha 2 (Opcional)</label>
            <input style={fieldStyle} value={form.testemunha2} onChange={(e) => updateField("testemunha2", e.target.value)} placeholder="Nome e CPF" />
          </div>
        </div>
      </section>

      {/* PRÉVIA DO DOCUMENTO JURÍDICO A4 */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização do Contrato Formatado</h3>
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
            id="papel-contrato"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "64px 64px 64px 76px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 14, lineHeight: 1.8
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              <h3 style={{ textAlign: "center", fontSize: 15, marginBottom: 30, textDecoration: "underline" }}>
                {form.tituloContrato.toUpperCase()}
              </h3>

              {/* Parágrafo das partes qualificadas */}
              <p style={{ textAlign: "justify", marginBottom: 20 }}>
                As partes acima qualificadas têm, entre si, justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições seguintes:
              </p>
              
              <p style={{ textAlign: "justify", marginBottom: 15 }}><strong>CONTRATANTE:</strong> {form.primeiraParteQualificacao}</p>
              <p style={{ textAlign: "justify", marginBottom: 30 }}><strong>CONTRATADO:</strong> {form.segundaParteQualificacao}</p>

              {/* Cláusulas montadas sequencialmente */}
              <div style={{ display: "grid", gap: 18, textAlign: "justify" }}>
                <div>
                  <strong>CLÁUSULA PRIMEIRA – DO OBJETO</strong>
                  <p style={{ margin: "4px 0 0 0" }}>{form.clausulaObjeto}</p>
                </div>

                <div>
                  <strong>CLÁUSULA SEGUNDA – DO VALOR E DO PAGAMENTO</strong>
                  <p style={{ margin: "4px 0 0 0" }}>{form.clausulaValor}</p>
                </div>

                <div>
                  <strong>CLÁUSULA TERCEIRA – DO PRAZO E DA VIGÊNCIA</strong>
                  <p style={{ margin: "4px 0 0 0" }}>{form.clausulaPrazo}</p>
                </div>

                <div>
                  <strong>CLÁUSULA QUARTA – DO FORO</strong>
                  <p style={{ margin: "4px 0 0 0" }}>{form.clausulaForo}</p>
                </div>
              </div>

              <p style={{ textAlign: "justify", marginTop: 30, marginBottom: 50 }}>
                E, por estarem assim justas e contratadas, assinam o presente instrumento em duas vias de igual teor e forma, na presença das testemunhas abaixo nomeadas.
              </p>

              <div style={{ textAlign: "right", marginBottom: 50 }}>
                {form.cidadeData}
              </div>

              {/* signature spacer removed */}

              {/* Bloco de Assinaturas Paralelas */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 40, marginBottom: 50 }}>
                <div style={{ textAlign: "center", width: "45%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13 }}>CONTRATANTE</div>
                </div>
                <div style={{ textAlign: "center", width: "45%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13 }}>CONTRATADO</div>
                </div>
              </div>

              {/* Linha das Testemunhas */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
                <div style={{ width: "45%", fontSize: 12 }}>
                  <div style={{ borderTop: "1px solid #a1a1aa", marginTop: 25, paddingTop: 4 }} />
                  {form.testemunha1 || "Testemunha 1 (Nome e CPF)"}
                </div>
                <div style={{ width: "45%", fontSize: 12 }}>
                  <div style={{ borderTop: "1px solid #a1a1aa", marginTop: 25, paddingTop: 4 }} />
                  {form.testemunha2 || "Testemunha 2 (Nome e CPF)"}
                </div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Contrato"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}