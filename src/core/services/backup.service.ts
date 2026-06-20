import { save, open } from "@tauri-apps/plugin-dialog";
import { copyFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { DATABASE } from "../config/constants";
import { connection } from "../database/connection";

export interface BackupInfo {
  lastBackupDate: string | null;
  lastBackupPath: string | null;
}

const BACKUP_KEY = "paroquia_last_backup";

export function getBackupInfo(): BackupInfo {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) return { lastBackupDate: null, lastBackupPath: null };
    return JSON.parse(stored);
  } catch {
    return { lastBackupDate: null, lastBackupPath: null };
  }
}

function saveBackupInfo(info: BackupInfo) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(info));
}

export async function fazerBackup(): Promise<string> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const nomeArquivo = `paroquia-backup-${timestamp}.db`;

  const destino = await save({
    defaultPath: nomeArquivo,
    filters: [{ name: "Banco de Dados SQLite", extensions: ["db"] }],
  });

  if (!destino) throw new Error("CANCELLED");

  const appData = await appDataDir();
  const dbPath = await join(appData, DATABASE.NAME);

  await copyFile(dbPath, destino);

  saveBackupInfo({
    lastBackupDate: now.toISOString(),
    lastBackupPath: destino,
  });

  return destino;
}

export async function restaurarBackup(): Promise<void> {
  const arquivo = await open({
    title: "Selecionar Backup para Restaurar",
    filters: [{ name: "Backup do Sistema Paroquial", extensions: ["db"] }],
  });

  if (!arquivo || typeof arquivo !== "string") throw new Error("CANCELLED");

  // Encerrar conexão atual antes de sobrescrever o arquivo
  if (connection.dbInstance) {
    try { await connection.dbInstance.close(); } catch { /* ok */ }
    connection.dbInstance = null;
  }

  const appData = await appDataDir();
  const dbPath = await join(appData, DATABASE.NAME);

  await copyFile(arquivo as string, dbPath);

  // Recarregar aplicação para usar o banco restaurado
  window.location.reload();
}
