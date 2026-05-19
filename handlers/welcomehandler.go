package handlers

import (
	"net/http"

)

func WelcomeHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Добро пожаловать! Вы успешно вошли в систему."))
}
func WelcomePageHandler(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "view/welcome.html")
}