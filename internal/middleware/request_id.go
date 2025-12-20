package middleware

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		reqID := c.Get("X-Request-Id")

		if reqID == "" {
			reqID = strconv.FormatUint(c.Context().ID(), 10)
		}

		c.Set("X-Request-Id", reqID)
		return c.Next()
	}
}
