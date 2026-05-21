package repository

import (
	"context"
	"fmt"
	"my_api/models"
	"my_api/database"
)

func CreateUser(user models.User) error {
	query := `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`
	_, err := database.DB.Exec(context.Background(), query, user.Username, user.Email, user.PasswordHash, user.Role)
	if err != nil {
		return fmt.Errorf("Ошибка при создании пользователя: %w", err)
	}
	return nil
}
func GetUserByUsername(username string) (models.User, error) {
	var user models.User
	query := `SELECT id, username, email, password_hash, role FROM users WHERE username = $1`
	err := database.DB.QueryRow(context.Background(), query, username).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.Role)
	if err != nil {
		return user, fmt.Errorf("Ошибка при получении пользователя: %w", err)
	}	
	return user, nil
}
func GetAllUsers() ([]models.User, error) {
    rows, err := database.DB.Query(context.Background(), "SELECT id, username, email, role FROM users")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []models.User
    for rows.Next() {
        var u models.User
        if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role); err != nil {
            return nil, err
        }
        users = append(users, u)
    }
    return users, nil
}
func GetAllProducts() ([]models.Product, error) {
	rows, err := database.DB.Query(context.Background(), "SELECT id, name, description, price, seller_id, quantity FROM products")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.SellerID, &p.Quantity); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func CreateProduct(name, description string, price float64, sellerID int, quantity int) error {
	query := `INSERT INTO products (name, description, price, seller_id, quantity) VALUES ($1, $2, $3, $4, $5)`
	_, err := database.DB.Exec(context.Background(), query, name, description, price, sellerID, quantity)
	if err != nil {
		return fmt.Errorf("Ошибка при создании продукта: %w", err)
	}
	return nil
}

