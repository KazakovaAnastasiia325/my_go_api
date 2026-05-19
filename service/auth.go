package service

import (
	"fmt"
	"my_api/repository"
	"time"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)
var jwt_secret = []byte("мой_секретный_ключ")
func AuthenticateUser(username, password string) (string, error) {
	user, err := repository.GetUserByUsername(username)
	if err != nil {
		return "", fmt.Errorf("Ошибка при получении пользователя: %w", err)
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", fmt.Errorf("Неверный пароль: %w", err)
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})
	tokenString, err := token.SignedString(jwt_secret)
	if err != nil {
		return "", fmt.Errorf("Ошибка при генерации токена: %w", err)
	}
	return tokenString, nil
}