import { Pool, types } from 'pg';
import { config } from '../config';

// Тип DATE (oid 1082) отдаём строкой YYYY-MM-DD, чтобы не было сдвигов из-за часовых поясов
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({ connectionString: config.databaseUrl });
