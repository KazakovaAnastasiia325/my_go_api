package service

import (
	"fmt"
	"my_api/repository"
	"time"
	"os"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func AuthenticateUser(username, password string) (string, string, error) {
    user, err := repository.GetUserByUsername(username)
    if err != nil {
        return "", "", fmt.Errorf("Ошибка при получении пользователя: %w", err)
    }

    err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
    if err != nil {
        return "", "", fmt.Errorf("Неверный пароль")
    }

    secret := os.Getenv("JWT_SECRET")
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "username": user.Username,
        "role":     user.Role, 
        "exp":      time.Now().Add(time.Hour * 72).Unix(),
    })

    tokenString, err := token.SignedString([]byte(secret))
    if err != nil {
        return "", "", err
    }
    return tokenString, user.Role, nil 
}