package handlers

import (
	"encoding/json"
	"my_api/models"
	"my_api/service"
	"net/http"
)
func AuthenticateUserHandler(w http.ResponseWriter, r *http.Request) {

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
	token, err := service.AuthenticateUser(user.Username, user.Password)
	if err != nil {
		http.Error(w, "Неверные учетные данные", http.StatusUnauthorized)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token, "username": user.Username})
	return
	
}
func AuthenticatePageHandler(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "view/auth.html")
}
