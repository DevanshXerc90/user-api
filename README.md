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
	- NestJS coverage from `npm run test:cov`: 81.08% statements, 75.55% branches, 90.32% functions, 80.98% lines.

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
- Benchmark request latency under load and publish p95/p99 results.
- Add health check and readiness endpoints for production deployments.
- Integrate CI/CD pipelines and deployment manifests (Kubernetes, etc.).

---

This project is designed to be easy to read, extend, and operate, making it a solid reference for idiomatic Go REST API development with a pragmatic, production-oriented stack.

---

## Two Implementations: Go and NestJS

This repository contains **two complete, independent implementations** of the same User Management REST API, living side by side:

| Path | Language | Framework |
|---|---|---|
| `/` (root) | Go 1.22 | GoFiber |
| `/nestjs-version` | TypeScript / Node.js | NestJS + TypeORM |

### Why Two Implementations?

This repo serves as a **direct architectural comparison** of how two modern ecosystems solve the same problem. Both services:

- Expose the **exact same 5 endpoints** (`POST`, `GET list`, `GET by ID`, `PUT`, `DELETE` on `/users`)
- Persist to the **same PostgreSQL database** and **same `users` table** (schema owned by the Go migration)
- Implement the **same age-calculation algorithm** (year diff, birthday-not-yet-passed adjustment, clamped to ≥ 0)
- Use **structured JSON logging** with matching field names (`level`, `msg`, `method`, `path`, `duration`)
- Apply **request-ID tracing middleware** that reads or generates an `X-Request-Id` header

The goal is to let you compare the **idioms, ergonomics, and trade-offs** of each ecosystem for building REST APIs.

---

### How to Run Both Services Together (Docker Compose)

The `docker-compose.yml` at the project root starts **all three containers**:

```bash
docker compose up --build
```

| Service | URL | Container |
|---|---|---|
| Go API | http://localhost:3000/users | `user-api-go` |
| NestJS API | http://localhost:3001/users | `user-api-nestjs` |
| PostgreSQL | localhost:5432 | `jeevan-db` |

The Go migration (`db/migrations/001_users.sql`) is automatically applied to Postgres on first start via Docker's `initdb.d` mount.

---

### How to Run Each Service Individually

#### Go API (port 3000)

```bash
# From the repo root
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/jeevan?sslmode=disable
go run ./cmd/server
```

#### NestJS API (port 3001)

```bash
cd nestjs-version
cp .env.example .env     # edit DATABASE_URL and PORT if needed
npm install
npm run start:dev        # development mode with hot reload
# or
npm run build && npm run start:prod
```

#### Run NestJS Tests

```bash
cd nestjs-version
npm test                 # unit tests
npm run test:cov         # with coverage report
```

---

### Architecture Comparison

| Dimension | Go / GoFiber | NestJS / TypeORM |
|---|---|---|
| **Language** | Go 1.22 (compiled, statically typed) | TypeScript 5 (compiled to JS, runs on Node.js) |
| **Framework** | GoFiber (fasthttp-based, ultra-low overhead) | NestJS (Express under the hood, decorators-first) |
| **Architecture** | Manual layering: handler → service → repository | NestJS enforced modules: Controller → Service → Repository |
| **Database access** | SQLC — raw SQL compiled to type-safe Go code | TypeORM — decorator-based ORM with Repository pattern |
| **Validation** | `go-playground/validator` struct tags (`required`, `min=1`) | `class-validator` decorators (`@IsNotEmpty`, `@MinLength`) |
| **Middleware** | Fiber `app.Use()` handlers (functional) | NestJS `MiddlewareConsumer` (class-based, `NestMiddleware`) |
| **Request ID** | Fiber's numeric connection counter | UUID v4 |
| **Error shape** | `{"error":"...","details":"..."}` (fiber.Map) | `{"error":"...","details":[...]}` (HttpExceptionFilter) |
| **Not-Found (GET/PUT)** | 500 (bug — error bubbles up) | 404 NotFoundException ✅ |
| **Schema management** | SQLC + raw SQL migrations | TypeORM with `synchronize: false` (reuses Go schema) |
| **Structured logging** | Uber Zap (production JSON) | `process.stdout.write` JSON (same field schema as Zap) |
| **Test framework** | Go's built-in `testing` package | Jest + `@nestjs/testing` |
| **Docker image** | distroless/base (tiny, no shell) | node:20-alpine (small Node runtime) |
| **Port** | 3000 | 3001 |

### Known Behavioural Divergences

| # | Behaviour | Go | NestJS |
|---|---|---|---|
| 1 | GET/PUT by missing ID | 500 Internal Server Error (db error bubbles) | 404 Not Found ✅ |
| 2 | Request ID fallback | Fiber numeric connection ID | UUID v4 |
| 3 | `age` on POST response | Omitted if 0 (`omitempty`) | Always present |
| 4 | Validation error `details` | Raw validator string | Structured array of messages |

