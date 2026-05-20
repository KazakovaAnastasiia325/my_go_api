package models

type User struct {
	ID int `json: "id"`
	Username string `json: "username"`
	Email string `json: "email"`
	Password string `json: "password"`
	PasswordHash string `json: "-"`
	Role string `json:"role"` // "admin", "seller", "customer"
}