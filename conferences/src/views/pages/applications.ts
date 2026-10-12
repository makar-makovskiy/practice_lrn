import type { Application, FormErrors, FormValues, SessionUser } from '../../domain/types';
import { esc, formatDate, formatDateTime, icons, paymentLabel, stars, statusBadge } from '../helpers';
import { layout, type Flash, type LayoutOptions } from '../layout';

interface Options {
  user: SessionUser;
  applications: Application[];
  flash?: Flash | null;
  /** ошибки формы отзыва: какая заявка и что не так */
  reviewErrors?: { applicationId: number; errors: FormErrors; values: FormValues } | null;
  inlineAssets?: LayoutOptions['inlineAssets'];
}

function reviewBlock(app: Application, o: Options): string {
  if (app.review) {
    return `
    <div class="review review-done">
      <div class="review-head">${stars(app.review.rating)}<span class="muted">Ваш отзыв</span></div>
      <p>${esc(app.review.comment)}</p>
    </div>`;
  }

  if (app.statusCode !== 'completed') {
    return `<p class="review-locked">${icons.lock}<span>Отзыв можно оставить после завершения мероприятия</span></p>`;
  }

  const err = o.reviewErrors?.applicationId === app.id ? o.reviewErrors : null;
  const e = err?.errors ?? {};
  const rating = Number(err?.values.rating ?? 0);

  return `
  <details class="review-form"${err ? ' open' : ''}>
    <summary class="btn btn-soft btn-block">${icons.star}<span>Оставить отзыв</span></summary>
    <form method="post" action="/applications/${app.id}/review" novalidate data-validate>
      ${e.form ? `<div class="alert alert-error">${esc(e.form)}</div>` : ''}
      <div class="field${e.rating ? ' has-error' : ''}">
        <span class="label">Оценка мероприятия</span>
        <div class="rating-input" role="radiogroup" aria-label="Оценка">
          ${[5, 4, 3, 2, 1]
            .map(
              (i) => `<input type="radio" id="r${app.id}-${i}" name="rating" value="${i}"${rating === i ? ' checked' : ''}${i === 5 ? ' required data-msg-required="Поставьте оценку"' : ''}>
              <label for="r${app.id}-${i}" title="${i}">★</label>`,
            )
            .join('')}
        </div>
        <p class="field-error" data-error-for="rating">${esc(e.rating ?? '')}</p>
      </div>
      <div class="field${e.comment ? ' has-error' : ''}">
        <label for="c${app.id}">Комментарий</label>
        <textarea id="c${app.id}" name="comment" rows="3" maxlength="1000" required placeholder="Как прошло мероприятие?">${esc(err?.values.comment ?? '')}</textarea>
        <p class="field-error" data-error-for="comment">${esc(e.comment ?? '')}</p>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Отправить отзыв</button>
    </form>
  </details>`;
}

export function applicationCard(app: Application, o: Options, index: number): string {
  return `
  <article class="card app-card" style="--i:${index}">
    <header class="app-card-head">
      <div>
        <span class="app-id">Заявка №${app.id}</span>
        <h3>${esc(app.roomName)}</h3>
        <span class="chip">${esc(app.roomType)}</span>
      </div>
      ${statusBadge(app.statusCode)}
    </header>
    <dl class="meta">
      <div>${icons.calendar}<dt>Дата начала</dt><dd>${formatDate(app.startDate)}</dd></div>
      <div>${icons.wallet}<dt>Оплата</dt><dd>${esc(paymentLabel(app.paymentCode))}</dd></div>
      <div>${icons.clock}<dt>Подана</dt><dd>${formatDateTime(app.createdAt)}</dd></div>
    </dl>
    ${reviewBlock(app, o)}
  </article>`;
}

export function applicationsPage(o: Options): string {
  const list = o.applications.length
    ? `<div class="cards">${o.applications.map((a, i) => applicationCard(a, o, i)).join('')}</div>`
    : `
    <div class="empty card">
      <div class="empty-icon">${icons.calendar}</div>
      <h3>Заявок пока нет</h3>
      <p class="muted">Выберите помещение и дату — мы всё организуем.</p>
      <a href="/applications/new" class="btn btn-primary">${icons.plus}<span>Оформить заявку</span></a>
    </div>`;

  const body = `
  <section class="page-head">
    <div>
      <p class="eyebrow">Личный кабинет</p>
      <h1>Мои заявки</h1>
    </div>
    <a href="/applications/new" class="btn btn-primary btn-head">${icons.plus}<span>Новая заявка</span></a>
  </section>
  ${list}`;

  return layout({ title: 'Мои заявки', body, user: o.user, active: 'applications', flash: o.flash, inlineAssets: o.inlineAssets });
}
