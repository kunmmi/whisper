# Deployment Guide for Whisper Chat App

## Overview
This guide will help you deploy the Whisper chat app to production. The app consists of:
- **Backend**: Node.js/Express API with Socket.IO
- **Frontend**: React/Vite application
- **Database**: SQLite (can be migrated to PostgreSQL for production)

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
Railway can deploy both frontend and backend easily.

### Option 2: Render
Good free tier, supports both frontend and backend.

### Option 3: Vercel (Frontend) + Railway/Render (Backend)
Best performance, separate deployments.

---

## Step-by-Step Deployment

### Prerequisites
1. GitHub account (recommended for easy deployment)
2. Accounts on your chosen hosting platforms

---

## Deployment Steps

### 1. Prepare Environment Variables

#### Backend Environment Variables
Create a `.env` file in the `backend` folder:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend Environment Variables
The frontend will use `import.meta.env.VITE_API_URL` for the API URL.

---

### 2. Update Code for Production

The code has been updated to:
- Use environment variables for API URLs
- Support dynamic CORS origins
- Handle production builds

---

### 3. Deploy Backend

#### On Railway:
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Select the `backend` folder
6. Add environment variables:
   - `PORT=3000`
   - `JWT_SECRET=<generate-a-secure-random-string>`
   - `NODE_ENV=production`
   - `FRONTEND_URL=<your-frontend-url>`
7. Railway will auto-detect Node.js and deploy
8. Note the backend URL (e.g., `https://your-app.railway.app`)

#### On Render:
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: whisper-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy

---

### 4. Deploy Frontend

#### On Vercel (Recommended for Frontend):
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - `VITE_API_URL=https://your-backend-url.com/api`
   - `VITE_SOCKET_URL=https://your-backend-url.com`
6. Deploy

#### On Netlify:
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add environment variables:
   - `VITE_API_URL=https://your-backend-url.com/api`
   - `VITE_SOCKET_URL=https://your-backend-url.com`
6. Deploy

---

### 5. Update CORS Settings

After deployment, update your backend's `FRONTEND_URL` environment variable to match your frontend URL.

---

## Important Notes

### File Uploads
- Uploads are stored in the `backend/uploads` directory
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- The current setup works but files are stored on the server

### Database
- Currently using SQLite
- For production, consider migrating to PostgreSQL
- Railway and Render offer free PostgreSQL databases

### WebSocket (Socket.IO)
- Ensure your hosting platform supports WebSockets
- Railway and Render both support WebSockets
- Vercel requires a separate backend for WebSockets

---

## Post-Deployment Checklist

- [ ] Backend is accessible and returning health check
- [ ] Frontend can connect to backend API
- [ ] WebSocket connections work
- [ ] File uploads work
- [ ] Authentication works
- [ ] Messages send/receive in real-time
- [ ] Environment variables are set correctly
- [ ] CORS is configured for production URLs

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your frontend domain
- Check that credentials are enabled

### WebSocket Connection Issues
- Verify Socket.IO server is running
- Check that your hosting platform supports WebSockets
- Ensure the Socket.IO URL is correct in frontend

### File Upload Issues
- Check that `uploads` directory exists and is writable
- Verify file size limits
- Check CORS settings for file uploads

---

## Security Checklist

- [ ] JWT_SECRET is a strong random string
- [ ] Environment variables are not committed to git
- [ ] CORS is restricted to your frontend domain
- [ ] File upload size limits are set
- [ ] SQL injection protection (using parameterized queries)
- [ ] Rate limiting (consider adding for production)

---

## Next Steps

1. Set up a custom domain (optional)
2. Add SSL/HTTPS (usually automatic on these platforms)
3. Set up monitoring and error tracking
4. Consider migrating to PostgreSQL for better scalability
5. Set up automated backups

Good luck with your deployment! 🚀

