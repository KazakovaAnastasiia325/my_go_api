package handlers

import (
	
	"my_api/repository"
	"net/http"
	"encoding/json"
)

func GetMeHandler(w http.ResponseWriter, r *http.Request) {
    // AuthMiddleware уже должен был достать ID из токена и положить в контекст
    userID := r.Context().Value("userID").(int)
    
    // Получаем данные из базы по ID
    user, err := repository.GetUserByID(userID)
    if err != nil {
        http.Error(w, "Пользователь не найден", http.StatusUnauthorized)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "user_id": user.ID,
        "role":    user.RoleName,
    })
}