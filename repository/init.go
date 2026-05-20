package repository

import (
	"context"
	"log"
	"my_api/database"
	"os"
	"golang.org/x/crypto/bcrypt"
)
func SeedAdmin() {
	username := os.Getenv("ADMIN_USERNAME")
	email := os.Getenv("ADMIN_EMAIL")
	role := os.Getenv("ADMIN_ROLE")
	password := os.Getenv("ADMIN_PASSWORD")
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Ошибка при генерации хэша пароля для администратора")
	}
	_, err = database.DB.Exec(context.Background(), `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
    `, username, email, string(passwordHash), role)

    if err != nil {
        log.Printf("❌ Критическая ошибка при инициализации админа: %v", err)
    } else {
        log.Printf("✅ Проверка админа '%s' завершена (создан или уже был)", username)
    }
}