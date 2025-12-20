package service

import "time"

func CalculateAge(dob time.Time) int {
	now := time.Now()
	age := now.Year() - dob.Year()

	// Adjust if birthday has not occurred yet this year
	birthdayThisYear := time.Date(now.Year(), dob.Month(), dob.Day(), 0, 0, 0, 0, now.Location())
	if now.Before(birthdayThisYear) {
		age--
	}

	if age < 0 {
		return 0
	}

	return age
}

