import { getDb } from '@core/database';
import { SacramentoRegistro, ObitoExequia } from '@core/types/entities';
import { BaseRepository } from '@core/repository';

class SacramentoRegistroRepositoryClass extends BaseRepository<SacramentoRegistro> {
  constructor() { super('sacramentos_registros', true); }

  private extrairLivroFolhaAssento(
    tipo: string,
    jsonDados: string
  ): { livro: string | null; folha: string | null; assento: string | null } {
    try {
      const j = JSON.parse(jsonDados);
      const v = (x: unknown): string | null =>
        x != null && String(x).trim() !== '' ? String(x).trim() : null;
      switch (tipo) {
        case 'BATISMO':
          return {
            livro:   v(j?.batizando?.livro),
            folha:   v(j?.batizando?.pagina),
            assento: v(j?.batizando?.numeroFicha),
          };
        case 'MATRIMONIO':
          return {
            livro:   v(j?.livroReg),
            folha:   v(j?.folhaReg),
            assento: v(j?.numReg),
          };
        case 'CERT_BATISMO':
        case 'CERT_CRISMA':
        case 'CERT_MATRIMONIO':
          return {
            livro:   v(j?.livro),
            folha:   v(j?.folha),
            assento: v(j?.termo),
          };
        default:
          return { livro: null, folha: null, assento: null };
      }
    } catch {
      return { livro: null, folha: null, assento: null };
    }
  }

  async findByTipo(tipo: string): Promise<SacramentoRegistro[]> {
    const db = await getDb();
    return db.select<SacramentoRegistro[]>(
      'SELECT * FROM sacramentos_registros WHERE tipo = $1 AND deleted_at IS NULL ORDER BY data_sacramento DESC',
      [tipo]
    );
  }

  async findByTipoEComunidade(tipo: string, comunidade?: string): Promise<SacramentoRegistro[]> {
    const db = await getDb();
    if (comunidade) {
      return db.select<SacramentoRegistro[]>(
        'SELECT * FROM sacramentos_registros WHERE tipo = $1 AND comunidade = $2 AND deleted_at IS NULL ORDER BY data_sacramento DESC',
        [tipo, comunidade]
      );
    }
    return this.findByTipo(tipo);
  }

  async countByTipoAno(tipo: string, ano?: string): Promise<number> {
    const db = await getDb();
    const sql = ano
      ? 'SELECT COUNT(*) as n FROM sacramentos_registros WHERE tipo=? AND substr(data_sacramento,1,4)=? AND deleted_at IS NULL'
      : 'SELECT COUNT(*) as n FROM sacramentos_registros WHERE tipo=? AND deleted_at IS NULL';
    const params = ano ? [tipo, ano] : [tipo];
    const r = await db.select<{ n: number }[]>(sql, params);
    return r[0]?.n ?? 0;
  }

  async proximaCelebracao(tipo: string): Promise<string | null> {
    const db = await getDb();
    const r = await db.select<{ data_sacramento: string }[]>(
      "SELECT data_sacramento FROM sacramentos_registros WHERE tipo=? AND data_sacramento >= date('now') AND deleted_at IS NULL ORDER BY data_sacramento ASC LIMIT 1",
      [tipo]
    );
    return r[0]?.data_sacramento ?? null;
  }

  async checkDuplicate(tipo: string, fiel_id?: number | null, excludeId?: number): Promise<boolean> {
    if (!fiel_id) return false;
    const db = await getDb();
    const sql = excludeId
      ? 'SELECT COUNT(*) as n FROM sacramentos_registros WHERE tipo=? AND fiel_id=? AND deleted_at IS NULL AND id!=?'
      : 'SELECT COUNT(*) as n FROM sacramentos_registros WHERE tipo=? AND fiel_id=? AND deleted_at IS NULL';
    const params = excludeId ? [tipo, fiel_id, excludeId] : [tipo, fiel_id];
    const r = await db.select<{ n: number }[]>(sql, params);
    return (r[0]?.n ?? 0) > 0;
  }

  async upsert(
    tipo: string,
    nomePrincipal: string,
    dataSacramento: string,
    celebrante: string,
    comunidade: string,
    jsonDados: string,
    id?: number,
    fiel_id?: number | null
  ): Promise<{ ok: boolean; duplicado?: boolean }> {
    if (!id && await this.checkDuplicate(tipo, fiel_id)) {
      return { ok: false, duplicado: true };
    }

    const db = await getDb();
    const { livro, folha, assento } = this.extrairLivroFolhaAssento(tipo, jsonDados);
    if (id) {
      await db.execute(
        'UPDATE sacramentos_registros SET nome_principal=?, data_sacramento=?, celebrante=?, comunidade=?, json_dados=?, livro=?, folha=?, assento=?, fiel_id=? WHERE id=?',
        [nomePrincipal, dataSacramento, celebrante, comunidade, jsonDados, livro, folha, assento, fiel_id ?? null, id]
      );
    } else {
      await db.execute(
        'INSERT INTO sacramentos_registros (tipo, nome_principal, data_sacramento, celebrante, comunidade, json_dados, livro, folha, assento, fiel_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [tipo, nomePrincipal, dataSacramento, celebrante, comunidade, jsonDados, livro, folha, assento, fiel_id ?? null]
      );
    }
    return { ok: true };
  }
}

class ObitoExequiaRepositoryClass extends BaseRepository<ObitoExequia> {
  constructor() { super('obitos_exequias', true); }

  async findAllOrdenados(): Promise<ObitoExequia[]> {
    const db = await getDb();
    return db.select<ObitoExequia[]>(
      'SELECT * FROM obitos_exequias WHERE deleted_at IS NULL ORDER BY dataFalecimento DESC'
    );
  }
}

export const SacramentalRepository = {
  registros: new SacramentoRegistroRepositoryClass(),
  obitos: new ObitoExequiaRepositoryClass(),
};
