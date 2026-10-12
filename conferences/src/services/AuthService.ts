import type { FormErrors, FormValues, SessionUser } from '../domain/types';
import { UserRepository } from '../repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';
import { PATTERNS, Validator } from './Validator';

export type RegisterResult = { ok: true; user: SessionUser } | { ok: false; errors: FormErrors };
export type LoginResult = { ok: true; user: SessionUser } | { ok: false; errors: FormErrors };

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher = new PasswordHasher(),
  ) {}

  validateRegistration(values: FormValues): Validator {
    return new Validator(values)
      .required('login')
      .matches('login', PATTERNS.login, 'Только латиница и цифры, не менее 6 символов')
      .maxLength('login', 50, 'Не более 50 символов')
      .required('password')
      .minLength('password', 8, 'Пароль должен содержать минимум 8 символов')
      .required('fullName')
      .matches('fullName', PATTERNS.fullName, 'Только символы кириллицы и пробелы')
      .maxLength('fullName', 150, 'Не более 150 символов')
      .required('phone')
      .matches('phone', PATTERNS.phone, 'Формат: 8(XXX)XXX-XX-XX')
      .required('email')
      .matches('email', PATTERNS.email, 'Некорректный адрес электронной почты')
      .maxLength('email', 150, 'Не более 150 символов');
  }

  async register(values: FormValues): Promise<RegisterResult> {
    const v = this.validateRegistration(values);
    const login = values.login?.trim() ?? '';

    if (!v.errors.login && (await this.users.existsByLogin(login))) {
      v.check('login', false, 'Этот логин уже занят');
    }
    if (!v.isValid) return { ok: false, errors: v.errors };

    const fullName = values.fullName.trim().replace(/\s+/g, ' ');
    const id = await this.users.create({
      login,
      passwordHash: await this.hasher.hash(values.password),
      fullName,
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
    });
    return { ok: true, user: { id, login, fullName, role: 'user' } };
  }

  async login(values: FormValues): Promise<LoginResult> {
    const v = new Validator(values)
      .required('login', 'Введите логин')
      .required('password', 'Введите пароль');
    if (!v.isValid) return { ok: false, errors: v.errors };

    const user = await this.users.findByLogin(values.login.trim());
    if (!user) {
      return { ok: false, errors: { login: 'Пользователь с таким логином не найден' } };
    }
    if (!(await this.hasher.verify(values.password, user.passwordHash))) {
      return { ok: false, errors: { password: 'Неверный пароль' } };
    }
    return {
      ok: true,
      user: { id: user.id, login: user.login, fullName: user.fullName, role: user.role },
    };
  }
}
