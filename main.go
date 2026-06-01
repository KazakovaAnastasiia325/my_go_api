package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"my_api/database"
	"my_api/handlers"
	"my_api/middleware"
	"my_api/repository"
	"my_api/storage" // импортируем ваш пакет storage
	"context"
)

// Предполагается, что NewHub определен в этом же пакете или импортирован
var hub = NewHub()

func main() {
	handlers.HubInstance = hub
	
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: файл .env не найден")
	}
	
	connStr := os.Getenv("CONN_STR")
	if connStr == "" {
		log.Fatal("Переменная CONN_STR не установлена")
	}
	
	database.InitDB(connStr)
	defer database.DB.Close()

	// Инициализация S3 клиента с проверкой ошибок
s3Client, err := minio.New("localhost:9000", &minio.Options{
    Creds:  credentials.NewStaticV4("ВАШ_ACCESS_KEY", "ВАШ_SECRET_KEY", ""), // ЗАМЕНИТЕ НА ВАШИ КЛЮЧИ
    Secure: false,
})
if err != nil {
    log.Println("⚠️ Предупреждение: S3 недоступен:", err)
} else {
    storage.S3Client = s3Client
    // Проверка бакета
    ctx := context.Background()
    exists, _ := storage.S3Client.BucketExists(ctx, "uploads")
    if !exists {
        _ = storage.S3Client.MakeBucket(ctx, "uploads", minio.MakeBucketOptions{})
    }
    log.Println("✅ S3 клиент инициализирован и бакет готов")
}
	go hub.Run()
	http.HandleFunc("/ws", hub.HandleConnections)
	
	repository.SeedAdmin()
	
	mux := middleware.SetupRoutes()
	handlerWithCORS := middleware.EnableCORS(mux)

	fmt.Println("Сервер запущен на http://localhost:8080")
	if err := http.ListenAndServe(":8080", handlerWithCORS); err != nil {
		log.Fatal(err)
	}
}