import Database from "@tauri-apps/plugin-sql";

import { EXPECTED_SCHEMA } from "./schema";
import {
  getTableInfo,
  createTableFromSchema,
  addMissingColumns,
} from "./migration";

export async function validateAndSyncSchema(
  db: Database
): Promise<void> {
  console.log(
    "🔍 Iniciando validação e sincronização de schema..."
  );

  const report: {
    table: string;
    created: boolean;
    columnsAdded: string[];
  }[] = [];

  for (const tableSchema of EXPECTED_SCHEMA) {
    const tableInfo = await getTableInfo(
      db,
      tableSchema.name
    );

    if (Object.keys(tableInfo).length === 0) {
      await createTableFromSchema(
        db,
        tableSchema
      );

      report.push({
        table: tableSchema.name,
        created: true,
        columnsAdded: [],
      });

      continue;
    }

    const columnsAdded =
      await addMissingColumns(
        db,
        tableSchema
      );

    report.push({
      table: tableSchema.name,
      created: false,
      columnsAdded,
    });
  }

  console.log("\n============================================================");
  console.log("📊 RELATÓRIO DE MIGRAÇÃO DE SCHEMA");
  console.log("============================================================");

  report.forEach((item) => {
    if (item.created) {
      console.log(
        `✅ [CRIADA] Tabela '${item.table}'`
      );
    } else if (item.columnsAdded.length > 0) {
      console.log(
        `✅ [ATUALIZADA] Tabela '${item.table}' - Colunas adicionadas: ${item.columnsAdded.join(", ")}`
      );
    } else {
      console.log(
        `✅ [OK] Tabela '${item.table}' - Nenhuma alteração necessária`
      );
    }
  });

  console.log("============================================================");
  console.log("✅ Schema sincronizado com sucesso!");
  console.log("============================================================\n");
}