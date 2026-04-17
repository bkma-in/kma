# KMA Application

Full-stack application for the Kerala Mathematical Association.

## Project Structure

- **frontend/**: React + TypeScript + Vite + Tailwind CSS.
- **backend/**: Python API structure (FastAPI).

## Getting Started

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install requirements:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
3. Run the API:
   ```bash
   uvicorn main:app --reload
   ```

## Development
- Only one `.git` is maintained at the root.
- Centralize environment variables in the root `.env` file.
