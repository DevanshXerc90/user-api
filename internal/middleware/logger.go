package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func RequestLogger(log *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		log.Info("request completed",
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Duration("duration", time.Since(start)),
		)

		return err
	}
}
