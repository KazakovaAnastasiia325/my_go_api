package middleware

import (
	"my_api/handlers"
	"net/http"
    
)
func SetupRoutes() *http.ServeMux {
    mux := http.NewServeMux()

    // Главная страница
   mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			// Если запрашивается файл (js, css, картинки), отдаем его из статики
			http.FileServer(http.Dir("./frontend/dist")).ServeHTTP(w, r)
			return
		}
		// Перенаправление на страницу входа
		http.Redirect(w, r, "/auth", http.StatusSeeOther)
	})
    mux.HandleFunc("/auth", handlers.AuthenticatePageHandler)

    // Страницы
    /*mux.HandleFunc("/register-page", handlers.RegisterPageHandler)
    mux.HandleFunc("/auth-page", handlers.AuthenticatePageHandler)
    mux.HandleFunc("/welcome-page", handlers.WelcomePageHandler)
	mux.HandleFunc("/admin-dashboard", handlers.AdminPageHandler)
	mux.HandleFunc("/create-seller-page", handlers.CreateSellerPageHandler)
	mux.HandleFunc("/seller-dashboard", handlers.SellerDashboardHandler)
	mux.HandleFunc("/catalog", handlers.CatalogPageHandler)
	mux.HandleFunc("/catalog-dashboard", handlers.CatalogPageHandler)
	mux.HandleFunc("/customer", handlers.CustomerDashboardHandler)
	mux.HandleFunc("/customer-dashboard", handlers.CustomerDashboardHandler)*/

    // API
    mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
    mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
    mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
	mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
    mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)
    mux.HandleFunc("/api/products", handlers.ProductsHandler)
   mux.HandleFunc("/api/catalog", handlers.GetProductsHandler)
    // Статика
   


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

