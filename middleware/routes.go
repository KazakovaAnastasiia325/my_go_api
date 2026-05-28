package middleware

import (
	"my_api/handlers"
	"net/http"
	"strings"
	"log"
	"context"
	"os"
	"github.com/golang-jwt/jwt/v5"
)
func getSecret() []byte {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        secret = "default_secret_key" // Используем ту же строку, что и в service!
    }
    return []byte(secret)
}
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")

        // ВЫВОДИМ ТОКЕН В КОНСОЛЬ, ЧТОБЫ УБЕДИТЬСЯ
        log.Printf("DEBUG: Пытаюсь проверить токен: %s", tokenString)

        token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
            // ПРОВЕРЯЕМ СЕКРЕТНЫЙ КЛЮЧ
            return getSecret(), nil 
        })

        if err != nil {
            // ЭТО ВАМ ПОКАЖЕТ, ПОЧЕМУ ОШИБКА (например, "signature is invalid")
            log.Printf("DEBUG: Ошибка валидации токена: %v", err)
            http.Error(w, "Ошибка токена: "+err.Error(), http.StatusUnauthorized)
            return
        }

        if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
            log.Printf("DEBUG: Токен валиден! Данные: %v", claims)
            
            // ВАШ userID
            userIDFloat := claims["user_id"].(float64)
            userID := int(userIDFloat)

            ctx := context.WithValue(r.Context(), "userID", userID)
            next(w, r.WithContext(ctx))
        } else {
            http.Error(w, "Токен недействителен", http.StatusUnauthorized)
        }
    }
}

// 2. ИСПРАВЛЕННЫЙ SETUPROUTES
func SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	// ... остальной код (статика и т.д.) ...
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.FileServer(http.Dir("./uploads")).ServeHTTP(w, r)
			return
		}
		http.Redirect(w, r, "/auth", http.StatusSeeOther)
	})
	// Регистрация папки uploads для доступа из браузера
fs := http.FileServer(http.Dir("./uploads"))
// StripPrefix убирает "/uploads/" из URL, чтобы Go искал файл просто в папке ./uploads/
mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	mux.HandleFunc("/auth", handlers.AuthenticatePageHandler)

	// ЗАЩИЩЕННЫЕ API (используем AuthMiddleware)
	mux.HandleFunc("/api/checkout", AuthMiddleware(handlers.CheckoutHandler))
	
	// ОТКРЫТЫЕ API
	mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
    mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
    mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
    mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
    mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)
    mux.HandleFunc("/api/products", handlers.ProductsHandler)
    mux.HandleFunc("/api/catalog", handlers.GetProductsHandler)
    mux.HandleFunc("/api/products/", handlers.ProductByIDHandler)
	

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