package main

import (
	"fmt"
	"my_api/database"
	"my_api/repository"
	"net/http"
	"os"
	"log"
	"github.com/joho/godotenv"
	"my_api/middleware"
	"my_api/handlers"
)
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
		return
	}
    database.InitDB(connStr)
    defer database.DB.Close()
	
	go hub.Run() // Запускаем цикл хаба
	repository.SeedAdmin()
    mux := middleware.SetupRoutes()
	handlerWithCORS := middleware.EnableCORS(mux)
	http.HandleFunc("/ws", hub.HandleConnections)
    fmt.Println("Сервер запущен на http://localhost:8080")
    if err := http.ListenAndServe(":8080", handlerWithCORS); err != nil {
        log.Fatal(err)
    }
}