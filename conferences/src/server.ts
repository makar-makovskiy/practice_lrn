import { createApp } from './app';
import { config } from './config';
import { initDatabase } from './db/init';
import { pool } from './db/pool';

async function main(): Promise<void> {
  await initDatabase(pool);
  createApp(pool).listen(config.port, () => {
    console.log(`Конференции.РФ запущены: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Не удалось запустить сервер:', err);
  process.exit(1);
});
