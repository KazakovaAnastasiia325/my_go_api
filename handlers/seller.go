package handlers

import (
	"encoding/json"
	"fmt"
	"my_api/models"
	"my_api/repository"
	"net/http"
	"strconv"
)

func SellerDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	fmt.Println("Запрос на страницу продавца получен")
	http.ServeFile(w, r, "view/seller.html")
}

// ProductsHandler теперь обрабатывает и создание (POST), и получение (GET) продуктов
func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodPost:
		// --- ЛОГИКА СОЗДАНИЯ ТОВАРА ---
		var product models.Product
		err := json.NewDecoder(r.Body).Decode(&product)
		if err != nil {
			http.Error(w, "Неверный формат данных", http.StatusBadRequest)
			return
		}
		err = repository.CreateProduct(product.Name, product.Description, product.Price, product.SellerID, product.Quantity, product.ImageURL)
		if err != nil {
			http.Error(w, "Ошибка при создании продукта", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Продукт успешно создан"))

	case http.MethodGet:
		// --- ЛОГИКА ПОЛУЧЕНИЯ ТОВАРОВ ---
		// Вызываем метод репозитория для получения списка товаров.
		// (Если у вас функция называется иначе, например, GetAllProducts, замените её здесь)
		products, err := repository.GetAllProducts() 
		if err != nil {
			http.Error(w, "Ошибка при получении продуктов", http.StatusInternalServerError)
			return
		}

		// Отправляем JSON-ответ на фронтенд
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(products); err != nil {
			http.Error(w, "Ошибка кодирования JSON", http.StatusInternalServerError)
			return
		}

	default:
		// Если придет любой другой HTTP-метод (PUT, DELETE и т.д.)
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
	}
}

func ProductByIDHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var product models.Product
		if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
			http.Error(w, "Неверный формат данных", http.StatusBadRequest)
			return
		}

		product.ID = id

		err := repository.UpdateProduct(product.ID, product.Name, product.Description, product.Price, product.SellerID, product.Quantity, product.ImageURL)
		if err != nil {
			http.Error(w, "Ошибка при обновлении продукта", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Продукт успешно обновлён"))

	case http.MethodDelete:
		err := repository.DeleteProduct(id)
		if err != nil {
			http.Error(w, "Ошибка при удалении продукта", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
	}
}
