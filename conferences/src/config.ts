// Загружаем переменные окружения из .env (встроено в Node.js >= 20.12, без пакета dotenv)
try {
  (process as unknown as { loadEnvFile: (p?: string) => void }).loadEnvFile();
} catch {
  /* .env может отсутствовать — используем значения по умолчанию */
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/conferences',
  sessionSecret: process.env.SESSION_SECRET ?? 'conferences-dev-secret',
  admin: {
    login: process.env.ADMIN_LOGIN ?? 'Conf2027',
    password: process.env.ADMIN_PASSWORD ?? 'Demo77',
  },
} as const;
