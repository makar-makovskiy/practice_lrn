import { Router } from 'express';
import { isStatusCode, STATUS_LABELS } from '../domain/types';
import { asyncHandler, requireAdmin, setFlash, takeFlash } from '../middleware/auth';
import type { ApplicationFilters, ApplicationRepository } from '../repositories/ApplicationRepository';
import type { RoomRepository } from '../repositories/RoomRepository';
import type { ApplicationService } from '../services/ApplicationService';
import { adminPage } from '../views/pages/admin';

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function adminRoutes(
  service: ApplicationService,
  applications: ApplicationRepository,
  rooms: RoomRepository,
): Router {
  const router = Router();
  router.use(requireAdmin);

  // Панель администратора: все заявки + фильтрация
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const status = str(req.query.status);
      const roomId = Number(str(req.query.room));
      const sort = str(req.query.sort);
      const filters: ApplicationFilters = {
        status: isStatusCode(status) ? status : undefined,
        roomId: Number.isInteger(roomId) && roomId > 0 ? roomId : undefined,
        search: str(req.query.q).slice(0, 100) || undefined,
        sort: sort === 'old' || sort === 'date' ? sort : 'new',
      };

      const [list, roomList, counts] = await Promise.all([
        applications.findAll(filters),
        rooms.findAll(),
        applications.countByStatus(),
      ]);
      res.send(adminPage({ user: req.session.user!, applications: list, rooms: roomList, counts, filters, flash: takeFlash(req) }));
    }),
  );

  // Смена статуса: обычная форма (редирект) или fetch-запрос (JSON)
  router.post(
    '/applications/:id/status',
    asyncHandler(async (req, res) => {
      const wantsJson = req.headers.accept?.includes('application/json');
      const id = Number(req.params.id);
      const status = req.body.status;

      if (!isStatusCode(status)) {
        if (wantsJson) return res.status(422).json({ ok: false, error: 'Неизвестный статус' });
        setFlash(req, 'error', 'Неизвестный статус');
        return res.redirect(req.get('Referer') ?? '/admin');
      }

      const updated = await service.changeStatus(id, status);
      if (wantsJson) {
        if (!updated) return res.status(404).json({ ok: false, error: 'Заявка не найдена' });
        return res.json({ ok: true, status, label: STATUS_LABELS[status], counts: await applications.countByStatus() });
      }
      setFlash(req, updated ? 'success' : 'error', updated ? `Статус заявки №${id}: «${STATUS_LABELS[status]}»` : 'Заявка не найдена');
      res.redirect(req.get('Referer') ?? '/admin');
    }),
  );

  return router;
}
