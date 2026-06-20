import { printWithTitle } from "@core/utils/pdfGenerator";
// src/modules/patrimonio/pages/PatrimonioPage.tsx
import React from 'react';
import { usePatrimonio } from '../hooks/usePatrimonio';
import { ModalConfirm, ModalAlert } from '../../../core/ui/Modal';
import { colors, spacing, typography } from '../../../design';
import { useState } from 'react';
import { useWorkspace } from "@/layouts/WorkspaceContext";

const inS: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.border}`, width: "100%", fontFamily: typography.fontFamily, fontSize: typography.fontSize.sm, boxSizing: "border-box", background: colors.surface, color: colors.text };

const ESTADOS = ["Excelente", "Bom", "Regular", "Necessita Reparo"];

const COR_ESTADO: Record<string, { bg: string; text: string }> = {
  "Excelente": { bg: "#d1fae5", text: "#065f46" },
  "Bom": { bg: "#cffafe", text: "#164e63" },
  "Regular": { bg: "#fef3c7", text: "#92400e" },
  "Necessita Reparo": { bg: "#fee2e2", text: "#991b1b" },
};

interface PatrimonioPageProps {
  /** Quando definido, restringe a visão a esta comunidade (por id) */
  comunidadeFixa?: number | null;
}

export const PatrimonioPage: React.FC<PatrimonioPageProps> = ({ comunidadeFixa }) => {
  const {
    bensFiltrados, comunidades, carregando, buscaTermo, setBuscaTermo,
    filtroComunidade, setFiltroComunidade, registrarBem, apagarBem,
    carregarParaEdicao, limparFormulario, editandoId,
    nome, setNome, categoria, setCategoria, localizacao, setLocalizacao,
    comunidadeId, setComunidadeId, dataAquisicao, setDataAquisicao,
    valorEstimado, setValorEstimado, estadoConservacao, setEstadoConservacao,
    observacoes, setObservacoes,
  } = usePatrimonio({ comunidadeFixa: comunidadeFixa ?? null });

  const [idExcluir, setIdExcluir] = useState<number | null>(null);
  const [alerta, setAlerta] = useState<{ tipo: "sucesso" | "erro"; msg: string } | null>(null);
  const { selectItem } = useWorkspace();

  const valorTotal = bensFiltrados.reduce((acc, cur) => acc + (cur.valor_estimado || 0), 0);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registrarBem();
      setAlerta({ tipo: "sucesso", msg: editandoId ? "Bem atualizado com sucesso!" : "Bem cadastrado com sucesso!" });
    } catch { setAlerta({ tipo: "erro", msg: "Erro ao salvar o bem." }); }
  };

  const confirmarExcluir = async () => {
    if (!idExcluir) return;
    try {
      await apagarBem(idExcluir);
      setAlerta({ tipo: "sucesso", msg: "Bem excluído." });
    } catch { setAlerta({ tipo: "erro", msg: "Erro ao excluir." }); }
    setIdExcluir(null);
  };

  return (
    <div style={{ padding: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.lg, fontFamily: typography.fontFamily, color: colors.text }}>
      <ModalConfirm aberto={idExcluir !== null} titulo="Excluir Bem" mensagem="Deseja excluir este bem patrimonial? O histórico de manutenções também será removido." onConfirmar={confirmarExcluir} onCancelar={() => setIdExcluir(null)} />
      <ModalAlert aberto={!!alerta} tipo={alerta?.tipo ?? "info"} mensagem={alerta?.msg ?? ""} onFechar={() => setAlerta(null)} />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .pat-print, .pat-print * { visibility: visible; }
          .pat-print { position: absolute; left: 0; top: 0; width: 98%; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.surface, padding: spacing.lg, borderRadius: 14, border: `1px solid ${colors.border}` }}>
        <div>
          <h2 style={{ margin: 0, color: colors.text, fontSize: typography.fontSize.xl, fontWeight: 700 }}>Gestão Patrimonial</h2>
          <small style={{ color: colors.textMuted }}>Controle e inventário de bens paroquiais</small>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <input type="text" placeholder="🔍 Pesquisar..." value={buscaTermo} onChange={e => setBuscaTermo(e.target.value)} style={{ ...inS, width: 200 }} />
          {comunidadeFixa ? (
            <div style={{ ...inS, width: 180, display: "inline-flex", alignItems: "center", gap: 6 }}>
              🔒 {comunidades.find(c => c.id === comunidadeFixa)?.nome ?? "Minha comunidade"}
            </div>
          ) : (
            <select value={filtroComunidade} onChange={e => setFiltroComunidade(e.target.value)} style={{ ...inS, width: 180 }}>
              <option value="TODOS">Todas as Comunidades</option>
              <option value="MATRIZ">Matriz</option>
              {comunidades.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
            </select>
          )}
          <button onClick={() => printWithTitle("Relatório de Patrimônio")} style={{ padding: "8px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: typography.fontFamily, fontSize: typography.fontSize.sm, whiteSpace: "nowrap" }}>
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="pat-print" style={{ display: "none" }}>
        <h1 style={{ textAlign: "center", marginBottom: 8 }}>Inventário Patrimonial</h1>
        <p style={{ textAlign: "center", marginBottom: 16 }}>
          Itens: {bensFiltrados.length} | Valor Total: R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Data: {new Date().toLocaleDateString("pt-BR")}
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
          <thead><tr>{["Nome","Categoria","Localização","Aquisição","Valor","Estado"].map(h => <th key={h} style={{ border: "1px solid #000", padding: 8, background: "#eee", textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {bensFiltrados.map(b => {
              const com = comunidades.find(c => String(c.id) === String(b.comunidade_id));
              return (
                <tr key={b.id}>
                  <td style={{ border: "1px solid #000", padding: 8 }}>{b.nome}</td>
                  <td style={{ border: "1px solid #000", padding: 8 }}>{b.categoria}</td>
                  <td style={{ border: "1px solid #000", padding: 8 }}>{b.localizacao || "-"} {com ? `(${com.nome})` : "(Matriz)"}</td>
                  <td style={{ border: "1px solid #000", padding: 8 }}>{b.data_aquisicao ? b.data_aquisicao.split("-").reverse().join("/") : "-"}</td>
                  <td style={{ border: "1px solid #000", padding: 8, fontWeight: "bold" }}>R$ {(b.valor_estimado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: "1px solid #000", padding: 8 }}>{b.estado_conservacao}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Corpo principal */}
      <div className="no-print" style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        {/* Formulário */}
        <div style={{ width: 320, background: colors.surface, borderRadius: 14, border: `1px solid ${colors.border}`, padding: spacing.lg, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <h3 style={{ margin: 0, fontSize: typography.fontSize.sm, fontWeight: 700, color: editandoId ? colors.warning : colors.primary }}>
              {editandoId ? "✏️ Editar Bem" : "+ Novo Bem"}
            </h3>
            {editandoId && (
              <button onClick={limparFormulario} style={{ fontSize: typography.fontSize.xs, color: colors.textMuted, background: "none", border: "none", cursor: "pointer" }}>Cancelar</button>
            )}
          </div>
          <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {[
              { label: "Nome do Bem *", key: "nome", value: nome, set: setNome, type: "text", placeholder: "Ex: Veículo Fiat Uno" },
              { label: "Categoria *", key: "cat", value: categoria, set: setCategoria, type: "text", placeholder: "Ex: Veículos, Som..." },
              { label: "Localização", key: "loc", value: localizacao, set: setLocalizacao, type: "text", placeholder: "Ex: Garagem, Sacristia" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inS} required={f.label.includes("*")} />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>Comunidade</label>
              <select value={comunidadeId} onChange={e => setComunidadeId(e.target.value)} style={inS}>
                <option value="">Geral / Matriz</option>
                {comunidades.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>Data de Aquisição</label>
              <input type="date" value={dataAquisicao} onChange={e => setDataAquisicao(e.target.value)} style={inS} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>Valor Estimado (R$)</label>
              <input type="text" value={valorEstimado} onChange={e => setValorEstimado(e.target.value)} placeholder="0,00" style={inS} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>Estado de Conservação</label>
              <select value={estadoConservacao} onChange={e => setEstadoConservacao(e.target.value)} style={inS}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: typography.fontSize.xs, fontWeight: 600, color: colors.textSecondary, marginBottom: 3 }}>Observações</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} style={{ ...inS, resize: "vertical" }} />
            </div>
            <button type="submit" style={{ padding: "10px", background: editandoId ? colors.warning : colors.primary, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: typography.fontFamily }}>
              {editandoId ? "Salvar Alterações" : "Cadastrar Bem"}
            </button>
          </form>
        </div>

        {/* Tabela */}
        <div style={{ flex: 1, background: colors.surface, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ padding: `${spacing.md}px ${spacing.lg}px`, borderBottom: `1px solid ${colors.divider}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: typography.fontSize.sm }}>Itens ({bensFiltrados.length})</span>
            <span style={{ fontWeight: 800, color: colors.primary, fontSize: typography.fontSize.sm }}>
              Valor Total: R$ {valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {carregando ? <div style={{ padding: spacing.xl, textAlign: "center", color: colors.textMuted }}>Carregando...</div> : bensFiltrados.length === 0 ? (
            <div style={{ padding: spacing.xl, textAlign: "center", color: colors.textMuted }}>Nenhum bem patrimonial encontrado.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: colors.surfaceSoft }}>
                  {["Nome","Categoria","Localização / Comunidade","Aquisição","Valor","Estado","Ações"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: typography.fontSize.xs, color: colors.textSecondary, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {bensFiltrados.map(bem => {
                    const com = comunidades.find(c => String(c.id) === String(bem.comunidade_id));
                    const corEst = COR_ESTADO[bem.estado_conservacao ?? "Bom"] ?? COR_ESTADO["Bom"];
                    return (
                      <tr
                        key={bem.id}
                        style={{ borderTop: `1px solid ${colors.divider}`, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover, rgba(0,0,0,0.03))")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}
                        onClick={() => selectItem({ type: "patrimonio", id: bem.id!, nome: bem.nome, categoria: bem.categoria, localizacao: bem.localizacao ?? undefined, valorEstimado: bem.valor_estimado ?? undefined, estadoConservacao: bem.estado_conservacao ?? undefined, dataAquisicao: bem.data_aquisicao ?? undefined, observacoes: bem.observacoes ?? undefined })}
                      >
                        <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: typography.fontSize.sm }}>{bem.nome}</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ background: colors.surfaceSoft, padding: "2px 8px", borderRadius: 6, fontSize: typography.fontSize.xs, fontWeight: 500 }}>{bem.categoria}</span></td>
                        <td style={{ padding: "10px 14px", fontSize: typography.fontSize.sm }}>
                          <div>{bem.localizacao || "—"}</div>
                          <small style={{ color: colors.primary, fontWeight: 500 }}>{com ? `📌 ${com.nome}` : "⛪ Matriz"}</small>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: typography.fontSize.sm, color: colors.textSecondary }}>{bem.data_aquisicao ? bem.data_aquisicao.split("-").reverse().join("/") : "—"}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: colors.primary }}>
                          R$ {(bem.valor_estimado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: corEst.bg, color: corEst.text, padding: "3px 8px", borderRadius: 6, fontSize: typography.fontSize.xs, fontWeight: 700 }}>{bem.estado_conservacao}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={e => { e.stopPropagation(); carregarParaEdicao(bem); }} style={{ color: colors.primary, background: "none", border: "none", cursor: "pointer", fontSize: typography.fontSize.xs, fontWeight: 600 }}>Editar</button>
                            <button onClick={e => { e.stopPropagation(); bem.id && setIdExcluir(bem.id); }} style={{ color: colors.danger, background: "none", border: "none", cursor: "pointer", fontSize: typography.fontSize.xs, fontWeight: 600 }}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
