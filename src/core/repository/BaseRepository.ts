import { getDb } from "@core/database";

export interface FindAllOptions {
  /** Inclui registros com deleted_at preenchido (padrão: false). */
  includeDeleted?: boolean;
  /** Cláusula ORDER BY sem a palavra-chave (padrão: "id DESC"). */
  orderBy?: string;
  /** Condição WHERE adicional, sem a palavra-chave. Ex: "tipo = $1". */
  where?: string;
  /** Parâmetros de bind para a cláusula where. */
  params?: unknown[];
  limit?: number;
  offset?: number;
}

/**
 * BaseRepository<T> — base genérica para acesso ao banco.
 *
 * Fornece findAll, findById, create, update, softDelete, hardDelete e restore
 * sem alterar nenhuma lógica existente nos hooks ou páginas.
 * Cada módulo pode estender esta classe para queries especializadas.
 *
 * @param tableName  Nome exato da tabela SQLite.
 * @param hasSoftDelete  true se a tabela tiver coluna deleted_at (padrão: true).
 */
export class BaseRepository<T extends { id?: number | null }> {
  constructor(
    protected readonly tableName: string,
    protected readonly hasSoftDelete: boolean = true
  ) {}

  async findAll(options: FindAllOptions = {}): Promise<T[]> {
    const db = await getDb();
    const {
      includeDeleted = false,
      orderBy = "id DESC",
      where,
      params = [],
      limit,
      offset,
    } = options;

    const conditions: string[] = [];
    if (this.hasSoftDelete && !includeDeleted) {
      conditions.push("deleted_at IS NULL");
    }
    if (where) {
      conditions.push(`(${where})`);
    }

    let sql = `SELECT * FROM ${this.tableName}`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    sql += ` ORDER BY ${orderBy}`;
    if (limit !== undefined) sql += ` LIMIT ${limit}`;
    if (offset !== undefined) sql += ` OFFSET ${offset}`;

    return db.select<T[]>(sql, params);
  }

  async findById(id: number): Promise<T | null> {
    const db = await getDb();
    const conditions = ["id = $1"];
    if (this.hasSoftDelete) conditions.push("deleted_at IS NULL");

    const rows = await db.select<T[]>(
      `SELECT * FROM ${this.tableName} WHERE ${conditions.join(" AND ")}`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(data: Omit<T, "id">): Promise<number> {
    const db = await getDb();
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined
    );
    if (entries.length === 0) {
      throw new Error(`BaseRepository.create: sem dados para ${this.tableName}`);
    }

    const cols = entries.map(([k]) => k).join(", ");
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
    const values = entries.map(([, v]) => v);

    const result = await db.execute(
      `INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders})`,
      values
    );
    return result.lastInsertId ?? 0;
  }

  async update(id: number, data: Partial<Omit<T, "id">>): Promise<void> {
    const db = await getDb();
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== undefined
    );
    if (entries.length === 0) return;

    const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(", ");
    const values = [...entries.map(([, v]) => v), id];

    await db.execute(
      `UPDATE ${this.tableName} SET ${sets} WHERE id = $${entries.length + 1}`,
      values
    );
  }

  /** Define deleted_at = CURRENT_TIMESTAMP (soft delete). */
  async softDelete(id: number): Promise<void> {
    if (!this.hasSoftDelete) {
      throw new Error(
        `BaseRepository.softDelete: ${this.tableName} não possui deleted_at`
      );
    }
    const db = await getDb();
    await db.execute(
      `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }

  /** DELETE físico — irreversível. */
  async hardDelete(id: number): Promise<void> {
    const db = await getDb();
    await db.execute(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
  }

  /** Restaura um registro apagado via soft delete (deleted_at = NULL). */
  async restore(id: number): Promise<void> {
    if (!this.hasSoftDelete) {
      throw new Error(
        `BaseRepository.restore: ${this.tableName} não possui deleted_at`
      );
    }
    const db = await getDb();
    await db.execute(
      `UPDATE ${this.tableName} SET deleted_at = NULL WHERE id = $1`,
      [id]
    );
  }
}
