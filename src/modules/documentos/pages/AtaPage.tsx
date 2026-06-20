import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface Props { paroquia: Paroquia; }

const fieldStyle: CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #d6dbe7",
  background: "#fff", color: "#1a1d2e", fontSize: 14, boxSizing: "border-box", marginBottom: 12
};

const labelStyle: CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase"
};

export function AtaPage({ paroquia }: Props) {
  // Estado para controlar a fonte escolhida
  const [fonte, setFonte] = useState("Times New Roman");

  const [form, setForm] = useState({
    numeroProtocolo: "",
    titulo: "ATA DA ___ª REUNIÃO DO CONSELHO PASTORAL",
    abertura: `Aos ___ dias do mês de ___________ de 2026, às ___:___ horas, na ${paroquia.nome}...`,
    participantes: "",
    ordemDia: "1. Oração Inicial; 2. Leitura da Ata Anterior; 3. pauta...",
    decisoes: "",
    horarioEncerramento: "",
    secretario: "",
    presidente: ""
  });

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("ata");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) setForm(f => ({ ...f, numeroProtocolo: proximoNumero }));
  }, [proximoNumero]);

  // Função para lidar com a nova lógica de impressão
  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.titulo,
      destinatario: "",
      signatario: form.presidente,
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

  async function tratarImpressao() {
    await gerarPDFDoPreview("papel-ata", form.titulo || "Ata Paroquial");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

<section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ marginBottom: 20 }}>Nova Ata Paroquial</h2>
        
        {/* SELETOR DE FONTE ADICIONADO AQUI */}
        <FontSelector fonteAtual={fonte} onChange={setFonte} />

        <label style={labelStyle}>Número de Protocolo</label>
        <input style={fieldStyle} value={form.numeroProtocolo} onChange={e => setForm({...form, numeroProtocolo: e.target.value})} placeholder={proximoNumero || "Ex: 001/2026"} />

        <label style={labelStyle}>Título e Contexto</label>
        <input style={fieldStyle} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />

        <label style={labelStyle}>Abertura (Data, Hora e Local)</label>
        <textarea style={{...fieldStyle, height: 80}} value={form.abertura} onChange={e => setForm({...form, abertura: e.target.value})} />

        <label style={labelStyle}>Participantes</label>
        <textarea style={{...fieldStyle, height: 80}} placeholder="Lista de presentes e ausências..." value={form.participantes} onChange={e => setForm({...form, participantes: e.target.value})} />

        <label style={labelStyle}>Ordem do Dia (Pauta)</label>
        <textarea style={{...fieldStyle, height: 100}} value={form.ordemDia} onChange={e => setForm({...form, ordemDia: e.target.value})} />

        <label style={labelStyle}>Discussões e Decisões</label>
        <textarea style={{...fieldStyle, height: 200}} placeholder="Resumo fiel dos assuntos..." value={form.decisoes} onChange={e => setForm({...form, decisoes: e.target.value})} />

        <label style={labelStyle}>Horário de Encerramento</label>
        <input
          style={fieldStyle}
          placeholder="Ex: 20:30"
          value={form.horarioEncerramento}
          onChange={e => setForm({...form, horarioEncerramento: e.target.value})}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={labelStyle}>Presidente da Reunião</label>
            <input style={fieldStyle} value={form.presidente} onChange={e => setForm({...form, presidente: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Secretário(a)</label>
            <input style={fieldStyle} value={form.secretario} onChange={e => setForm({...form, secretario: e.target.value})} />
          </div>
        </div>
      </section>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            onClick={handleRegistrar}
            style={{ background: "#0e9f6e", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontWeight: 700 }}
          >
            {editandoId !== null ? "💾 Salvar Edição" : "✓ Registrar Documento"}
          </button>
          <button
            onClick={tratarImpressao}
          style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontWeight: 700, marginBottom: 20 }}
        >
          🖨 Imprimir / PDF
        </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", padding: 40, borderRadius: 16 }}>
          <article 
            id="papel-ata" 
            style={{ 
              width: 794, 
              minHeight: 1123, 
              background: "white", 
              padding: "60px", 
              boxSizing: "border-box", 
              fontFamily: `"${fonte}", serif`, // APLICAÇÃO DA FONTE NA PRÉ-VISUALIZAÇÃO
              fontSize: "14px", 
              lineHeight: "1.6", 
              textAlign: "justify" 
            }}
          >
            <DocumentHeader paroquia={paroquia} />
            
            <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, fontSize: 18 }}>{form.titulo}</h2>

            <p style={{ marginTop: 30 }}><strong>ABERTURA:</strong> {form.abertura}</p>
            <p><strong>PARTICIPANTES:</strong> {form.participantes || "________________________________"}</p>
            <p><strong>ORDEM DO DIA:</strong> {form.ordemDia}</p>
            
            <div style={{ marginTop: 20 }}>
              <strong>DISCUSSÕES E DELIBERAÇÕES:</strong>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{form.decisoes || "\n\n\n\n\n"}</div>
            </div>

            <p style={{ marginTop: 30 }}>
              Nada mais havendo a tratar, encerrou-se a reunião às{" "}
              <strong>{form.horarioEncerramento || "____:____"}</strong> horas.
            </p>

            <div style={{ marginTop: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", textAlign: "center" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", marginBottom: 5 }} />
                <strong>{form.presidente}</strong><br/>Presidente
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", marginBottom: 5 }} />
                <strong>{form.secretario || "________________"}</strong><br/>Secretário(a)
              </div>
            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Ata"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}