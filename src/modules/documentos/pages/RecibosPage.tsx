import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
// src/modules/documentos/pages/RecibosPage.tsx
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface RecibosPageProps {
  paroquia: Paroquia;
}

type TipoRecibo = "recebimento" | "pagamento";

// 1. Estrutura de dados atualizada com o número de protocolo oficial
interface ReciboForm {
  tipo: TipoRecibo;
  numeroProtocolo: string; // Atualizado para seguir o padrão do Ofício
  valorNumerico: string;
  valorExtenso: string;
  nomeParticipante: string;
  cpfCnpj: string;
  referenteA: string;
  cidadeData: string;
  emissorNome: string;
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

export function RecibosPage({ paroquia }: RecibosPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<ReciboForm>({
    tipo: "recebimento",
    numeroProtocolo: "Recibo nº 001/2026", // Sugestão padrão adicionada
    valorNumerico: "0,00",
    valorExtenso: "(Zero reais)",
    nomeParticipante: "",
    cpfCnpj: "",
    referenteA: "Contribuição do Dízimo / Doação espontânea",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    emissorNome: "",
  });

  function updateField<K extends keyof ReciboForm>(key: K, value: ReciboForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("recibo");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Recibo nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.referenteA,
      destinatario: form.nomeParticipante,
      signatario: form.emissorNome,
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
    await gerarPDFDoPreview("papel-recibo", form.numeroProtocolo || "Recibo");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FORMULÁRIO CONFIGURADOR */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Emissor de Recibos</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Selecione o tipo de operação, insira os valores e controle as emissões através do número de protocolo.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          
          {/* 2. Campo de Protocolo posicionado no topo do formulário */}
          <div>
            <label style={labelStyle}>Número de Controle / Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Tipo de Recibo</label>
            <select 
              style={fieldStyle} 
              value={form.tipo} 
              onChange={(e) => updateField("tipo", e.target.value as TipoRecibo)}
            >
              <option value="recebimento">Recibo de Recebimento (Entrada)</option>
              <option value="pagamento">Recibo de Pagamento (Saída)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Valor Numérico (R$)</label>
            <input style={fieldStyle} value={form.valorNumerico} onChange={(e) => updateField("valorNumerico", e.target.value)} placeholder="Ex: 150,00" />
          </div>

          <div>
            <label style={labelStyle}>Valor por Extenso</label>
            <input style={fieldStyle} value={form.valorExtenso} onChange={(e) => updateField("valorExtenso", e.target.value)} placeholder="Ex: (Cento e cinquenta reais)" />
          </div>

          <div>
            <label style={labelStyle}>
              {form.tipo === "recebimento" ? "Recebemos de (Nome)" : "Pagamos a (Nome)"}
            </label>
            <input style={fieldStyle} value={form.nomeParticipante} onChange={(e) => updateField("nomeParticipante", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>CPF / CNPJ</label>
            <input style={fieldStyle} value={form.cpfCnpj} onChange={(e) => updateField("cpfCnpj", e.target.value)} placeholder="Ex: 000.000.000-00" />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Referente a (Descrição do motivo)</label>
            <input style={fieldStyle} value={form.referenteA} onChange={(e) => updateField("referenteA", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Quem assina o Recibo</label>
            <input style={fieldStyle} value={form.emissorNome} onChange={(e) => updateField("emissorNome", e.target.value)} placeholder="Deixe em branco para assinatura manual" />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO DA FOLHA */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia do Recibo</h3>
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
            id="papel-recibo"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "50px 54px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 14, lineHeight: 1.8
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 35, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              {/* 3. Alinhamento simétrico do Protocolo e da Data acima do corpo do recibo */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, padding: "0 4px", fontSize: 13, color: "#4b5563" }}>
                <strong>{form.numeroProtocolo}</strong>
                <span>{form.cidadeData}</span>
              </div>

              {/* Moldura clássica do Recibo */}
              <div style={{ border: "2px solid #1a1d2e", borderRadius: 12, padding: 24, background: "#fff" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1a1d2e", paddingBottom: 14, marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: "bold", textTransform: "uppercase" }}>
                    {form.tipo === "recebimento" ? "RECIBO DE RECEBIMENTO" : "RECIBO DE PAGAMENTO"}
                  </h3>
                  <div style={{ background: "#eef2f7", border: "1px solid #1a1d2e", padding: "6px 16px", borderRadius: 6, fontSize: 18, fontWeight: "bold" }}>
                    R$ {form.valorNumerico}
                  </div>
                </div>

                <p style={{ textAlign: "justify", fontSize: 15, margin: 0, lineHeight: 2 }}>
                  {form.tipo === "recebimento" ? "Recebemos de " : "Pagamos a "}
                  <strong>{form.nomeParticipante || "__________________________________________________"}</strong>
                  {form.cpfCnpj && ` (inscrito sob o CPF/CNPJ: ${form.cpfCnpj})`}, 
                  a importância de <strong>{form.valorExtenso || "__________________________________________________"}</strong>, 
                  referente a {form.referenteA || "__________________________________________________."}
                </p>
              </div>

              {/* signature spacer removed */}

              {/* Bloco de assinatura inferior */}
              <div style={{ 
                margin: "40px auto 0", width: "fit-content", textAlign: "center", 
                display: "flex", flexDirection: "column", alignItems: "center"
              }}>
                <div style={{ borderTop: "1px solid #1a1d2e", width: 340, marginBottom: 8 }} />
                <strong>{form.emissorNome || "Assinatura do Responsável"}</strong>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  {form.tipo === "recebimento" ? "Paróquia Emitente / Recebedora" : "Prestador / Beneficiário do Pagamento"}
                </div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Recibo"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}