package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"my_api/models"
	"my_api/repository"
	"my_api/storage"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/minio/minio-go/v7"
)

// Вспомогательная функция для загрузки в S3
func uploadToS3(file io.Reader, size int64, originalName string, contentType string) (string, error) {
	bucketName := "uploads"
	objectName := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(originalName))

	_, err := storage.S3Client.PutObject(
		context.Background(),
		bucketName,
		objectName,
		file,
		size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return "", err
	}
	return "/" + bucketName + "/" + objectName, nil
}

func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodPost:
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "Ошибка парсинга формы", http.StatusBadRequest)
			return
		}

		sellerID, _ := strconv.Atoi(r.FormValue("seller_id"))
		name := r.FormValue("name")
		description := r.FormValue("description")
		price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
		quantity, _ := strconv.Atoi(r.FormValue("quantity"))
		categoryID, _ := strconv.Atoi(r.FormValue("category_id")) // Получаем ID категории

		var imagePath string
		file, handler, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			imagePath, err = uploadToS3(file, handler.Size, handler.Filename, handler.Header.Get("Content-Type"))
			if err != nil {
				http.Error(w, "Ошибка загрузки в S3: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		// Передаем categoryID
		err = repository.CreateProduct(name, description, price, sellerID, quantity, categoryID, imagePath)
		if err != nil {
			http.Error(w, "Ошибка БД: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Товар создан"))

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
	}
}

func ProductByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/products/"):]
	id, _ := strconv.Atoi(idStr)

	switch r.Method {
	case http.MethodPut:
		r.ParseMultipartForm(10 << 20)
		name := r.FormValue("name")
		description := r.FormValue("description")
		price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
		quantity, _ := strconv.Atoi(r.FormValue("quantity"))
		categoryID, _ := strconv.Atoi(r.FormValue("category_id")) // Получаем ID категории

		var imagePath string
		file, handler, err := r.FormFile("image")
		if err == nil {
			defer file.Close()
			imagePath, err = uploadToS3(file, handler.Size, handler.Filename, handler.Header.Get("Content-Type"))
		} else {
			imagePath = r.FormValue("old_image_url")
		}

		// Передаем categoryID
		err = repository.UpdateProduct(id, name, description, price, quantity, categoryID, imagePath)
		if err != nil {
			http.Error(w, "Ошибка обновления: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write([]byte("Обновлено"))
	case http.MethodDelete:
		repository.DeleteProduct(id)
		w.WriteHeader(http.StatusNoContent)
	}
}
func GetCategoriesHandler(w http.ResponseWriter, r *http.Request) {
    categories, err := repository.GetAllCategories()
    if err != nil {
        http.Error(w, "Ошибка получения категорий", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(categories)
}