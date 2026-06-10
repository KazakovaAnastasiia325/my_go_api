package repository

import (
	"context"
	"log"
	"my_api/database"
	"os"
	"strconv" // Добавили для конвертации строки из Env в число
	"my_api/models"
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


func GetUserByID(id int) (*models.User, error) {
    var user models.User
    
   
    query := "SELECT id, username, role_name FROM users WHERE id = $1"
    

    err := database.DB.QueryRow(context.Background(), query, id).Scan(&user.ID, &user.Username, &user.RoleName)
    
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func GetOrdersChartData() ([]map[string]interface{}, error) {
    // Добавляем ::TEXT к дате, чтобы PostgreSQL отдал её как строку
    query := `
        SELECT DATE(created_at)::TEXT as date, COUNT(*) as count 
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC;`

    rows, err := database.DB.Query(context.Background(), query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var data []map[string]interface{}
    for rows.Next() {
        var date string
        var count int
        // Теперь сканирование сработает, так как мы явно привели тип в SQL
        if err := rows.Scan(&date, &count); err != nil {
            return nil, err
        }
        data = append(data, map[string]interface{}{
            "date":  date,
            "count": count,
        })
    }
    
    // Если данных нет, вернем пустой массив вместо nil, чтобы фронтенд не падал
    if data == nil {
        return []map[string]interface{}{}, nil
    }
    
    return data, nil
}