import { PAYMENT_LABELS, STATUS_LABELS, type PaymentCode, type StatusCode } from '../domain/types';

const ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Экранирование пользовательских данных при выводе в HTML. */
export const esc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPE[c]);

export const attrs = (map: Record<string, string | number | boolean | undefined | null>): string =>
  Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(' ');

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** 2026-10-20 → «20 октября 2026» */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const statusBadge = (code: StatusCode): string =>
  `<span class="badge status-${code}" data-status-badge>${esc(STATUS_LABELS[code])}</span>`;

export const paymentLabel = (code: PaymentCode): string => PAYMENT_LABELS[code];

export const stars = (rating: number): string =>
  `<span class="stars" aria-label="Оценка ${rating} из 5">${[1, 2, 3, 4, 5]
    .map((i) => `<span class="star${i <= rating ? ' on' : ''}">★</span>`)
    .join('')}</span>`;

// ---------- Иконки (inline SVG, без внешних запросов — интернета на экзамене нет) ----------

const svg = (body: string) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 16 0v1"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  id: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M15 10h3M15 14h3"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  room: svg('<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M14 12h.01"/>'),
  wallet: svg('<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M16 15h2"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  filter: svg('<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>'),
  sbp: svg('<path d="M4 7h16v10H4z"/><path d="m4 7 8 5 8-5"/>'),
  cash: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
};

export const logo = `
<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2F5BEA"/><stop offset="1" stop-color="#7B4DFF"/></linearGradient></defs>
  <rect width="40" height="40" rx="11" fill="url(#lg)"/>
  <path d="M10 27V15.5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2V27" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M8 27h24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="20" cy="20" r="3.2" fill="#FFD166"/>
</svg>`;

// ---------- Поля форм ----------

export interface FieldOptions {
  name: string;
  label: string;
  type?: string;
  value?: string;
  error?: string;
  placeholder?: string;
  icon?: string;
  hint?: string;
  autocomplete?: string;
  extra?: Record<string, string | number | boolean | undefined>;
}

export function field(o: FieldOptions): string {
  const id = `f-${o.name}`;
  const isPassword = o.type === 'password';
  return `
  <div class="field${o.error ? ' has-error' : ''}">
    <label for="${id}">${esc(o.label)}</label>
    <div class="input-wrap">
      ${o.icon ?? ''}
      <input ${attrs({
        id,
        name: o.name,
        type: o.type ?? 'text',
        value: isPassword ? undefined : o.value,
        placeholder: o.placeholder,
        autocomplete: o.autocomplete,
        'aria-invalid': o.error ? 'true' : undefined,
        'aria-describedby': `${id}-err`,
        ...o.extra,
      })}>
      ${isPassword ? `<button type="button" class="toggle-pass" aria-label="Показать пароль" data-toggle-pass>${icons.eye}</button>` : ''}
    </div>
    ${o.hint ? `<p class="field-hint">${esc(o.hint)}</p>` : ''}
    <p class="field-error" id="${id}-err" data-error-for="${o.name}">${esc(o.error ?? '')}</p>
  </div>`;
}

export const formAlert = (message?: string): string =>
  message ? `<div class="alert alert-error" role="alert">${esc(message)}</div>` : '';
