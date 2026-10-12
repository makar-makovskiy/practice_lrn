import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pwd: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/** Хеширование паролей встроенным алгоритмом scrypt (без внешних зависимостей). */
export class PasswordHasher {
  private static readonly KEY_LENGTH = 64;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, PasswordHasher.KEY_LENGTH);
    return `${salt.toString('hex')}:${key.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [saltHex, keyHex] = stored.split(':');
    if (!saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
