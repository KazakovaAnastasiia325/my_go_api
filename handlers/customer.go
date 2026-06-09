package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"time"

	"my_api/repository"
)

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
	products, err := repository.GetCatalogProducts()
	if err != nil {
		http.Error(w, "Ошибка при получении продуктов", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func CheckoutHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Проверка метода
    if r.Method != http.MethodPost {
        http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
        return
    }

    var cart []struct {
        ID       int    `json:"id"`
        SellerID string `json:"sellerId"` // Добавьте это поле
        Count    int    `json:"count"`
    }

    if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
        http.Error(w, "Ошибка формата данных", http.StatusBadRequest)
        return
    }

    // 2. получение userID из контекста
    userIDVal := r.Context().Value("userID")
    if userIDVal == nil {
        http.Error(w, "Не авторизован", http.StatusUnauthorized)
        return
    }

    var userID int
    switch v := userIDVal.(type) {
    case int:
        userID = v
    case float64:
        userID = int(v)
    default:
        http.Error(w, "Неверный формат ID пользователя", http.StatusInternalServerError)
        return
    }

    // 3. ПРОВЕРКА и СЧЕТ
    var totalPrice float64
    for _, item := range cart {
        product, err := repository.GetProductByID(item.ID)
        if err != nil {
            http.Error(w, "Товар не найден", http.StatusNotFound)
            return
        }
        if product.Quantity < item.Count {
            http.Error(w, "Недостаточно товара: "+product.Name, http.StatusConflict)
            return
        }
        totalPrice += product.Price * float64(item.Count)
    }

    // 4. ОПЕРАЦИИ В БД: Создаем заказ
    orderID, err := repository.CreateOrder(userID, totalPrice)
    if err != nil {
        http.Error(w, "Ошибка создания заказа", http.StatusInternalServerError)
        return
    }

    // 5. Списываем остатки
    for _, item := range cart {
    // ВАЖНО: Передавайте sellerId в ваш метод репозитория
    if err := repository.ReduceProductQuantity(item.ID, item.SellerID, item.Count); err != nil {
        log.Printf("Ошибка списания товара ID %d (seller %s): %v", item.ID, item.SellerID, err)
    }
}

    // 6. ПЕРВОЕ уведомление об оформлении
    repository.CreateNotification(userID, fmt.Sprintf("Заказ №%d успешно оформлен! Ожидайте подтверждения.", orderID))

    // 7. Фоновое обновление статуса (Асинхронно)
    go func(id int, uid int) {
        statuses := []string{"Собран", "Отправлен", "Доставлен"}
        for _, status := range statuses {
            time.Sleep(10 * time.Second) // Для теста

            // Обновляем статус в БД
            if err := repository.UpdateOrderStatus(id, status); err != nil {
                log.Printf("Ошибка обновления статуса %d: %v", id, err)
                continue
            }

            // СОХРАНЯЕМ УВЕДОМЛЕНИЕ В БД для истории
            msg := fmt.Sprintf("Заказ №%d изменил статус: %s", id, status)
            repository.CreateNotification(uid, msg)

            // Отправляем в WebSocket
            if HubInstance != nil {
                msgJSON, _ := json.Marshal(map[string]string{
                    "type":    "ORDER_STATUS_UPDATE",
                    "message": msg,
                })
                HubInstance.BroadcastChan() <- msgJSON
            }
        }
    }(orderID, userID)

    // 8. Ответ пользователю
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "Заказ успешно оформлен",
        "orderID": orderID,
    })
}
func GetNotificationsHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value("userID").(int)
    notifs, err := repository.GetUserNotifications(userID)
    if err != nil {
        http.Error(w, "Ошибка", 500)
        return
    }
    json.NewEncoder(w).Encode(notifs)
}
func MarkAllReadHandler(w http.ResponseWriter, r *http.Request) {
    userIDVal := r.Context().Value("userID")
    if userIDVal == nil {
        http.Error(w, "Не авторизован", http.StatusUnauthorized)
        return
    }
    
    userID := userIDVal.(int)
    
    err := repository.MarkNotificationsAsRead(userID)
    if err != nil {
        log.Printf("Ошибка при обновлении статуса уведомлений: %v", err)
        http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusOK)
}