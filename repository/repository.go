package repository

import (
	"context"
	"fmt"
	"my_api/database"
	"my_api/models"
)

// --- ПОЛЬЗОВАТЕЛИ ---

func CreateUser(user models.User) error {

	query := `INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)`
	_, err := database.DB.Exec(context.Background(), query, user.Username, user.Email, user.Password, user.RoleID)
	if err != nil {
		return fmt.Errorf("ошибка при создании пользователя: %w", err)
	}
	return nil
}

func GetUserByUsername(username string) (models.User, error) {
	var user models.User
	// Добавляем JOIN roles r ON u.role_id = r.id, чтобы вытащить имя роли
	query := `
		SELECT u.id, u.username, u.email, u.password_hash, u.role_id, r.name 
		FROM users u
		JOIN roles r ON u.role_id = r.id
		WHERE u.username = $1`
	
	err := database.DB.QueryRow(context.Background(), query, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.RoleID, &user.RoleName,
	)
	if err != nil {
		return user, fmt.Errorf("ошибка при получении пользователя: %w", err)
	}
	return user, nil
}

func GetAllUsers() ([]models.User, error) {

	query := `
		SELECT u.id, u.username, u.email, u.role_id, r.name 
		FROM users u
		JOIN roles r ON u.role_id = r.id`
	
	rows, err := database.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		// Сканируем и ID роли, и её имя
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.RoleID, &u.RoleName); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// --- ПРОДУКТЫ ---

func CreateProduct(name, description string, price float64, sellerID int, quantity int, imageURL string) error {
	query := `INSERT INTO products (name, description, price, seller_id, quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := database.DB.Exec(context.Background(), query, name, description, price, sellerID, quantity, imageURL)
	if err != nil {
		return fmt.Errorf("ошибка при создании продукта: %w", err)
	}
	return nil
}

func GetProductsBySeller(sellerID int) ([]models.Product, error) {
	query := "SELECT id, name, description, price, seller_id, quantity, image_url FROM products WHERE seller_id = $1 ORDER BY id DESC"
	rows, err := database.DB.Query(context.Background(), query, sellerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product = []models.Product{} // Сразу инициализируем пустым слайсом
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.SellerID, &p.Quantity, &p.ImageURL); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func UpdateProduct(id int, name, description string, price float64, quantity int, imageURL string) error {
	query := `
        UPDATE products 
        SET name = $1, description = $2, price = $3, quantity = $4, image_url = $5 
        WHERE id = $6`
	_, err := database.DB.Exec(context.Background(), query, name, description, price, quantity, imageURL, id)
	return err
}

func DeleteProduct(id int) error {
	query := `DELETE FROM products WHERE id = $1`
	_, err := database.DB.Exec(context.Background(), query, id)
	return err
}

func GetAllProducts() ([]models.Product, error) {
	rows, err := database.DB.Query(context.Background(), "SELECT id, name, description, price, seller_id, quantity, image_url FROM products ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var products []models.Product = []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.SellerID, &p.Quantity, &p.ImageURL); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func ReduceProductQuantity(id int, count int) error {
	// Проверка на количество (quantity >= $3) гарантирует, что мы не уйдем в минус
	query := `UPDATE products SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $3`

	result, err := database.DB.Exec(context.Background(), query, count, id, count)
	if err != nil {
		return fmt.Errorf("не удалось обновить остатки: %w", err)
	}

	// Проверяем, обновилась ли хоть одна строка (если товара было меньше, чем заказывают, rows будет 0)
	if result.RowsAffected() == 0 {
		return fmt.Errorf("недостаточно товара на складе или товар не найден")
	}

	return nil
}
// Удаление пользователя по ID
func DeleteUser(id int) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := database.DB.Exec(context.Background(), query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении пользователя: %w", err)
	}
	return nil
}

