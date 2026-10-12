// Конференции.РФ — клиентская интерактивность (без библиотек, работает офлайн)
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------- Уведомления ---------------- */

  function dismiss(toast, delay) {
    setTimeout(() => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, delay);
  }

  function showToast(text, type = 'success') {
    const stack = $('[data-toast-stack]');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = text;
    stack.appendChild(toast);
    dismiss(toast, 3200);
  }

  $$('[data-toast]').forEach((t) => dismiss(t, 3600));

  /* ---------------- «Рябь» на кнопках ---------------- */

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ---------------- Показать / скрыть пароль ---------------- */

  $$('[data-toggle-pass]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.classList.toggle('on', show);
      btn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    });
  });

  /* ---------------- Маска телефона 8(XXX)XXX-XX-XX ---------------- */

  function formatPhone(value) {
    let d = value.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '7') d = '8' + d.slice(1);
    if (d[0] !== '8') d = '8' + d;
    d = d.slice(0, 11);
    let out = '8';
    if (d.length > 1) out += '(' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  $$('[data-mask="phone"]').forEach((input) => {
    let prev = input.value;
    input.addEventListener('input', () => {
      let digits = input.value.replace(/\D/g, '');
      // поле было пустым («8(»), а пользователь начал номер с 7/8 — это код страны, не дублируем
      if (prev.replace(/\D/g, '').length <= 1 && /^8[78]/.test(digits)) digits = '8' + digits.slice(2);
      input.value = formatPhone(digits);
      prev = input.value;
    });
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '8(';
    });
    input.addEventListener('blur', () => {
      if (input.value === '8(' || input.value === '8') input.value = '';
    });
  });

  /* ---------------- Валидация форм ---------------- */

  const DEFAULT_MSG = {
    required: 'Поле обязательно для заполнения',
    pattern: 'Неверный формат',
    minlength: (n) => `Минимум ${n} символов`,
    type: 'Неверный формат',
    min: 'Значение слишком маленькое',
  };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Возвращает текст ошибки или '' для группы полей с одним name */
  function validateGroup(form, name) {
    const inputs = $$(`[name="${CSS.escape(name)}"]`, form);
    const first = inputs[0];
    const msg = (key, fallback) => first.dataset[`msg${key[0].toUpperCase()}${key.slice(1)}`] || fallback;

    if (first.type === 'radio') {
      const required = inputs.some((i) => i.required);
      return required && !inputs.some((i) => i.checked) ? msg('required', DEFAULT_MSG.required) : '';
    }

    const value = first.value.trim();
    if (!value) return first.required ? msg('required', DEFAULT_MSG.required) : '';

    const pattern = first.getAttribute('pattern');
    if (pattern && !new RegExp(`^(?:${pattern})$`).test(value)) return msg('pattern', DEFAULT_MSG.pattern);

    const minlength = Number(first.getAttribute('minlength'));
    if (minlength && first.value.length < minlength) return msg('minlength', DEFAULT_MSG.minlength(minlength));

    if (first.type === 'email' && !EMAIL_RE.test(value)) return msg('type', DEFAULT_MSG.type);

    const min = first.getAttribute('min');
    if (first.type === 'date' && min && value < min) return msg('min', DEFAULT_MSG.min);

    return '';
  }

  function showError(form, name, message) {
    const input = $(`[name="${CSS.escape(name)}"]`, form);
    const field = input && input.closest('.field');
    const box = $(`[data-error-for="${CSS.escape(name)}"]`, form);
    if (!field) return;
    if (message) box && (box.textContent = message);
    field.classList.toggle('has-error', !!message);
    field.classList.toggle('is-valid', !message && input.type !== 'radio' && !!input.value);
    $$(`[name="${CSS.escape(name)}"]`, form).forEach((i) => i.setAttribute('aria-invalid', message ? 'true' : 'false'));
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth; // перезапуск анимации
    el.classList.add('shake');
  }

  $$('form[data-validate]').forEach((form) => {
    const names = [...new Set($$('input[name], select[name], textarea[name]', form).map((el) => el.name))];

    form.addEventListener('focusout', (e) => {
      const el = e.target;
      if (!el.name || el.type === 'radio' || !el.value) return;
      showError(form, el.name, validateGroup(form, el.name));
    });

    form.addEventListener('input', (e) => {
      const el = e.target;
      if (!el.name) return;
      const field = el.closest('.field');
      // пока ошибка показана — перепроверяем на лету, чтобы она исчезла сразу после исправления
      if (field && field.classList.contains('has-error')) showError(form, el.name, validateGroup(form, el.name));
    });

    form.addEventListener('change', (e) => {
      if (e.target.type === 'radio' || e.target.tagName === 'SELECT') showError(form, e.target.name, validateGroup(form, e.target.name));
    });

    form.addEventListener('submit', (e) => {
      let firstInvalid = null;
      for (const name of names) {
        const message = validateGroup(form, name);
        showError(form, name, message);
        if (message && !firstInvalid) firstInvalid = $(`[name="${CSS.escape(name)}"]`, form);
      }
      if (firstInvalid) {
        e.preventDefault();
        const field = firstInvalid.closest('.field');
        shake(field);
        if (firstInvalid.type !== 'radio') firstInvalid.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const btn = $('button[type="submit"]', form);
      if (btn) btn.classList.add('is-loading');
    });
  });

  // ошибки, пришедшие с сервера, — тоже «встряхиваем»
  const serverError = $('.field.has-error');
  if (serverError) shake(serverError);

  /* ---------------- Информация о помещении ---------------- */

  const roomSelect = $('[data-room-select]');
  if (roomSelect) {
    const info = $('[data-room-info]');
    const update = () => {
      const opt = roomSelect.selectedOptions[0];
      if (!opt || !opt.value) {
        info.hidden = true;
        return;
      }
      $('[data-room-type]', info).textContent = opt.dataset.type;
      $('[data-room-capacity]', info).textContent = `до ${opt.dataset.capacity} человек`;
      $('[data-room-description]', info).textContent = opt.dataset.description;
      info.hidden = false;
      info.style.animation = 'none';
      void info.offsetWidth;
      info.style.animation = '';
    };
    roomSelect.addEventListener('change', update);
    update();
  }

  /* ---------------- Панель администратора ---------------- */

  const filters = $('[data-filters]');
  if (filters) {
    $$('select', filters).forEach((s) => s.addEventListener('change', () => filters.requestSubmit()));
  }

  function updateCounts(counts) {
    let total = 0;
    Object.entries(counts).forEach(([code, n]) => {
      total += n;
      const el = $(`[data-count="${code}"]`);
      if (el && el.textContent !== String(n)) {
        el.textContent = n;
        el.classList.remove('tick');
        void el.offsetWidth;
        el.classList.add('tick');
      }
    });
    const all = $('[data-count="all"]');
    if (all) all.textContent = total;
  }

  $$('[data-status-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('button', form);
      const card = form.closest('[data-app-card]');
      const status = form.elements.status.value;
      btn.classList.add('is-loading');

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams({ status }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка сохранения');

        const badge = $('[data-status-badge]', card);
        badge.className = `badge status-${data.status} bump`;
        badge.textContent = data.label;
        card.dataset.status = data.status;
        card.classList.remove('is-updated');
        void card.offsetWidth;
        card.classList.add('is-updated');
        updateCounts(data.counts);
        showToast(`Статус изменён: «${data.label}»`);
      } catch (err) {
        showToast(err.message || 'Не удалось сохранить', 'error');
      } finally {
        btn.classList.remove('is-loading');
      }
    });
  });
})();
