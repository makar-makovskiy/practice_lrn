import { isPaymentCode, type FormErrors, type FormValues, type StatusCode } from '../domain/types';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { ReviewRepository } from '../repositories/ReviewRepository';
import { RoomRepository } from '../repositories/RoomRepository';
import { isRealDate, todayIso, Validator } from './Validator';

export type ServiceResult = { ok: true } | { ok: false; errors: FormErrors };

export class ApplicationService {
  constructor(
    private readonly applications: ApplicationRepository,
    private readonly rooms: RoomRepository,
    private readonly reviews: ReviewRepository,
  ) {}

  async create(userId: number, values: FormValues): Promise<ServiceResult> {
    const roomId = Number(values.roomId);
    const date = (values.startDate ?? '').trim();

    const v = new Validator(values)
      .required('roomId', 'Выберите помещение')
      .required('startDate', 'Укажите дату начала конференции')
      .check('startDate', !date || isRealDate(date), 'Некорректная дата')
      .check('startDate', !date || !isRealDate(date) || date >= todayIso(), 'Дата не может быть в прошлом')
      .required('payment', 'Выберите способ оплаты')
      .check('payment', !values.payment || isPaymentCode(values.payment), 'Неизвестный способ оплаты');

    if (!v.errors.roomId && !(Number.isInteger(roomId) && (await this.rooms.exists(roomId)))) {
      v.check('roomId', false, 'Помещение не найдено');
    }
    if (!v.isValid) return { ok: false, errors: v.errors };

    await this.applications.create(userId, roomId, date, values.payment as 'cash' | 'sbp');
    return { ok: true };
  }

  /** Отзыв можно оставить только к своей завершённой заявке и только один раз. */
  async addReview(userId: number, applicationId: number, values: FormValues): Promise<ServiceResult> {
    const app = await this.applications.findById(applicationId);
    if (!app || app.userId !== userId) return { ok: false, errors: { form: 'Заявка не найдена' } };
    if (app.statusCode !== 'completed') {
      return { ok: false, errors: { form: 'Отзыв доступен только после завершения мероприятия' } };
    }
    if (app.review) return { ok: false, errors: { form: 'Отзыв уже оставлен' } };

    const rating = Number(values.rating);
    const v = new Validator(values)
      .check('rating', Number.isInteger(rating) && rating >= 1 && rating <= 5, 'Поставьте оценку от 1 до 5')
      .required('comment', 'Напишите пару слов о мероприятии')
      .maxLength('comment', 1000, 'Не более 1000 символов');
    if (!v.isValid) return { ok: false, errors: v.errors };

    await this.reviews.create(applicationId, rating, values.comment.trim());
    return { ok: true };
  }

  changeStatus(applicationId: number, status: StatusCode): Promise<boolean> {
    return this.applications.updateStatus(applicationId, status);
  }
}
