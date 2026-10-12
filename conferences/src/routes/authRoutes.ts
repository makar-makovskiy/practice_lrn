import { Router, type Request } from 'express';
import type { SessionUser } from '../domain/types';
import { asyncHandler, redirectIfAuthenticated, setFlash, takeFlash } from '../middleware/auth';
import type { AuthService } from '../services/AuthService';
import { loginPage, registerPage } from '../views/pages/auth';

/** Меняем id сессии при входе (защита от фиксации сессии) */
function signIn(req: Request, user: SessionUser): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.user = user;
      req.session.save((e) => (e ? reject(e) : resolve()));
    });
  });
}

export function authRoutes(auth: AuthService): Router {
  const router = Router();

  router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.send(loginPage({ flash: takeFlash(req) }));
  });

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const result = await auth.login(req.body);
      if (!result.ok) {
        return res.status(422).send(loginPage({ values: req.body, errors: result.errors }));
      }
      await signIn(req, result.user);
      setFlash(req, 'success', `Добро пожаловать, ${result.user.fullName}!`);
      res.redirect(result.user.role === 'admin' ? '/admin' : '/applications');
    }),
  );

  router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.send(registerPage({ flash: takeFlash(req) }));
  });

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const result = await auth.register(req.body);
      if (!result.ok) {
        return res.status(422).send(registerPage({ values: req.body, errors: result.errors }));
      }
      await signIn(req, result.user);
      setFlash(req, 'success', 'Регистрация прошла успешно!');
      res.redirect('/applications');
    }),
  );

  router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('conf.sid');
      res.redirect('/login');
    });
  });

  return router;
}
