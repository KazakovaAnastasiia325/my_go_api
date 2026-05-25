package repository

import (
	"context"
	"log"
	"my_api/database"
	"os"
	"strconv" // Добавили для конвертации строки из Env в число

	"golang.org/x/crypto/bcrypt"
)

func SeedAdmin() {
	username := os.Getenv("ADMIN_USERNAME")
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")
	
	// Читаем ID роли из переменных окружения (например, "1")
	roleIDStr := os.Getenv("ADMIN_ROLE_ID") 
	roleID, err := strconv.Atoi(roleIDStr)
	if err != nil {
		log.Printf("⚠️ ADMIN_ROLE_ID не задан или некорректен, используем ID 1 (по умолчанию admin)")
		roleID = 1 // По умолчанию ставим 1, если в .env пусто
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Ошибка при генерации хэша пароля для администратора")
	}

	// ИСПРАВЛЕНО: столбец role заменен на role_id
	query := `
		INSERT INTO users (username, email, password_hash, role_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (username) DO NOTHING
	`

	_, err = database.DB.Exec(context.Background(), query, 
		username, 
		email, 
		string(passwordHash), 
		roleID, // Передаем число
	)

	if err != nil {
		log.Printf("❌ Критическая ошибка при инициализации админа: %v", err)
	} else {
		log.Printf("✅ Проверка админа '%s' завершена (создан или уже был)", username)
	}
}