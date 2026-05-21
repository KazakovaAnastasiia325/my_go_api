package handlers
import (
	"encoding/json"
	"my_api/models"
	"fmt"
	"my_api/repository"
	"net/http"
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
	fmt.Println("Запрос на страницу продавца получен") // Увидишь в терминале
    http.ServeFile(w, r, "view/seller.html")
}
func CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		return
	}
	var product models.Product
	err := json.NewDecoder(r.Body).Decode(&product)
	if err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}
	err = repository.CreateProduct(product.Name, product.Description, product.Price, product.SellerID, product.Quantity)
	if err != nil {
		http.Error(w, "Ошибка при создании продукта", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Продукт успешно создан"))
}