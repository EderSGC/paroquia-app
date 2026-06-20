import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getDb } from "@core/database";
import { useWorkspace, type SelectedItem } from "@/layouts/WorkspaceContext";
import { PanelSection, PanelDivider } from "@/components/ui/SectionHeader";

/* ─── Avatar ──────────────────────────────────────────────────── */
function Avatar({ nome, size = 48 }: { nome: string; size?: number }) {
  const initials = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const hue = [...nome].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue}, 52%, 50%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.34), fontWeight: 800, color: "#fff",
    }}>
      {initials || "?"}
    </div>
  );
}

/* ─── Shared row styles ───────────────────────────────────────── */
const ROW: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  padding: "5px 0", borderBottom: "1px solid var(--separator)", gap: 8,
};
const LABEL: React.CSSProperties = { color: "var(--text-secondary)", fontSize: 11, flexShrink: 0 };
const VALUE: React.CSSProperties = { fontWeight: 600, color: "var(--text-primary)", fontSize: 11, textAlign: "right", wordBreak: "break-word" };

/* ─── Fiel detail ─────────────────────────────────────────────── */
type FielItem = Extract<SelectedItem, { type: "fiel" }>;

const SACR_LABEL: Record<string, string> = {
  BATISMO: "Batismo", EUCARISTIA: "1ª Eucaristia", CRISMA: "Crisma",
  MATRIMONIO: "Matrimônio", UNCAO_DOS_ENFERMOS: "Unção dos Enfermos",
  OBITO: "Óbito / Exéquias",
};
const SACR_COLOR: Record<string, string> = {
  BATISMO: "var(--accent)", EUCARISTIA: "var(--accent-orange)", CRISMA: "var(--accent-purple)",
  MATRIMONIO: "var(--accent-red)", UNCAO_DOS_ENFERMOS: "var(--accent-teal)", OBITO: "var(--text-tertiary)",
};

