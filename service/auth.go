package service

import (
	"fmt"
	"log"
	"my_api/repository"
	"os"
	"strings" 
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func AuthenticateUser(username, password string) (string, string, int, error) {
	//Получаем пользователя из базы
	user, err := repository.GetUserByUsername(username)
	if err != nil {
		return "", "", 0, fmt.Errorf("Ошибка при получении пользователя: %w", err)
	}

	//Сравниваем пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", "", 0, fmt.Errorf("Неверный пароль")
	}

	//Приводим роль к нижнему регистру, чтобы избежать ошибок "Seller" != "seller"
	role := strings.ToLower(user.RoleName)

	// ЛОГИРОВАНИЕ: Выведет в консоль сервера, под кем мы зашли и какая роль
	log.Printf("DEBUG: Успешный вход пользователя: %s, ID: %d, Роль: %s", user.Username, user.ID, role)

	// 4. Генерация JWT
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET не установлен в переменных окружения!")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     role, // Теперь всегда в нижнем регистре
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", "", 0, fmt.Errorf("Ошибка при генерации токена: %w", err)
	}

	return tokenString, role, user.ID, nil
}