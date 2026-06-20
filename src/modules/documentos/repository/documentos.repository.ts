import { getDb } from '@core/database';
import { DocumentoRegistro } from '@core/types/entities';
import { BaseRepository } from '@core/repository';

class DocumentoRegistroRepositoryClass extends BaseRepository<DocumentoRegistro> {
  constructor() { super('documentos_registros', false); }

  async findByTipo(tipo: string): Promise<DocumentoRegistro[]> {
    const db = await getDb();
    return db.select<DocumentoRegistro[]>(
      'SELECT * FROM documentos_registros WHERE tipo = $1 ORDER BY id DESC',
      [tipo]
    );
  }

  async countByTipoAno(tipo: string, ano: number): Promise<number> {
    const db = await getDb();
    const rows = await db.select<{ c: number }[]>(
      'SELECT COUNT(*) as c FROM documentos_registros WHERE tipo = $1 AND numero_protocolo LIKE $2',
      [tipo, `%/${ano}`]
    );
    return rows[0]?.c ?? 0;
  }
}

export const DocumentosRepository = {
  registros: new DocumentoRegistroRepositoryClass(),
};
