package models

type User struct {
	ID int `json: "id"`
	Username string `json: "username"`
	Email string `json: "email"`
	Password string `json: "password"`
	PasswordHash string `json: "-"`
	RoleID   int    `json:"role_id"`   // Новое поле для ID
    RoleName string `json:"role"` // Сюда будем класть "admin" или "customer" после JOIN
}