# 🔄 CI/CD Pipeline Guide

This guide provides comprehensive instructions for setting up continuous integration and continuous deployment pipelines for the AI Resume Builder application.

## 📋 Table of Contents

- [GitHub Actions](#-github-actions)
- [GitLab CI/CD](#-gitlab-cicd)
- [Jenkins Pipeline](#-jenkins-pipeline)
- [Testing Strategies](#-testing-strategies)
- [Deployment Environments](#-deployment-environments)
- [Security Scanning](#-security-scanning)
- [Monitoring and Notifications](#-monitoring-and-notifications)

## 🐙 GitHub Actions

### Basic CI/CD Pipeline

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Backend Testing
  backend-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.11]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        cd backend
        pytest --cov=src tests/
    
    - name: Lint with flake8
      run: |
        cd backend
        pip install flake8
        flake8 src/ --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 src/ --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

  # Frontend Testing
  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage
    
    - name: Build
      run: |
        cd frontend
        npm run build

  # Deploy to Render (only on main branch)
  deploy:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Trigger Render Deploy
      run: |
        curl -X POST https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
          -H "Content-Type: application/json"
```

### Environment-Specific Deployments

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy Backend to Staging
      run: |
        # Add your staging deployment commands here
        echo "Deploying to staging environment"
    
    - name: Deploy Frontend to Staging
      run: |
        # Add your frontend staging deployment commands here
        echo "Deploying frontend to staging"
```

### Automated Release Management

Create `.github/workflows/release.yml`:

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false
```

## 🦊 GitLab CI/CD

### Complete Pipeline Configuration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy
  - monitor

variables:
  PYTHON_VERSION: "3.11"
  NODE_VERSION: "18"

# Backend Build
backend-build:
  stage: build
  image: python:${PYTHON_VERSION}
  script:
    - cd backend
    - pip install -r requirements.txt
    - python -m compileall src/
  artifacts:
    paths:
      - backend/
  only:
    - main
    - develop
    - merge_requests

# Frontend Build
frontend-build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/dist/
  only:
    - main
    - develop
    - merge_requests

# Backend Testing
backend-test:
  stage: test
  image: python:${PYTHON_VERSION}
  services:
    - postgres:13
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
  script:
    - cd backend
    - pip install pytest pytest-cov
    - pytest --cov=src tests/
  coverage: '/TOTAL.*\s+(\d+%)$/'
  only:
    - main
    - develop
    - merge_requests

# Frontend Testing
frontend-test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - cd frontend
    - npm ci
    - npm test
  only:
    - main
    - develop
    - merge_requests

# Deploy to Staging
deploy-staging:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST $STAGING_DEPLOY_HOOK
  environment:
    name: staging
    url: https://staging.ai-resume-builder.com
  only:
    - develop

# Deploy to Production
deploy-production:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache curl
    - curl -X POST $PRODUCTION_DEPLOY_HOOK
  environment:
    name: production
    url: https://ai-resume-builder.com
  when: manual
  only:
    - main

# Performance Monitoring
performance-monitor:
  stage: monitor
  image: python:${PYTHON_VERSION}
  script:
    - pip install locust
    - locust --headless -u 10 -r 1 --run-time 1m --host $TEST_URL
  only:
    - schedules
```

## 🔧 Jenkins Pipeline

### Declarative Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    tools {
        nodejs "node-18"
        python "python-3.11"
    }
    
    environment {
        BACKEND_DIR = "backend"
        FRONTEND_DIR = "frontend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Backend Setup') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'pip install -r requirements.txt'
                }
            }
        }
        
        stage('Frontend Setup') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Backend Testing') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'pip install pytest pytest-cov'
                    sh 'pytest --cov=src tests/'
                }
            }
            post {
                always {
                    publishCoverage adapters: [coberturaAdapter('coverage.xml')]
                }
            }
        }
        
        stage('Frontend Testing') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm test'
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: "${FRONTEND_DIR}/dist/**/*", fingerprint: true
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    // Deploy to staging environment
                    sh 'echo "Deploying to staging"'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    // Deploy to production environment
                    sh 'echo "Deploying to production"'
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            script {
                currentBuild.result = 'SUCCESS'
                // Send success notification
            }
        }
        failure {
            script {
                currentBuild.result = 'FAILURE'
                // Send failure notification
            }
        }
    }
}
```

## 🧪 Testing Strategies

### Automated Testing Matrix

1. **Unit Tests**
   ```bash
   # Backend unit tests
   cd backend
   pytest tests/unit/
   
   # Frontend unit tests
   cd frontend
   npm test
   ```

2. **Integration Tests**
   ```bash
   # Backend integration tests
   cd backend
   pytest tests/integration/
   
   # Frontend integration tests
   cd frontend
   npm run test:integration
   ```

3. **End-to-End Tests**
   ```bash
   # Using Cypress
   cd frontend
   npm run test:e2e
   ```

4. **Performance Tests**
   ```bash
   # Using Locust
   locust -f tests/performance/locustfile.py
   ```

### Test Environment Configuration

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  test-db:
    image: postgres:13
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5432:5432"

  test-redis:
    image: redis:7
    ports:
      - "6379:6379"

  selenium-hub:
    image: selenium/hub:latest
    ports:
      - "4442:4442"
      - "4443:4443"
      - "4444:4444"

  chrome-node:
    image: selenium/node-chrome:latest
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
```

