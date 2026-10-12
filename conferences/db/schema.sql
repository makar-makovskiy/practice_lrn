-- =====================================================================
-- Портал «Конференции.РФ» — схема базы данных (PostgreSQL 14+)
-- Скрипт идемпотентный: его можно запускать повторно.
-- =====================================================================

-- ---------- Справочники ----------

-- Типы помещений: аудитория, коворкинг, кинозал
CREATE TABLE IF NOT EXISTS room_types (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Помещения для проведения конференций
CREATE TABLE IF NOT EXISTS rooms (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    room_type_id INTEGER      NOT NULL REFERENCES room_types (id),
    capacity     INTEGER      NOT NULL CHECK (capacity > 0),
    description  TEXT
);

-- Способы оплаты: при очном посещении / перевод по СБП
CREATE TABLE IF NOT EXISTS payment_methods (
    id   SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

-- Статусы заявок: Новая / Мероприятие назначено / Завершено
CREATE TABLE IF NOT EXISTS statuses (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20) NOT NULL UNIQUE,
    name       VARCHAR(50) NOT NULL,
    sort_order SMALLINT    NOT NULL DEFAULT 0
);

-- ---------- Основные сущности ----------

-- Пользователи (и администратор: role = 'admin')
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    login         VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(16)  NOT NULL,
    email         VARCHAR(150) NOT NULL,
    role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Заявки на бронирование помещения
CREATE TABLE IF NOT EXISTS applications (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    room_id           INTEGER     NOT NULL REFERENCES rooms (id),
    payment_method_id INTEGER     NOT NULL REFERENCES payment_methods (id),
    status_id         INTEGER     NOT NULL REFERENCES statuses (id),
    start_date        DATE        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user   ON applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status_id);
CREATE INDEX IF NOT EXISTS idx_applications_room   ON applications (room_id);

-- Отзывы о проведённом мероприятии (не более одного на заявку)
CREATE TABLE IF NOT EXISTS reviews (
    id             SERIAL PRIMARY KEY,
    application_id INTEGER     NOT NULL UNIQUE REFERENCES applications (id) ON DELETE CASCADE,
    rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Начальные данные ----------

INSERT INTO room_types (name) VALUES
    ('Аудитория'), ('Коворкинг'), ('Кинозал')
ON CONFLICT (name) DO NOTHING;

INSERT INTO payment_methods (code, name) VALUES
    ('cash', 'При очном посещении'),
    ('sbp',  'Перевод по СБП')
ON CONFLICT (code) DO NOTHING;

INSERT INTO statuses (code, name, sort_order) VALUES
    ('new',       'Новая',                 1),
    ('scheduled', 'Мероприятие назначено', 2),
    ('completed', 'Завершено',             3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO rooms (name, room_type_id, capacity, description)
SELECT v.name, rt.id, v.capacity, v.description
FROM (VALUES
    ('Аудитория 101',          'Аудитория', 60,  'Классическая аудитория с проектором и трибуной'),
    ('Большая аудитория 305',  'Аудитория', 150, 'Амфитеатр, микрофоны, запись выступлений'),
    ('Коворкинг «Точка роста»', 'Коворкинг', 40,  'Свободная рассадка, флипчарты, кофе-зона'),
    ('Коворкинг «Open Space»', 'Коворкинг', 80,  'Трансформируемое пространство для секций'),
    ('Кинозал «Премьера»',     'Кинозал',   120, 'Большой экран, звук 7.1, мягкие кресла'),
    ('Малый кинозал',          'Кинозал',   45,  'Камерный зал для презентаций и показов')
) AS v (name, type_name, capacity, description)
JOIN room_types rt ON rt.name = v.type_name
ON CONFLICT (name) DO NOTHING;

-- Учётная запись администратора (логин Conf2027, пароль Demo77)
-- создаётся приложением при запуске (npm run db:init), т.к. пароль хранится в виде хеша.
