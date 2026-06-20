/**
 * Converte uma data no formato YYYY-MM-DD para DD/MM/YYYY
 */
export function formatarDataBR(dataIso: string): string {
  if (!dataIso) return "";
  return dataIso.split('-').reverse().join('/');
}