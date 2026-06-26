import { getDb } from '@core/database';
import {
  CatequeseTurma, Catequista, CatequeseFicha,
  CatequeseMatricula, CatequeseEncontro, CatequesePresenca,
} from '@core/types/entities';
import { BaseRepository } from '@core/repository';

interface CatequistaComFiel extends Catequista {
  nome_fiel?: string | null;
}

interface PresencaPayloadAluno {
  matricula_id: number;
  status: string;
  justificativa?: string;
  observacao?: string;
}

class CatequeseTurmaRepositoryClass extends BaseRepository<CatequeseTurma> {
  constructor() { super('catequese_turmas', true); }

  async findAllOrdenadas(): Promise<CatequeseTurma[]> {
    const db = await getDb();
    return db.select<CatequeseTurma[]>(
      'SELECT * FROM catequese_turmas WHERE deleted_at IS NULL ORDER BY ano DESC'
    );
  }
}

class CatequistaRepositoryClass extends BaseRepository<Catequista> {
  constructor() { super('catequistas', true); }

  async findComFiel(): Promise<CatequistaComFiel[]> {
    const db = await getDb();
    return db.select<CatequistaComFiel[]>(
      'SELECT id, fiel_id, COALESCE(nome_fiel, nome) as nome_fiel, formacao, disponibilidade, tel_fiel, email_fiel, endereco_fiel FROM catequistas WHERE deleted_at IS NULL ORDER BY nome_fiel ASC'
    );
  }

  async createFromFiel(
    fielId: number,
    nome: string,
    formacao: string,
    disponibilidade: string,
    tel: string,
    email: string,
    endereco: string
  ): Promise<void> {
    const db = await getDb();
    await db.execute(
      'INSERT INTO catequistas (fiel_id, nome, nome_fiel, formacao, disponibilidade, tel_fiel, email_fiel, endereco_fiel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [fielId, nome, nome, formacao, disponibilidade, tel, email, endereco]
    );
  }
}

class CatequeseFichaRepositoryClass extends BaseRepository<CatequeseFicha> {
  constructor() { super('catequese_fichas', true); }

  async findAllOrdenadas(): Promise<CatequeseFicha[]> {
    const db = await getDb();
    return db.select<CatequeseFicha[]>(
      'SELECT * FROM catequese_fichas WHERE deleted_at IS NULL ORDER BY nome ASC'
    );
  }
}

class CatequeseMatriculaRepositoryClass extends BaseRepository<CatequeseMatricula> {
  constructor() { super('catequese_matriculas', true); }

  async findAll(): Promise<CatequeseMatricula[]> {
    const db = await getDb();
    return db.select<CatequeseMatricula[]>('SELECT * FROM catequese_matriculas WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 5000');
  }

  async findByTurma(turmaId: number): Promise<CatequeseMatricula[]> {
    const db = await getDb();
    return db.select<CatequeseMatricula[]>(
      'SELECT * FROM catequese_matriculas WHERE turma_id = $1 AND deleted_at IS NULL',
      [turmaId]
    );
  }

  async softDeleteByTurma(turmaId: number): Promise<void> {
    const db = await getDb();
    await db.execute('UPDATE catequese_matriculas SET deleted_at = CURRENT_TIMESTAMP WHERE turma_id = $1 AND deleted_at IS NULL', [turmaId]);
  }
}

class CatequeseEncontroRepositoryClass extends BaseRepository<CatequeseEncontro> {
  constructor() { super('catequese_encontros', false); }

  async findAllOrdenados(): Promise<CatequeseEncontro[]> {
    const db = await getDb();
    return db.select<CatequeseEncontro[]>(
      'SELECT * FROM catequese_encontros ORDER BY data DESC'
    );
  }

  async findByTurmaData(turmaId: number, data: string): Promise<{ id: number }[]> {
    const db = await getDb();
    return db.select<{ id: number }[]>(
      'SELECT id FROM catequese_encontros WHERE turma_id = $1 AND data = $2',
      [turmaId, data]
    );
  }

  async findIdRecente(turmaId: number, data: string): Promise<number | null> {
    const db = await getDb();
    const rows = await db.select<{ id: number }[]>(
      'SELECT id FROM catequese_encontros WHERE turma_id = $1 AND data = $2 ORDER BY id DESC LIMIT 1',
      [turmaId, data]
    );
    return rows[0]?.id ?? null;
  }
}

class CatequesePresencaRepositoryClass extends BaseRepository<CatequesePresenca> {
  constructor() { super('catequese_presencas', false); }

  async findAll(): Promise<CatequesePresenca[]> {
    const db = await getDb();
    return db.select<CatequesePresenca[]>('SELECT * FROM catequese_presencas ORDER BY id DESC LIMIT 10000');
  }

  async deleteByEncontro(encontroId: number): Promise<void> {
    const db = await getDb();
    await db.execute('DELETE FROM catequese_presencas WHERE encontro_id = $1', [encontroId]);
  }

  async registrarChamada(encontroId: number, chamada: PresencaPayloadAluno[]): Promise<void> {
    const db = await getDb();
    await db.execute('SAVEPOINT chamada_sp');
    try {
      for (const aluno of chamada) {
        await db.execute(
          'INSERT INTO catequese_presencas (encontro_id, matricula_id, status, justificativa, observacao) VALUES ($1, $2, $3, $4, $5)',
          [encontroId, aluno.matricula_id, aluno.status, aluno.justificativa ?? '', aluno.observacao ?? '']
        );
      }
      await db.execute('RELEASE SAVEPOINT chamada_sp');
    } catch (error) {
      try { await db.execute('ROLLBACK TO SAVEPOINT chamada_sp'); } catch { /* ok */ }
      throw error;
    }
  }
}

export const CatequeseRepository = {
  turmas: new CatequeseTurmaRepositoryClass(),
  catequistas: new CatequistaRepositoryClass(),
  fichas: new CatequeseFichaRepositoryClass(),
  matriculas: new CatequeseMatriculaRepositoryClass(),
  encontros: new CatequeseEncontroRepositoryClass(),
  presencas: new CatequesePresencaRepositoryClass(),
};
