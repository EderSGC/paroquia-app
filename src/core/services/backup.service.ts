import { save, open, confirm } from "@tauri-apps/plugin-dialog";
import { copyFile, readFile, stat } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { DATABASE } from "../config/constants";
import { connection } from "../database/connection";
import { registrarAuditoria } from "./auditoria.service";

export interface BackupInfo {
  lastBackupDate: string | null;
  lastBackupPath: string | null;
  lastBackupSize: number | null;
}

export interface BackupValidation {
  valido: boolean;
  tamanho: number;
  tabelas: number;
  erros: string[];
}

const BACKUP_KEY = "paroquia_last_backup";

export function getBackupInfo(): BackupInfo {
  try {
    const stored = localStorage.getItem(BACKUP_KEY);
    if (!stored) return { lastBackupDate: null, lastBackupPath: null, lastBackupSize: null };
    return JSON.parse(stored);
  } catch {
    return { lastBackupDate: null, lastBackupPath: null, lastBackupSize: null };
  }
}

function saveBackupInfo(info: BackupInfo) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(info));
}

export async function fazerBackup(usuarioId?: number): Promise<string> {
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

  // VACUUM antes do backup para compactar
  if (connection.dbInstance) {
    try { await connection.dbInstance.execute("PRAGMA wal_checkpoint(TRUNCATE)"); } catch { /* ok */ }
  }

  await copyFile(dbPath, destino);

  // Verificar tamanho do backup
  let tamanho = 0;
  try {
    const info = await stat(destino);
    tamanho = info.size;
  } catch { /* ok */ }

  saveBackupInfo({
    lastBackupDate: now.toISOString(),
    lastBackupPath: destino,
    lastBackupSize: tamanho,
  });

  if (usuarioId) {
    await registrarAuditoria({
      usuario_id: usuarioId,
      acao: "BACKUP",
      tabela: "sistema",
      descricao: `Backup manual gerado: ${nomeArquivo} (${formatarTamanho(tamanho)})`,
    });
  }

  return destino;
}

export async function restaurarBackup(usuarioId?: number): Promise<void> {
  const arquivo = await open({
    title: "Selecionar Backup para Restaurar",
    filters: [{ name: "Backup do Sistema Paroquial", extensions: ["db"] }],
  });

  if (!arquivo || typeof arquivo !== "string") throw new Error("CANCELLED");

  // Validar arquivo antes de restaurar
  let tamanho = 0;
  try {
    const info = await stat(arquivo);
    tamanho = info.size;
  } catch {
    throw new Error("Não foi possível ler o arquivo selecionado.");
  }

  if (tamanho < 4096) {
    throw new Error("Arquivo muito pequeno para ser um banco de dados válido.");
  }

  // Verificar header SQLite (primeiros 16 bytes)
  try {
    const bytes = await readFile(arquivo);
    const header = new TextDecoder().decode(bytes.slice(0, 15));
    if (!header.startsWith("SQLite format")) {
      throw new Error("O arquivo selecionado não é um banco de dados SQLite válido.");
    }
  } catch (e) {
    if ((e as Error).message.includes("SQLite")) throw e;
  }

  // Confirmação explícita do usuário
  const confirmou = await confirm(
    `Restaurar backup substituirá TODOS os dados atuais.\n\nArquivo: ${arquivo}\nTamanho: ${formatarTamanho(tamanho)}\n\nEsta ação não pode ser desfeita.\nDeseja continuar?`,
    { title: "Confirmar Restauração", kind: "warning" }
  );

  if (!confirmou) throw new Error("CANCELLED");

  // Registrar antes de fechar conexão
  if (usuarioId && connection.dbInstance) {
    await registrarAuditoria({
      usuario_id: usuarioId,
      acao: "RESTAURACAO",
      tabela: "sistema",
      descricao: `Restauração de backup: ${arquivo} (${formatarTamanho(tamanho)})`,
    });
  }

  // Encerrar conexão atual antes de sobrescrever
  if (connection.dbInstance) {
    try { await connection.dbInstance.close(); } catch { /* ok */ }
    connection.dbInstance = null;
  }

  const appData = await appDataDir();
  const dbPath = await join(appData, DATABASE.NAME);

  await copyFile(arquivo, dbPath);

  window.location.reload();
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
