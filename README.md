# ContractAI

ContractAI is an end‑to‑end system for analyzing, summarizing, and chatting over contracts. It features a React + Vite frontend and a Node.js + Express + MongoDB backend with integrated LLM workflows (Groq).

## Overview

- Frontend (`Fe`): Modern React + TypeScript app with authentication, file uploads, chat interface, and an Admin panel.
- Backend (`BeMongo`): Express API with JWT auth, file processing pipeline, clause extraction, summarization, and QA endpoints.
- Document pipeline: Upload → text extraction (PDF/DOCX/TXT + basic OCR for images) → summary → clause parsing → severity assessment → persisted results and chat message.

## Project Structure

```
ContractAI/
├── BeMongo/                  # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── config/          # env, mongo connection, admin seeding
│   │   ├── middleware/      # auth middleware
│   │   ├── models/          # Mongoose models (User, Chat, File)
│   │   ├── routes/          # auth, admin, chats, files, ml
│   │   ├── services/        # LLM + text extraction
│   │   └── server.ts        # API entrypoint
│   ├── samples/             # Sample contracts + expected parsing results
│   └── scripts/             # Evaluation script
└── Fe/                      # Frontend (React + Vite)
    ├── src/
    │   ├── components/      # UI, ChatInterface, AdminPanel, etc.
    │   ├── contexts/        # Auth context
    │   └── services/        # API clients
    └── vite.config.ts
```

## Requirements

- Node.js `>=18`
- MongoDB (`mongodb://localhost:27017/contractai` by default)
- Groq API key for LLM features

## Backend Setup (BeMongo)

1. Install dependencies:
   ```bash
   cd BeMongo
   npm install
   ```

2. Create `.env` in `BeMongo/` with values:
   ```env
   # Required
   JWT_SECRET=your_jwt_secret_string
   GROQ_API_KEY=your_groq_api_key

   # Optional
   GROQ_MODEL=llama-3.3-70b-versatile
   MONGODB_URI=mongodb://localhost:27017/contractai
   PORT=3000
   FRONTEND_URL=http://localhost:5173

   # Optional admin seed (created on boot if provided)
   ADMIN_EMAIL=admin@contractai.com
   ADMIN_PASSWORD=admin123
   ```

3. Run the API server (dev):
   ```bash
   npm run dev
   ```
   - Health check: `http://localhost:3000/api/health`

## Frontend Setup (Fe)

1. Install dependencies:
   ```bash
   cd Fe
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Access the app:
   - Frontend: `http://localhost:5173`
   - Backend API base: `http://localhost:3000/api`

## Key Features

- Secure auth with JWT; automatic token refresh via `/auth/refresh`.
- Upload contracts (`PDF`, `DOCX`, `TXT`) and receive:
  - 6‑bullet summary.
  - Clause presence analysis and severity (`red`, `amber`, `green`).
  - Persisted bot summary message in the associated chat.
- Chat interface:
  - Text messaging to LLM.
  - QA directly over attached document using only its content.
  - Auto‑generated chat titles derived from document content.
- Admin panel with backend health and stats endpoints.

## API Overview (selected)

- `GET /api/health` — service status.

- Auth (`/api/auth`):
  - `POST /register` — email + password; optional `firstName`, `lastName`, `company`.
  - `POST /login` — returns `accessToken` + user.
  - `POST /refresh` — refreshes JWT (requires Authorization).
  - `POST /admin/login` — admin login (requires seeded admin).
  - `PUT /profile` — update profile fields.

- Chats (`/api/chats`):
  - `GET /` — list chats for current user.
  - `POST /` — create chat.
  - `GET /:chatId/messages` — list messages.
  - `POST /:chatId/messages` — send message; bot replies (QA if a file is attached).
  - `PUT /:chatId` — update chat title; preserves title history.
  - `GET /:chatId/title` — fetch current title and history.
  - `DELETE /:chatId` — delete a chat and its messages.

- Files (`/api/files`):
  - `POST /upload` — multipart upload (`file`), optional `chatId`.
  - `GET /chats/:chatId` — list files for chat.
  - `GET /:fileId/download` — download.
  - `GET /:fileId/text` — extracted text.
  - `GET /:fileId/summary` — current summary string.
  - `DELETE /:fileId` — delete file.

- ML (`/api/ml`):
  - `POST /generate` — generic text generation using Groq.
  - `POST /analyze/file` — analysis + summary for stored file by id.
  - `POST /analyze/text` — analysis + summary for raw text.
  - `POST /summarize/file` — summary for stored file by id.
  - `POST /qa/file` — QA over stored file using only its text.
  - `POST /parse/contract` — structured clause parsing from text or `fileId`.

## Document Processing Pipeline

- File types: `PDF`, `DOCX`, `TXT`. Basic OCR for `PNG/JPG/JPEG/TIFF` during extraction.
- Size limit: 10MB per upload.
- Steps on upload:
  - Store file on disk under `uploads/`.
  - Extract text; handle common PDF errors and scanned docs.
  - Summarize in 6 concise bullets.
  - Parse clauses, mark missing ones, compute overall severity.
  - Persist a bot message in the linked chat with the summary and missing clause list.

## Admin Seeding

- If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, an admin account is created at boot.
- Use `POST /api/auth/admin/login` with these credentials to access admin routes.

## Evaluation and Samples

- Sample contracts live under `BeMongo/samples/` with expected presence JSONs.
- Run evaluation to check clause extraction performance:
  ```bash
  cd BeMongo
  npx ts-node scripts/evaluateContracts.ts
  ```

## Development Notes

- Frontend base API URL: `Fe/src/services/api.ts` → `http://localhost:3000/api`.
- CORS: backend allows `http://localhost:5173` and `http://localhost:5174`, plus `FRONTEND_URL` env.
- Tokens: stored in `localStorage`; auto refresh on 401.
- Upload directory: `BeMongo/uploads` is created automatically.

## Troubleshooting

- Missing `JWT_SECRET` or `GROQ_API_KEY`: backend exits on startup; set them in `.env`.
- Mongo connection: ensure MongoDB is running and `MONGODB_URI` is reachable.
- PDF parse errors (corrupt or scanned): try a text‑based PDF or DOCX; OCR is used for images but may be slower.
- CORS blocked: set `FRONTEND_URL` to your dev hostname if not `localhost:5173/5174`.
- Admin login failing: verify `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set and seeded.

## License

Proprietary — not for redistribution without permission.
