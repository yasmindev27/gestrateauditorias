/**
 * Formatadores de Data Padronizados para GEStrategic
 * Garante consistência em todas as exibições de data do sistema
 * Formato padrão: DD/MM/YYYY HH:mm
 * ⏰ Timezone: América/São Paulo (Brasília) - UTC-3
 */

import { format, parseISO, isValid, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Converte UTC para Brasília (UTC-3)
 * Supabase armazena em UTC, aqui convertemos para exibição local
 */
const convertToBrasilia = (date: Date): Date => {
  // Brasília está sempre em UTC-3 (sem horário de verão)
  return addHours(date, -3);
};

/**
 * Formata data/hora completa (DD/MM/YYYY HH:mm) em horário de Brasília
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    const brasiliaTime = convertToBrasilia(dateObj);
    return format(brasiliaTime, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata apenas a data (DD/MM/YYYY) em horário de Brasília
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    const brasiliaTime = convertToBrasilia(dateObj);
    return format(brasiliaTime, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata apenas a hora (HH:mm) em horário de Brasília
 */
export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    const brasiliaTime = convertToBrasilia(dateObj);
    return format(brasiliaTime, "HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata data e hora com descrição relativa (ex: "hoje às 14:30") em Brasília
 */
export const formatDateTimeRelative = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    const brasiliaTime = convertToBrasilia(dateObj);
    return format(brasiliaTime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Formata apenas dia e mês (DD/MM) em horário de Brasília
 */
export const formatDateShort = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    const brasiliaTime = convertToBrasilia(dateObj);
    return format(brasiliaTime, "dd/MM", { locale: ptBR });
  } catch {
    return "-";
  }
};

/**
 * Valida se uma string é uma data válida (ISO 8601)
 */
export const isValidDate = (dateString: string): boolean => {
  try {
    const dateObj = parseISO(dateString);
    return isValid(dateObj);
  } catch {
    return false;
  }
};
