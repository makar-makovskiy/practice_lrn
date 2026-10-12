import type { SessionUser } from '../domain/types';
import { esc, icons, logo } from './helpers';

export interface Flash {
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface LayoutOptions {
  title: string;
  body: string;
  user?: SessionUser | null;
  active?: 'applications' | 'new' | 'admin';
  flash?: Flash | null;
  bodyClass?: string;
  /** Для статических макетов design/*.html — CSS и JS встраиваются прямо в файл */
  inlineAssets?: { css: string; js: string };
}

function navigation(user: SessionUser, active?: LayoutOptions['active']): string {
  const link = (href: string, key: LayoutOptions['active'], icon: string, label: string) =>
    `<a href="${href}" class="nav-link${active === key ? ' active' : ''}">${icon}<span>${label}</span></a>`;

  const links =
    user.role === 'admin'
      ? link('/admin', 'admin', icons.list, 'Все заявки')
      : link('/applications', 'applications', icons.list, 'Мои заявки') +
        link('/applications/new', 'new', icons.plus, 'Новая заявка');

  return `
  <nav class="nav" aria-label="Основная навигация">
    ${links}
    <form method="post" action="/logout" class="nav-logout">
      <button type="submit" class="nav-link">${icons.logout}<span>Выход</span></button>
    </form>
  </nav>`;
}

export function layout(o: LayoutOptions): string {
  const css = o.inlineAssets ? `<style>${o.inlineAssets.css}</style>` : '<link rel="stylesheet" href="/css/style.css">';
  const js = o.inlineAssets ? `<script>${o.inlineAssets.js}</script>` : '<script src="/js/main.js" defer></script>';
  const flash = o.flash
    ? `<div class="toast toast-${o.flash.type}" role="status" data-toast>${esc(o.flash.text)}</div>`
    : '';

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#2F5BEA">
  <title>${esc(o.title)} — Конференции.РФ</title>
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(logo.replace('class="logo-mark" ', 'xmlns="http://www.w3.org/2000/svg" '))}">
  ${css}
</head>
<body class="${esc(o.bodyClass ?? '')}${o.user ? ' has-nav' : ''}">
  <header class="topbar">
    <a href="/" class="brand">${logo}<span>Конференции<b>.РФ</b></span></a>
    ${o.user ? navigation(o.user, o.active) : ''}
    ${o.user ? `<div class="topbar-user" title="${esc(o.user.login)}">${icons.user}<span>${esc(o.user.fullName)}</span></div>` : ''}
  </header>
  <main class="page">
    ${o.body}
  </main>
  <div class="toast-stack" data-toast-stack>${flash}</div>
  ${js}
</body>
</html>`;
}
