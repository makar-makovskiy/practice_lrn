import { BaseRepository } from './BaseRepository';
import type { Application, PaymentCode, StatusCode } from '../domain/types';

interface ApplicationRow {
  id: number;
  user_id: number;
  room_id: number;
  room_name: string;
  room_type: string;
  start_date: string;
  payment_code: PaymentCode;
  status_code: StatusCode;
  created_at: Date;
  user_full_name: string;
  user_login: string;
  user_phone: string;
  user_email: string;
  review_rating: number | null;
  review_comment: string | null;
  review_created_at: Date | null;
}

export interface ApplicationFilters {
  status?: StatusCode;
  roomId?: number;
  search?: string;
  sort?: 'new' | 'old' | 'date';
}

const SELECT_APPLICATIONS = `
  SELECT a.id, a.user_id, a.room_id, r.name AS room_name, rt.name AS room_type,
         a.start_date, pm.code AS payment_code, s.code AS status_code, a.created_at,
         u.full_name AS user_full_name, u.login AS user_login,
         u.phone AS user_phone, u.email AS user_email,
         rv.rating AS review_rating, rv.comment AS review_comment, rv.created_at AS review_created_at
  FROM applications a
  JOIN rooms r            ON r.id = a.room_id
  JOIN room_types rt      ON rt.id = r.room_type_id
  JOIN payment_methods pm ON pm.id = a.payment_method_id
  JOIN statuses s         ON s.id = a.status_id
  JOIN users u            ON u.id = a.user_id
  LEFT JOIN reviews rv    ON rv.application_id = a.id`;

export class ApplicationRepository extends BaseRepository {
  private static map(row: ApplicationRow): Application {
    return {
      id: row.id,
      userId: row.user_id,
      roomId: row.room_id,
      roomName: row.room_name,
      roomType: row.room_type,
      startDate: row.start_date,
      paymentCode: row.payment_code,
      statusCode: row.status_code,
      createdAt: row.created_at.toISOString(),
      userFullName: row.user_full_name,
      userLogin: row.user_login,
      userPhone: row.user_phone,
      userEmail: row.user_email,
      review:
        row.review_rating !== null
          ? {
              rating: row.review_rating,
              comment: row.review_comment ?? '',
              createdAt: row.review_created_at!.toISOString(),
            }
          : null,
    };
  }

  async create(userId: number, roomId: number, startDate: string, payment: PaymentCode): Promise<number> {
    const row = await this.one<{ id: number }>(
      `INSERT INTO applications (user_id, room_id, start_date, payment_method_id, status_id)
       VALUES ($1, $2, $3,
               (SELECT id FROM payment_methods WHERE code = $4),
               (SELECT id FROM statuses WHERE code = 'new'))
       RETURNING id`,
      [userId, roomId, startDate, payment],
    );
    return row!.id;
  }

  async findById(id: number): Promise<Application | null> {
    const row = await this.one<ApplicationRow>(`${SELECT_APPLICATIONS} WHERE a.id = $1`, [id]);
    return row ? ApplicationRepository.map(row) : null;
  }

  async findByUser(userId: number): Promise<Application[]> {
    const rows = await this.many<ApplicationRow>(
      `${SELECT_APPLICATIONS} WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
      [userId],
    );
    return rows.map(ApplicationRepository.map);
  }

  async findAll(filters: ApplicationFilters = {}): Promise<Application[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      params.push(filters.status);
      where.push(`s.code = $${params.length}`);
    }
    if (filters.roomId) {
      params.push(filters.roomId);
      where.push(`a.room_id = $${params.length}`);
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      const p = `$${params.length}`;
      where.push(`(u.full_name ILIKE ${p} OR u.login ILIKE ${p} OR u.email ILIKE ${p} OR u.phone ILIKE ${p})`);
    }

    const order =
      filters.sort === 'old' ? 'a.created_at ASC'
      : filters.sort === 'date' ? 'a.start_date ASC'
      : 'a.created_at DESC';

    const sql = `${SELECT_APPLICATIONS}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${order}`;

    const rows = await this.many<ApplicationRow>(sql, params);
    return rows.map(ApplicationRepository.map);
  }

  async countByStatus(): Promise<Record<StatusCode, number>> {
    const rows = await this.many<{ code: StatusCode; count: string }>(
      `SELECT s.code, COUNT(a.id) AS count
       FROM statuses s LEFT JOIN applications a ON a.status_id = s.id
       GROUP BY s.code`,
    );
    const result: Record<StatusCode, number> = { new: 0, scheduled: 0, completed: 0 };
    for (const r of rows) result[r.code] = Number(r.count);
    return result;
  }

  async updateStatus(id: number, status: StatusCode): Promise<boolean> {
    const res = await this.db.query(
      `UPDATE applications
       SET status_id = (SELECT id FROM statuses WHERE code = $2), updated_at = NOW()
       WHERE id = $1`,
      [id, status],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
