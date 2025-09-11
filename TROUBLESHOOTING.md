# 🛠️ Troubleshooting Guide

This guide covers common issues you might encounter when setting up, running, or deploying the AI Resume Builder application.

## 🚀 Setup Issues

### "Module not found" errors

**Problem:** When running the backend, you get errors like `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### "OpenAI API key not found"

**Problem:** Application runs but AI features don't work, showing API key errors

**Solution:**
1. Check that you have a `.env` file in the root directory
2. Verify that `OPENAI_API_KEY` is set correctly in the `.env` file
3. Ensure the backend is loading the environment variables properly

### Port already in use

**Problem:** When starting the application, you get "Address already in use" errors

**Solution:**
```bash
# Kill existing processes
pkill -f "python src/main.py"

# Or use different ports
# For backend, set PORT environment variable
PORT=5001 python src/main.py

# For frontend, modify vite.config.js
```

## 🌐 Frontend Issues

### White screen or blank page

**Problem:** The frontend loads but shows a blank white page

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify that the backend API is running and accessible
3. Check that `VITE_API_BASE_URL` is set correctly in environment variables
4. Clear browser cache and hard refresh (Ctrl+F5)

### CORS errors

**Problem:** Browser console shows CORS errors when making API requests

**Solutions:**
1. Ensure the backend is configured with proper CORS settings:
   ```python
   from flask_cors import CORS
   CORS(app, origins=["http://localhost:5173", "https://your-frontend-domain.com"])
   ```
2. Verify that the frontend is making requests to the correct backend URL

### Build failures

**Problem:** Frontend build fails with various errors

**Solutions:**
1. Ensure all dependencies are installed:
   ```bash
   cd frontend
   npm install
   ```
2. Check for TypeScript or syntax errors in the code
3. Verify Node.js version compatibility (v18+ recommended)

## 🔧 Backend Issues

### Database connection errors

**Problem:** Backend fails to start with database connection errors

**Solutions:**
1. Check that the database file exists and is writable:
   ```bash
   # Create database directory if it doesn't exist
   mkdir -p backend/database
   ```
2. Verify database path configuration in `backend/src/main.py`
3. For Render deployment, ensure the application uses `/tmp` directory which is writable

### "sqlite3.OperationalError: unable to open database file"

**Problem:** This specific error occurs on Render deployment

**Solutions:**
1. The application is configured to skip database initialization on Render
2. Verify that environment variables are set correctly:
   - `RENDER=true`
   - `PYTHONPATH=/opt/render/project/src/backend`
3. Check Render logs for specific error messages

### AI features not working

**Problem:** AI-powered features return errors or don't work as expected

**Solutions:**
1. Verify OpenAI API key is set correctly
2. Check that you have sufficient credits in your OpenAI account
3. Verify internet connectivity from your deployment environment
4. Check application logs for specific error messages

## ☁️ Deployment Issues

### Render deployment failures

**Problem:** Application fails to deploy on Render with various errors

**Solutions:**
1. Check that [render.yaml](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\render.yaml) is properly configured
2. Verify environment variables are set in Render dashboard:
   - `OPENAI_API_KEY`
   - `SECRET_KEY`
3. Check Render logs for specific error messages
4. Ensure you're deploying from the correct branch

### Railway deployment issues

**Problem:** Application fails to deploy on Railway

**Solutions:**
1. Check that [railway.json](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\railway.json) is properly configured
2. Verify environment variables are set in Railway dashboard
3. Check Railway logs for specific error messages
4. Ensure Procfile exists in the backend directory

### Vercel deployment problems

**Problem:** Frontend fails to deploy on Vercel

**Solutions:**
1. Verify project settings in Vercel dashboard:
   - Root directory: `frontend`
   - Build command: `npm run build` (or `pnpm run build`)
   - Output directory: `dist`
2. Check that all dependencies are in `package.json`
3. Verify environment variables are set correctly

## 📱 Feature-Specific Issues

### PDF upload not working

**Problem:** PDF upload functionality doesn't populate resume fields

**Solutions:**
1. Verify OpenAI API key is set (PDF parsing uses AI)
2. Check browser console for JavaScript errors
3. Ensure the backend `/api/parse-pdf` endpoint is working
4. Verify file size limits (large PDFs may timeout)

### Live preview not showing

**Problem:** Live preview panel doesn't update as you type

**Solutions:**
1. Check that the preview mode is activated
2. Verify that resume content is being saved properly
3. Check browser console for JavaScript errors
4. Ensure the frontend can communicate with the backend

### Auto-save flickering

**Problem:** Resume content box flickers continuously

**Solutions:**
1. This was a known issue that has been fixed in recent versions
2. Ensure you're using the latest code with proper debounced auto-save implementation
3. Check that `useRef` is being used correctly instead of state variables for intervals

## 🛡️ Security Issues

### CORS misconfiguration

**Problem:** Security warnings about CORS in browser console

**Solutions:**
1. Properly configure CORS in the backend:
   ```python
   from flask_cors import CORS
   CORS(app, origins=["https://your-frontend-domain.com"])
   ```
2. Don't use wildcard (*) in production

### Environment variables exposed

**Problem:** Sensitive information visible in client-side code

**Solutions:**
1. Only use `VITE_` prefixed variables in frontend code
2. Never expose backend secrets to the frontend
3. Use proper environment variable management

## 📊 Performance Issues

### Slow AI responses

**Problem:** AI-powered features take too long to respond

**Solutions:**
1. Check your OpenAI API usage and rate limits
2. Implement caching for common responses
3. Consider using cheaper models for less critical operations
4. Add loading indicators to improve user experience

### High memory usage

**Problem:** Application consumes excessive memory

**Solutions:**
1. Optimize database queries
2. Implement proper cleanup of resources
3. Use connection pooling for database connections
4. Monitor for memory leaks in long-running processes

## 📞 Getting Additional Help

If you're still experiencing issues:

1. **Check the logs** - Both application logs and platform-specific deployment logs
2. **Search existing issues** - Check the GitHub issues page for similar problems
3. **Test locally** - Reproduce the issue in a local development environment
4. **Provide detailed information** when opening a new issue:
   - Error messages and stack traces
   - Steps to reproduce the issue
   - Environment information (OS, Node.js version, Python version)
   - Deployment platform and configuration

## 🔄 Updating the Application

When pulling updates from the repository:

1. **Update dependencies:**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

2. **Check for configuration changes:**
   - Review any changes to `.env.example`
   - Check for new environment variables
   - Review updated documentation

3. **Database migrations:**
   - If there are database schema changes, you may need to update your database
   - For production deployments, always backup your database before applying changes