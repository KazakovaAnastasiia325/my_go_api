package middleware

import (
	"my_api/handlers"
	"net/http"
	
)

func SetupRoutes() http.Handler {
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
	mux.HandleFunc("/api/checkout", handlers.CheckoutHandler)
	mux.HandleFunc("/api/reg", handlers.RegisterUserHandler)
	mux.HandleFunc("/api/auth", handlers.AuthenticateUserHandler)
	mux.HandleFunc("/api/welcome", handlers.WelcomeHandler)
	mux.HandleFunc("/api/admin/create-user", handlers.CreateSellerHandler)
	
	// Получение списка пользователей
	mux.HandleFunc("/api/admin/users", handlers.GetUsersHandler)

	// Обработка операций с конкретным пользователем (PUT / DELETE)
	mux.HandleFunc("/api/admin/users/", func(w http.ResponseWriter, r *http.Request) {
		// Логика маршрутизации для динамического ID
		if r.Method == http.MethodPut {
			
			handlers.DeleteUserHandler(w, r)
		} else {
			http.Error(w, "Метод не разрешен", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/products", handlers.ProductsHandler)
	mux.HandleFunc("/api/catalog", handlers.GetProductsHandler)
	mux.HandleFunc("/api/products/", handlers.ProductByIDHandler) 

	fs := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

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