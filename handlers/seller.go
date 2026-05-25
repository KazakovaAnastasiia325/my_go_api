package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"my_api/models"
	"my_api/repository"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
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
	http.ServeFile(w, r, "view/seller.html")
}

func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodPost:
		// 1. Читаем форму (для файлов)
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "Ошибка парсинга данных", http.StatusBadRequest)
			return
		}

		// 2. Вытягиваем данные
		name := r.FormValue("name")
		description := r.FormValue("description")
		price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
		quantity, _ := strconv.Atoi(r.FormValue("quantity"))
		sellerID, _ := strconv.Atoi(r.FormValue("seller_id"))

		// 3. Обработка картинки
		var imagePath string
		file, handler, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			// Создаем папку uploads в корне проекта, если её нет
			uploadDir := "./uploads"
			os.MkdirAll(uploadDir, os.ModePerm)

			fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(handler.Filename))
			fullPath := filepath.Join(uploadDir, fileName)

			dst, err := os.Create(fullPath)
			if err != nil {
				fmt.Println("Ошибка создания файла:", err)
				http.Error(w, "Ошибка сервера при сохранении фото", http.StatusInternalServerError)
				return
			}
			defer dst.Close()
			io.Copy(dst, file)
			imagePath = "/uploads/" + fileName // Этот путь пойдет в БД
		}

		// 4. Сохранение
		err = repository.CreateProduct(name, description, price, sellerID, quantity, imagePath)
		if err != nil {
			fmt.Println("Ошибка БД при создании:", err)
			http.Error(w, "Ошибка сохранения в базу данных", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Продукт успешно создан"))

	case http.MethodGet:
		sellerIDStr := r.URL.Query().Get("seller_id")
		var products []models.Product
		var err error

		if sellerIDStr != "" {
			sid, _ := strconv.Atoi(sellerIDStr)
			products, err = repository.GetProductsBySeller(sid)
		} else {
			products, err = repository.GetAllProducts()
		}

		if err != nil {
			http.Error(w, "Ошибка получения данных", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)

	default:
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
		// Для обновления тоже используем MultipartForm, чтобы можно было сменить фото
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "Ошибка данных", http.StatusBadRequest)
			return
		}

		name := r.FormValue("name")
		description := r.FormValue("description")
		price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
		quantity, _ := strconv.Atoi(r.FormValue("quantity"))
		sellerID, _ := strconv.Atoi(r.FormValue("seller_id"))
		
		// Проверяем, прислали ли новое фото
		var imagePath string
		file, handler, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(handler.Filename))
			fullPath := filepath.Join("./uploads", fileName)
			dst, _ := os.Create(fullPath)
			io.Copy(dst, file)
			dst.Close()
			imagePath = "/uploads/" + fileName
		} else {
			// Если фото не прислали, берем старое из скрытого поля или доп. логики
			imagePath = r.FormValue("old_image_url") 
		}

		err = repository.UpdateProduct(id, name, description, price, sellerID, quantity, imagePath)
		if err != nil {
			http.Error(w, "Ошибка обновления", http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Обновлено"))

	case http.MethodDelete:
		if err := repository.DeleteProduct(id); err != nil {
			http.Error(w, "Ошибка удаления", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
	}
}