CREATE TABLE roles (

    id SERIAL PRIMARY KEY,

    name VARCHAR(50) UNIQUE NOT NULL

);
INSERT INTO roles (name) VALUES ('admin'), ('customer');

ALTER TABLE users DROP COLUMN role; 
UPDATE users SET role_id = 1 WHERE username = 'admin';
UPDATE users SET role_id = 1 WHERE username = 'admin1';
UPDATE users SET role_id = 2 WHERE username = 'user1';
UPDATE users SET role_id = 2 WHERE username = 'user2';
UPDATE users SET role_id = 4 WHERE username = 'seller1';
UPDATE users SET role_id = 4 WHERE username = 'seller2';
UPDATE users SET role_id = 4 WHERE username = 'seller3';