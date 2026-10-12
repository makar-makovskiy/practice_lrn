import { STATUS_LABELS, type Application, type Room, type SessionUser, type StatusCode } from '../../domain/types';
import type { ApplicationFilters } from '../../repositories/ApplicationRepository';
import { attrs, esc, formatDate, formatDateTime, icons, paymentLabel, stars, statusBadge } from '../helpers';
import { layout, type Flash, type LayoutOptions } from '../layout';

interface Options {
  user: SessionUser;
  applications: Application[];
  rooms: Room[];
  counts: Record<StatusCode, number>;
  filters: ApplicationFilters;
  flash?: Flash | null;
  inlineAssets?: LayoutOptions['inlineAssets'];
}

const STATUS_CODES = Object.keys(STATUS_LABELS) as StatusCode[];

function statsBar(o: Options): string {
  const total = STATUS_CODES.reduce((s, c) => s + o.counts[c], 0);
  const tile = (code: StatusCode | '', label: string, count: number) => `
    <a class="stat${(o.filters.status ?? '') === code ? ' active' : ''} stat-${code || 'all'}" href="/admin${code ? `?status=${code}` : ''}">
      <b data-count="${code || 'all'}">${count}</b><span>${label}</span>
    </a>`;
  return `<div class="stats">
    ${tile('', 'Все', total)}
    ${STATUS_CODES.map((c) => tile(c, STATUS_LABELS[c], o.counts[c])).join('')}
  </div>`;
}

function filtersForm(o: Options): string {
  const f = o.filters;
  return `
  <form class="card filters" method="get" action="/admin" data-filters>
    <div class="input-wrap filter-search">
      ${icons.search}
      <input type="search" name="q" value="${esc(f.search ?? '')}" placeholder="ФИО, логин, телефон или почта">
    </div>
    <div class="filter-row">
      <div class="input-wrap select-wrap">
        <select name="status" aria-label="Статус">
          <option value="">Все статусы</option>
          ${STATUS_CODES.map((c) => `<option ${attrs({ value: c, selected: f.status === c })}>${STATUS_LABELS[c]}</option>`).join('')}
        </select>
      </div>
      <div class="input-wrap select-wrap">
        <select name="room" aria-label="Помещение">
          <option value="">Все помещения</option>
          ${o.rooms.map((r) => `<option ${attrs({ value: r.id, selected: f.roomId === r.id })}>${esc(r.name)}</option>`).join('')}
        </select>
      </div>
      <div class="input-wrap select-wrap">
        <select name="sort" aria-label="Сортировка">
          <option value="new"${!f.sort || f.sort === 'new' ? ' selected' : ''}>Сначала новые</option>
          <option value="old"${f.sort === 'old' ? ' selected' : ''}>Сначала старые</option>
          <option value="date"${f.sort === 'date' ? ' selected' : ''}>По дате мероприятия</option>
        </select>
      </div>
    </div>
    <div class="filter-actions">
      <button type="submit" class="btn btn-primary">${icons.filter}<span>Применить</span></button>
      <a href="/admin" class="btn btn-ghost">Сбросить</a>
    </div>
  </form>`;
}

function adminCard(app: Application, index: number): string {
  return `
  <article class="card app-card admin-card" style="--i:${index}" data-app-card data-status="${app.statusCode}">
    <header class="app-card-head">
      <div>
        <span class="app-id">Заявка №${app.id} · ${formatDateTime(app.createdAt)}</span>
        <h3>${esc(app.roomName)}</h3>
        <span class="chip">${esc(app.roomType)}</span>
      </div>
      ${statusBadge(app.statusCode)}
    </header>

    <div class="client">
      <div class="avatar" aria-hidden="true">${esc((app.userFullName ?? '?').trim().charAt(0))}</div>
      <div>
        <b>${esc(app.userFullName)}</b>
        <span class="muted">@${esc(app.userLogin)}</span>
      </div>
    </div>

    <dl class="meta">
      <div>${icons.calendar}<dt>Дата начала</dt><dd>${formatDate(app.startDate)}</dd></div>
      <div>${icons.wallet}<dt>Оплата</dt><dd>${esc(paymentLabel(app.paymentCode))}</dd></div>
      <div>${icons.phone}<dt>Телефон</dt><dd><a href="tel:${esc(app.userPhone)}">${esc(app.userPhone)}</a></dd></div>
      <div>${icons.mail}<dt>Почта</dt><dd><a href="mailto:${esc(app.userEmail)}">${esc(app.userEmail)}</a></dd></div>
    </dl>

    ${app.review ? `<div class="review review-done"><div class="review-head">${stars(app.review.rating)}<span class="muted">Отзыв клиента</span></div><p>${esc(app.review.comment)}</p></div>` : ''}

    <form class="status-form" method="post" action="/admin/applications/${app.id}/status" data-status-form>
      <div class="input-wrap select-wrap">
        <select name="status" aria-label="Статус заявки №${app.id}">
          ${STATUS_CODES.map((c) => `<option ${attrs({ value: c, selected: app.statusCode === c })}>${STATUS_LABELS[c]}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary" aria-label="Сохранить статус" title="Сохранить">${icons.check}<span>Сохранить</span></button>
    </form>
  </article>`;
}

export function adminPage(o: Options): string {
  const list = o.applications.length
    ? `<div class="cards cards-grid">${o.applications.map(adminCard).join('')}</div>`
    : `<div class="empty card"><div class="empty-icon">${icons.search}</div><h3>Ничего не найдено</h3><p class="muted">Измените условия фильтра.</p></div>`;

  const body = `
  <section class="page-head">
    <div>
      <p class="eyebrow">${icons.shield} Панель администратора</p>
      <h1>Заявки пользователей</h1>
    </div>
  </section>
  ${statsBar(o)}
  ${filtersForm(o)}
  <p class="muted results-count">Найдено заявок: <b>${o.applications.length}</b></p>
  ${list}`;

  return layout({ title: 'Панель администратора', body, user: o.user, active: 'admin', flash: o.flash, bodyClass: 'admin-page', inlineAssets: o.inlineAssets });
}
