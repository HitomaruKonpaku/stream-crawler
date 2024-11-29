export class Util {
  public static sleep(ms?: number) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(null), ms)
    })
  }

  public static getTimeString(ms?: number): string {
    const date = ms
      ? new Date(ms)
      : new Date()
    const s = date.toISOString()
      .replace(/[^\d]/g, '')
      .substring(2, 12)
    return s
  }
}
