# FeedPulse

FeedPulse is an AI-powered product feedback platform built for the Software Engineer - Product Development Intern assignment. It includes a public feedback submission flow, Gemini-powered feedback analysis, and a protected admin dashboard for triage and review.

## Tech stack

- Frontend: Next.js 14, React, TypeScript, CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- AI: Google Gemini 1.5 Flash
- Auth: JWT-based admin session token

## Project structure

```text
feedpulse/
|- frontend/
|- backend/
|- package.json
|- README.md
```

## Features implemented

- Public feedback form with client-side validation and success/error states
- `POST /api/feedback` saves to MongoDB and triggers Gemini analysis
- Gemini fields saved on the feedback document: category, sentiment, priority, summary, tags
- Graceful AI failure handling so feedback still persists
- Rate limiting on feedback submission: 5 per IP per hour
- Admin login with hardcoded credentials and JWT token
- Protected dashboard with feedback list, sentiment badges, filters, search, sorting, pagination, stats, and status updates
- On-demand 7 day AI summary
- Consistent API response shape: `{ success, data, error, message }`

## Environment variables

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/feedpulse
JWT_SECRET=change-me
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@feedpulse.local
ADMIN_PASSWORD=feedpulse-admin
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Run locally

1. Install dependencies in the root workspace with `npm install`.
2. Start MongoDB locally, or update `MONGO_URI` to point at your instance.
3. Add the backend and frontend environment files.
4. Run the backend with `npm run dev:backend`.
5. Run the frontend with `npm run dev:frontend`.
6. Open `http://localhost:3000`.

## Admin login

- Email: `admin@feedpulse.local`
- Password: `feedpulse-admin`

These can be changed in `backend/.env`.

## API endpoints

- `POST /api/auth/login`
- `POST /api/feedback`
- `GET /api/feedback`
- `GET /api/feedback/:id`
- `PATCH /api/feedback/:id`
- `DELETE /api/feedback/:id`
- `GET /api/feedback/summary`

## Screenshots

Add at least two screenshots here before submission:

- Public submission page
- Admin dashboard

## What I would build next

- Move AI processing into a background queue
- Add manual AI re-run actions per feedback item
- Add test coverage with Jest and Supertest
- Add Docker support for one-command local setup
