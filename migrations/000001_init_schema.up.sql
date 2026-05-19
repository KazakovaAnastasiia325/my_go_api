CREATE TABLE users (
    id SERIAL PRIMARY KEY,              -- Автоматический ID
    username VARCHAR(50) NOT NULL,      -- Имя пользователя
    email VARCHAR(100) UNIQUE NOT NULL, -- Уникальная почта
    password_hash TEXT NOT NULL,        -- Хэш пароля
    created_at TIMESTAMP DEFAULT NOW()  -- Дата регистрации
);