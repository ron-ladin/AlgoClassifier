# AlgoClassifier

AlgoClassifier is a full-stack web application designed for classifying, storing, and analyzing algorithmic problems. It features an AI-driven backend for categorization and a modern, responsive frontend for users to manage their problem sets.

## Architecture
- **Backend**: FastAPI (Python), MongoDB (Motor), JWT Authentication, Cloudinary (Image handling), Google GenAI for auto-classification.
- **Frontend**: React, Vite, TypeScript, TailwindCSS, React Router.

## Features
- Secure User Authentication (JWT + bcrypt).
- Problem categorization (by topics, difficulty).
- Image uploads powered by Cloudinary.
- Smart problem parsing and tag generation.
- Real-time dashboard and history logs.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- MongoDB instance (local or Atlas)

### 1. Setup Backend
```bash
cd algo_classifier
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run server
uvicorn app.main:app --reload
```
API Documentation will be available at: http://localhost:8000/docs

### 2. Setup Frontend
```bash
cd frontend
# Install packages
npm install
# Run development server
npm run dev
```
The application will be accessible at: http://localhost:5173

---
**Note:** Ensure you configure `.env` in both folders referencing your MongoDB URI, JWT Secret, Cloudinary API keys, and Google GenAI API key.

