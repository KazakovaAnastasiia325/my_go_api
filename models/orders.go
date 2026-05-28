package models

type Order struct {
	ID         int    `json:"id"`
	UserID int    `json:"user_id"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	totalPrice float64 `json:"total_price"`
}