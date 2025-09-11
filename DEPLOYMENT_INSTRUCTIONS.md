# AI Resume Builder Deployment Instructions

This document provides step-by-step instructions for deploying both the frontend and backend of the AI Resume Builder application.

## Prerequisites

1. GitHub account (already set up)
2. OpenAI API key
3. Either:
   - Vercel account for frontend deployment (free at [vercel.com](https://vercel.com)) AND Railway account for backend deployment (free at [railway.app](https://railway.app))
   - OR Render account for both frontend and backend deployment (free at [render.com](https://render.com))

## Option 1: Deploy to Render (Recommended)

Render is a unified cloud platform that makes it easy to deploy full-stack web applications.

### Step 1: Sign up for Render
1. Go to [render.com](https://render.com)
2. Sign up using your GitHub account
3. Follow the setup process

### Step 2: Deploy using render.yaml
1. Fork this repository to your GitHub account (if you haven't already)
2. Go to your Render dashboard
3. Click "New+" and select "Import from GitHub repository"
4. Choose your forked `ai-resume-builder` repository
5. Render will automatically detect the [render.yaml](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\render.yaml) file and create both services

### Step 3: Configure Environment Variables
1. For the backend service, go to "Environment Variables" and add:
   - `OPENAI_API_KEY`: Your actual OpenAI API key
   - `SECRET_KEY`: A secure random string
2. The frontend will automatically get the backend URL through the service linking in [render.yaml](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\render.yaml)

### Step 4: Deploy
1. Click "Create Deployment" for both services
2. Wait for the deployments to complete (this may take a few minutes)

## Option 2: Deploy to Vercel (Frontend) + Railway (Backend)

### Frontend Deployment (Vercel)

#### Step 1: Sign up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up using your GitHub account
3. Follow the setup process

#### Step 2: Import your project
1. Click "New Project"
2. Select "Import Git Repository"
3. Choose your `ai-resume-builder` repository
4. Click "Import"

#### Step 3: Configure project settings
1. **Project Name**: ai-resume-builder (or any name you prefer)
2. **Framework Preset**: Vite
3. **Root Directory**: frontend
4. **Build and Output Settings**:
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

#### Step 4: Add environment variables
1. In the "Environment Variables" section, add:
   - `VITE_API_BASE_URL`: URL of your deployed backend (you'll get this after deploying the backend)
2. Click "Deploy"

#### Step 5: Update environment variables after backend deployment
1. Once your backend is deployed, get its URL
2. Go to your Vercel project settings
3. Navigate to "Environment Variables"
4. Update `VITE_API_BASE_URL` with your backend URL
5. Redeploy the project

### Backend Deployment (Railway)

#### Step 1: Sign up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up using your GitHub account
3. Follow the setup process

#### Step 2: Create a new project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `ai-resume-builder` repository

#### Step 3: Configure the service
Railway should now automatically detect the configuration files we've added:
- **Root Directory**: backend
- **Start Command**: `cd src && python main.py` (from Procfile)
- **Python Version**: 3.11 (from runtime.txt)

#### Step 4: Add environment variables
1. Go to your project settings
2. Navigate to "Variables"
3. Add the following environment variables:
   - `OPENAI_API_KEY`: Your actual OpenAI API key
   - `OPENAI_API_BASE`: https://api.openai.com/v1
   - `FLASK_ENV`: production
   - `SECRET_KEY`: A secure random string

#### Step 5: Configure the domain
1. Railway will automatically provide a domain
2. You can also add a custom domain if desired

## Post-Deployment Steps

### Update Frontend Environment Variables (if using Vercel/Railway)
1. Get your backend URL from Railway
2. Update the `VITE_API_BASE_URL` environment variable in Vercel with this URL
3. Redeploy the frontend

### Test the Deployment
1. Visit your frontend URL
2. Try uploading a resume and analyzing it
3. Verify that all features work correctly

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your backend is configured to accept requests from your frontend domain
2. **API Key Issues**: Verify that your OpenAI API key is correctly set in environment variables
3. **Build Failures**: Check that all dependencies are correctly specified in package.json
4. **Database Issues**: The application now uses `/tmp/app.db` in Render environments to ensure write access

### Checking Logs
- **Render**: Check deployment logs in the Render dashboard
- **Vercel**: Check deployment logs in the Vercel dashboard
- **Railway**: Check application logs in the Railway dashboard

## Scaling Considerations

For production use, consider:
1. Upgrading from free tiers on platforms
2. Adding a proper database (PostgreSQL) instead of SQLite
3. Implementing rate limiting for API calls
4. Adding monitoring and error tracking

## Cost Considerations

All platforms offer free tiers:
- **Render**: Free tier with some limitations
- **Vercel**: Generous free tier for frontend hosting
- **Railway**: $5 credit for new users, with pay-as-you-go pricing

The main ongoing cost will be OpenAI API usage, which depends on how much the application is used.