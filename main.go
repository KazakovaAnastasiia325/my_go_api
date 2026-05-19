package main

import (
	"fmt"
	"my_api/database"
	"my_api/handlers"
	"net/http"
	
)
func main() {
	connStr := "postgres://postgres:0000@localhost:5432/user_db"
	database.InitDB(connStr)
	defer database.DB.Close()
	http.HandleFunc("/register", handlers.RegisterUserHandler)
	http.HandleFunc("/authenticate", handlers.AuthenticateUserHandler)
	http.HandleFunc("/welcome", handlers.WelcomeHandler)
	fmt.Println("Сервер запущен на порту 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Printf("Ошибка при запуске сервера: %v\n", err)
	}

}


