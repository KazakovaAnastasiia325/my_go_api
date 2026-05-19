package handlers

import (
	"encoding/json"
	"my_api/models"
	"my_api/service"
	"net/http"
)

func RegisterUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")             // Разрешить запросы от всех
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS") 
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	 if r.Method == http.MethodOptions{ 
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
	err = service.RegisterUser(user.Username, user.Email, user.Password)
	if err != nil {
		http.Error(w, "Ошибка при регистрации пользователя", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Пользователь успешно зарегистрирован"))}
	