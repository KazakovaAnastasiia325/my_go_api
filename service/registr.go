package service

import (
	"fmt"
	"my_api/models"
	"my_api/repository"
	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(username, email, password string, roleID int) error {
	// Хешируем пароль
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("ошибка при хешировании пароля: %w", err)
	}

	//Создаем объект пользователя
	user := models.User{
		Username: username,
		Email:    email,
		Password: string(passwordHash), 
		RoleID:   roleID, 
	}

	//Проверка на адекватность (просто чтобы ID не был нулевым)
	if roleID < 1 {
		return fmt.Errorf("недопустимый ID роли: %d", roleID)
	}

	// Отправляем в базу данных

	err = repository.CreateUser(user)
	if err != nil {
		return fmt.Errorf("ошибка при сохранении пользователя: %w", err)
	}

	return nil
}