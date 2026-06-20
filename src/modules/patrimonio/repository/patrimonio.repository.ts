import { getDb } from '@core/database';
import { PatrimonioBem, PatrimonioManutencao } from '@core/types/entities';
import { BaseRepository } from '@core/repository';

class PatrimonioBemRepositoryClass extends BaseRepository<PatrimonioBem> {
  constructor() { super('patrimonio_bens', true); }

  async findAllOrdenados(): Promise<PatrimonioBem[]> {
    const db = await getDb();
    return db.select<PatrimonioBem[]>(
      'SELECT * FROM patrimonio_bens WHERE deleted_at IS NULL ORDER BY nome ASC'
    );
  }
}

class PatrimonioManutencaoRepositoryClass extends BaseRepository<PatrimonioManutencao> {
  constructor() { super('patrimonio_manutencoes', false); }

  async findByBem(bemId: number): Promise<PatrimonioManutencao[]> {
    const db = await getDb();
    return db.select<PatrimonioManutencao[]>(
      'SELECT * FROM patrimonio_manutencoes WHERE bem_id = $1 ORDER BY data_manutencao DESC',
      [bemId]
    );
  }

  async findAllOrdenadas(): Promise<PatrimonioManutencao[]> {
    const db = await getDb();
    return db.select<PatrimonioManutencao[]>(
      'SELECT * FROM patrimonio_manutencoes ORDER BY data_manutencao DESC'
    );
  }

  async registrar(
    bemId: number,
    dataMantencao: string,
    descricao: string,
    prestador: string,
    valorGasto: number,
    observacoes: string
  ): Promise<void> {
    const db = await getDb();
    await db.execute(
      'INSERT INTO patrimonio_manutencoes (bem_id, data_manutencao, descricao, prestador_servico, valor_gasto, observacoes) VALUES (?,?,?,?,?,?)',
      [bemId, dataMantencao, descricao, prestador, valorGasto, observacoes]
    );
  }
}

export const PatrimonioRepository = {
  bens: new PatrimonioBemRepositoryClass(),
  manutencoes: new PatrimonioManutencaoRepositoryClass(),
};
