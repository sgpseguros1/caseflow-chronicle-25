/**
 * Utilitários para manipulação de datas puras (sem timezone)
 * 
 * IMPORTANTE: Campos de data pura (DATE no banco) devem ser tratados
 * como valores absolutos, sem conversão de timezone.
 * 
 * Problema resolvido: Ao usar new Date("2025-07-24"), o JavaScript
 * interpreta como UTC meia-noite. Em fusos negativos (ex: GMT-3),
 * isso resulta em 23/07/2025 23:00:00 local, exibindo o dia anterior.
 */

/**
 * Formata uma data pura (string YYYY-MM-DD) para exibição DD/MM/YYYY
 * Sem conversão de timezone - a data exibida será exatamente a mesma informada
 * 
 * @param dateString - Data no formato YYYY-MM-DD ou null/undefined
 * @returns Data formatada DD/MM/YYYY ou null se inválida
 */
export function formatDateOnly(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  
  // Extrai ano, mês e dia diretamente da string
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Converte uma data do formato DD/MM/YYYY para YYYY-MM-DD
 * Para uso em inputs e salvamento no banco
 * 
 * @param dateString - Data no formato DD/MM/YYYY
 * @returns Data no formato YYYY-MM-DD ou string vazia se inválida
 */
export function parseDateBR(dateString: string): string {
  if (!dateString) return '';
  
  const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return dateString; // Retorna original se não conseguir parsear
  
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD
 * 
 * @param dateString - String a ser validada
 * @returns true se for uma data válida
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  
  const [, year, month, day] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  
  // Validação básica de ranges
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  
  return true;
}
