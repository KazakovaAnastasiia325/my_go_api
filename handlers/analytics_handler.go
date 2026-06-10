package handlers

import (
	"encoding/json"
	"net/http"
	"my_api/repository"
    "log"
)

func GetOrdersChartData(w http.ResponseWriter, r *http.Request) {
    data, err := repository.GetOrdersChartData()
    w.Header().Set("Content-Type", "application/json") // Устанавливаем заголовок JSON
    
    if err != nil {
        // Логируем ошибку на сервере, чтобы вы могли её прочитать в консоли Go
        log.Printf("Ошибка получения данных для графика: %v", err)
        
        // Отправляем JSON с ошибкой, а не текст
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Не удалось загрузить данные"})
        return
    }
    
    json.NewEncoder(w).Encode(data)
}
