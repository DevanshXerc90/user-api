package models

type UserResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Dob  string `json:"dob"`
	Age  int    `json:"age,omitempty"`
}

