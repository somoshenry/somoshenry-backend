import {
  format,
  addMonths,
  addDays,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { formatInTimeZone, toDate, fromZonedTime } from 'date-fns-tz';

export class DateUtil {
  // ============================================
  // OBTENER FECHA ACTUAL EN UTC
  // ============================================
  static nowUTC(): Date {
    return new Date(); // JavaScript Date ya está en UTC internamente
  }

  // ============================================
  // CONVERTIR DE LOCAL A UTC (para guardar)
  // ============================================
  static toUTC(date: Date | string, timezone: string = 'UTC'): Date {
    if (typeof date === 'string') {
      date = parseISO(date);
    }
    // Si viene con timezone, convertir a UTC
    return fromZonedTime(date, timezone);
  }

  // ============================================
  // FORMATEAR FECHA PARA ENVIAR AL FRONTEND
  // ============================================
  static formatForClient(date: Date, timezone: string = 'UTC'): string {
    // Retornar ISO string (frontend lo convertirá)
    return date.toISOString();
  }

  // ============================================
  // FORMATEAR FECHA EN ZONA HORARIA ESPECÍFICA
  // ============================================
  static formatInTimezone(
    date: Date,
    timezone: string,
    formatString: string = 'yyyy-MM-dd HH:mm:ss',
  ): string {
    return formatInTimeZone(date, timezone, formatString);
  }

  // ============================================
  // AGREGAR DÍAS (para renovación)
  // ============================================
  static addDays(date: Date, days: number = 1): Date {
    return addDays(date, days);
  }

  // ============================================
  // AGREGAR MES (para renovación)
  // ============================================
  static addMonth(date: Date, months: number = 1): Date {
    return addMonths(date, months);
  }

  // ============================================
  // OBTENER INICIO/FIN DE MES (para contar posts)
  // ============================================
  static getStartOfMonth(date: Date = new Date()): Date {
    return startOfMonth(date);
  }
  // Función getStartOfMonth es equivalente a la comentada abajo
  //   static getStartOfMonth() {
  //     const now = new Date();
  //     return new Date(now.getFullYear(), now.getMonth(), 1);
  //   }

  static getEndOfMonth(date: Date = new Date()): Date {
    return endOfMonth(date);
  }
  // Función getEndOfMonth es equivalente a la comentada abajo
  //   static getEndOfMonth() {
  //     const now = new Date();
  //     return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  //   }

  // ============================================
  // VERIFICAR SI UNA FECHA YA PASÓ
  // ============================================
  static isPast(date: Date): boolean {
    return isBefore(date, new Date());
  }

  static isFuture(date: Date): boolean {
    return isAfter(date, new Date());
  }

  // ============================================
  // EJEMPLOS DE USO
  // ============================================
  static examples() {
    const now = DateUtil.nowUTC();
    console.log('Now UTC:', now.toISOString());

    // Agregar 1 mes
    const nextMonth = DateUtil.addMonth(now);
    console.log('Next month:', nextMonth.toISOString());

    // Formatear en Argentina
    const argTime = DateUtil.formatInTimezone(
      now,
      'America/Argentina/Buenos_Aires',
    );
    console.log('Argentina time:', argTime);

    // Formatear en México
    const mxTime = DateUtil.formatInTimezone(now, 'America/Mexico_City');
    console.log('Mexico time:', mxTime);

    // Inicio/fin del mes actual
    const monthStart = DateUtil.getStartOfMonth();
    const monthEnd = DateUtil.getEndOfMonth();
    console.log('Month:', monthStart, 'to', monthEnd);
  }
}
