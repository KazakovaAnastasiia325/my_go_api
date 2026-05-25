package middleware

import (
    "my_api/handlers"
    "net/http"
)

func SetupRoutes() http.Handler { // Изменили возвращаемый тип на http.Handler
    mux := http.NewServeMux()

    // Главная страница и статика
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/" {
            http.FileServer(http.Dir("./frontend/dist")).ServeHTTP(w, r)
            return
        }
        http.Redirect(w, r, "/auth", http.StatusSeeOther)
    })
    mux.HandleFunc("/auth", handlers.AuthenticatePageHandler)

    // API
    mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
    mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
    mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
    mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
    mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)
    mux.HandleFunc("/api/products", handlers.ProductsHandler)
    mux.HandleFunc("/api/catalog", handlers.GetProductsHandler)
    mux.HandleFunc("/api/products/{id}", handlers.ProductByIDHandler)
    fs := http.FileServer(http.Dir("./uploads"))
    mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

    return EnableCORS(mux)
}

func EnableCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Если в продакшене — замените "*" на конкретный URL фронтенда
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