package models
type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	SellerID    int     `json:"seller_id"`
	Quantity    int     `json:"quantity"`
	ImageURL    string  `json:"image_url"`
	CategoryID  int     `json:"category_id"`
}
