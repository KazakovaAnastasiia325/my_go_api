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

// создание пользователя
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

// получение списка всех пользователей
func GetUsersHandler(w http.ResponseWriter, r *http.Request) {

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 10
	}

	search := r.URL.Query().Get("search")
	role := r.URL.Query().Get("role")

	log.Println("PAGE =", page)
	log.Println("SEARCH =", search)
	log.Println("ROLE =", role)
	
	users, total, err := repository.GetUsersPaginated(
		page,
		limit,
		search,
		role,
	)

	if err != nil {
		http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
		return
	}

	stats := 0
	response := map[string]interface{}{
		"users": users,
		"total": total,
		"stats": stats,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
func GetStatsHandler(w http.ResponseWriter, r *http.Request) {
	adminCount, _ := repository.GetUserCountByRole("admin")
	sellerCount, _ := repository.GetUserCountByRole("seller")
	customerCount, _ := repository.GetUserCountByRole("customer")

	stats := map[string]int{
		"admin":    adminCount,
		"seller":   sellerCount,
		"customer": customerCount,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// удаление пользователя по ID
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

func CreateSellerPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/create_seller.html")
}

func AdminDashboardHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/admin.html")
}

func AdminPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/admin.html")
}
