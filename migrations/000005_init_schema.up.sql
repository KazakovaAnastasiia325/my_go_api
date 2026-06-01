-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    total_price INT,
    status VARCHAR(50) DEFAULT 'Оплачен', -- Оплачен, Собран, В пути, Доставлен
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица уведомлений
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO categories (name) VALUES 
('Клавиатуры'),
('Мыши'),
('Коврики для мыши'),
('Наушники'),
('Освещение'),
('Мониторы');