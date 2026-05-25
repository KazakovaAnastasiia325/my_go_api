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
    // CORS логика (если нужна)
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

        // ПРОВЕРКА ID: Если фронт прислал пустоту, мы не идем дальше
        sellerIDRaw := r.FormValue("seller_id")
        if sellerIDRaw == "" {
            http.Error(w, "Отсутствует seller_id. Вы не авторизованы корректно.", http.StatusUnauthorized)
            return
        }
        
        sellerID, err := strconv.Atoi(sellerIDRaw)
        if err != nil {
            http.Error(w, "Некорректный ID продавца", http.StatusBadRequest)
            return
        }

        name := r.FormValue("name")
        description := r.FormValue("description")
        price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
        quantity, _ := strconv.Atoi(r.FormValue("quantity"))

        var imagePath string
        file, handler, err := r.FormFile("image")
        if err == nil {
            defer file.Close()
            uploadDir := "./uploads"
            os.MkdirAll(uploadDir, os.ModePerm)
            fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), filepath.Ext(handler.Filename))
            fullPath := filepath.Join(uploadDir, fileName)
            dst, _ := os.Create(fullPath)
            defer dst.Close()
            io.Copy(dst, file)
            imagePath = "/uploads/" + fileName
        }

        err = repository.CreateProduct(name, description, price, sellerID, quantity, imagePath)
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
            // ВНИМАНИЕ: Проверь, чтобы в repository.GetProductsBySeller был WHERE seller_id = ?
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
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Некорректный ID", http.StatusBadRequest)
        return
    }

    switch r.Method {
    case http.MethodPut:
        if err := r.ParseMultipartForm(10 << 20); err != nil {
            http.Error(w, "Ошибка данных", http.StatusBadRequest)
            return
        }

        name := r.FormValue("name")
        description := r.FormValue("description")
        price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
        quantity, _ := strconv.Atoi(r.FormValue("quantity"))
        
        // ВАЖНО: Мы больше не используем sellerID для обновления!
        
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
            imagePath = r.FormValue("old_image_url") 
        }

        // ВЫЗОВ БЕЗ sellerID
        err = repository.UpdateProduct(id, name, description, price, quantity, imagePath)
        if err != nil {
            http.Error(w, "Ошибка обновления", http.StatusInternalServerError)
            return
        }
        w.Write([]byte("Обновлено успешно"))

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