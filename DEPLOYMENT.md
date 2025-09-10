# 🚀 Deployment Guide

Deploy your AI Resume Builder to production with these step-by-step guides.

## 🌐 Frontend Deployment (Vercel)

### Option 1: Vercel CLI (Recommended)

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

### Option 2: GitHub Integration

1. Push your code to GitHub (already done!)
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Set root directory to `frontend`
6. Deploy!

### Environment Variables for Frontend

In Vercel dashboard, add:
```
VITE_API_URL=https://your-backend-url.com
```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

### Option 2: Heroku

```bash
# Install Heroku CLI
# Create Procfile
echo "web: python src/main.py" > backend/Procfile

# Deploy
cd backend
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key_here
git subtree push --prefix backend heroku main
```

### Option 3: DigitalOcean App Platform

1. Create new app on DigitalOcean
2. Connect your GitHub repository
3. Set source directory to `backend`
4. Add environment variables
5. Deploy!

## 🗄️ Database Setup (Production)

### PostgreSQL (Recommended)

```bash
# Update backend/src/main.py
# Replace SQLite with PostgreSQL URL
DATABASE_URL=postgresql://user:password@host:port/database
```

### Environment Variables for Backend

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
DATABASE_URL=your_database_url
FLASK_ENV=production
SECRET_KEY=your_secure_secret_key
```

## 🔒 Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Set up monitoring and logging

## 🌍 Custom Domain Setup

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Project Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

### Backend (Railway/Heroku)
1. Add custom domain in platform dashboard
2. Update DNS CNAME record
3. Enable SSL certificate

## 📊 Monitoring & Analytics

### Error Tracking
```bash
# Add to backend requirements.txt
sentry-sdk[flask]

# Configure in main.py
import sentry_sdk
sentry_sdk.init(dsn="your_sentry_dsn")
```

### Performance Monitoring
- Use platform-specific monitoring (Vercel Analytics, Railway Metrics)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor API usage and costs

## 🔄 CI/CD Pipeline

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

## 💰 Cost Optimization

### OpenAI API Costs
- Set usage limits in OpenAI dashboard
- Implement rate limiting
- Cache common responses
- Monitor token usage

### Infrastructure Costs
- Use free tiers initially (Vercel, Railway)
- Scale based on actual usage
- Optimize database queries
- Use CDN for static assets

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures:**
```bash
# Check build logs
# Ensure all dependencies are in requirements.txt/package.json
# Verify environment variables are set
```

**CORS Errors:**
```python
# Update Flask CORS settings
from flask_cors import CORS
CORS(app, origins=["https://your-frontend-domain.com"])
```

**Database Connection Issues:**
```python
# Check DATABASE_URL format
# Ensure database is accessible from deployment platform
# Verify SSL settings
```

## 📈 Scaling Considerations

### Performance Optimization
- Implement Redis caching
- Use database connection pooling
- Optimize AI API calls
- Add CDN for static assets

### High Availability
- Use multiple deployment regions
- Set up database replicas
- Implement health checks
- Add load balancing

## 🎯 Post-Deployment Checklist

- [ ] Test all functionality in production
- [ ] Verify environment variables
- [ ] Check SSL certificates
- [ ] Test payment processing (if implemented)
- [ ] Monitor error rates
- [ ] Set up backup procedures
- [ ] Document rollback procedures

## 📞 Support

If you encounter deployment issues:

1. Check platform-specific documentation
2. Review deployment logs
3. Test locally first
4. Open an issue on GitHub with deployment details

Happy deploying! 🚀

