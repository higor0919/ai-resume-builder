# 🚀 Quick Start Guide

Get the AI Resume Builder running in under 5 minutes!

## Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- OpenAI API Key

## One-Command Setup

```bash
git clone https://github.com/higor0919/ai-resume-builder.git
cd ai-resume-builder
./setup.sh
```

## Manual Setup

### 1. Clone & Setup Environment

```bash
git clone https://github.com/higor0919/ai-resume-builder.git
cd ai-resume-builder
cp .env.example .env
```

### 2. Add Your OpenAI API Key

Edit `.env` file:
```bash
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**Frontend:**
```bash
cd frontend
npm install  # or pnpm install
cd ..
```

### 4. Run the Application

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
python src/main.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev  # or pnpm run dev
```

## 🎉 You're Ready!

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔧 Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
cd backend && source venv/bin/activate && pip install -r requirements.txt
```

**"OpenAI API key not found":**
- Check your `.env` file
- Ensure `OPENAI_API_KEY` is set correctly

**Port already in use:**
- Kill existing processes: `pkill -f "python src/main.py"`
- Or use different ports in the configuration

### Getting Help

1. Check the [main README](README.md)
2. Review the [documentation](docs/)
3. Open an issue on GitHub

## 🎯 Next Steps

1. **Test the app** with sample resume content
2. **Customize** the AI prompts in `backend/src/routes/ai.py`
3. **Deploy** to production using the deployment guides
4. **Contribute** improvements back to the project

Happy resume building! 🎉

