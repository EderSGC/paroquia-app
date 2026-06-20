import { useEffect, useState } from "react";
import { getDb } from "@db";

type RecordType = Record<string, any>;

export function useCrud<T extends RecordType>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function list() {
    setLoading(true);
    try {
      const db = await getDb();
      const result = await db.select<T[]>(`SELECT * FROM ${table} ORDER BY id DESC`);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function create(item: Partial<T>) {
    const db = await getDb();

    const keys = Object.keys(item);
    const values = Object.values(item);

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(",");

    await db.execute(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`,
      values
    );

    await list();
  }

  async function update(id: number, item: Partial<T>) {
    const db = await getDb();

    const keys = Object.keys(item);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    await db.execute(
      `UPDATE ${table} SET ${set} WHERE id = $${keys.length + 1}`,
      [...Object.values(item), id]
    );

    await list();
  }

  async function remove(id: number) {
    const db = await getDb();
    await db.execute(`DELETE FROM ${table} WHERE id = $1`, [id]);

    await list();
  }

  async function findById(id: number): Promise<T | null> {
    const db = await getDb();
    const result = await db.select<T[]>(
      `SELECT * FROM ${table} WHERE id = $1`,
      [id]
    );

    return result?.[0] ?? null;
  }

  useEffect(() => {
    list();
  }, []);

  return {
    data,
    loading,
    error,
    list,
    create,
    update,
    remove,
    findById,
  };
}