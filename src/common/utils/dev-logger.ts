export class DevLogger {
  private static isDev = process.env.NODE_ENV === 'development';

  static log(...args: any[]): void {
    if (this.isDev) {
      console.log(...args);
    }
  }

  static error(...args: any[]): void {
    if (this.isDev) {
      console.error(...args);
    }
  }

  static warn(...args: any[]): void {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  static debug(...args: any[]): void {
    if (this.isDev) {
      console.debug(...args);
    }
  }
}
