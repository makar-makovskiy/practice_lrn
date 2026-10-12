import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { SessionUser } from '../domain/types';
import type { Flash } from '../views/layout';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    flash?: Flash;
  }
}

/** Express 4 не перехватывает ошибки async-обработчиков — оборачиваем их. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function setFlash(req: Request, type: Flash['type'], text: string): void {
  req.session.flash = { type, text };
}

/** Забирает одноразовое сообщение из сессии */
export function takeFlash(req: Request): Flash | null {
  const flash = req.session.flash ?? null;
  delete req.session.flash;
  return flash;
}

export const requireUser: RequestHandler = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role === 'admin') return res.redirect('/admin');
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.session.user?.role !== 'admin') {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ ok: false, error: 'Доступ запрещён' });
    }
    return res.redirect('/login');
  }
  next();
};

export const redirectIfAuthenticated: RequestHandler = (req, res, next) => {
  const user = req.session.user;
  if (user) return res.redirect(user.role === 'admin' ? '/admin' : '/applications');
  next();
};
