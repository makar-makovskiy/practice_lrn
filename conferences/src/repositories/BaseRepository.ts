import type { Pool, QueryResultRow } from 'pg';

/** Базовый класс репозитория: инкапсулирует доступ к пулу соединений PostgreSQL. */
export abstract class BaseRepository {
  constructor(protected readonly db: Pool) {}

  protected async many<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { rows } = await this.db.query<T>(sql, params);
    return rows;
  }

  protected async one<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.many<T>(sql, params);
    return rows[0] ?? null;
  }
}
