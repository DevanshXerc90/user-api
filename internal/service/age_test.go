package service

import (
	"testing"
	"time"
)

func TestCalculateAge(t *testing.T) {
	tests := []struct {
		name     string
		dob      time.Time
		expected int
	}{
		{
			name:     "Birthday passed this year",
			dob:      time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
			expected: time.Now().Year() - 2000,
		},
		{
			name:     "Birthday not yet passed this year",
			dob:      time.Date(time.Now().Year()-20, 12, 31, 0, 0, 0, 0, time.UTC),
			expected: 19,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			age := CalculateAge(tt.dob)
			if age != tt.expected {
				t.Errorf("expected age %d, got %d", tt.expected, age)
			}
		})
	}
}
