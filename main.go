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

	// Инициализация S3 клиента
	s3Client, err := minio.New("localhost:9000", &minio.Options{
		Creds:  credentials.NewStaticV4("", "", ""),
		Secure: false,
	})
	if err != nil {
		log.Fatal("Ошибка подключения к S3:", err)
	}

	// ПРАВИЛЬНО: обращаемся к переменной через пакет storage
	storage.S3Client = s3Client
	ctx := context.Background()
bucketName := "uploads"
exists, _ := storage.S3Client.BucketExists(ctx, bucketName)
if !exists {
    err = storage.S3Client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
    if err != nil {
        log.Fatal("Не удалось создать бакет:", err)
    }
    log.Println("Бакет 'uploads' успешно создан")
}
	log.Println("S3 клиент инициализирован")

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