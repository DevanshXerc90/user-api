# User Management Frontend

A clean, minimalist React + Vite frontend built to interface with the User Management REST API (Go and NestJS implementations). It is designed to be easily deployable on Vercel and perfect for technical interviews.

## Frontend Architecture

- **React + Vite**: Fast build tool and framework.
- **Component Structure**:
  - `App.jsx`: Main orchestrator, manages state, handles API integration, and features a backend switcher.
  - `StatusIndicator.jsx`: Pings the active API to display a real-time connection status.
  - `UserTable.jsx`: Renders the user list and handles Edit/Delete actions.
  - `UserForm.jsx`: A modal form for creating and updating users.
  - `services/api.js`: Centralized data fetching logic using the native `fetch` API.
- **Styling**: Plain CSS (`index.css`) for a clean, professional, dependency-free design.

## How it Communicates with the API

The application dynamically selects the API base URL based on a dropdown in the UI. When you switch between "Go" and "NestJS", the `App.jsx` component passes the selected backend identifier to `services/api.js`, which then constructs the API request using the appropriate environment variable.

## Environment Variables

Copy `.env.example` to `.env` in the root of the `frontend` directory:

```bash
VITE_GO_API_URL=http://localhost:3000
VITE_NEST_API_URL=http://localhost:3001
```

If you deploy your backend APIs, replace these local URLs with your production endpoints.

## Local Development

1. Ensure your backend is running (e.g., via `docker compose up`).
2. Navigate to the frontend directory: `cd frontend`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open your browser to the local URL (usually `http://localhost:5173`).

## Production Deployment

This project includes a `vercel.json` file, making it ready for Vercel out-of-the-box.

### Deploying to Vercel
1. Push this repository to GitHub/GitLab.
2. Go to Vercel, click **Add New Project**, and select this repository.
3. If Vercel defaults the root directory, make sure you override the **Root Directory** setting to `frontend`.
4. In the **Environment Variables** section, add your production URLs:
   - `VITE_GO_API_URL` = (Your Go API URL)
   - `VITE_NEST_API_URL` = (Your NestJS API URL)
5. Click **Deploy**.

*Note: Ensure that your deployed backend APIs have CORS configured to allow requests from your Vercel frontend URL.*
