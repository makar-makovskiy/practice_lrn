import { BaseRepository } from './BaseRepository';

export class ReviewRepository extends BaseRepository {
  async create(applicationId: number, rating: number, comment: string): Promise<void> {
    await this.db.query(
      'INSERT INTO reviews (application_id, rating, comment) VALUES ($1, $2, $3)',
      [applicationId, rating, comment],
    );
  }
}
