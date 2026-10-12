import path from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import session from 'express-session';
import type { Pool } from 'pg';
import { config } from './config';
import { ApplicationRepository } from './repositories/ApplicationRepository';
import { ReviewRepository } from './repositories/ReviewRepository';
import { RoomRepository } from './repositories/RoomRepository';
import { UserRepository } from './repositories/UserRepository';
import { adminRoutes } from './routes/adminRoutes';
import { applicationRoutes } from './routes/applicationRoutes';
import { authRoutes } from './routes/authRoutes';
import { ApplicationService } from './services/ApplicationService';
import { AuthService } from './services/AuthService';
import { layout } from './views/layout';

export function createApp(pool: Pool): express.Express {
  // Слой доступа к данным (репозитории) и бизнес-логика (сервисы)
  const users = new UserRepository(pool);
  const rooms = new RoomRepository(pool);
  const applications = new ApplicationRepository(pool);
  const reviews = new ReviewRepository(pool);
  const authService = new AuthService(users);
  const applicationService = new ApplicationService(applications, rooms, reviews);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static(path.resolve(process.cwd(), 'public'), { maxAge: '1h' }));
  app.use(
    session({
      name: 'conf.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
    }),
  );

  app.get('/', (req, res) => {
    const user = req.session.user;
    res.redirect(!user ? '/login' : user.role === 'admin' ? '/admin' : '/applications');
  });

  app.use(authRoutes(authService));
  app.use('/applications', applicationRoutes(applicationService, applications, rooms));
  app.use('/admin', adminRoutes(applicationService, applications, rooms));

  app.use((req, res) => {
    res.status(404).send(
      layout({
        title: 'Страница не найдена',
        user: req.session.user,
        body: `<div class="empty card"><h1>404</h1><p class="muted">Такой страницы нет.</p><a class="btn btn-primary" href="/">На главную</a></div>`,
      }),
    );
  });

  const onError: ErrorRequestHandler = (err, req, res, _next) => {
    console.error(err);
    res.status(500).send(
      layout({
        title: 'Ошибка',
        user: req.session?.user,
        body: `<div class="empty card"><h1>Что-то пошло не так</h1><p class="muted">Попробуйте ещё раз чуть позже.</p><a class="btn btn-primary" href="/">На главную</a></div>`,
      }),
    );
  };
  app.use(onError);

  return app;
}
