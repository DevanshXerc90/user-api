# User API

A clean, production-ready REST API written in Go 1.22 for managing users. It exposes CRUD endpoints, persists data in PostgreSQL, calculates age dynamically from date of birth, and demonstrates a layered, testable architecture suitable for real-world backends.

The server listens on port **3000** by default.

## Tech Stack

- **Language:** Go 1.22
- **Framework:** [GoFiber](https://github.com/gofiber/fiber)
- **Database:** PostgreSQL
- **DB Access:** [SQLC](https://sqlc.dev/) (type-safe Go code generated from raw SQL)
- **Validation:** [go-playground/validator](https://github.com/go-playground/validator)
- **Logging:** [Uber Zap](https://github.com/uber-go/zap)
- **Containerization:** Docker, Docker Compose

## Features

- **User CRUD APIs** (`POST`, `GET`, `PUT`, `DELETE` on `/users`)
- **User data model:** `name`, `dob` (date of birth)
- **Dynamic age calculation** using Go's `time` package
- **Pagination** on `GET /users` via `page` and `limit` query parameters
- **Input validation** using `go-playground/validator`
- **Structured logging** using Uber Zap
- **Middleware** for request tracing and metrics
	- Injects `X-Request-Id` into each request
	- Logs request duration and basic request/response metadata
- **Layered architecture**: handler → service → repository
- **Type-safe SQL** with SQLC (ORM alternative)
- **Unit tests** for age calculation logic

## Architecture Overview

The codebase follows a clear separation of concerns:

- **Handler layer (HTTP / transport)**
	- Implements HTTP endpoints using GoFiber.
	- Parses path/query parameters and JSON bodies.
	- Performs request validation and maps errors to HTTP responses.

- **Service layer (business logic)**
	- Encapsulates application use cases (create user, list users with pagination, update user, etc.).
	- Calculates derived fields such as **age** from `dob` using the Go `time` package.
	- Orchestrates calls to repositories and other services.

- **Repository layer (data access)**
	- Wraps SQLC-generated queries for PostgreSQL.
	- Exposes a small, focused interface (e.g. `CreateUser`, `GetUserByID`, `ListUsersPaginated`).
	- Keeps raw SQL in one place while leveraging SQLC for compile-time type safety.

This structure makes the project easy to maintain, extend, and test.

## Middleware

Custom middleware adds operational features on top of GoFiber:

- **Request ID middleware**
	- Ensures every request has a unique `X-Request-Id` header.
	- Useful for correlating logs across services and debugging.

- **Request duration logging middleware**
	- Measures the time taken to handle each request.
	- Logs method, path, status code, and duration via Uber Zap.

## Environment Variables

The service expects a PostgreSQL connection string via `DATABASE_URL` in the standard format:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/userdb?sslmode=disable
```

Other typical configuration (port, log level, etc.) can be wired similarly depending on the implementation.

## Running Locally (without Docker)

1. **Clone the repository**

	 ```bash
	 git clone <your-repo-url>
	 cd user-api
	 ```

2. **Start PostgreSQL**

	 - Create a database (e.g. `userdb`).
	 - Apply the SQL migrations from `db/migrations` to the database.

3. **Export `DATABASE_URL`**

	 ```bash
	 export DATABASE_URL=postgres://user:password@localhost:5432/userdb?sslmode=disable
	 ```

4. **Generate SQLC code (if needed)**

	 ```bash
	 sqlc generate
	 ```

5. **Run the API server**

	 ```bash
	 go run ./cmd/server
	 ```

6. The API will be available at:

	 ```
	 http://localhost:3000
	 ```

## Running with Docker & Docker Compose

This project ships with a multi-stage `Dockerfile` and a `docker-compose.yml` that starts both the API and PostgreSQL.

1. **Build and start services**

	 ```bash
	 docker compose up --build
	 ```

2. Docker Compose will:

	 - Build the Go API image using the multi-stage Dockerfile.
	 - Start a PostgreSQL container.
	 - Configure the API container with `DATABASE_URL` pointing to the database.

3. Once running, access the API at:

	 ```
	 http://localhost:3000
	 ```

## API Endpoints

### Create User

- **Method:** `POST`
- **URL:** `/users`
- **Request body:**

	```json
	{
		"name": "John Doe",
		"dob": "1990-05-12"
	}
	```

- **Response (201 Created):**

	```json
	{
		"id": 1,
		"name": "John Doe",
		"dob": "1990-05-12"
	}
	```

### Get User by ID

- **Method:** `GET`
- **URL:** `/users/:id`

- **Response (200 OK):**

	```json
	{
		"id": 1,
		"name": "John Doe",
		"dob": "1990-05-12",
		"age": 34
	}
	```

### List Users (Paginated)

- **Method:** `GET`
- **URL:** `/users`
- **Query params:**
	- `page` (optional, default: `1`)
	- `limit` (optional, default: `10`)

- **Example:**

	```http
	GET /users?page=1&limit=10 HTTP/1.1
	Host: localhost:3000
	```

- **Response (200 OK):**

	```json
	[
		{
			"id": 1,
			"name": "John Doe",
			"dob": "1990-05-12",
			"age": 34
		},
		{
			"id": 2,
			"name": "Jane Smith",
			"dob": "1988-11-03",
			"age": 36
		}
	]
	```

### Update User

- **Method:** `PUT`
- **URL:** `/users/:id`
- **Request body:**

	```json
	{
		"name": "John Doe Updated",
		"dob": "1991-01-01"
	}
	```

- **Response (200 OK):**

	```json
	{
		"id": 1,
		"name": "John Doe Updated",
		"dob": "1991-01-01",
		"age": 33
	}
	```

### Delete User

- **Method:** `DELETE`
- **URL:** `/users/:id`

- **Response (204 No Content):**

	No body.

## Validation & Error Handling

- **Validation**
	- Request payloads are validated using `go-playground/validator`.
	- Required fields such as `name` and `dob` are enforced.
	- `dob` is expected in `YYYY-MM-DD` format and parsed using Go's `time` package.

- **Error responses**
	- Invalid input → `400 Bad Request` with a JSON error payload.
	- Resource not found → `404 Not Found`.
	- Server-side issues → `500 Internal Server Error`.
	- Errors are returned as JSON objects, typically:

		```json
		{
			"error": "validation failed",
			"details": "..."
		}
		```

## Logging & Middleware

- **Uber Zap logging**
	- Structured, leveled logging suitable for production.
	- Logs include contextual fields such as request ID, path, method, status code, and duration.

- **Middleware responsibilities**
	- Injects `X-Request-Id` into incoming requests (generating one if missing).
	- Measures latency per request and logs timing metrics.
	- Can be extended to capture additional metadata (user ID, correlation IDs, etc.).

## Testing

- **Unit tests**
	- Age calculation logic is covered by unit tests to ensure correctness across edge cases (e.g. leap years, birthdays).

- **Run tests**

	From the project root:

	```bash
	go test ./...
	```

## Why SQLC Instead of an ORM?

- Keeps **full control over SQL** while still providing type-safe Go code.
- Catches schema and query issues at **compile time**.
- Avoids heavy ORM abstractions, keeping performance predictable and behavior explicit.

## Future Improvements

- Add authentication and authorization (e.g. JWT-based auth).
- Add OpenAPI/Swagger documentation for the REST endpoints.
- Introduce more extensive test coverage across handlers, services, and repositories.
- Add health check and readiness endpoints for production deployments.
- Integrate CI/CD pipelines and deployment manifests (Kubernetes, etc.).

---

This project is designed to be easy to read, extend, and operate, making it a solid reference for idiomatic Go REST API development with a pragmatic, production-oriented stack.

