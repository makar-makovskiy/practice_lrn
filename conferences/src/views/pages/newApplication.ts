import { PAYMENT_LABELS, type FormErrors, type FormValues, type PaymentCode, type Room, type SessionUser } from '../../domain/types';
import { attrs, esc, formAlert, icons } from '../helpers';
import { layout, type Flash, type LayoutOptions } from '../layout';

interface Options {
  user: SessionUser;
  rooms: Room[];
  minDate: string;
  values?: FormValues;
  errors?: FormErrors;
  flash?: Flash | null;
  inlineAssets?: LayoutOptions['inlineAssets'];
}

function roomOptions(rooms: Room[], selected?: string): string {
  const groups = new Map<string, Room[]>();
  for (const r of rooms) groups.set(r.type, [...(groups.get(r.type) ?? []), r]);

  return [...groups.entries()]
    .map(
      ([type, list]) => `<optgroup label="${esc(type)}">${list
        .map(
          (r) => `<option ${attrs({
            value: r.id,
            selected: String(r.id) === selected,
            'data-capacity': r.capacity,
            'data-type': r.type,
            'data-description': r.description ?? '',
          })}>${esc(r.name)}</option>`,
        )
        .join('')}</optgroup>`,
    )
    .join('');
}

const PAYMENT_ICONS: Record<PaymentCode, string> = { cash: icons.cash, sbp: icons.sbp };
const PAYMENT_HINTS: Record<PaymentCode, string> = {
  cash: 'Оплата на месте в день мероприятия',
  sbp: 'Быстрый перевод по номеру телефона',
};

export function newApplicationPage(o: Options): string {
  const v = o.values ?? {};
  const e = o.errors ?? {};

  const body = `
  <section class="page-head">
    <div>
      <p class="eyebrow">Бронирование</p>
      <h1>Новая заявка</h1>
    </div>
  </section>

  <form class="card form-card" method="post" action="/applications" novalidate data-validate>
    ${formAlert(e.form)}

    <div class="field${e.roomId ? ' has-error' : ''}">
      <label for="f-roomId">Помещение</label>
      <div class="input-wrap select-wrap">
        ${icons.room}
        <select id="f-roomId" name="roomId" required data-msg-required="Выберите помещение" data-room-select>
          <option value="">Выберите помещение</option>
          ${roomOptions(o.rooms, v.roomId)}
        </select>
      </div>
      <div class="room-info" data-room-info hidden>
        <span class="chip" data-room-type></span>
        <span class="room-cap">${icons.users}<span data-room-capacity></span></span>
        <p class="muted" data-room-description></p>
      </div>
      <p class="field-error" data-error-for="roomId">${esc(e.roomId ?? '')}</p>
    </div>

    <div class="field${e.startDate ? ' has-error' : ''}">
      <label for="f-startDate">Дата начала конференции</label>
      <div class="input-wrap">
        ${icons.calendar}
        <input ${attrs({
          id: 'f-startDate', type: 'date', name: 'startDate', value: v.startDate, min: o.minDate,
          required: true, 'data-msg-required': 'Укажите дату начала конференции', 'data-msg-min': 'Дата не может быть в прошлом',
        })}>
      </div>
      <p class="field-error" data-error-for="startDate">${esc(e.startDate ?? '')}</p>
    </div>

    <fieldset class="field${e.payment ? ' has-error' : ''}">
      <legend>Способ оплаты</legend>
      <div class="pay-options">
        ${(Object.keys(PAYMENT_LABELS) as PaymentCode[])
          .map(
            (code, i) => `
          <label class="pay-option">
            <input type="radio" name="payment" value="${code}"${v.payment === code ? ' checked' : ''}${i === 0 ? ' required data-msg-required="Выберите способ оплаты"' : ''}>
            <span class="pay-card">
              ${PAYMENT_ICONS[code]}
              <span><b>${PAYMENT_LABELS[code]}</b><small>${PAYMENT_HINTS[code]}</small></span>
              <span class="pay-check">${icons.check}</span>
            </span>
          </label>`,
          )
          .join('')}
      </div>
      <p class="field-error" data-error-for="payment">${esc(e.payment ?? '')}</p>
    </fieldset>

    <button type="submit" class="btn btn-primary btn-block">Отправить</button>
  </form>`;

  return layout({ title: 'Новая заявка', body, user: o.user, active: 'new', flash: o.flash, inlineAssets: o.inlineAssets });
}
