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
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Неверный формат данных", http.StatusBadRequest)
        return
    }

    token, role, userID, err := service.AuthenticateUser(user.Username, user.Password)
    if err != nil {
        http.Error(w, "Ошибка авторизации", http.StatusUnauthorized)
        return
    }

    // Устанавливаем ТОЛЬКО токен. 
    // Роль и ID будут браться из него на бэкенде.
    http.SetCookie(w, &http.Cookie{
        Name:     "token",
        Value:    token,
        HttpOnly: true, // Защищает от JS (XSS)
        Secure:   false, // true только для HTTPS
        Path:     "/",
        SameSite: http.SameSiteStrictMode, // Защита от CSRF
    })

    // Возвращаем данные для удобства фронтенда (редирект и UI)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":  "success",
        "role":    role,
        "user_id": userID,
    })
}

func AuthenticatePageHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "view/auth.html")
}
func CheckRoleHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value("userID").(int)
    role := r.Context().Value("role").(string)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "user_id": userID,
        "role":    role,
    })
}