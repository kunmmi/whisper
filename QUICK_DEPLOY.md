# 🚀 Quick Deployment Guide

## Ready to Deploy!

Your Whisper chat app is now configured for production deployment. Here's the fastest way to get it live:

---

## 🎯 Recommended: Railway (Easiest)

### Deploy Backend:
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your repository
4. Select the `backend` folder
5. Add environment variables:
   - `PORT` = `3000`
   - `JWT_SECRET` = (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (you'll update this after deploying frontend)
6. Railway will auto-deploy! Note the backend URL (e.g., `https://whisper-backend.railway.app`)

### Deploy Frontend:
1. In Railway, click "New" → "GitHub Repo"
2. Select the same repository
3. Select the `frontend` folder
4. Add environment variables:
   - `VITE_API_URL` = `https://your-backend-url.railway.app/api`
   - `VITE_SOCKET_URL` = `https://your-backend-url.railway.app`
5. Set build command: `npm run build`
6. Set output directory: `dist`
7. Deploy!

### Update Backend CORS:
1. Go back to backend service in Railway
2. Update `FRONTEND_URL` to your frontend URL
3. Redeploy backend

---

## 🌐 Alternative: Vercel (Frontend) + Railway (Backend)

### Backend (Railway):
Follow steps above for Railway backend deployment.

### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_URL` = `https://your-backend-url.railway.app/api`
   - `VITE_SOCKET_URL` = `https://your-backend-url.railway.app`
6. Deploy!

---

## ✅ Post-Deployment Checklist

- [ ] Backend is accessible (check `/health` endpoint)
- [ ] Frontend can connect to backend
- [ ] WebSocket connections work
- [ ] File uploads work
- [ ] Test login/register
- [ ] Test sending messages
- [ ] Test real-time messaging

---

## 🔧 Troubleshooting

**CORS Errors?**
- Make sure `FRONTEND_URL` in backend matches your frontend domain exactly
- Check that both URLs use HTTPS in production

**WebSocket Not Working?**
- Verify Socket.IO URL is correct
- Check that your hosting platform supports WebSockets (Railway and Vercel do)

**File Upload Issues?**
- Check that `uploads` directory exists on server
- Verify file size limits

---

## 🎉 You're Live!

Once deployed, share your app URL and start chatting! 🚀

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

