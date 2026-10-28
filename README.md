# Job Application Tracker (MERN)

A web app to record job applications and track each one through its stages.
Built with MongoDB Atlas, Express.js, React (Vite) and Node.js.

## Features
- Add, view, edit and delete applications
- Auto-generated ID in the format `JA-<COMPANY>-<NNN>`
- Status workflow with validated transitions and a status history timeline
- Auto follow-up date (7 days) and a "Follow-up Overdue" badge
- Duplicate check (case-insensitive) for active applications
- Filter by status, search by company, and per-status counts

## Setup
```bash
cd backend
npm install
npm run dev

cd frontend
npm install
npm run dev
```
Backend runs on http://localhost:5000 and frontend on http://localhost:5173.

## API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/applications | Create an application |
| GET | /api/applications?status=&search= | List with filter and search |
| GET | /api/applications/stats | Count per status |
| GET | /api/applications/:id | Get one application |
| PUT | /api/applications/:id | Edit an application |
| PATCH | /api/applications/:id/status | Change status |
| DELETE | /api/applications/:id | Delete an application |

All responses use the format `{ success, message, data }`.

## Screenshots
(add later)
## Business Rules
- Applied → Interview or Rejected
- Interview → Offer or Rejected
- Offer → Accepted or Declined
- Rejected, Accepted and Declined are final
- Interview and Offer applications cannot be deleted
- Follow-up date is 7 days after the applied date