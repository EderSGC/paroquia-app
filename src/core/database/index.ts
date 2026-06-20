// src/core/database/index.ts

import Database from "@tauri-apps/plugin-sql";

import { DATABASE } from "@core/config/constants";

import { connection } from "./connection";

import { validateAndSyncSchema } from "./migration";
import { runMigrations } from "./migrations";
import { prepareForSync } from "./syncPreparation";
import { createIndexes } from "./indexes";
import { createUpdatedAtTriggers } from "./triggers";
import { createForeignKeys } from "./foreignKeys";

export * from "./types";
export * from "./schema";
export * from "./migration";
export * from "./connection";
export * from "./syncPreparation";

export async function getDb(): Promise<Database> {
  if (connection.dbInstance) {
    return connection.dbInstance;
  }

  if (connection.isConnecting) {
    await new Promise((resolve) =>
      setTimeout(resolve, 100)
    );

    return getDb();
  }

  connection.isConnecting = true;
  connection.connectionError = null;

  try {
    connection.dbInstance =
      await Database.load(
        `sqlite:${DATABASE.NAME}`
      );

    // Ativar foreign keys e otimizações de performance por conexão
    await connection.dbInstance.execute("PRAGMA foreign_keys = ON");
    await connection.dbInstance.execute("PRAGMA journal_mode = WAL");
    await connection.dbInstance.execute("PRAGMA synchronous = NORMAL");
    await connection.dbInstance.execute("PRAGMA cache_size = -8000"); // 8 MB cache

    // 1. Criar/atualizar tabelas e colunas conforme EXPECTED_SCHEMA
    await validateAndSyncSchema(connection.dbInstance);

    // 2. Migrações numeradas e idempotentes (transformações de dados, drops de tabelas legadas)
    await runMigrations(connection.dbInstance);

    // 3. Gerar UUIDs para registros existentes sem uuid (idempotente)
    await prepareForSync(connection.dbInstance);

    // 4. Criar índices de performance (idempotente)
    await createIndexes(connection.dbInstance);

    // 5. Triggers de updated_at automático (idempotente)
    await createUpdatedAtTriggers(connection.dbInstance);

    // 6. Foreign Keys seguras — verifica órfãos antes de criar (idempotente)
    await createForeignKeys(connection.dbInstance);

    console.log("✅ Banco sincronizado com sucesso.");

    return connection.dbInstance;
  } catch (error) {
    connection.connectionError =
      String(error);

    console.error(
      "❌ Erro ao conectar banco:",
      error
    );

    throw error;
  } finally {
    connection.isConnecting = false;
  }
}