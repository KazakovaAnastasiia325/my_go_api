package repository

import (
	"context"
	"fmt"
	"my_api/models"
	"my_api/database"
)

func CreateUser(user models.User) error {
	query := `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)`
	_, err := database.DB.Exec(context.Background(), query, user.Username, user.Email, user.PasswordHash)
	if err != nil {
		return fmt.Errorf("Ошибка при создании пользователя: %w", err)
	}
	return nil
}
func GetUserByUsername(username string) (models.User, error) {
	var user models.User
	query := `SELECT id, username, email, password_hash FROM users WHERE username = $1`
	err := database.DB.QueryRow(context.Background(), query, username).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash)	
	if err != nil {
		return user, fmt.Errorf("Ошибка при получении пользователя: %w", err)
	}	
	return user, nil
}