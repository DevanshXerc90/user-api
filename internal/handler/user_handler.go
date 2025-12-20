package handler

import
(
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/go-playground/validator/v10"

	"user-api/internal/service"
)

type UserHandler struct {
	service  *service.UserService
	validate *validator.Validate
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{
		service:  svc,
		validate: validator.New(),
	}
}

type createUserRequest struct {
	Name string `json:"name" validate:"required,min=1"`
	Dob  string `json:"dob" validate:"required"`
}

type updateUserRequest struct {
	Name string `json:"name" validate:"required,min=1"`
	Dob  string `json:"dob" validate:"required"`
}

func (h *UserHandler) RegisterRoutes(r fiber.Router) {
	r.Post("/", h.CreateUser)
	r.Get("/:id", h.GetUserByID)
	r.Get("/", h.ListUsers)
	r.Put("/:id", h.UpdateUser)
	r.Delete("/:id", h.DeleteUser)
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req createUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := h.validate.Struct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "validation failed", "details": err.Error()})
	}

	dob, err := time.Parse("2006-01-02", req.Dob)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "dob must be in YYYY-MM-DD format"})
	}

	user, err := h.service.CreateUser(c.Context(), req.Name, dob)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create user"})
	}

	return c.Status(http.StatusCreated).JSON(user)
}

func (h *UserHandler) GetUserByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	user, err := h.service.GetUserByID(c.Context(), id)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch user"})
	}

	if user == nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(user)
}

func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid page"})
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid limit"})
	}

	users, err := h.service.ListUsersPaginated(c.Context(), page, limit)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to list users"})
	}

	return c.JSON(users)
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var req updateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := h.validate.Struct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "validation failed", "details": err.Error()})
	}

	dob, err := time.Parse("2006-01-02", req.Dob)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "dob must be in YYYY-MM-DD format"})
	}

	user, err := h.service.UpdateUser(c.Context(), id, req.Name, dob)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update user"})
	}

	return c.JSON(user)
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.service.DeleteUser(c.Context(), id); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete user"})
	}

	return c.SendStatus(http.StatusNoContent)
}

