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

export function CertificadoBatismoPage({ paroquia }: Props) {
  const { showToast } = useToast();
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Times New Roman");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);

const [form, setForm] = useState({
    nome: "",
    naturalidade: "",
    nascimento: "",
    pais: "",
    celebrante: "",
    funcaoCelebrante: "",
    dataBatismo: "",
    localBatismo: "",
    padrinho: "",
    madrinha: "",
    livro: "",
    folha: "",
    termo: "",
    cidadeData: `Manaus, ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`,
    assinante: "",
    cargoAssinante: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);

  const salvarNoBanco = async () => {
    if (!form.nome) { showToast("Preencha o nome do fiel.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(form);
      const result = await SacramentalRepository.registros.upsert(
        "CERT_BATISMO", form.nome, form.dataBatismo, form.celebrante, form.localBatismo, jsonDados,
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
    <div style={{ display: "grid", gap: 24 }}>

      <div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <input style={{ flex: 1, padding: "13px 16px", borderRadius: "14px", border: "1px solid #d0d5dd", background: "rgba(255,255,255,0.92)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Buscar por nome do fiel..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => setForm(f => ({ ...f, nome: "", nascimento: "", naturalidade: "", pais: "" }))} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "13px 20px", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>+ Novo</button>
        </div>
        <RegistrosList tipo="CERT_BATISMO" busca={busca} recarregarKey={recarregarKey}
          onExcluir={() => setEditandoId(null)}
          onSelecionar={(d, registro) => { setEditandoId(registro.id); setForm(f => ({ ...f, ...(d as Record<string, string>) })); }} />
        <BuscarFielPastoral onSelecionar={f => { setForm(prev => ({ ...prev, nome: f.nome, naturalidade: f.comunidade || prev.naturalidade })); setFielId(f.id); }} label="Buscar Fiel no Módulo Pastoral" />
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", padding: "10px 16px", background: "rgba(31,59,115,0.08)", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#1f3b73" }}>
            📖 Buscar nos Registros de Batismo (para preencher a certidão)
          </summary>
          <div style={{ paddingTop: "8px" }}>
            <RegistrosList tipo="BATISMO" busca={busca} recarregarKey={0}
              onSelecionar={(d) => {
                type BatismoJson = { batizando?: Record<string, string>; padrinhos?: Record<string, string> };
                const json = d as BatismoJson & Record<string, string>;
                const b = (json.batizando || json) as Record<string, string>;
                const pads = (json.padrinhos || {}) as Record<string, string>;
                setForm(f => ({ ...f, nome: b.nomeBatizando || b.nome || f.nome, dataBatismo: b.dataBatismo || f.dataBatismo, celebrante: b.celebrante || f.celebrante, localBatismo: b.comunidade || f.localBatismo, padrinho: pads.padrinhoNome || f.padrinho, madrinha: pads.madrinhaNome || f.madrinha }));
              }} />
          </div>
        </details>
      </div>

      <style>{`
          @media screen { #papel-batismo { display: none; } }
        `}</style>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Certidão de Batismo</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Preencha os dados do fiel para gerar o certificado oficial conforme os registros.
        </p>

        {/* 3. Inserindo o seletor de fontes no formulário */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector 
            fonteAtual={fonteDocumento} 
            onChange={(novaFonte) => setFonteDocumento(novaFonte)} 
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Nome do Fiel</label>
            <input style={fieldStyle} value={form.nome} onChange={(e) => updateField("nome", e.target.value)} />
          </div>
          {/* ... demais campos permanecem iguais ... */}
          <div>
            <label style={labelStyle}>Data de Nascimento</label>
            <input style={fieldStyle} value={form.nascimento} onChange={(e) => updateField("nascimento", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Naturalidade</label>
            <input style={fieldStyle} value={form.naturalidade} onChange={(e) => updateField("naturalidade", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Filiação (Pais)</label>
            <input style={fieldStyle} value={form.pais} onChange={(e) => updateField("pais", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Celebrante</label>
            <input style={fieldStyle} value={form.celebrante} onChange={(e) => updateField("celebrante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Função do Celebrante</label>
            <input style={fieldStyle} value={form.funcaoCelebrante} onChange={(e) => updateField("funcaoCelebrante", e.target.value)} placeholder="Ex: Pároco, Vigário..." />
          </div>
          <div>
            <label style={labelStyle}>Data do Sacramento</label>
            <input style={fieldStyle} value={form.dataBatismo} onChange={(e) => updateField("dataBatismo", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Local (Capela / Comunidade)</label>
            <input style={fieldStyle} value={form.localBatismo} onChange={(e) => updateField("localBatismo", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Livro / Folha / Termo</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={fieldStyle} placeholder="L" value={form.livro} onChange={(e) => updateField("livro", e.target.value)} />
              <input style={fieldStyle} placeholder="F" value={form.folha} onChange={(e) => updateField("folha", e.target.value)} />
              <input style={fieldStyle} placeholder="T" value={form.termo} onChange={(e) => updateField("termo", e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Padrinho</label>
            <input style={fieldStyle} value={form.padrinho} onChange={(e) => updateField("padrinho", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Madrinha</label>
            <input style={fieldStyle} value={form.madrinha} onChange={(e) => updateField("madrinha", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Assinante</label>
            <input style={fieldStyle} value={form.assinante} onChange={(e) => updateField("assinante", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cargo do Assinante</label>
            <input style={fieldStyle} value={form.cargoAssinante} onChange={(e) => updateField("cargoAssinante", e.target.value)} />
          </div>
        </div>
      </section>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Prévia para impressão</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={salvarNoBanco} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{editandoId ? "💾 Atualizar" : "💾 Salvar"}</button>
            {editandoId && <button onClick={() => setEditandoId(null)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: 10, cursor: "pointer", padding: "12px 18px", fontWeight: 700 }}>✕ Novo</button>}
            <button onClick={() => gerarPDFDoPreview("papel-batismo", `Certidão de Batismo — ${form.nome || "Documento"}`)} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Imprimir Certidão</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article
            id="papel-batismo"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", borderRadius: 8, padding: "48px 54px",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)", boxSizing: "border-box", color: "#111827",
              textAlign: "center", 
              // 4. APLICANDO A FONTE DINÂMICA AQUI
              fontFamily: `${fonteDocumento}, serif`, 
              display: "flex", flexDirection: "column"
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <h1 style={{ fontSize: "26px", margin: "50px 0 20px", fontWeight: "bold", textTransform: "uppercase" }}>Certidão de Batismo</h1>
            
            <h2 style={{ fontSize: "28px", margin: "10px 0", fontWeight: "bold" }}>{form.nome || "_________________________"}</h2>

            <div style={{ fontSize: "12px", lineHeight: "2.4", textAlign: "center", marginTop: "30px", flexGrow: 1 }}>
              <p>Nascido(a) em {form.naturalidade || "________"}, no dia {form.nascimento || "____/____/____"}, <br/>
              filho(a) de {form.pais || "________________"}.</p>

              <p style={{ marginTop: "20px" }}>Foi batizado(a) solenemente pelo <strong>{form.celebrante}</strong> {form.funcaoCelebrante ? `(${form.funcaoCelebrante})` : ""}</p>
              
              <p style={{ marginTop: "10px" }}>no dia {form.dataBatismo || "________"}, na {form.localBatismo || "________"} <br/>
              desta Área Missionária {paroquia.nome}.</p>

              <p style={{ marginTop: "30px" }}>Foram seus padrinhos:</p>
              <div style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0" }}>
                {form.padrinho || "________"} <br/>
                <span style={{ fontWeight: "normal", fontSize: "14px", fontStyle: "italic" }}>e</span> <br/>
                {form.madrinha || "________"}
              </div>
              
              <p style={{ marginTop: "35px", fontStyle: "italic" }}>
                E para constar, foi lavrado o presente termo no livro nº {form.livro || "___"}, folha nº {form.folha || "___"}, sob o nº {form.termo || "___"}.
              </p>
            </div>

            <div style={{ marginLeft: "auto", width: "fit-content", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
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