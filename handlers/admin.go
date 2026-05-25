package handlers

import (
	"encoding/json"
	"log"
	"my_api/models"
	"my_api/repository"
	"my_api/service"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// CreateSellerHandler — создание пользователя
func CreateSellerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	finalRoleID := user.RoleID
	if finalRoleID == 0 {
		finalRoleID = 4 // По умолчанию продавец
	}

	if err := service.RegisterUser(user.Username, user.Email, user.Password, finalRoleID); err != nil {
		log.Printf("Ошибка при создании пользователя: %v", err)
		http.Error(w, "Ошибка при создании пользователя", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Пользователь успешно создан"))
}

// GetUsersHandler — получение списка всех пользователей
func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	users, err := repository.GetAllUsers()
	if err != nil {
		log.Println("Ошибка получения списка пользователей:", err)
		http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if users == nil {
		users = []models.User{}
	}
	json.NewEncoder(w).Encode(users)
}

// DeleteUserHandler — удаление пользователя по ID
func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	if err := repository.DeleteUser(id); err != nil {
		log.Printf("Ошибка при удалении пользователя %d: %v", id, err)
		http.Error(w, "Ошибка при удалении", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}



// --- Хендлеры отдачи страниц ---

func CreateSellerPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/create_seller.html")
}

func AdminDashboardHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/admin.html")
}

func AdminPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/admin.html")
}