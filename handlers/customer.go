package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
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
	products, err := repository.GetAllProducts()
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
        ID    int `json:"id"`
        Count int `json:"count"`
    }

    if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
        http.Error(w, "Ошибка формата данных", http.StatusBadRequest)
        return
    }

    // БЕЗОПАСНОЕ приведение типа
   userIDVal := r.Context().Value("userID")
if userIDVal == nil {
    http.Error(w, "Не авторизован", http.StatusUnauthorized)
    return
}

// Приводим ID к типу int, учитывая особенности JSON-декодинга
var userID int
switch v := userIDVal.(type) {
case int:
    userID = v
case float64:
    userID = int(v) // JSON часто парсит числа как float64
case string:
    // Если ID пришел как строка, пробуем сконвертировать
    parsedID, err := strconv.Atoi(v)
    if err != nil {
        http.Error(w, "Неверный формат ID пользователя", http.StatusBadRequest)
        return
    }
    userID = parsedID
default:
    http.Error(w, "Неподдерживаемый тип ID пользователя", http.StatusInternalServerError)
    return
}

    // ПРОВЕРКА и СЧЕТ (без немедленного списания)
    var totalPrice float64
    for _, item := range cart {
        product, err := repository.GetProductByID(item.ID)
        if err != nil {
            http.Error(w, "Товар не найден", http.StatusNotFound)
            return
        }
        if product.Quantity < item.Count {
            http.Error(w, "Недостаточно товара на складе", http.StatusConflict)
            return
        }
        totalPrice += product.Price * float64(item.Count)
    }

    // ОПЕРАЦИИ В БД
    // 1. Создаем заказ
    orderID, err := repository.CreateOrder(userID, totalPrice)
    if err != nil {
        http.Error(w, "Ошибка создания заказа", http.StatusInternalServerError)
        return
    }

    // 2. Списываем остатки (только если заказ успешно создан)
    for _, item := range cart {
        err := repository.ReduceProductQuantity(item.ID, item.Count)
        if err != nil {
            log.Printf("Критическая ошибка: товар списан неверно! ID: %d", item.ID)
        }
    }
	// 6. Фоновое обновление статуса (Асинхронно)
	go func(id int) {
		statuses := []string{"Собран", "Отправлен", "Доставлен"}
		for _, status := range statuses {
			time.Sleep(10 * time.Second) // Уменьшил для теста

			err := repository.UpdateOrderStatus(id, status)
			if err != nil {
				log.Printf("Ошибка обновления статуса %d: %v", id, err)
				continue
			}

			if HubInstance != nil {
				msg, _ := json.Marshal(map[string]string{
					"type":    "ORDER_SUCCESS",
					"message": fmt.Sprintf("Заказ №%d: %s", id, status),
				})
				HubInstance.BroadcastChan() <- msg
			}
		}
	}(orderID)

	// 7. Успешный ответ
	w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "Заказ успешно оформлен",
        "orderID": orderID,
    })
}