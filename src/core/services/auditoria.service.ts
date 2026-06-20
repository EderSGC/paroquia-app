import { getDb } from "../database";

export type AcaoAuditoria = "INCLUSAO" | "ALTERACAO" | "EXCLUSAO";

export interface EntradaAuditoria {
  usuario_id: number;
  acao: AcaoAuditoria;
  tabela: string;
  registro_id?: number | null;
  descricao: string;
}

export interface RegistroAuditoria extends EntradaAuditoria {
  id: number;
  usuario_nome?: string;
  data_hora: string;
}

export interface FiltrosAuditoria {
  usuario_id?: number;
  tabela?: string;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}

/** Grava uma entrada na tabela de auditoria. Falhas são silenciosas para não
 *  bloquear a operação principal que chamou este serviço. */
export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO auditoria (usuario_id, acao, tabela, registro_id, descricao)
       VALUES (?, ?, ?, ?, ?)`,
      [entrada.usuario_id, entrada.acao, entrada.tabela, entrada.registro_id ?? null, entrada.descricao],
    );
  } catch (err) {
    console.warn("[Auditoria] Falha ao registrar entrada:", err);
  }
}

export async function listarAuditoria(filtros?: FiltrosAuditoria): Promise<RegistroAuditoria[]> {
  const db = await getDb();

  const conds: string[] = [];
  const params: unknown[] = [];

  if (filtros?.usuario_id) {
    conds.push("a.usuario_id = ?");
    params.push(filtros.usuario_id);
  }
  if (filtros?.tabela) {
    conds.push("a.tabela = ?");
    params.push(filtros.tabela);
  }
  if (filtros?.dataInicio) {
    conds.push("DATE(a.data_hora) >= ?");
    params.push(filtros.dataInicio);
  }
  if (filtros?.dataFim) {
    conds.push("DATE(a.data_hora) <= ?");
    params.push(filtros.dataFim);
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const limite = filtros?.limite ?? 500;

  const rows = await db.select<RegistroAuditoria[]>(
    `SELECT a.*, u.nome AS usuario_nome
     FROM auditoria a
     LEFT JOIN usuarios u ON a.usuario_id = u.id
     ${where}
     ORDER BY a.data_hora DESC
     LIMIT ${limite}`,
    params,
  );

  return rows;
}

export const TABELAS_LABEL: Record<string, string> = {
  fieis:                 "Fiéis",
  comunidades:           "Comunidades",
  sacramentos_registros: "Sacramentos",
  lancamentos:           "Financeiro",
  patrimonio_bens:       "Patrimônio",
  usuarios:              "Usuários",
  agenda_compromissos:   "Agenda",
  catequese_turmas:      "Catequese",
  familias:              "Famílias",
};

export const ACAO_COR: Record<AcaoAuditoria, { bg: string; text: string }> = {
  INCLUSAO:  { bg: "#d1fae5", text: "#065f46" },
  ALTERACAO: { bg: "#fef3c7", text: "#92400e" },
  EXCLUSAO:  { bg: "#fee2e2", text: "#991b1b" },
};
