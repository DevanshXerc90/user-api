package routes

import (
	"github.com/gofiber/fiber/v2"

	"user-api/internal/handler"
)

func RegisterUserRoutes(app *fiber.App, h *handler.UserHandler) {
	group := app.Group("/users")
	h.RegisterRoutes(group)
}

