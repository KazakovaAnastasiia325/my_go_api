package handlers

import (
	"encoding/json"
	"fmt"
	"time"
	"io"
	"os"
	"path/filepath"
	"strconv"
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
	// 1. Ограничиваем максимальный размер файла (например, 5 МБ)
	r.ParseMultipartForm(5 << 20)

	// 2. Достаем текстовые поля из FormData
	name := r.FormValue("name")
	description := r.FormValue("description")
	priceStr := r.FormValue("price")
	sellerIDStr := r.FormValue("seller_id")

	// Переводим строки в нужные типы данных
	price, _ := strconv.ParseFloat(priceStr, 64)
	sellerID, _ := strconv.Atoi(sellerIDStr)

	// 3. Работаем с файлом картинки
	file, header, err := r.FormFile("image")
	var imageURL string

	if err == nil {
		defer file.Close()

		// Чтобы имена картинок не перезаписывали друг друга, добавляем таймштамп
		uniqueName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), header.Filename)
		
		// Путь, куда физически сохранится файл в проекте
		dstPath := filepath.Join("./uploads", uniqueName)
		dst, err := os.Create(dstPath)
		if err != nil {
			http.Error(w, "Ошибка сохранения файла на сервере", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Копируем содержимое загруженного файла в созданный файл на диске
		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Ошибка записи файла", http.StatusInternalServerError)
			return
		}

		// Ссылка на картинку, которую мы сохраним в базу (фронтенд будет стучаться по ней)
		imageURL = "/uploads/" + uniqueName
	} else {
		// Если картинку не загрузили, можно оставить пустую строку или поставить дефолтную заглушку
		imageURL = "/uploads/default-placeholder.png"
	}

	// 4. Сохраняем всё в репозиторий (не забудь добавить аргумент imageURL в твою функцию репозитория)
	err = repository.CreateProduct(name, description, price, sellerID, imageURL)
	if err != nil {
		http.Error(w, "Ошибка при создании продукта в БД", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Продукт с картинкой успешно создан"))

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