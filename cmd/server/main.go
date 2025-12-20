package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	_ "github.com/lib/pq"
	"go.uber.org/zap"

	"user-api/internal/handler"
	"user-api/internal/logger"
	"user-api/internal/middleware"
	"user-api/internal/repository"
	"user-api/internal/routes"
	"user-api/internal/service"
)

func main() {
	log.Println("starting user-api server...")

	// Initialize logger
	loggr := logger.InitLogger()
	defer func() {
		_ = loggr.Sync()
	}()

	// Read database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		loggr.Fatal("DATABASE_URL is not set")
	}

	// Open DB connection
	dbConn, err := sql.Open("postgres", dbURL)
	if err != nil {
		loggr.Fatal("failed to open database", zap.Error(err))
	}
	defer dbConn.Close()

	// Retry DB connection until ready (for Docker / slow startups)
	ctx := context.Background()
	maxWait := 10 * time.Second
	deadline := time.Now().Add(maxWait)

	for {
		if err := dbConn.PingContext(ctx); err == nil {
			break
		}

		if time.Now().After(deadline) {
			loggr.Fatal("database is not reachable after retries", zap.Error(err))
		}

		loggr.Warn("database not ready, retrying...")
		time.Sleep(time.Second)
	}

	loggr.Info("database connection established")

	// Initialize layers
	userRepo := repository.NewUserRepository(dbConn)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		StrictRouting: false,
	})

	// Global middleware
	app.Use(middleware.RequestID())
	app.Use(middleware.RequestLogger(loggr))

	// Register routes
	routes.RegisterUserRoutes(app, userHandler)

	// Start server
	if err := app.Listen(":3000"); err != nil {
		loggr.Fatal("failed to start server", zap.Error(err))
	}
}
