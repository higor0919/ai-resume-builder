# 🚀 Comprehensive Deployment Guide

Deploy your AI Resume Builder to production with these comprehensive step-by-step guides.

## 📋 Table of Contents

- [Quick Start Guide (5-minute setup)](#-quick-start-guide-5-minute-setup)
- [Detailed Deployment Guide](#-detailed-deployment-guide)
  - [Frontend Deployment Options](#frontend-deployment-options)
  - [Backend Deployment Options](#backend-deployment-options)
  - [Database Setup for Production](#-database-setup-for-production)
- [CI/CD Pipeline Examples](#-cicd-pipeline-examples)
- [Security Checklist](#-security-checklist)
- [Troubleshooting and Scaling Information](#-troubleshooting-and-scaling-information)
- [Cost Optimization](#-cost-optimization)
- [Post-Deployment Checklist](#-post-deployment-checklist)

## 🚀 Quick Start Guide (5-minute setup)

### Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- OpenAI API Key
- GitHub account

### One-Command Setup

```bash
git clone https://github.com/higor0919/ai-resume-builder.git
cd ai-resume-builder
./setup.sh
```

### Manual Setup

1. **Clone & Setup Environment**
   ```bash
   git clone https://github.com/higor0919/ai-resume-builder.git
   cd ai-resume-builder
   cp .env.example .env
   ```

2. **Add Your OpenAI API Key**
   Edit `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   
   # Frontend
   cd frontend
   npm install  # or pnpm install
   cd ..
   ```

4. **Run the Application**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   source venv/bin/activate
   python src/main.py
   
   # Terminal 2 (Frontend)
   cd frontend
   npm run dev  # or pnpm run dev
   ```

## 📖 Detailed Deployment Guide

### Frontend Deployment Options

#### Option 1: Vercel (Recommended)

**Vercel CLI Method:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: ai-resume-builder-frontend
# - Directory: ./
# - Override settings? No
```

**GitHub Integration Method:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Set root directory to `frontend`
6. Deploy!

**Environment Variables for Frontend (Vercel):**
```
VITE_API_BASE_URL=https://your-backend-url.com
```

#### Option 2: Render (Static Site)

In Render dashboard:
1. Create new "Static Site" service
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm install && npm run build`
4. Set publish directory: `frontend/dist`

### Backend Deployment Options

#### Option 1: Render (Web Service) - Recommended

Render is configured with [render.yaml](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\render.yaml) for automatic deployment:

1. Fork this repository to your GitHub account
2. Go to your Render dashboard
3. Click "New+" and select "Import from GitHub repository"
4. Choose your forked `ai-resume-builder` repository
5. Render will automatically detect the [render.yaml](file://c:\Users\Ygor\Downloads\ai-resume-builder-main\render.yaml) file and create both services

**Environment Variables for Backend (Render):**
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
FLASK_ENV=production
SECRET_KEY=your_secure_secret_key
```

#### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

**Environment Variables for Backend (Railway):**
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
FLASK_ENV=production
SECRET_KEY=your_secure_secret_key
```

#### Option 3: Heroku

```bash
# Create Procfile
echo "web: cd src && python main.py" > backend/Procfile

# Deploy
cd backend
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key_here
git subtree push --prefix backend heroku main
```

#### Option 4: DigitalOcean App Platform

1. Create new app on DigitalOcean
2. Connect your GitHub repository
3. Set source directory to `backend`
4. Add environment variables
5. Deploy!

### 🗄️ Database Setup for Production

The application currently uses SQLite for development but should use PostgreSQL for production.

#### PostgreSQL Setup

1. **Update backend/src/main.py** (already configured for Render):
   ```python
   # For local development with SQLite
   db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.db')
   app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
   
   # For production with PostgreSQL
   # app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
   ```

2. **Environment Variables for PostgreSQL:**
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

## 🔄 CI/CD Pipeline Examples

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          working-directory: ./backend
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  PNPM_VERSION: "8"

build-frontend:
  stage: build
  image: node:18
  script:
    - cd frontend
    - npm install -g pnpm
    - pnpm install
    - pnpm run build
  artifacts:
    paths:
      - frontend/dist/

deploy-frontend:
  stage: deploy
  image: node:18
  script:
    - npm install -g vercel
    - cd frontend
    - vercel --token $VERCEL_TOKEN --yes
  only:
    - main

deploy-backend:
  stage: deploy
  image: python:3.11
  script:
    - pip install -r backend/requirements.txt
    - # Deploy to your preferred platform
  only:
    - main
```

## 🔒 Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Regular security audits

## 🚨 Troubleshooting and Scaling Information

### Common Deployment Issues

**Build Failures:**
- Check build logs
- Ensure all dependencies are in requirements.txt/package.json
- Verify environment variables are set

**CORS Errors:**
```python
# Update Flask CORS settings
from flask_cors import CORS
CORS(app, origins=["https://your-frontend-domain.com"])
```

**Database Connection Issues:**
- Check DATABASE_URL format
- Ensure database is accessible from deployment platform
- Verify SSL settings

**Render Deployment Issues:**
- Check that you're using the correct branch
- Verify environment variables are set
- Check logs for specific error messages

### Scaling Considerations

#### Performance Optimization
- Implement Redis caching for API responses
- Use database connection pooling
- Optimize AI API calls with caching
- Add CDN for static assets

#### High Availability
- Use multiple deployment regions
- Set up database replicas
- Implement health checks
- Add load balancing

#### Database Scaling
- Migrate from SQLite to PostgreSQL
- Implement database connection pooling
- Add read replicas for read-heavy operations
- Set up automated backups

## 💰 Cost Optimization

### OpenAI API Costs
- Set usage limits in OpenAI dashboard
- Implement rate limiting in application
- Cache common responses
- Monitor token usage with logging
- Consider using cheaper models for less critical operations

### Infrastructure Costs
- Use free tiers initially (Vercel, Render, Railway)
- Scale based on actual usage
- Optimize database queries
- Use CDN for static assets
- Monitor resource usage and adjust plans accordingly

### Optimization Techniques
- Implement response caching
- Use lazy loading for non-critical components
- Compress assets
- Minimize API calls with batching

## 📊 Monitoring & Analytics

### Error Tracking
```bash
# Add to backend requirements.txt
sentry-sdk[flask]

# Configure in main.py
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your_sentry_dsn",
    integrations=[FlaskIntegration()]
)
```

### Performance Monitoring
- Use platform-specific monitoring (Vercel Analytics, Railway Metrics)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor API usage and costs
- Implement application performance monitoring (APM)

## 🌍 Custom Domain Setup

### Frontend (Vercel/Render)
1. Go to platform dashboard
2. Project Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

### Backend (Railway/Render)
1. Add custom domain in platform dashboard
2. Update DNS CNAME record
3. Enable SSL certificate

## 📋 Post-Deployment Checklist

- [ ] Test all functionality in production
- [ ] Verify environment variables
- [ ] Check SSL certificates
- [ ] Test payment processing (if implemented)
- [ ] Monitor error rates
- [ ] Set up backup procedures
- [ ] Document rollback procedures
- [ ] Configure monitoring and alerting
- [ ] Test custom domain setup
- [ ] Verify CORS configuration

## 📞 Support

If you encounter deployment issues:

1. Check platform-specific documentation
2. Review deployment logs
3. Test locally first
4. Open an issue on GitHub with deployment details

Happy deploying! 🚀