function FielDetail({ item }: { item: FielItem }) {
  const [sacramentos, setSacramentos] = useState<{ tipo: string; data_sacramento: string }[]>([]);
  const [catequese, setCatequese] = useState<{ etapa: string; situacao: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useWorkspace();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const db = await getDb();
        const [sacrs, cats] = await Promise.all([
          db.select<{ tipo: string; data_sacramento: string }[]>(
            "SELECT tipo, data_sacramento FROM sacramentos_registros WHERE LOWER(nome_principal)=LOWER(?) AND deleted_at IS NULL ORDER BY data_sacramento ASC",
            [item.nome.trim()]
          ),
          db.select<{ etapa: string; situacao: string }[]>(
            "SELECT t.etapa, m.situacao FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE LOWER(m.nome_catequizando)=LOWER(?)",
            [item.nome.trim()]
          ),
        ]);
        if (!cancelled) { setSacramentos(sacrs); setCatequese(cats); }
      } catch (e) {
        console.error("FielDetail:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [item.id, item.nome]);

  const fmtDate = (s: string) =>
    s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "";

  // Deduplica sacramentos: apenas o primeiro registro por tipo
  const sacrByTipo = new Map<string, { tipo: string; data_sacramento: string }>();
  sacramentos.forEach(s => { if (!sacrByTipo.has(s.tipo)) sacrByTipo.set(s.tipo, s); });
  const sacramentosUnicos = Array.from(sacrByTipo.values());

  type JornadaItem = { key: string; label: string; data: string; color: string; extra?: string };
  const jornada: JornadaItem[] = [
    ...sacramentos.map(s => ({
      key: s.tipo + s.data_sacramento,
      label: SACR_LABEL[s.tipo] ?? s.tipo,
      data: s.data_sacramento,
      color: SACR_COLOR[s.tipo] ?? "var(--accent)",
    })),
    ...catequese.map((c, i) => ({
      key: "cat" + i,
      label: `Catequese — ${c.etapa}`,
      data: "",
      color: "var(--accent-green)",
      extra: c.situacao,
    })),
    ...(item.isDizimista ? [{ key: "diz", label: "Dízimo Ativo", data: "", color: "var(--accent-orange)" }] : []),
  ].sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return a.data.localeCompare(b.data);
  });

  return (
    <>
      {/* ── HERO centrado ── */}
      <div style={{ textAlign: "center", paddingBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Avatar nome={item.nome} size={60} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.25, wordBreak: "break-word" }}>
          {item.nome}
        </div>
        {item.comunidade && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            {item.comunidade}
          </div>
        )}
      </div>

      {/* ── SACRAMENTOS ── */}
      {!loading && sacramentosUnicos.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Sacramentos">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {sacramentosUnicos.map(s => (
                <div key={s.tipo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: SACR_COLOR[s.tipo] ?? "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, flex: 1 }}>
                    {SACR_LABEL[s.tipo] ?? s.tipo}
                  </span>
                  {s.data_sacramento && (
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400 }}>
                      {s.data_sacramento.substring(0, 4)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </PanelSection>
        </>
      )}

      {/* ── PARTICIPAÇÃO ── */}
      {(item.isDizimista || catequese.length > 0) && (
        <>
          <PanelDivider />
          <PanelSection title="Participação">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {item.isDizimista && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-orange)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>Dizimista ativo</span>
                </div>
              )}
              {catequese.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, flex: 1 }}>
                    Catequese — {c.etapa}
                  </span>
                  {c.situacao && (
                    <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{c.situacao}</span>
                  )}
                </div>
              ))}
            </div>
          </PanelSection>
        </>
      )}

      {/* ── CONTATO ── */}
      {(item.data_nascimento || item.telefone || item.email || item.endereco) && (
        <>
          <PanelDivider />
          <PanelSection title="Contato">
            {item.data_nascimento && <div style={ROW}><span style={LABEL}>Nascimento</span><span style={VALUE}>{item.data_nascimento.split("-").reverse().join("/")}</span></div>}
            {item.telefone && <div style={ROW}><span style={LABEL}>Telefone</span><span style={VALUE}>{item.telefone}</span></div>}
            {item.email && <div style={ROW}><span style={LABEL}>E-mail</span><span style={{ ...VALUE, fontSize: 10 }}>{item.email}</span></div>}
            {item.endereco && <div style={ROW}><span style={LABEL}>Endereço</span><span style={{ ...VALUE, fontSize: 10 }}>{item.endereco}</span></div>}
          </PanelSection>
        </>
      )}

      {/* ── JORNADA PASTORAL ── */}
      <PanelDivider />
      <PanelSection title="Jornada Pastoral">
        {loading ? (
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "4px 0" }}>Carregando jornada...</div>
        ) : jornada.length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "4px 0" }}>Nenhum registro sacramental encontrado.</div>
        ) : (
          <div style={{ position: "relative" }}>
            {jornada.map((j, i) => (
              <div key={j.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 12, position: "relative" }}>
                {i < jornada.length - 1 && (
                  <div style={{ position: "absolute", left: 11, top: 22, bottom: 0, width: 1, background: "var(--separator)" }} />
                )}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                  background: j.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, color: "#fff",
                }}>
                  {j.label[0]}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{j.label}</div>
                  {j.data && <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>{fmtDate(j.data)}</div>}
                  {j.extra && <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>{j.extra}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelSection>

      {/* ── ABRIR FICHA COMPLETA ── */}
      <div style={{ marginTop: 12, paddingBottom: 2 }}>
        <button
          onClick={() => navigate("ficha" as any, String(item.id))}
          style={{
            width: "100%", padding: "11px 16px",
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 10,
            fontWeight: 600, fontSize: 13,
            cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "-0.1px",
            transition: "opacity 150ms ease, transform 150ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = ""; }}
        >
          Abrir Ficha Completa
        </button>
      </div>
    </>
  );
}

/* ─── Sacramento detail ───────────────────────────────────────── */
type SacrItem = Extract<SelectedItem, { type: "sacramento" }>;

function SacramentoDetail({ item }: { item: SacrItem }) {
  // Parse json_dados; Batismo usa estrutura aninhada { batizando: {...}, padrinhos: {...} }
  let raw: Record<string, unknown> = {};
  try { raw = JSON.parse(item.jsonDados || "{}") as Record<string, unknown>; } catch {}
  const flat: Record<string, unknown> =
    (raw.batizando && typeof raw.batizando === "object") ? raw.batizando as Record<string, unknown> : raw;

  // Referência de arquivo
  const livro = flat.livro  || flat.livroReg  || raw.livroReg  || "";
  const folha = flat.folha  || flat.folhaReg  || flat.pagina   || raw.folhaReg || "";
  const num   = flat.numero || flat.numReg    || flat.numeroFicha || raw.numReg || "";
  const refParts = [
    livro && `Livro ${livro}`,
    folha && `Folha ${folha}`,
    num   && `Nº ${num}`,
  ].filter(Boolean);

  // Pessoas envolvidas — tenta múltiplos nomes de campo
  const str = (v: unknown) => (typeof v === "string" && v.trim()) ? v.trim() : "";
  const pessoas: { label: string; value: string }[] = [];
  const addPessoa = (label: string, ...keys: string[]) => {
    const v = keys.map(k => str(flat[k])).find(Boolean) || "";
    if (v) pessoas.push({ label, value: v });
  };
  addPessoa("Pai",       "pai",       "paiNome");
  addPessoa("Mãe",       "mae",       "maeNome");
  addPessoa("Padrinho",  "padrinho",  "padrinhoNome");
  addPessoa("Madrinha",  "madrinha",  "madrinhaNome");
  addPessoa("Cônjuge",   "conjuge",   "noivaNome", "noivoNome");
  addPessoa("Ministro",  "ministro");
  addPessoa("Testemunha 1", "testemunha1", "test1Nome");
  addPessoa("Testemunha 2", "testemunha2", "test2Nome");

  const observ = str(flat.observacoes) || str(raw.observacoes);

  const tipoLabel = SACR_LABEL[item.tipo] ?? item.tipo;
  const cor       = SACR_COLOR[item.tipo] ?? "var(--accent)";
  const fmtDate = (s: string) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";

  return (
    <>
      {/* ── Hero ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--separator)" }}>
        <Avatar nome={item.nomePrincipal || "?"} size={44} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3, wordBreak: "break-word" }}>
            {item.nomePrincipal || "—"}
          </div>
          <div style={{
            marginTop: 5, display: "inline-flex",
            background: `${cor}18`, border: `1px solid ${cor}30`,
            borderRadius: 6, padding: "2px 8px",
            fontSize: 10, fontWeight: 700, color: cor,
          }}>
            {tipoLabel}
          </div>
        </div>
      </div>

      {/* ── Referência de arquivo ── */}
      {refParts.length > 0 && (
        <div style={{
          background: "rgba(255, 159, 10, 0.06)",
          border: "1px solid rgba(255, 159, 10, 0.22)",
          borderRadius: 10, padding: "10px 12px", marginBottom: 14,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.8px",
            textTransform: "uppercase", color: "var(--accent-orange)", marginBottom: 5,
          }}>
            Arquivo Paroquial
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {refParts.join("  ·  ")}
          </div>
        </div>
      )}

      {/* ── Registro ── */}
      <PanelSection title="Registro">
        <div style={ROW}><span style={LABEL}>Data</span><span style={VALUE}>{fmtDate(item.dataSacramento)}</span></div>
        {item.celebrante && <div style={ROW}><span style={LABEL}>Celebrante</span><span style={VALUE}>{item.celebrante}</span></div>}
        {item.comunidade && <div style={ROW}><span style={LABEL}>Comunidade</span><span style={VALUE}>{item.comunidade}</span></div>}
      </PanelSection>

      {/* ── Envolvidos ── */}
      {pessoas.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Envolvidos">
            {pessoas.map(p => (
              <div key={p.label} style={ROW}>
                <span style={LABEL}>{p.label}</span>
                <span style={{ ...VALUE, fontSize: 10 }}>{p.value}</span>
              </div>
            ))}
          </PanelSection>
        </>
      )}

      {/* ── Observações ── */}
      {observ && (
        <>
          <PanelDivider />
          <PanelSection title="Observações">
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{observ}</div>
          </PanelSection>
        </>
      )}
    </>
  );
}

/* ─── Lançamento detail ───────────────────────────────────────── */
type LancItem = Extract<SelectedItem, { type: "lancamento" }>;

function LancamentoDetail({ item }: { item: LancItem }) {
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (s: string) => s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const isEntrada = item.tipoLanc === "ENTRADA";

  return (
    <>
      <div style={{
        borderRadius: 10,
        background: isEntrada ? "rgba(52,199,89,0.09)" : "rgba(255,59,48,0.09)",
        border: `1px solid ${isEntrada ? "rgba(52,199,89,0.18)" : "rgba(255,59,48,0.18)"}`,
        padding: "12px 14px", marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 4 }}>
          {isEntrada ? "Receita" : "Despesa"}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: isEntrada ? "var(--accent-green)" : "var(--accent-red)", lineHeight: 1 }}>
          {fmt(item.valor)}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>{fmtDate(item.data)}</div>
      </div>

      <PanelSection title="Detalhes">
        <div style={ROW}><span style={LABEL}>Descrição</span><span style={{ ...VALUE, fontSize: 10 }}>{item.descricao || "—"}</span></div>
        {item.categoria && <div style={ROW}><span style={LABEL}>Categoria</span><span style={VALUE}>{item.categoria}</span></div>}
        {item.origem && <div style={ROW}><span style={LABEL}>Unidade</span><span style={VALUE}>{item.origem}</span></div>}
      </PanelSection>
    </>
  );
}

