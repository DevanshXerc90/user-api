package repository

import (
	"context"
	"database/sql"
	"time"

	db "user-api/db/sqlc"
)

type UserRepository struct {
	q *db.Queries
}

func NewUserRepository(dbConn *sql.DB) *UserRepository {
	return &UserRepository{
		q: db.New(dbConn),
	}
}

func (r *UserRepository) CreateUser(
	ctx context.Context,
	name string,
	dob time.Time,
) (db.User, error) {
	return r.q.CreateUser(ctx, db.CreateUserParams{
		Name: name,
		Dob:  dob,
	})
}

func (r *UserRepository) GetUserByID(
	ctx context.Context,
	id int64,
) (db.User, error) {
	return r.q.GetUserByID(ctx, int32(id))
}

func (r *UserRepository) ListUsers(
	ctx context.Context,
) ([]db.User, error) {
	return r.q.ListUsers(ctx)
}

func (r *UserRepository) ListUsersPaginated(
	ctx context.Context,
	limit int32,
	offset int32,
) ([]db.User, error) {
	return r.q.ListUsersPaginated(ctx, db.ListUsersPaginatedParams{
		Limit:  limit,
		Offset: offset,
	})
}

func (r *UserRepository) UpdateUser(
	ctx context.Context,
	id int64,
	name string,
	dob time.Time,
) (db.User, error) {
	return r.q.UpdateUser(ctx, db.UpdateUserParams{
		ID:   int32(id),
		Name: name,
		Dob:  dob,
	})
}

func (r *UserRepository) DeleteUser(
	ctx context.Context,
	id int64,
) error {
	return r.q.DeleteUser(ctx, int32(id))
}
