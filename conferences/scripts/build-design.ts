/**
 * Генерирует статические макеты страниц (design/*.html) для смартфона 390×844
 * из тех же шаблонов, что использует сервер. CSS и JS встраиваются в файл,
 * поэтому макеты открываются двойным кликом, без сервера и интернета.
 *
 *   npm run design
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Application, Room, SessionUser } from '../src/domain/types';
import { adminPage } from '../src/views/pages/admin';
import { applicationsPage } from '../src/views/pages/applications';
import { loginPage, registerPage } from '../src/views/pages/auth';
import { newApplicationPage } from '../src/views/pages/newApplication';

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'design');
mkdirSync(out, { recursive: true });

const inlineAssets = {
  css: readFileSync(path.join(root, 'public/css/style.css'), 'utf8'),
  js: readFileSync(path.join(root, 'public/js/main.js'), 'utf8'),
};

// ---------- Демо-данные ----------

const user: SessionUser = { id: 2, login: 'ivanov2027', fullName: 'Иванов Иван Иванович', role: 'user' };
const admin: SessionUser = { id: 1, login: 'Conf2027', fullName: 'Администратор', role: 'admin' };

const rooms: Room[] = [
  { id: 1, name: 'Аудитория 101', type: 'Аудитория', capacity: 60, description: 'Классическая аудитория с проектором и трибуной' },
  { id: 2, name: 'Большая аудитория 305', type: 'Аудитория', capacity: 150, description: 'Амфитеатр, микрофоны, запись выступлений' },
  { id: 3, name: 'Коворкинг «Точка роста»', type: 'Коворкинг', capacity: 40, description: 'Свободная рассадка, флипчарты, кофе-зона' },
  { id: 4, name: 'Коворкинг «Open Space»', type: 'Коворкинг', capacity: 80, description: 'Трансформируемое пространство для секций' },
  { id: 5, name: 'Кинозал «Премьера»', type: 'Кинозал', capacity: 120, description: 'Большой экран, звук 7.1, мягкие кресла' },
  { id: 6, name: 'Малый кинозал', type: 'Кинозал', capacity: 45, description: 'Камерный зал для презентаций и показов' },
];

const base = { userId: 2, userFullName: user.fullName, userLogin: user.login, userPhone: '8(914)123-45-67', userEmail: 'ivanov@mail.ru' };

const apps: Application[] = [
  { ...base, id: 14, roomId: 5, roomName: 'Кинозал «Премьера»', roomType: 'Кинозал', startDate: '2026-11-20', paymentCode: 'sbp', statusCode: 'new', createdAt: '2026-10-12T03:15:00Z', review: null },
  { ...base, id: 11, roomId: 2, roomName: 'Большая аудитория 305', roomType: 'Аудитория', startDate: '2026-10-30', paymentCode: 'cash', statusCode: 'scheduled', createdAt: '2026-10-05T07:40:00Z', review: null },
  { ...base, id: 7, roomId: 3, roomName: 'Коворкинг «Точка роста»', roomType: 'Коворкинг', startDate: '2026-09-18', paymentCode: 'sbp', statusCode: 'completed', createdAt: '2026-09-01T09:05:00Z', review: null },
  { ...base, id: 4, roomId: 1, roomName: 'Аудитория 101', roomType: 'Аудитория', startDate: '2026-08-22', paymentCode: 'cash', statusCode: 'completed', createdAt: '2026-08-10T11:20:00Z',
    review: { rating: 5, comment: 'Отличная аудитория, всё работало без сбоев. Спасибо!', createdAt: '2026-08-23T10:00:00Z' } },
];

const adminApps: Application[] = [
  apps[0],
  { ...apps[1], userFullName: 'Петрова Анна Сергеевна', userLogin: 'petrova88', userPhone: '8(924)555-12-34', userEmail: 'petrova@yandex.ru' },
  { ...apps[2], id: 9, userFullName: 'Сидоров Пётр', userLogin: 'sidorov01', userPhone: '8(902)777-00-11', userEmail: 'sidorov@gmail.com' },
  apps[3],
];

// ---------- Страницы ----------

const pages: Record<string, string> = {
  'login.html': loginPage({ inlineAssets }),
  'login-errors.html': loginPage({ inlineAssets, values: { login: 'ivanov' }, errors: { password: 'Неверный пароль' } }),
  'register.html': registerPage({ inlineAssets }),
  'register-errors.html': registerPage({
    inlineAssets,
    values: { login: 'ivan', fullName: 'Ivanov', phone: '8(914)12', email: 'ivanov@' },
    errors: {
      login: 'Только латиница и цифры, не менее 6 символов',
      password: 'Пароль должен содержать минимум 8 символов',
      fullName: 'Только символы кириллицы и пробелы',
      phone: 'Формат: 8(XXX)XXX-XX-XX',
      email: 'Некорректный адрес электронной почты',
    },
  }),
  'applications.html': applicationsPage({ user, applications: apps, inlineAssets, flash: { type: 'success', text: 'Заявка отправлена на рассмотрение администратору' } }),
  'applications-empty.html': applicationsPage({ user, applications: [], inlineAssets }),
  'new-application.html': newApplicationPage({ user, rooms, minDate: '2026-10-12', inlineAssets, values: { roomId: '5', payment: 'sbp' } }),
  'admin.html': adminPage({ user: admin, applications: adminApps, rooms, counts: { new: 1, scheduled: 1, completed: 2 }, filters: { sort: 'new' }, inlineAssets }),
};

// Ссылки между макетами вместо серверных маршрутов
const LINKS: [RegExp, string][] = [
  [/href="\/login"/g, 'href="login.html"'],
  [/href="\/register"/g, 'href="register.html"'],
  [/href="\/applications\/new"/g, 'href="new-application.html"'],
  [/href="\/applications"/g, 'href="applications.html"'],
  [/href="\/admin"/g, 'href="admin.html"'],
  [/href="\/"/g, 'href="login.html"'],
];

for (const [file, html] of Object.entries(pages)) {
  const result = LINKS.reduce((acc, [re, to]) => acc.replace(re, to), html);
  writeFileSync(path.join(out, file), result);
  console.log('design/' + file);
}
