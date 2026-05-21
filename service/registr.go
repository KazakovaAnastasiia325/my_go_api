package service
import (
	"fmt"
	"my_api/models"
	"my_api/repository"
	"golang.org/x/crypto/bcrypt"
)
func RegisterUser(username, email, password, role string) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("Ошибка при хешировании пароля: %w", err)
	}
	user := models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(passwordHash),
		Role:         role,
	}
	if role != "seller" && role != "admin" && role != "customer" {
    return fmt.Errorf("Недопустимая роль")
}
	return repository.CreateUser(user)
}