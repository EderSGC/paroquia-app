import Database from "@tauri-apps/plugin-sql";
import { EXPECTED_SCHEMA } from "./schema";
import type { TableSchema } from "./types";

interface SQLiteColumn {
  name: string;
  type: string;
}

export async function getTableInfo(
  db: Database,
  tableName: string
): Promise<Record<string, string>> {
  try {
    const result = await db.select<SQLiteColumn[]>(
      `PRAGMA table_info(${tableName})`
    );

    const columns: Record<string, string> = {};

    if (Array.isArray(result)) {
      result.forEach((col) => {
        columns[col.name] = col.type;
      });
    }

    return columns;
  } catch {
    return {};
  }
}

export async function createTableFromSchema(
  db: Database,
  tableSchema: TableSchema
): Promise<void> {
  const columnDefs = tableSchema.columns
    .map((col) => {
      let def = `${col.name} ${col.type}`;

      if (col.notNull) {
        def += " NOT NULL";
      }

      if (col.default) {
        def += ` DEFAULT ${col.default}`;
      }

      return def;
    })
    .join(", ");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${tableSchema.name}
    (${columnDefs})
  `);

  console.log(`✅ Tabela ${tableSchema.name} criada/verificada`);
}

// SQLite proíbe DEFAULT CURRENT_TIMESTAMP / funções em ALTER TABLE ADD COLUMN.
// Apenas literals são aceitos (NULL, 0, 1, 'texto'). Expressões de tempo ficam NULL
// para linhas históricas; triggers e o app definem o valor nas novas linhas.
const NON_CONSTANT_DEFAULTS = new Set(["CURRENT_TIMESTAMP", "CURRENT_DATE", "CURRENT_TIME"]);

export async function addMissingColumns(
  db: Database,
  tableSchema: TableSchema
): Promise<string[]> {
  const existingColumns = await getTableInfo(
    db,
    tableSchema.name
  );

  const addedColumns: string[] = [];

  for (const column of tableSchema.columns) {
    if (!existingColumns[column.name]) {
      let sql = `ALTER TABLE "${tableSchema.name}" ADD COLUMN "${column.name}" ${column.type}`;

      if (column.default && !NON_CONSTANT_DEFAULTS.has(column.default)) {
        sql += ` DEFAULT ${column.default}`;
      }

      try {
        await db.execute(sql);
        addedColumns.push(column.name);
        console.log(`✅ Coluna ${column.name} adicionada em ${tableSchema.name}`);
      } catch (error) {
        console.warn(`⚠️  ${tableSchema.name}.${column.name}: ${error}`);
      }
    }
  }

  return addedColumns;
}

export async function validateAndSyncSchema(
  db: Database
): Promise<void> {
  console.log(
    "🔍 Iniciando validação de schema..."
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

  console.log("\n================================");

  report.forEach((item) => {
    if (item.created) {
      console.log(
        `✅ [CRIADA] ${item.table}`
      );
    } else if (
      item.columnsAdded.length
    ) {
      console.log(
        `✅ [ATUALIZADA] ${item.table}`
      );
    } else {
      console.log(
        `✅ [OK] ${item.table}`
      );
    }
  });

  console.log("================================");
}