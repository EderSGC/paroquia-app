import { useToast } from "@core/ui/Toast";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import { SacramentalRepository } from '../repository/sacramental.repository';

interface Props {
  paroquia: Paroquia;
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.9)",
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "#111827",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  transition: "all .2s ease",
  boxSizing: "border-box",
  boxShadow: `
    inset 0 1px 2px rgba(255,255,255,0.6),
    0 1px 2px rgba(15,23,42,0.04)
  `,
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

export function CertificadoCrismaPage({ paroquia }: Props) {
  const { showToast } = useToast();
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Times New Roman");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);

  const [form, setForm] = useState({
    fiel: "",
    dataCrisma: "",
    local: "",
    celebrante: "",
    catequista: "",
    padrinhoMadrinha: "",
    livro: "",
    folha: "",
    termo: "",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    assinante: "",
    cargoAssinante: "Pároco / Vigário",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const salvarNoBanco = async () => {
    if (!form.fiel) { showToast("Preencha o nome do fiel.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(form);
      const result = await SacramentalRepository.registros.upsert(
        "CERT_CRISMA", form.fiel, form.dataCrisma, form.celebrante, form.local, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Certidão atualizada com sucesso!" : "Certidão salva com sucesso!", "success");
    } catch (e) { showToast("Erro ao salvar.", "error"); console.error(e); }
  };

  return (
    <div
  style={{
    display: "grid",
    gap: 24,
    padding: 30,
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  }}
>
      <style>{`
          @media screen { #papel-crisma { display: none; } }
        `}</style>

      {/* BUSCA E LISTA */}
      <div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input style={{ flex: 1, padding: "13px 16px", borderRadius: "14px", border: "1px solid #d0d5dd", background: "rgba(255,255,255,0.92)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Buscar por nome do fiel..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => setForm(f => ({ ...f, fiel: "", dataCrisma: "" }))} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "13px 20px", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>+ Novo</button>
        </div>
        <RegistrosList tipo="CERT_CRISMA" busca={busca} recarregarKey={recarregarKey}
          onExcluir={() => setEditandoId(null)}
          onSelecionar={(d, registro) => { setEditandoId(registro.id); setForm(f => ({ ...f, ...(d as Record<string, string>) })); }} />
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", padding: "10px 16px", background: "rgba(31,59,115,0.08)", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#1f3b73" }}>
            📖 Buscar nos Registros de Crisma (para preencher a certidão)
          </summary>
          <div style={{ paddingTop: "8px" }}>
            <RegistrosList tipo="CRISMA" busca={busca} recarregarKey={0}
              onSelecionar={(d) => { const data = d as Record<string, string>; setForm(f => ({ ...f, fiel: data.nome || f.fiel, dataCrisma: data.dataBatismo || f.dataCrisma, celebrante: data.celebrante || f.celebrante, local: data.paroquiaAtual || f.local, catequista: data.catequista || f.catequista })); }} />
          </div>
        </details>
        <BuscarFielPastoral onSelecionar={f => { setForm(prev => ({ ...prev, fiel: f.nome })); setFielId(f.id); }} label="Buscar Crismando no Módulo Pastoral" />
      </div>

      {/* FORMULÁRIO DE ENTRADA */}
      <section
  style={{
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.6)",
    padding: 32,
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
  }}
>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Lembrança da Crisma</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Preencha os dados abaixo para gerar o certificado de confirmação.
        </p>

        {/* 2. Adicionamos o seletor de fontes aqui, com uma linha divisória para organização */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector 
            fonteAtual={fonteDocumento} 
            onChange={(novaFonte) => setFonteDocumento(novaFonte)} 
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Nome do Crismando(a)</label>
            <input style={fieldStyle} value={form.fiel} onChange={(e) => updateField("fiel", e.target.value)} placeholder="Nome completo" />
          </div>

          <div>
            <label style={labelStyle}>Data do Sacramento</label>
            <input style={fieldStyle} value={form.dataCrisma} onChange={(e) => updateField("dataCrisma", e.target.value)} placeholder="Ex: 20/05/2026" />
          </div>

          <div>
            <label style={labelStyle}>Local (Paróquia/Capela)</label>
            <input style={fieldStyle} value={form.local} onChange={(e) => updateField("local", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Padrinho / Madrinha</label>
            <input style={fieldStyle} value={form.padrinhoMadrinha} onChange={(e) => updateField("padrinhoMadrinha", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Catequista</label>
            <input style={fieldStyle} value={form.catequista} onChange={(e) => updateField("catequista", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Celebrante</label>
            <input style={fieldStyle} value={form.celebrante} onChange={(e) => updateField("celebrante", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Registros (Livro / Folha / Termo)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={fieldStyle} placeholder="Livro" value={form.livro} onChange={(e) => updateField("livro", e.target.value)} />
              <input style={fieldStyle} placeholder="Folha" value={form.folha} onChange={(e) => updateField("folha", e.target.value)} />
              <input style={fieldStyle} placeholder="Termo" value={form.termo} onChange={(e) => updateField("termo", e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* PRÉVIA DE IMPRESSÃO */}
      <section
  style={{
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.6)",
    padding: 32,
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
  }}
>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia do Certificado</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={salvarNoBanco} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{editandoId ? "💾 Atualizar" : "💾 Salvar"}</button>
            {editandoId && <button onClick={() => setEditandoId(null)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: 14, cursor: "pointer", padding: "13px 22px", fontWeight: 700 }}>✕ Novo</button>}
            <button onClick={() => gerarPDFDoPreview("papel-crisma", `Certidão de Crisma — ${form.fiel || "Documento"}`)} style={{ background: "linear-gradient(135deg, #1f3b73 0%, #2b5fb8 100%)", color: "white", border: "none", borderRadius: 14, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 25px rgba(31,59,115,0.28)" }}>Imprimir Crisma</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article
            id="papel-crisma"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", borderRadius: 8, padding: "48px 54px",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)", boxSizing: "border-box", color: "#111827",
              textAlign: "center", 
              // 3. APLICAMOS A FONTE ESCOLHIDA APENAS AO PAPEL
              fontFamily: `${fonteDocumento}, serif`, 
              display: "flex", flexDirection: "column"
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <h1 style={{ fontSize: "32px", margin: "50px 0 10px", fontWeight: "bold", color: "#1f3b73" }}>Lembrança da Crisma</h1>
            
            <div style={{ fontSize: "16px", fontStyle: "italic", marginBottom: "30px", color: "#374151" }}>
              "Recebe por este sinal o Espírito Santo, o dom de Deus!"
            </div>

            <div style={{ fontSize: "15px", lineHeight: "1.8", flexGrow: 1 }}>
              <p style={{ margin: "20px 0" }}>Certificamos que</p>
              <h2 style={{ fontSize: "28px", fontWeight: "bold", textDecoration: "underline", margin: "10px 0" }}>
                {form.fiel || "____________________________________"}
              </h2>

              <p>
                recebeu o Sacramento da Confirmação no dia <strong>{form.dataCrisma || "___/___/___"}</strong>, <br />
                na <strong>{form.local || "________________"}</strong>, <br />
                desta <strong>{paroquia.nome}</strong>.
              </p>

              <div style={{ margin: "30px auto", maxWidth: "80%", fontSize: "14px", border: "1px double #d1d5db", padding: "15px", borderRadius: "8px" }}>
                <strong>Dons do Espírito Santo:</strong> <br />
                Sabedoria • Entendimento • Conselho • Fortaleza • Ciência • Piedade • Temor a Deus
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px", textAlign: "left" }}>
                <div><strong>Padrinho/Madrinha:</strong> {form.padrinhoMadrinha || "________________"}</div>
                <div><strong>Catequista:</strong> {form.catequista || "________________"}</div>
                <div style={{ gridColumn: "1 / span 2" }}><strong>Celebrante:</strong> {form.celebrante || "________________"}</div>
              </div>

              <p style={{ marginTop: "40px", fontSize: "12px" }}>
                Registrado no Livro nº <strong>{form.livro || "___"}</strong>, folha nº <strong>{form.folha || "___"}</strong>, termo nº <strong>{form.termo || "___"}</strong>.
              </p>
            </div>

            {/* ASSINATURA À DIREITA */}
            <div style={{ marginLeft: "auto", width: "fit-content", textAlign: "center", marginTop: 40 }}>
              <p style={{ fontSize: "12px", marginBottom: 40 }}>{form.cidadeData}</p>
              <div style={{ borderTop: "1px solid #000", width: 280, marginBottom: 10 }} />
              <strong style={{ fontSize: "14px" }}>{form.assinante || "Nome do Responsável"}</strong>
              <div style={{ fontSize: "12px" }}>{form.cargoAssinante}</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}