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

func CreateProduct(name, description string, price float64, sellerID int, quantity int, categoryID int, imageURL string) error {
    query := `INSERT INTO products (name, description, price, seller_id, quantity, category_id, image_url) 
              VALUES ($1, $2, $3, $4, $5, $6, $7)`
    _, err := database.DB.Exec(context.Background(), query, name, description, price, sellerID, quantity, categoryID, imageURL)
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

func UpdateProduct(id int, name, description string, price float64, quantity int, categoryID int, imageURL string) error {
    query := `
        UPDATE products 
        SET name = $1, description = $2, price = $3, quantity = $4, category_id = $5, image_url = $6 
        WHERE id = $7`
    _, err := database.DB.Exec(context.Background(), query, name, description, price, quantity, categoryID, imageURL, id)
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
func GetAllCategories() ([]models.Category, error) {
    query := "SELECT id, name FROM categories ORDER BY name ASC"
    rows, err := database.DB.Query(context.Background(), query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var categories []models.Category
    for rows.Next() {
        var c models.Category
        if err := rows.Scan(&c.ID, &c.Name); err != nil {
            return nil, err
        }
        categories = append(categories, c)
    }
    return categories, nil
}
// Добавьте это в repository/repository.go
func GetStats() (map[string]int, error) {
    stats := map[string]int{"admin": 0, "seller": 0, "customer": 0}
    
    // Считаем всех сразу одним запросом
    query := `
        SELECT r.name, COUNT(u.id) 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        GROUP BY r.name`
        
    rows, err := database.DB.Query(context.Background(), query)
    if err != nil { return stats, err }
    defer rows.Close()

    for rows.Next() {
        var name string
        var count int
        if err := rows.Scan(&name, &count); err == nil {
            stats[name] = count
        }
    }
    return stats, nil
}
func GetUserCountByRole(roleName string) (int, error) {
    var count int
    query := `
        SELECT COUNT(u.id) 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = $1`
    err := database.DB.QueryRow(context.Background(), query, roleName).Scan(&count)
    return count, err
}
func GetCatalogProducts() ([]map[string]interface{}, error) {
	query := `
	SELECT
		MIN(id) as id,
		name,
		description,
		MIN(price) as price,
		SUM(quantity) as quantity,
		MAX(image_url) as image_url,
		COUNT(*) as sellers_count
	FROM products
	GROUP BY name, description
	ORDER BY name
	`

	rows, err := database.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []map[string]interface{}

	for rows.Next() {
		var (
			id           int
			name         string
			description  string
			price        float64
			quantity     int
			imageURL     string
			sellersCount int
		)

		err := rows.Scan(
			&id,
			&name,
			&description,
			&price,
			&quantity,
			&imageURL,
			&sellersCount,
		)

		if err != nil {
			return nil, err
		}

		products = append(products, map[string]interface{}{
			"id":            id,
			"name":          name,
			"description":   description,
			"price":         price,
			"quantity":      quantity,
			"image_url":     imageURL,
			"sellers_count": sellersCount,
		})
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

func UpdateOrderStatus(orderID int, status string) error {
	query := "UPDATE orders SET status = $1 WHERE id = $2"
    _, err := database.DB.Exec(context.Background(), query, status, orderID)
    if err != nil {
        return err
    }
    return nil
}
func CreateOrder(userID int, totalPrice float64) (int, error) {
    var orderID int
    // Создаем заказ и сразу получаем его ID
    query := `INSERT INTO orders (user_id, status, total_price) VALUES ($1, 'Оплачен', $2) RETURNING id`
    err := database.DB.QueryRow(context.Background(), query, userID, totalPrice).Scan(&orderID)
    if err != nil {
        return 0, fmt.Errorf("ошибка при создании записи заказа: %v", err)
    }
    return orderID, nil
}

func GetProductByID(id int) (models.Product, error) {
	var p models.Product
	query := "SELECT id, name, description, price, seller_id, quantity, image_url FROM products WHERE id = $1"
	err := database.DB.QueryRow(context.Background(), query, id).Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.SellerID, &p.Quantity, &p.ImageURL)
	if err != nil {
		return p, fmt.Errorf("товар не найден: %w", err)
	}
	return p, nil
}
func CreateNotification(userID int, message string) error {
    query := `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`
    _, err := database.DB.Exec(context.Background(), query, userID, message)
    return err
}
func GetUserNotifications(userID int) ([]models.Notification, error) {
    query := `SELECT id, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`
    
    rows, err := database.DB.Query(context.Background(), query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var notifs []models.Notification
    for rows.Next() {
        var n models.Notification
        
        if err := rows.Scan(&n.ID, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
            return nil, err
        }
        notifs = append(notifs, n)
    }
    return notifs, nil
}
func MarkNotificationsAsRead(userID int) error {
    query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`
    _, err := database.DB.Exec(context.Background(), query, userID)
    return err
}
// GetUsersPaginated меняем логику с offset на id
func GetUsersPaginated(lastID int, limit int) ([]models.User, error) {
    // Если lastID == 0, значит мы берем первую страницу
    query := `
        SELECT u.id, u.username, u.email, r.name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id > $1 
        ORDER BY u.id ASC 
        LIMIT $2`
    
    rows, err := database.DB.Query(context.Background(), query, lastID, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []models.User
    for rows.Next() {
        var u models.User
        if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.RoleName); err != nil {
            return nil, err
        }
        users = append(users, u)
    }
    return users, nil
}

// для получения общего количества 
func GetTotalUsers() (int, error) {
    var count int
    err := database.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
    return count, err
}