## 🌍 Deployment Environments

### Environment Configuration

1. **Development Environment**
   ```yaml
   # .env.development
   FLASK_ENV=development
   DEBUG=True
   DATABASE_URL=sqlite:///app.db
   ```

2. **Staging Environment**
   ```yaml
   # .env.staging
   FLASK_ENV=staging
   DEBUG=False
   DATABASE_URL=postgresql://user:pass@staging-db:5432/resume_builder
   ```

3. **Production Environment**
   ```yaml
   # .env.production
   FLASK_ENV=production
   DEBUG=False
   DATABASE_URL=postgresql://user:pass@prod-db:5432/resume_builder
   ```

### Environment-Specific Builds

```javascript
// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
    },
    server: {
      host: true,
      port: 5173
    }
  }
})
```

## 🔍 Security Scanning

### Dependency Scanning

```yaml
# GitHub Actions Security Scan
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    # Backend security scan
    - name: Run bandit security scan
      run: |
        cd backend
        pip install bandit
        bandit -r src/
    
    # Frontend security scan
    - name: Run npm audit
      run: |
        cd frontend
        npm audit
```

### Container Security

If using Docker:

```dockerfile
# Dockerfile.security
FROM python:3.11-slim

# Run security updates
RUN apt-get update && apt-get upgrade -y && apt-get clean

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Copy application
COPY --chown=app:app . /app
WORKDIR /app

# Install dependencies with security checks
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000
CMD ["python", "src/main.py"]
```

## 📢 Monitoring and Notifications

### Slack Notifications

```yaml
# GitHub Actions Slack Notification
notify-slack:
  runs-on: ubuntu-latest
  if: always()
  needs: [backend-test, frontend-test]
  steps:
    - name: Send Slack notification
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

```yaml
# GitHub Actions Email Notification
notify-email:
  runs-on: ubuntu-latest
  if: failure()
  needs: [deploy]
  steps:
    - name: Send email notification
      uses: dawidd6/action-send-mail@v3
      with:
        server_address: smtp.gmail.com
        server_port: 465
        username: ${{ secrets.EMAIL_USERNAME }}
        password: ${{ secrets.EMAIL_PASSWORD }}
        subject: Deployment Failed - AI Resume Builder
        body: Deployment to production failed. Please check the logs.
        to: team@example.com
        from: ci@example.com
```

### Health Check Monitoring

```python
# Backend health check endpoint with detailed metrics
@app.route('/health')
def health_check():
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': check_database(),
            'openai': check_openai(),
            'cache': check_cache()
        },
        'version': APP_VERSION,
        'uptime': get_uptime()
    }
    
    if not all(service['status'] == 'healthy' for service in health_status['services'].values()):
        health_status['status'] = 'degraded'
        return jsonify(health_status), 503
    
    return jsonify(health_status)
```

## 📈 Performance Monitoring Integration

### Prometheus Metrics

```python
# Add to backend for metrics collection
from prometheus_client import Counter, Histogram, generate_latest

# Define metrics
api_requests_total = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint'])
request_duration_seconds = Histogram('request_duration_seconds', 'Request duration', ['method', 'endpoint'])

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    request_duration = time.time() - request.start_time
    request_duration_seconds.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown'
    ).observe(request_duration)
    
    api_requests_total.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown'
    ).inc()
    
    return response

@app.route('/metrics')
def metrics():
    return generate_latest()
```

## 🔄 Best Practices

### Pipeline Optimization

1. **Caching Dependencies**
   ```yaml
   - name: Cache pip dependencies
     uses: actions/cache@v3
     with:
       path: ~/.cache/pip
       key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
   
   - name: Cache node modules
     uses: actions/cache@v3
     with:
       path: frontend/node_modules
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Parallel Execution**
   ```yaml
   # Run backend and frontend tests in parallel
   backend-test:
     # ... backend test configuration
   
   frontend-test:
     # ... frontend test configuration
   ```

3. **Conditional Execution**
   ```yaml
   # Only run deployment on main branch
   deploy:
     if: github.ref == 'refs/heads/main'
     # ... deployment steps
   ```

By implementing these CI/CD pipelines, you'll have a robust automated system for testing, building, and deploying your AI Resume Builder application with proper monitoring and notifications.