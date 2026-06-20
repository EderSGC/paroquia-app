import Database from "@tauri-apps/plugin-sql";
import { EXPECTED_SCHEMA } from "./schema";

export interface SyncTableReport {
  table: string;
  recordsMigrated: number;
  alreadyHadUuid: number;
  error?: string;
}

export interface SyncPreparationReport {
  tablesProcessed: number;
  tableReports: SyncTableReport[];
  totalRecordsMigrated: number;
  errors: string[];
  completedAt: string;
}

// Último relatório gerado — acessível via getSyncReport()
let lastReport: SyncPreparationReport | null = null;

export function getSyncReport(): SyncPreparationReport | null {
  return lastReport;
}

export async function prepareForSync(db: Database): Promise<SyncPreparationReport> {
  const tableReports: SyncTableReport[] = [];
  const errors: string[] = [];
  let totalRecordsMigrated = 0;

  for (const tableSchema of EXPECTED_SCHEMA) {
    const tableName = tableSchema.name;
    const hasUuidInSchema = tableSchema.columns.some(c => c.name === "uuid");

    if (!hasUuidInSchema) {
      continue;
    }

    try {
      // Confirmar que a coluna uuid existe no banco (pode não existir se
      // a tabela foi criada em outra sessão antes desta migração)
      const colInfo = await db.select<{ name: string }[]>(
        `PRAGMA table_info("${tableName}")`
      );
      const hasUuidCol = colInfo.some(c => c.name === "uuid");

      if (!hasUuidCol) {
        errors.push(`[${tableName}] Coluna uuid não encontrada no banco — execute validateAndSyncSchema primeiro.`);
        tableReports.push({ table: tableName, recordsMigrated: 0, alreadyHadUuid: 0, error: "uuid column missing" });
        continue;
      }

      // Contar registros que já têm UUID
      // NOTA: Tauri SQLite plugin não preserva aliases (COUNT(*) as n → {"COUNT(*)": 5})
      const withUuid = await db.select<Record<string, unknown>[]>(
        `SELECT COUNT(*) FROM "${tableName}" WHERE uuid IS NOT NULL`
      );
      const alreadyHadUuid = Number(withUuid[0] ? Object.values(withUuid[0])[0] : 0);

      // Buscar registros sem UUID
      const withoutUuid = await db.select<{ id: number }[]>(
        `SELECT id FROM "${tableName}" WHERE uuid IS NULL`
      );

      if (withoutUuid.length === 0) {
        tableReports.push({ table: tableName, recordsMigrated: 0, alreadyHadUuid });
        continue;
      }

      // Gerar e persistir UUID para cada registro sem um
      for (const row of withoutUuid) {
        await db.execute(
          `UPDATE "${tableName}" SET uuid = ? WHERE id = ?`,
          [crypto.randomUUID(), row.id]
        );
      }

      totalRecordsMigrated += withoutUuid.length;
      tableReports.push({
        table: tableName,
        recordsMigrated: withoutUuid.length,
        alreadyHadUuid,
      });

      console.log(`✅ [sync] ${tableName}: ${withoutUuid.length} UUIDs gerados`);
    } catch (err) {
      const msg = `[${tableName}] ${String(err)}`;
      errors.push(msg);
      tableReports.push({ table: tableName, recordsMigrated: 0, alreadyHadUuid: 0, error: msg });
      console.error(`❌ [sync] ${msg}`);
    }
  }

  const report: SyncPreparationReport = {
    tablesProcessed: tableReports.length,
    tableReports,
    totalRecordsMigrated,
    errors,
    completedAt: new Date().toISOString(),
  };

  lastReport = report;
  logReport(report);

  return report;
}

function logReport(report: SyncPreparationReport): void {
  console.log("\n════════════════════════════════════════════");
  console.log("  RELATÓRIO DE PREPARAÇÃO PARA SINCRONIZAÇÃO");
  console.log("════════════════════════════════════════════");
  console.log(`  Tabelas processadas : ${report.tablesProcessed}`);
  console.log(`  Registros migrados  : ${report.totalRecordsMigrated}`);
  console.log(`  Erros               : ${report.errors.length}`);
  console.log(`  Concluído em        : ${report.completedAt}`);
  console.log("────────────────────────────────────────────");

  for (const t of report.tableReports) {
    if (t.error) {
      console.warn(`  ❌ ${t.table.padEnd(30)} ERRO: ${t.error}`);
    } else if (t.recordsMigrated > 0) {
      console.log(`  ✅ ${t.table.padEnd(30)} +${t.recordsMigrated} UUIDs  (${t.alreadyHadUuid} já tinham)`);
    } else {
      console.log(`  ✔  ${t.table.padEnd(30)} OK (${t.alreadyHadUuid} registros com UUID)`);
    }
  }

  if (report.errors.length > 0) {
    console.warn("\n  ERROS ENCONTRADOS:");
    report.errors.forEach(e => console.warn(`  • ${e}`));
  }

  console.log("════════════════════════════════════════════\n");
}
