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
