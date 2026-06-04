package middleware

import (
	"context"
	"io"
	"log"
	"my_api/handlers"
	"my_api/storage"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/minio/minio-go/v7"
)

func getSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	
	return []byte(secret)
}
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// вывод токена в консоль для отладки
		log.Printf("DEBUG: Пытаюсь проверить токен: %s", tokenString)

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			// проверка секретного ключа
			return getSecret(), nil
		})

		if err != nil {
			
			log.Printf("DEBUG: Ошибка валидации токена: %v", err)
			http.Error(w, "Ошибка токена: "+err.Error(), http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			log.Printf("DEBUG: Токен валиден! Данные: %v", claims)

			//  userID
			userIDFloat := claims["user_id"].(float64)
			userID := int(userIDFloat)

			ctx := context.WithValue(r.Context(), "userID", userID)
			next(w, r.WithContext(ctx))
		} else {
			http.Error(w, "Токен недействителен", http.StatusUnauthorized)
		}
	}
}
func S3FileHandler(w http.ResponseWriter, r *http.Request) {
	// r.URL.Path выглядит как "/uploads/имя_файла.jpg"
	
	objectName := strings.TrimPrefix(r.URL.Path, "/uploads/")

	// объект из MinIO
	object, err := storage.S3Client.GetObject(context.Background(), "uploads", objectName, minio.GetObjectOptions{})
	if err != nil {
		http.Error(w, "Файл не найден", http.StatusNotFound)
		return
	}
	defer object.Close()

	// Устанавливаем правильные заголовки
	w.Header().Set("Content-Type", "image/jpeg")

	// Отправляем файл пользователю
	io.Copy(w, object)
}


func SetupRoutes() http.Handler {
	mux := http.NewServeMux()


	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/auth", http.StatusSeeOther)
	})

	
	mux.HandleFunc("/uploads/", S3FileHandler)

	mux.HandleFunc("/auth", handlers.AuthenticatePageHandler)

	// ЗАЩИЩЕННЫЕ API 
	mux.HandleFunc("/api/checkout", AuthMiddleware(handlers.CheckoutHandler))

	// ОТКРЫТЫЕ API
	mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
	mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
	mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
	mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
	mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)

	mux.HandleFunc("/api/products", handlers.ProductsHandler)
	mux.HandleFunc("/api/catalog", handlers.ProductsHandler)
	mux.HandleFunc("/api/products/", handlers.ProductByIDHandler)
	mux.HandleFunc("/api/notifications", AuthMiddleware(handlers.GetNotificationsHandler))
	mux.HandleFunc("/api/notifications/read", AuthMiddleware(handlers.MarkAllReadHandler))
	mux.HandleFunc("/api/categories", handlers.GetCategoriesHandler)

	return EnableCORS(mux)
}

func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
