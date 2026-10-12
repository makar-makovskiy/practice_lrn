import type { FormErrors, FormValues } from '../../domain/types';
import { field, formAlert, icons } from '../helpers';
import { layout, type Flash, type LayoutOptions } from '../layout';

interface AuthPageOptions {
  values?: FormValues;
  errors?: FormErrors;
  flash?: Flash | null;
  inlineAssets?: LayoutOptions['inlineAssets'];
}

/** Иллюстрация «зал для конференции» в шапке страниц входа и регистрации */
const hero = (title: string, subtitle: string) => `
  <section class="auth-hero">
    <svg class="auth-illustration" viewBox="0 0 320 150" aria-hidden="true">
      <rect x="40" y="18" width="240" height="92" rx="10" class="ill-screen"/>
      <rect x="62" y="38" width="96" height="8" rx="4" class="ill-line"/>
      <rect x="62" y="54" width="140" height="6" rx="3" class="ill-line soft"/>
      <rect x="62" y="66" width="120" height="6" rx="3" class="ill-line soft"/>
      <path d="M214 92 L232 66 L246 80 L258 58 L270 92 Z" class="ill-chart"/>
      <g class="ill-seats">
        ${Array.from({ length: 9 }, (_, i) => `<rect x="${36 + i * 28}" y="122" width="20" height="18" rx="6" style="animation-delay:${i * 60}ms"/>`).join('')}
      </g>
    </svg>
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </section>`;

export function loginPage(o: AuthPageOptions = {}): string {
  const v = o.values ?? {};
  const e = o.errors ?? {};
  const body = `
  <div class="auth">
    ${hero('Вход', 'Бронирование помещений для Всероссийских конференций')}
    <form class="card auth-card" method="post" action="/login" novalidate data-validate>
      ${formAlert(e.form)}
      ${field({ name: 'login', label: 'Логин', value: v.login, error: e.login, icon: icons.user, autocomplete: 'username', placeholder: 'Ваш логин', extra: { required: true } })}
      ${field({ name: 'password', label: 'Пароль', type: 'password', error: e.password, icon: icons.lock, autocomplete: 'current-password', placeholder: '••••••••', extra: { required: true } })}
      <button type="submit" class="btn btn-primary btn-block">Войти</button>
      <p class="auth-switch">Еще не зарегистрированы? <a href="/register">Регистрация</a></p>
    </form>
  </div>`;
  return layout({ title: 'Вход', body, bodyClass: 'auth-page', flash: o.flash, inlineAssets: o.inlineAssets });
}

export function registerPage(o: AuthPageOptions = {}): string {
  const v = o.values ?? {};
  const e = o.errors ?? {};
  const body = `
  <div class="auth">
    ${hero('Регистрация', 'Создайте аккаунт, чтобы оставлять заявки')}
    <form class="card auth-card" method="post" action="/register" novalidate data-validate>
      ${formAlert(e.form)}
      ${field({
        name: 'login', label: 'Логин', value: v.login, error: e.login, icon: icons.user,
        autocomplete: 'username', placeholder: 'Например, ivanov2027', hint: 'Латиница и цифры, не менее 6 символов',
        extra: { required: true, pattern: '[A-Za-z0-9]{6,}', 'data-msg-pattern': 'Только латиница и цифры, не менее 6 символов' },
      })}
      ${field({
        name: 'password', label: 'Пароль', type: 'password', error: e.password, icon: icons.lock,
        autocomplete: 'new-password', placeholder: 'Минимум 8 символов',
        extra: { required: true, minlength: 8, 'data-msg-minlength': 'Пароль должен содержать минимум 8 символов' },
      })}
      ${field({
        name: 'fullName', label: 'ФИО', value: v.fullName, error: e.fullName, icon: icons.id,
        autocomplete: 'name', placeholder: 'Иванов Иван Иванович',
        extra: { required: true, pattern: '[А-Яа-яЁё\\s]+', 'data-msg-pattern': 'Только символы кириллицы и пробелы' },
      })}
      ${field({
        name: 'phone', label: 'Телефон', type: 'tel', value: v.phone, error: e.phone, icon: icons.phone,
        autocomplete: 'tel', placeholder: '8(XXX)XXX-XX-XX',
        extra: { required: true, inputmode: 'numeric', 'data-mask': 'phone', pattern: '8\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}', 'data-msg-pattern': 'Формат: 8(XXX)XXX-XX-XX' },
      })}
      ${field({
        name: 'email', label: 'Электронная почта', type: 'email', value: v.email, error: e.email, icon: icons.mail,
        autocomplete: 'email', placeholder: 'name@mail.ru',
        extra: { required: true, 'data-msg-type': 'Некорректный адрес электронной почты' },
      })}
      <button type="submit" class="btn btn-primary btn-block">Зарегистрироваться</button>
      <p class="auth-switch">Уже зарегистрированы? <a href="/login">Войти</a></p>
    </form>
  </div>`;
  return layout({ title: 'Регистрация', body, bodyClass: 'auth-page', flash: o.flash, inlineAssets: o.inlineAssets });
}