/* ─── Patrimônio detail ───────────────────────────────────────── */
type PatItem = Extract<SelectedItem, { type: "patrimonio" }>;

function PatrimonioDetail({ item }: { item: PatItem }) {
  const fmtDate = (s?: string) => s ? s.split("-").reverse().join("/") : "—";
  const fmtCur = (v?: number) => v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—";

  return (
    <>
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--separator)" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>{item.nome}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>{item.categoria}</div>
        {item.estadoConservacao && (
          <div style={{ marginTop: 6, display: "inline-flex", background: "var(--bg-surface)", border: "1px solid var(--border-card)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>
            {item.estadoConservacao}
          </div>
        )}
      </div>

      <PanelSection title="Informações">
        {item.localizacao && <div style={ROW}><span style={LABEL}>Localização</span><span style={{ ...VALUE, fontSize: 10 }}>{item.localizacao}</span></div>}
        <div style={ROW}><span style={LABEL}>Valor Estimado</span><span style={{ ...VALUE, color: "var(--accent)" }}>{fmtCur(item.valorEstimado)}</span></div>
        {item.dataAquisicao && <div style={ROW}><span style={LABEL}>Aquisição</span><span style={VALUE}>{fmtDate(item.dataAquisicao)}</span></div>}
      </PanelSection>

      {item.observacoes && (
        <>
          <PanelDivider />
          <PanelSection title="Observações">
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.observacoes}</div>
          </PanelSection>
        </>
      )}
    </>
  );
}

/* ─── Exported entry ──────────────────────────────────────────── */
export function ItemDetailPanel() {
  const { selectedItem, selectItem } = useWorkspace();
  if (!selectedItem) return null;

  return (
    <div key={`${selectedItem.type}-${selectedItem.id}`} className="item-detail-content">
      <button
        onClick={() => selectItem(null)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--accent)", fontSize: 12, fontWeight: 500, padding: "4px 0",
          fontFamily: "inherit", transition: "opacity 150ms ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <ChevronLeft size={13} />
        Voltar
      </button>

      {selectedItem.type === "fiel"       && <FielDetail item={selectedItem} />}
      {selectedItem.type === "sacramento" && <SacramentoDetail item={selectedItem} />}
      {selectedItem.type === "lancamento" && <LancamentoDetail item={selectedItem} />}
      {selectedItem.type === "patrimonio" && <PatrimonioDetail item={selectedItem} />}
    </div>
  );
}
