import { useEffect, useState, useCallback } from "react";
import {
  FielProfileService,
  type FielProfileCompleto,
  type TimelineEvent,
} from "@core/services/fielProfile.service";

interface Props {
  fielId: number;
  usuarioNome?: string;
  onVoltar: () => void;
  onNavFiel?: (id: number) => void;
}

// ─── Estilos inline (MacOS nativo) ───────────────────────────────────────────

const S = {
  page: {
    padding: "20px 28px 40px", maxWidth: 960, margin: "0 auto", fontFamily: "inherit",
  } as React.CSSProperties,
  backBtn: {
    background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--accent)",
    padding: "4px 0", display: "flex", alignItems: "center", gap: 4, marginBottom: 12,
  } as React.CSSProperties,
  header: {
    display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24,
  } as React.CSSProperties,
  avatar: {
    width: 72, height: 72, borderRadius: "50%", background: "var(--accent)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 26, fontWeight: 800, flexShrink: 0,
  } as React.CSSProperties,
  nome: {
    fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, margin: 0,
  } as React.CSSProperties,
  meta: {
    fontSize: 12, color: "var(--text-secondary)", marginTop: 2,
  } as React.CSSProperties,
  badges: {
    display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 8,
  } as React.CSSProperties,
  badge: (cor: string) => ({
    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
    background: cor + "18", color: cor, border: `1px solid ${cor}30`,
  }) as React.CSSProperties,
  section: {
    marginBottom: 24,
  } as React.CSSProperties,
  sTitle: {
    fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10,
    borderBottom: "1px solid var(--separator)", paddingBottom: 6,
  } as React.CSSProperties,
  cardGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10,
  } as React.CSSProperties,
  card: {
    background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px",
    border: "1px solid var(--separator)",
  } as React.CSSProperties,
  cardNum: {
    fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1,
  } as React.CSSProperties,
  cardLabel: {
    fontSize: 10, color: "var(--text-secondary)", marginTop: 3,
  } as React.CSSProperties,
  timeline: {
    position: "relative" as const, paddingLeft: 24,
  } as React.CSSProperties,
  tlLine: {
    position: "absolute" as const, left: 7, top: 0, bottom: 0, width: 2,
    background: "var(--separator)", borderRadius: 1,
  } as React.CSSProperties,
  tlDot: (cor: string) => ({
    position: "absolute" as const, left: -20, top: 4, width: 12, height: 12,
    borderRadius: "50%", background: cor, border: "2px solid var(--bg-elevated)",
  }) as React.CSSProperties,
  tlItem: {
    position: "relative" as const, paddingBottom: 18, fontSize: 12,
  } as React.CSSProperties,
  tlDate: {
    fontSize: 10, color: "var(--text-tertiary)", marginBottom: 1,
  } as React.CSSProperties,
  tlDesc: {
    color: "var(--text-primary)", fontWeight: 500,
  } as React.CSSProperties,
  tlTipo: {
    fontSize: 10, color: "var(--text-secondary)", marginTop: 1,
  } as React.CSSProperties,
  tableRow: {
    display: "flex", justifyContent: "space-between", padding: "6px 0",
    borderBottom: "1px solid var(--separator)", fontSize: 12,
  } as React.CSSProperties,
  label: { color: "var(--text-secondary)" } as React.CSSProperties,
  value: { color: "var(--text-primary)", fontWeight: 500, textAlign: "right" as const } as React.CSSProperties,
  membroLink: {
    cursor: "pointer", color: "var(--accent)", textDecoration: "none",
    fontSize: 12, fontWeight: 500,
  } as React.CSSProperties,
  obsArea: {
    display: "flex", gap: 8, marginBottom: 12,
  } as React.CSSProperties,
  obsInput: {
    flex: 1, borderRadius: 8, border: "1px solid var(--separator)",
    background: "var(--bg-elevated)", padding: "8px 10px", fontSize: 12,
    color: "var(--text-primary)", resize: "none" as const, minHeight: 40,
    outline: "none", fontFamily: "inherit",
  } as React.CSSProperties,
  obsBtn: {
    borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff",
    padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    alignSelf: "flex-end",
  } as React.CSSProperties,
  obsItem: {
    padding: "8px 10px", borderRadius: 8, background: "var(--bg-elevated)",
    border: "1px solid var(--separator)", marginBottom: 8, fontSize: 12,
  } as React.CSSProperties,
  empty: {
    fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic" as const, padding: "4px 0",
  } as React.CSSProperties,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcIdade(nasc: string | null): string {
  if (!nasc) return "—";
  const d = new Date(nasc + "T12:00:00");
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  if (hoje.getMonth() < d.getMonth() || (hoje.getMonth() === d.getMonth() && hoje.getDate() < d.getDate())) idade--;
  return `${idade} anos`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  try { return new Date(s + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return s; }
}

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function initiais(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function FichaDoFielPage({ fielId, usuarioNome, onVoltar, onNavFiel }: Props) {
  const [perfil, setPerfil] = useState<FielProfileCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [obsTexto, setObsTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await FielProfileService.carregarPerfil(fielId);
      setPerfil(data);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fielId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarObservacao() {
    if (!obsTexto.trim() || salvando) return;
    setSalvando(true);
    try {
      await FielProfileService.adicionarObservacao(fielId, obsTexto.trim(), usuarioNome ?? "Sistema");
      setObsTexto("");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Carregando ficha...</div>
      </div>
    );
  }

  if (erro || !perfil) {
    return (
      <div style={S.page}>
        <button style={S.backBtn} onClick={onVoltar}>← Voltar</button>
        <div style={{ fontSize: 13, color: "var(--accent-red)" }}>Erro: {erro ?? "Fiel não encontrado"}</div>
      </div>
    );
  }

  const { fiel, indicadores, resumo, sacramentos, catequese, pastorais, familia, financeiro, documentos, observacoes, timeline } = perfil;

  return (
    <div style={S.page} className="mac-scrollbar">
      {/* Voltar */}
      <button style={S.backBtn} onClick={onVoltar}>← Voltar para lista</button>

      {/* ─── 1. CABEÇALHO ───────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.avatar}>{initiais(fiel.nome)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={S.nome}>{fiel.nome}</h1>
          <div style={S.meta}>
            {calcIdade(fiel.data_nascimento)} · {fiel.comunidade ?? "Sem comunidade"}
            {fiel.data_nascimento && <> · Nasc. {fmtDate(fiel.data_nascimento)}</>}
          </div>
          <div style={{ ...S.meta, marginTop: 4 }}>
            {fiel.telefone && <span>{fiel.telefone}</span>}
            {fiel.email && <span> · {fiel.email}</span>}
          </div>
          {fiel.endereco && <div style={{ ...S.meta, marginTop: 2 }}>{fiel.endereco}</div>}
          {fiel.cpf && <div style={{ ...S.meta, marginTop: 2 }}>CPF: {fiel.cpf}</div>}

          {/* Badges */}
          <div style={S.badges}>
            {indicadores.isDizimista && <span style={S.badge("#34C759")}>Dizimista</span>}
            {indicadores.isCatequizando && <span style={S.badge("#FF9500")}>Catequizando</span>}
            {indicadores.isCatequista && <span style={S.badge("#5856D6")}>Catequista</span>}
            {indicadores.isAgentePastoral && <span style={S.badge("#007AFF")}>Agente Pastoral</span>}
            {indicadores.isResponsavelFamiliar && <span style={S.badge("#AF52DE")}>Resp. Familiar</span>}
          </div>
        </div>
      </div>

      {/* ─── 2. RESUMO PASTORAL ─────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.cardGrid}>
          <StatCard num={resumo.sacramentos} label="Sacramentos" cor="var(--accent-purple)" />
          <StatCard num={resumo.pastorais + resumo.gruposMovimentos} label="Pastorais / Grupos" cor="var(--accent-green)" />
          <StatCard num={resumo.registrosFinanceiros} label="Contribuições" cor="var(--accent-orange)" />
          <StatCard num={resumo.documentosEmitidos} label="Documentos" cor="#5856D6" />
        </div>
      </div>

      {/* ─── 3. LINHA DO TEMPO PASTORAL ─────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Linha do Tempo Pastoral</div>
        {timeline.length === 0 ? (
          <div style={S.empty}>Nenhum evento registrado.</div>
        ) : (
          <div style={S.timeline}>
            <div style={S.tlLine} />
            {timeline.map((ev, i) => (
              <TimelineItem key={i} ev={ev} />
            ))}
          </div>
        )}
      </div>

      {/* ─── 4. DADOS FAMILIARES ────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Família</div>
        {!familia ? (
          <div style={S.empty}>Nenhuma família vinculada.</div>
        ) : (
          <>
            <div style={S.tableRow}>
              <span style={S.label}>Família</span>
              <span style={S.value}>{familia.sobrenome}</span>
            </div>
            {familia.parentesco && (
              <div style={S.tableRow}>
                <span style={S.label}>Parentesco</span>
                <span style={S.value}>{familia.parentesco}</span>
              </div>
            )}
            {familia.membros.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>Membros:</div>
                {familia.membros.map(m => (
                  <div key={m.id} style={{ ...S.tableRow, cursor: onNavFiel ? "pointer" : "default" }}
                       onClick={() => onNavFiel?.(m.id)}>
                    <span style={onNavFiel ? S.membroLink : S.label}>{m.nome}</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{m.parentesco ?? ""}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── 5. SACRAMENTOS ─────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Sacramentos</div>
        {sacramentos.length === 0 ? (
          <div style={S.empty}>Nenhum sacramento registrado.</div>
        ) : (
          sacramentos.map(s => (
            <div key={s.id} style={S.tableRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 12 }}>{s.tipo}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                  {s.celebrante && `Cel. ${s.celebrante}`}{s.comunidade && ` · ${s.comunidade}`}
                  {s.livro && ` · Lv.${s.livro} Fl.${s.folha ?? "—"} As.${s.assento ?? "—"}`}
                </div>
              </div>
              <span style={S.value}>{fmtDate(s.data_sacramento)}</span>
            </div>
          ))
        )}
      </div>

      {/* ─── 6. CATEQUESE ───────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Catequese</div>
        {catequese.length === 0 ? (
          <div style={S.empty}>Nenhum registro de catequese.</div>
        ) : (
          catequese.map(c => (
            <div key={c.id} style={S.tableRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 12 }}>{c.etapa}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{c.turma} · {c.ano}</div>
              </div>
              <span style={{
                ...S.value, fontSize: 11,
                color: c.situacao === "CONCLUIDO" ? "var(--accent-green)" : c.situacao === "CANCELADO" ? "var(--accent-red)" : "var(--accent-orange)",
              }}>
                {c.situacao ?? "Em andamento"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ─── 7. PASTORAIS E MINISTÉRIOS ─────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Pastorais e Ministérios</div>
        {pastorais.length === 0 ? (
          <div style={S.empty}>Não participa de pastorais ou grupos.</div>
        ) : (
          pastorais.map(p => (
            <div key={`${p.tipo}-${p.id}`} style={S.tableRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 12 }}>{p.nome}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                  {p.tipo === "pastoral" ? "Pastoral" : "Grupo/Movimento"}
                </div>
              </div>
              <span style={{ ...S.value, fontSize: 11 }}>{p.cargo ?? "Membro"}</span>
            </div>
          ))
        )}
      </div>

      {/* ─── 8. DÍZIMO E FINANCEIRO ─────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Dízimo e Contribuições</div>
        <div style={S.tableRow}>
          <span style={S.label}>Status</span>
          <span style={{ ...S.value, color: indicadores.isDizimista ? "var(--accent-green)" : "var(--text-tertiary)" }}>
            {indicadores.isDizimista ? "Dizimista ativo" : "Não é dizimista"}
          </span>
        </div>
        <div style={S.tableRow}>
          <span style={S.label}>Total de contribuições</span>
          <span style={S.value}>{fmtCurrency(financeiro.totalContribuicoes)}</span>
        </div>
        <div style={S.tableRow}>
          <span style={S.label}>Registros</span>
          <span style={S.value}>{financeiro.countContribuicoes}</span>
        </div>
        {financeiro.ultimaContribuicao && (
          <div style={S.tableRow}>
            <span style={S.label}>Última contribuição</span>
            <span style={S.value}>{fmtDate(financeiro.ultimaContribuicao)}</span>
          </div>
        )}
      </div>

      {/* ─── 9. DOCUMENTOS ──────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Documentos Emitidos</div>
        {documentos.length === 0 ? (
          <div style={S.empty}>Nenhum documento emitido.</div>
        ) : (
          documentos.map(d => (
            <div key={d.id} style={S.tableRow}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 12 }}>{d.tipo}</div>
                {d.assunto && <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{d.assunto}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ ...S.value, fontSize: 11 }}>{fmtDate(d.data_emissao)}</div>
                {d.numero_protocolo && <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Prot. {d.numero_protocolo}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── 10. OBSERVAÇÕES PASTORAIS ──────────────────────────── */}
      <div style={S.section}>
        <div style={S.sTitle}>Observações Pastorais</div>

        <div style={S.obsArea}>
          <textarea
            style={S.obsInput}
            placeholder="Adicionar observação pastoral..."
            value={obsTexto}
            onChange={e => setObsTexto(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); salvarObservacao(); } }}
          />
          <button style={S.obsBtn} onClick={salvarObservacao} disabled={salvando || !obsTexto.trim()}>
            {salvando ? "..." : "Salvar"}
          </button>
        </div>

        {observacoes.length === 0 ? (
          <div style={S.empty}>Nenhuma observação registrada.</div>
        ) : (
          observacoes.map(o => (
            <div key={o.id} style={S.obsItem}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 11 }}>{o.autor}</span>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{fmtDate(o.created_at)}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{o.texto}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ num, label, cor }: { num: number; label: string; cor: string }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardNum, color: cor }}>{num}</div>
      <div style={S.cardLabel}>{label}</div>
    </div>
  );
}

function TimelineItem({ ev }: { ev: TimelineEvent }) {
  return (
    <div style={S.tlItem}>
      <div style={S.tlDot(ev.cor)} />
      <div style={S.tlDate}>{fmtDate(ev.data)}</div>
      <div style={S.tlDesc}>{ev.descricao}</div>
      <div style={S.tlTipo}>{ev.tipo}</div>
    </div>
  );
}
