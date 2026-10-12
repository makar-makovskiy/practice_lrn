import { BaseRepository } from './BaseRepository';
import type { Role, User } from '../domain/types';

interface UserRow {
  id: number;
  login: string;
  password_hash: string;
  full_name: string;
  phone: string;
  email: string;
  role: Role;
}

export interface NewUser {
  login: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  email: string;
}

export class UserRepository extends BaseRepository {
  private static map(row: UserRow): User {
    return {
      id: row.id,
      login: row.login,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      role: row.role,
    };
  }

  async findByLogin(login: string): Promise<User | null> {
    const row = await this.one<UserRow>('SELECT * FROM users WHERE login = $1', [login]);
    return row ? UserRepository.map(row) : null;
  }

  async existsByLogin(login: string): Promise<boolean> {
    // логин уникален без учёта регистра, чтобы не было «User01» и «user01»
    const row = await this.one('SELECT 1 FROM users WHERE LOWER(login) = LOWER($1)', [login]);
    return row !== null;
  }

  async create(user: NewUser): Promise<number> {
    const row = await this.one<{ id: number }>(
      `INSERT INTO users (login, password_hash, full_name, phone, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user.login, user.passwordHash, user.fullName, user.phone, user.email],
    );
    return row!.id;
  }

  async upsertAdmin(login: string, passwordHash: string): Promise<void> {
    await this.db.query(
      `INSERT INTO users (login, password_hash, full_name, phone, email, role)
       VALUES ($1, $2, 'Администратор', '8(000)000-00-00', 'admin@conferences.rf', 'admin')
       ON CONFLICT (login) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [login, passwordHash],
    );
  }
}
