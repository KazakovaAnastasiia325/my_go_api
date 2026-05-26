package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"my_api/repository"
)

// HubInstance определяет интерфейс для работы с WebSocket хабом
var HubInstance interface {
	BroadcastChan() chan []byte
}

func CustomerDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "view/customer.html")
}

func CatalogPageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "view/catalog.html")
}

func GetProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	products, err := repository.GetAllProducts()
	if err != nil {
		http.Error(w, "Ошибка при получении продуктов", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func CheckoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}

	var cart []struct {
		ID    int `json:"id"`
		Count int `json:"count"`
	}

	if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
		http.Error(w, "Ошибка данных", http.StatusBadRequest)
		return
	}

	// 1. Обновление склада
	for _, item := range cart {
		err := repository.ReduceProductQuantity(item.ID, item.Count)
		if err != nil {
			http.Error(w, "Ошибка при обновлении склада", http.StatusInternalServerError)
			return
		}
	}

	// 2. Создание записи заказа (предполагаем, что функция возвращает ID заказа)
	orderID := 123 // Здесь должен быть реальный вызов: repository.CreateOrder(...)

	// 3. Асинхронное обновление статусов (горутина)
	go func(id int) {
		statuses := []string{"Собран", "Отправлен", "Доставлен"}

		for _, status := range statuses {
			// Имитация времени на выполнение этапа
			time.Sleep(10 * time.Second) 

			// Обновляем в БД
			_ = repository.UpdateOrderStatus(id, status)

			// Шлем уведомление клиенту
			if HubInstance != nil {
				msg, _ := json.Marshal(map[string]string{
					"type":    "ORDER_STATUS_UPDATE",
					"orderID": strconv.Itoa(id),
					"status":  status,
					"message": fmt.Sprintf("Ваш заказ №%d теперь в статусе: %s", id, status),
				})
				HubInstance.BroadcastChan() <- msg
			}
		}
	}(orderID)

	// 4. Мгновенный ответ клиенту
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Заказ успешно оформлен и передан в обработку"})
}