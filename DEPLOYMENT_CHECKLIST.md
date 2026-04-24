# Deployment Checklist

## Backend
- Set `DATABASE_URL`, `DATABASE_USER`, and `DATABASE_PASSWORD` for your cloud Postgres.
- Set `JWT_SECRET` to a strong random value.
- Set `MAIL_USERNAME`, `MAIL_PASSWORD`, and `MAIL_FROM`.
- Set `FRONTEND_URL` to the deployed frontend origin.

## AI Service
- Set `GROQ_API_KEY`.
- Set `GROQ_MODEL` to the Groq model you want in production.
- Set `BACKEND_BASE_URL` to the backend origin.
- Set `FRONTEND_BASE_URL` to the frontend origin.

## Chat and Tickets
- Verify project chat participants are manager + assigned developers only.
- Verify only the chat starter can end a chat session.
- Verify Groq returns summary + blocker detection before ticket prompt.
- Verify tickets are visible in the manager ticket queue.

## Security
- Never commit real secrets to `.env` files.
- Rotate any credentials that were previously stored in the repo.
- Keep `.env.example` files committed and actual `.env` files local only.