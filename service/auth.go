package service

import (
	"fmt"
	"my_api/repository"
	"time"
	"os"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func AuthenticateUser(username, password string) (string, string, int, error) { 
	user, err := repository.GetUserByUsername(username)
	if err != nil {
		return "", "", 0, fmt.Errorf("Ошибка при получении пользователя: %w", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", "", 0, fmt.Errorf("Неверный пароль")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret_key" // На случай, если забудешь прописать в .env
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.RoleName, 
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", "", 0, fmt.Errorf("Ошибка при генерации токена: %w", err)
	}

	return tokenString, user.RoleName, user.ID, nil 
}