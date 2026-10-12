import { BaseRepository } from './BaseRepository';
import type { Room } from '../domain/types';

export class RoomRepository extends BaseRepository {
  async findAll(): Promise<Room[]> {
    return this.many<Room>(
      `SELECT r.id, r.name, rt.name AS type, r.capacity, r.description
       FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id
       ORDER BY rt.id, r.name`,
    );
  }

  async exists(id: number): Promise<boolean> {
    return (await this.one('SELECT 1 FROM rooms WHERE id = $1', [id])) !== null;
  }
}
