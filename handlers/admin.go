package handlers

import (
	"encoding/json"
	"my_api/models"
	"my_api/service"
	"my_api/repository"
	"net/http"
	"log"
)
func CreateSellerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}
	err = service.RegisterUser(user.Username, user.Email, user.Password, user.Role)
    if err != nil {
        http.Error(w, "Ошибка базы данных", http.StatusInternalServerError)
        return
    }
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Пользователь успешно создан"))
}
func CreateSellerPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/create_seller.html")
}
func AdminDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "view/admin.html")
}
func AdminPageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "view/admin.html")
}
func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
    users, err := repository.GetAllUsers()
    if err != nil {
        log.Println("Ошибка репозитория:", err)
        http.Error(w, "Ошибка сервера", 500)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")

    if users == nil {
        users = []models.User{} 
    }
    json.NewEncoder(w).Encode(users)
}
