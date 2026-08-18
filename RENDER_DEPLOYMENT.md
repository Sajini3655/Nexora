# Render Deployment Guide

## Prerequisites
- Render account (https://render.com)
- GitHub repository connected to Render
- Environment variables configured

## Deployment Steps

### 1. Connect Repository to Render
1. Go to https://dashboard.render.com
2. Click "New" > "Web Service"
3. Select "Deploy an existing repository"
4. Connect your GitHub repository (Sajini3655/Nexora)

### 2. Configure Service
- **Name**: `nexora-backend`
- **Environment**: Docker
- **Dockerfile**: `backend/Dockerfile`
- **Plan**: Standard (or Starter for testing)

### 3. Set Environment Variables
Add these variables in Render dashboard:

**Required (from application.properties):**
- `DATABASE_URL`: Your PostgreSQL connection string (Supabase)
- `DATABASE_USER`: Supabase username
- `DATABASE_PASSWORD`: Supabase password
- `JWT_SECRET`: Generate a long random string for JWT signing
- `MAIL_HOST`: SMTP server (e.g., smtp.gmail.com)
- `MAIL_PORT`: SMTP port (e.g., 587)
- `MAIL_USERNAME`: Email account
- `MAIL_PASSWORD`: Email app password
- `MAIL_FROM`: Sender email address
- `FRONTEND_URL`: Your frontend URL (e.g., https://admin-manager.onrender.com)
- `INBOUND_EMAIL_API_KEY`: API key for inbound email service (if applicable)
- `JWT_EXPIRATION_MS`: 86400000 (24 hours, optional)
- `BOOTSTRAP_ADMIN_ENABLED`: true (optional)

### 4. Database Setup
- **Option A (Recommended)**: Use existing Supabase PostgreSQL database
  - Configure DATABASE_URL to point to Supabase
  
- **Option B**: Use Render PostgreSQL Database
  - Create PostgreSQL database in Render (if using render.yaml)
  - Schema will be auto-initialized from schema.sql

### 5. Deploy
- Push changes to GitHub
- Render will auto-deploy on push to main branch
- Monitor deployment logs in Render dashboard

## Post-Deployment
1. Test API endpoint: `https://your-service.onrender.com/`
2. Verify database connection
3. Check logs for any errors: Render Dashboard > Logs

## Troubleshooting
- **Port Error**: Ensure PORT is set to 8081 or 10000 for Render
- **Database Connection**: Verify DATABASE_URL format and credentials
- **WebSocket Issues**: Ensure security headers permit WebSocket connections
- **Build Failures**: Check Maven build logs in deployment console

## Auto-Deploy Configuration
To enable automatic deployments:
1. Go to Service Settings > Deploy Hooks
2. Use the webhook URL in your CI/CD pipeline
3. Or simply push to main branch (if connected)

## Rollback
To rollback to previous deployment:
1. Go to Render Dashboard
2. Service > Deployments tab
3. Click "Redeploy" on previous successful deployment
