package handlers

import (
	"encoding/json"
	"my_api/models"
	"my_api/service"
	"net/http"
)

func RegisterUserHandler(w http.ResponseWriter, r *http.Request) {

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
	err = service.RegisterUser(user.Username, user.Email, user.Password, "customer" )
	if err != nil {
		http.Error(w, "Ошибка при регистрации пользователя", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Пользователь успешно зарегистрирован"))}
	
func RegisterPageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/reg.html")
}