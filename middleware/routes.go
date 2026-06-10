package middleware

import (
	"context"
	"encoding/json"
	"io"

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
        cookie, err := r.Cookie("token")
        if err != nil {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusUnauthorized)
            json.NewEncoder(w).Encode(map[string]string{"error": "Токен отсутствует"})
            return
        }

        token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
            return getSecret(), nil
        })

        if err != nil || !token.Valid {
            // Исправлено: теперь тоже возвращаем JSON, чтобы фронтенд не выдавал SyntaxError
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusUnauthorized)
            json.NewEncoder(w).Encode(map[string]string{"error": "Токен недействителен"})
            return
        }

        claims := token.Claims.(jwt.MapClaims)
        
        var userID int
        if val, ok := claims["user_id"].(float64); ok {
            userID = int(val)
        } else if val, ok := claims["user_id"].(int); ok {
            userID = val
        }

        role, _ := claims["role"].(string)

        ctx := context.WithValue(r.Context(), "userID", userID)
        ctx = context.WithValue(ctx, "role", role)
        
        next(w, r.WithContext(ctx))
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
        // Если путь начинается с /api, то это ошибочный запрос к API
        if strings.HasPrefix(r.URL.Path, "/api") {
            http.NotFound(w, r)
            return
        }
        // Иначе отдаем SPA
        http.ServeFile(w, r, "dist/index.html")
    })

	
	mux.HandleFunc("/uploads/", S3FileHandler)

	mux.HandleFunc("/auth", handlers.AuthenticatePageHandler)

	// ЗАЩИЩЕННЫЕ API 
	mux.HandleFunc("/api/checkout", AuthMiddleware(handlers.CheckoutHandler))
mux.HandleFunc("/api/check-role", AuthMiddleware(handlers.CheckRoleHandler))
	// ОТКРЫТЫЕ API
	mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
	mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
	mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
	mux.HandleFunc("/api/logout", handlers.LogoutHandler)
	mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
	mux.HandleFunc("/api/admin/users", AuthMiddleware(RoleMiddleware("admin")(handlers.GetUsersHandler)))

    // Пример: Доступ для продавца и админа
    mux.HandleFunc("/api/seller-dashboard", AuthMiddleware(RoleMiddleware("seller", "admin")(handlers.SellerHandler)))
    // Добавьте эту строку в ваш список маршрутов
mux.HandleFunc("/api/admin/analytics/orders", AuthMiddleware(RoleMiddleware("admin")(handlers.GetOrdersChartData)))
    // Пример: Доступ для покупателя и админа
    mux.HandleFunc("/api/customer-dashboard", AuthMiddleware(RoleMiddleware("customer", "admin")(handlers.CustomerDashboardHandler)))
mux.HandleFunc("/api/admin/stats", AuthMiddleware(RoleMiddleware("admin")(handlers.GetStatsHandler)))
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
        w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
        w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control")
        w.Header().Set("Access-Control-Allow-Credentials", "true") 

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}
func RoleMiddleware(allowedRoles ...string) func(http.HandlerFunc) http.HandlerFunc {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            // 1. Проверяем наличие пользователя
            userID := r.Context().Value("userID")
            if userID == nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            // 2. Достаем роль
            userRole, ok := r.Context().Value("role").(string)
            if !ok {
                http.Error(w, "Forbidden: роль не определена", http.StatusForbidden)
                return
            }

            // 3. Админ имеет доступ ко всему
            if userRole == "admin" {
                next(w, r)
                return
            }

            // 4. Проверяем остальные роли
            for _, role := range allowedRoles {
                if userRole == role {
                    next(w, r)
                    return
                }
            }

            http.Error(w, "Доступ запрещен", http.StatusForbidden)
        }
    }
}
