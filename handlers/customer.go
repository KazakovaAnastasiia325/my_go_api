package handlers

import (
	"encoding/json"
	
	"my_api/repository"
	
	"net/http"
)
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
    var cart []struct {
        ID    int `json:"id"`
        Count int `json:"count"`
    }

    if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
        http.Error(w, "Ошибка данных", http.StatusBadRequest)
        return
    }

    // Для каждого товара из корзины вызываем функцию обновления
    for _, item := range cart {
        err := repository.ReduceProductQuantity(item.ID, item.Count)
        if err != nil {
            http.Error(w, "Ошибка при обновлении склада", http.StatusInternalServerError)
            return
        }
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Заказ оформлен"})
}