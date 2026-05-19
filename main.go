package main

import (
	"fmt"
	"my_api/database"

	"net/http"
	"os"
	"log"
	"github.com/joho/godotenv"
	"my_api/routes"
)
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: файл .env не найден")
	}
	connStr := os.Getenv("CONN_STR")
	if connStr == "" {
		log.Fatal("Переменная окружения CONN_STR не установлена")
		return
	}
    database.InitDB(connStr)
    defer database.DB.Close()

    mux := routes.SetupRoutes()
	handlerWithCORS := routes.EnableCORS(mux)
    fmt.Println("Сервер запущен на http://localhost:8080")
    if err := http.ListenAndServe(":8080", handlerWithCORS); err != nil {
        log.Fatal(err)
    }

}


