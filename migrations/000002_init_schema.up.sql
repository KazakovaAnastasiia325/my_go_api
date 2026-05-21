CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,          -- Название товара
    description TEXT,                    -- Полное описание 
    price DECIMAL(10, 2) NOT NULL,       -- Цена 
    quantity INT NOT NULL DEFAULT 0,     -- Остаток на складе
    seller_id INT NOT NULL,              -- ID продавца из таблицы users
    category VARCHAR(50),                -- Категория товара
    created_at TIMESTAMP DEFAULT NOW(),  -- Дата добавления

    CONSTRAINT fk_seller 
        FOREIGN KEY(seller_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);