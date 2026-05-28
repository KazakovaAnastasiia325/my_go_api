package models
type Notification struct {
	ID      int    `json:"id"`
	UserID  int    `json:"user_id"`
	Message string `json:"message"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}