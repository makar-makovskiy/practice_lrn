import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Pool } from 'pg';
import { config } from '../config';
import { PasswordHasher } from '../services/PasswordHasher';
import { UserRepository } from '../repositories/UserRepository';
import { pool } from './pool';

/**
 * Создаёт таблицы и справочники (db/schema.sql) и учётную запись администратора.
 * Безопасно вызывать при каждом запуске сервера.
 */
export async function initDatabase(pool: Pool): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);

  const users = new UserRepository(pool);
  const hash = await new PasswordHasher().hash(config.admin.password);
  await users.upsertAdmin(config.admin.login, hash);
}

// Запуск как отдельного скрипта: npm run db:init
if (require.main === module) {
  (async () => {
    try {
      await initDatabase(pool);
      console.log('База данных инициализирована, администратор:', config.admin.login);
    } catch (err) {
      console.error('Ошибка инициализации БД:', err);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  })();
}
