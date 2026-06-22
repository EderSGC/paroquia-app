// src/modules/agenda/repository/agenda.repository.ts
import { getDb } from "@core/database";
import { CompromissoAgenda } from "../types/agenda.types";

export const AgendaRepository = {
  /**
   * Busca compromissos filtrados por categoria.
   * O repositório é o único responsável pela query SQL.
   */
  async fetchByCategory(categoria: string) {
    const db = await getDb();
    return await db.select<CompromissoAgenda[]>(`
      SELECT a.*, f.nome as nome_fiel, f.telefone as telefone_fiel
      FROM agenda_compromissos a
      LEFT JOIN fieis f ON a.fiel_id = f.id
      WHERE a.categoria = ? AND a.deleted_at IS NULL
      ORDER BY a.data ASC, a.horario ASC
    `, [categoria]);
  },

  /**
   * Executa a inserção ou atualização no banco.
   */
  async save(c: CompromissoAgenda) {
    const db = await getDb();
    if (c.id) {
      return await db.execute(`
        UPDATE agenda_compromissos 
        SET titulo = ?, descricao = ?, data = ?, horario = ?, local = ?, categoria = ?, fiel_id = ?
        WHERE id = ?
      `, [c.titulo, c.descricao, c.data, c.horario, c.local, c.categoria, c.fiel_id, c.id]);
    } else {
      return await db.execute(`
        INSERT INTO agenda_compromissos (titulo, descricao, data, horario, local, categoria, fiel_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [c.titulo, c.descricao, c.data, c.horario, c.local, c.categoria, c.fiel_id]);
    }
  },

  async delete(id: number) {
    const db = await getDb();
    return await db.execute("UPDATE agenda_compromissos SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  }
};