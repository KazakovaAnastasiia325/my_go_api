ALTER TABLE products ADD COLUMN image_url VARCHAR(255);
UPDATE products 
SET seller_id = 41 
WHERE seller_id = 1;