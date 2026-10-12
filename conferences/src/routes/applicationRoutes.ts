import { Router } from 'express';
import { asyncHandler, requireUser, setFlash, takeFlash } from '../middleware/auth';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { RoomRepository } from '../repositories/RoomRepository';
import type { ApplicationService } from '../services/ApplicationService';
import { todayIso } from '../services/Validator';
import { applicationsPage } from '../views/pages/applications';
import { newApplicationPage } from '../views/pages/newApplication';

export function applicationRoutes(
  service: ApplicationService,
  applications: ApplicationRepository,
  rooms: RoomRepository,
): Router {
  const router = Router();
  router.use(requireUser);

  // Страница просмотра заявок (личный кабинет)
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const user = req.session.user!;
      res.send(applicationsPage({ user, applications: await applications.findByUser(user.id), flash: takeFlash(req) }));
    }),
  );

  // Страница формирования заявки
  router.get(
    '/new',
    asyncHandler(async (req, res) => {
      res.send(
        newApplicationPage({ user: req.session.user!, rooms: await rooms.findAll(), minDate: todayIso(), flash: takeFlash(req) }),
      );
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const user = req.session.user!;
      const result = await service.create(user.id, req.body);
      if (!result.ok) {
        return res.status(422).send(
          newApplicationPage({ user, rooms: await rooms.findAll(), minDate: todayIso(), values: req.body, errors: result.errors }),
        );
      }
      setFlash(req, 'success', 'Заявка отправлена на рассмотрение администратору');
      res.redirect('/applications');
    }),
  );

  // Отзыв о проведённом мероприятии
  router.post(
    '/:id/review',
    asyncHandler(async (req, res) => {
      const user = req.session.user!;
      const id = Number(req.params.id);
      const result = await service.addReview(user.id, id, req.body);
      if (!result.ok) {
        return res.status(422).send(
          applicationsPage({
            user,
            applications: await applications.findByUser(user.id),
            reviewErrors: { applicationId: id, errors: result.errors, values: req.body },
          }),
        );
      }
      setFlash(req, 'success', 'Спасибо за отзыв!');
      res.redirect('/applications');
    }),
  );

  return router;
}
