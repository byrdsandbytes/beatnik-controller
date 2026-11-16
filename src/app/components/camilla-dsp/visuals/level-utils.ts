export const MIN_DB = -60;
const SILENCE_DB = -100;

export function toDb(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : SILENCE_DB;
}

/** Position of a dB value on a MIN_DB..0 scale, 0..1 */
export function dbFraction(db: number | null | undefined, min = MIN_DB): number {
  return Math.min(1, Math.max(0, (toDb(db) - min) / -min));
}

/** Same green/yellow/red zones as the signal level bars */
export function levelColor(db: number | null | undefined): string {
  const value = toDb(db);
  if (value >= -6) {
    return 'var(--ion-color-danger)';
  }
  return value >= -18 ? 'var(--ion-color-warning)' : 'var(--ion-color-success)';
}

export const RED_ZONE_DB = -6;

export interface ScaleTick {
  db: number;
  pos: number;
  red: boolean;
}

export function scaleTicks(values: number[]): ScaleTick[] {
  return values.map(db => ({ db, pos: dbFraction(db) * 100, red: db >= RED_ZONE_DB }));
}

/** Fixed-width "-06.3" style text, like the VU meter readouts */
export function formatDb(db: number | null | undefined): string {
  const value = Math.max(MIN_DB, toDb(db));
  return `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(1).padStart(4, '0')}`;
}

export const CHANNEL_NAMES = ['Left', 'Right'];
