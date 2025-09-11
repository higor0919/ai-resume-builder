# AI Resume Builder

An AI-powered resume builder with real-time ATS scoring and optimization. Get 3x more interviews with AI-optimized resumes.

![AI Resume Builder Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=AI+Resume+Builder+Demo)

## 🚀 Features

- **Real-time ATS Scoring**: Get instant feedback on how well your resume matches job descriptions
- **AI-Powered Optimization**: Smart suggestions to improve your resume content
- **Job Description Analysis**: Extract key requirements and keywords from job postings
- **Professional Templates**: Clean, ATS-friendly resume layouts
- **"Fix with AI" Functionality**: One-click improvements for resume sections
- **3x Interview Guarantee**: Track your success with built-in analytics

## 🛠️ Tech Stack

### Frontend
- **React** with Next.js
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons

### Backend
- **Flask** (Python)
- **OpenAI GPT-4** API
- **SQLite** database
- **Flask-CORS** for cross-origin requests

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **pnpm** (for frontend package management)
- **OpenAI API Key**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/higor0919/ai-resume-builder.git
cd ai-resume-builder
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Frontend Setup

```bash
cd frontend
pnpm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python src/main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔧 Configuration

### OpenAI API Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file
3. Ensure you have sufficient credits for API calls

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_API_BASE` | OpenAI API base URL | Yes |

## 📚 API Documentation

### Core Endpoints

#### Analyze Resume
```http
POST /api/analyze-resume
Content-Type: application/json

{
  "resume_content": "Your resume text here...",
  "job_description": "Job posting text here..."
}
```

#### Optimize Content
```http
POST /api/optimize-content
Content-Type: application/json

{
  "content": "Content to optimize...",
  "type": "bullet_point"
}
```

#### Extract Job Keywords
```http
POST /api/extract-job-keywords
Content-Type: application/json

{
  "job_description": "Job posting text here..."
}
```

## 🏗️ Project Structure

```
ai-resume-builder/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── assets/          # Static assets
│   │   └── App.jsx          # Main application component
│   ├── package.json
│   └── README.md
├── backend/                  # Flask backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database models
│   │   └── main.py          # Application entry point
│   ├── requirements.txt
│   └── README.md
├── docs/                     # Documentation files
└── README.md                 # This file
```

## 🎯 Usage Guide

### 1. Create Your Resume
- Start with the resume editor
- Input your professional information
- Use the real-time preview to see formatting

### 2. Analyze Against Job Descriptions
- Paste a job description in the analyzer
- Get instant ATS score and feedback
- See missing keywords highlighted

### 3. Optimize with AI
- Click "Fix with AI" for specific suggestions
- Review and apply AI-generated improvements
- Track your progress with updated scores

### 4. Export and Apply
- Download your optimized resume
- Apply to jobs with confidence
- Track your interview success rate

## 🚀 Deployment

For comprehensive deployment instructions, see our [Deployment Guide](DEPLOYMENT_GUIDE.md).

### Quick Deployment Options

#### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
# Deploy to Vercel or your preferred platform
```

### Backend Deployment (Railway/Render)

```bash
cd backend
# Add Procfile for deployment
echo "web: python src/main.py" > Procfile
# Deploy to Railway, Render, or your preferred platform
```

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get up and running in 5 minutes
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [API Documentation](#-api-documentation) - Details on all available endpoints
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Solutions for common issues
- [Scaling Guide](SCALING_GUIDE.md) - Performance and scaling instructions
- [CI/CD Guide](CI_CD_GUIDE.md) - Automated testing and deployment pipelines
- [Full Documentation](DOCUMENTATION.md) - Complete documentation overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Documentation](DOCUMENTATION.md)
2. Review the [Troubleshooting Guide](TROUBLESHOOTING.md)
3. Check the [Issues](https://github.com/higor0919/ai-resume-builder/issues) page
4. Create a new issue with detailed information

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4 API
- The React and Flask communities
- All contributors and testers

---

**Built with ❤️ to help job seekers land their dream jobs**

