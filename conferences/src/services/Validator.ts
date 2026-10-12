import type { FormErrors, FormValues } from '../domain/types';

export const PATTERNS = {
  login: /^[A-Za-z0-9]{6,}$/,
  fullName: /^[А-Яа-яЁё\s]+$/,
  phone: /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
};

/**
 * Цепочечный валидатор формы. Для каждого поля сохраняется только первая ошибка.
 *   new Validator(values).required('login').matches('login', /.../, 'текст').errors
 */
export class Validator {
  private readonly _errors: FormErrors = {};

  constructor(private readonly values: FormValues) {}

  private value(field: string): string {
    return (this.values[field] ?? '').trim();
  }

  private fail(field: string, message: string): this {
    if (!this._errors[field]) this._errors[field] = message;
    return this;
  }

  required(field: string, message = 'Поле обязательно для заполнения'): this {
    return this.value(field) ? this : this.fail(field, message);
  }

  matches(field: string, re: RegExp, message: string): this {
    const v = this.value(field);
    return !v || re.test(v) ? this : this.fail(field, message);
  }

  minLength(field: string, min: number, message: string): this {
    const v = this.values[field] ?? '';
    return !v || v.length >= min ? this : this.fail(field, message);
  }

  maxLength(field: string, max: number, message: string): this {
    return this.value(field).length <= max ? this : this.fail(field, message);
  }

  check(field: string, ok: boolean, message: string): this {
    return ok ? this : this.fail(field, message);
  }

  get errors(): FormErrors {
    return this._errors;
  }

  get isValid(): boolean {
    return Object.keys(this._errors).length === 0;
  }
}

/** Сегодняшняя дата в формате YYYY-MM-DD (локальное время сервера). */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isRealDate(iso: string): boolean {
  if (!PATTERNS.date.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}
