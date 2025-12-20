package service

import (
	"context"
	"time"

	"user-api/internal/models"
	"user-api/internal/repository"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

// -------------------- CREATE --------------------

func (s *UserService) CreateUser(
	ctx context.Context,
	name string,
	dob time.Time,
) (*models.UserResponse, error) {

	user, err := s.repo.CreateUser(ctx, name, dob)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:   int64(user.ID),
		Name: user.Name,
		Dob:  user.Dob.Format("2006-01-02"),
		Age:  CalculateAge(user.Dob),
	}, nil
}

// -------------------- GET BY ID --------------------

func (s *UserService) GetUserByID(
	ctx context.Context,
	id int64,
) (*models.UserResponse, error) {

	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:   int64(user.ID),
		Name: user.Name,
		Dob:  user.Dob.Format("2006-01-02"),
		Age:  CalculateAge(user.Dob),
	}, nil
}

// -------------------- LIST (NO PAGINATION) --------------------

func (s *UserService) ListUsers(
	ctx context.Context,
) ([]models.UserResponse, error) {

	users, err := s.repo.ListUsers(ctx)
	if err != nil {
		return nil, err
	}

	var result []models.UserResponse
	for _, user := range users {
		result = append(result, models.UserResponse{
			ID:   int64(user.ID),
			Name: user.Name,
			Dob:  user.Dob.Format("2006-01-02"),
			Age:  CalculateAge(user.Dob),
		})
	}

	return result, nil
}

// -------------------- LIST (PAGINATED) --------------------

func (s *UserService) ListUsersPaginated(
	ctx context.Context,
	page int,
	limit int,
) ([]models.UserResponse, error) {

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	users, err := s.repo.ListUsersPaginated(
		ctx,
		int32(limit),
		int32(offset),
	)
	if err != nil {
		return nil, err
	}

	var result []models.UserResponse
	for _, user := range users {
		result = append(result, models.UserResponse{
			ID:   int64(user.ID),
			Name: user.Name,
			Dob:  user.Dob.Format("2006-01-02"),
			Age:  CalculateAge(user.Dob),
		})
	}

	return result, nil
}

// -------------------- UPDATE --------------------

func (s *UserService) UpdateUser(
	ctx context.Context,
	id int64,
	name string,
	dob time.Time,
) (*models.UserResponse, error) {

	user, err := s.repo.UpdateUser(ctx, id, name, dob)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:   int64(user.ID),
		Name: user.Name,
		Dob:  user.Dob.Format("2006-01-02"),
		Age:  CalculateAge(user.Dob),
	}, nil
}

// -------------------- DELETE --------------------

func (s *UserService) DeleteUser(
	ctx context.Context,
	id int64,
) error {
	return s.repo.DeleteUser(ctx, id)
}
