import { DateTime } from 'luxon'

/**
 * Formata uma DateTime para string ISO no formato padrão da API
 * Todas as datas são tratadas como horário do Brasil (America/Sao_Paulo)
 *
 * Formato retornado: "2024-01-15T10:30:00-03:00" (ISO 8601 com timezone)
 *
 * @param dateTime - DateTime do Luxon (pode ser null/undefined)
 * @returns String ISO ou null
 */
export function formatDate(dateTime: DateTime | null | undefined): string | null {
  if (!dateTime) return null

  // Converte para timezone do Brasil e retorna ISO
  return dateTime.setZone('America/Sao_Paulo').toISO()
}

/**
 * Converte uma string ISO ou Date para DateTime no timezone do Brasil
 *
 * @param date - String ISO ou Date JavaScript
 * @returns DateTime no timezone do Brasil
 */
export function parseDate(date: string | Date): DateTime {
  if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: 'America/Sao_Paulo' })
  }

  // Se já tem timezone, mantém; senão assume que é horário do BR
  const dt = DateTime.fromISO(date, { zone: 'America/Sao_Paulo' })
  return dt.setZone('America/Sao_Paulo')
}
