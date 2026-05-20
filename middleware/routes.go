package middleware

import (
	"my_api/handlers"
	"net/http"

)
func SetupRoutes() *http.ServeMux {
    mux := http.NewServeMux()

    // Главная страница
    mux.HandleFunc("/", handlers.AuthenticatePageHandler)

    // Страницы
    mux.HandleFunc("/register-page", handlers.RegisterPageHandler)
    mux.HandleFunc("/auth-page", handlers.AuthenticatePageHandler)
    mux.HandleFunc("/welcome-page", handlers.WelcomePageHandler)
	mux.HandleFunc("/admin-dashboard", handlers.AdminPageHandler)
	mux.HandleFunc("/create-seller-page", handlers.CreateSellerPageHandler)
	/*mux.HandleFunc("/seller-dashboard", handlers.SellerPageHandler)
	mux.HandleFunc("/catalog", handlers.CatalogPageHandler)*/

    // API
    mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
    mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
    mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
	mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
    mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)
    /*mux.HandleFunc("/api/seller/create-product", handlers.CreateProductHandler)
    mux.HandleFunc("/api/catalog", handlers.CatalogHandler)*/
    // Статика
    fs := http.FileServer(http.Dir("view"))
    mux.Handle("/static/", http.StripPrefix("/static/", fs))

    return mux
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

