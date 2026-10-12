export type Role = 'user' | 'admin';
export type StatusCode = 'new' | 'scheduled' | 'completed';
export type PaymentCode = 'cash' | 'sbp';

export const STATUS_LABELS: Record<StatusCode, string> = {
  new: 'Новая',
  scheduled: 'Мероприятие назначено',
  completed: 'Завершено',
};

export const PAYMENT_LABELS: Record<PaymentCode, string> = {
  cash: 'При очном посещении',
  sbp: 'Перевод по СБП',
};

export const isStatusCode = (v: unknown): v is StatusCode =>
  typeof v === 'string' && v in STATUS_LABELS;

export const isPaymentCode = (v: unknown): v is PaymentCode =>
  typeof v === 'string' && v in PAYMENT_LABELS;

export interface SessionUser {
  id: number;
  login: string;
  fullName: string;
  role: Role;
}

export interface User extends SessionUser {
  passwordHash: string;
  phone: string;
  email: string;
}

export interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  description: string | null;
}

export interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Application {
  id: number;
  userId: number;
  roomId: number;
  roomName: string;
  roomType: string;
  startDate: string; // YYYY-MM-DD
  paymentCode: PaymentCode;
  statusCode: StatusCode;
  createdAt: string;
  // заполняется для панели администратора
  userFullName?: string;
  userLogin?: string;
  userPhone?: string;
  userEmail?: string;
  review: Review | null;
}

export type FormErrors = Record<string, string>;
export type FormValues = Record<string, string>;
