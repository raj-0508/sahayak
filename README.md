# <div align="center">🚀 Sahayak</div>
<div align="center"><strong>AI-Powered Teaching Assistant Platform</strong></div>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</div>

---

## 📖 Overview

**Sahayak** (meaning *Helper* in Hindi) is a comprehensive educational platform designed specifically for multi-grade classrooms in India. It leverages the power of **Google Gemini AI** to bridge the gap between teachers and students, providing a modern, interactive, and culturally relevant learning experience.

Whether it's generating lesson plans in seconds, visualizing complex concepts through AI-driven mind maps, or engaging students with AI-powered games, Sahayak is built to empower teachers and transform the way education is delivered.

---

## ✨ Key Features

### 🤖 AI-Powered Suite
*   **Ask Ganesha AI**: An intelligent chat assistant that provides instant explanations, answers questions, and helps both students and teachers.
*   **Smart Content Generator**: Instantly create summaries, lesson plans, and practice materials tailored to specific subjects and grades.
*   **Concept Visualizer**: Turn abstract topics into interactive visual maps to help students grasp complex ideas faster.
*   **Automated Worksheets**: Generate subject-specific worksheets and assignments with AI-driven question generation.
*   **AI Explainers**: Deep-dive into any topic with simplified, AI-generated explanations and real-world examples.

### 👨‍🏫 Teacher Empowerment
*   **Class Management**: Create and manage multiple subjects and classes with ease.
*   **Join Requests**: Approve or reject student requests to join specific classes.
*   **Material Sharing**: Instantly share notes, AI-generated content, and assignments with students.
*   **Performance Analytics**: Monitor student progress through detailed reports and test analytics.

### 🎓 Student Engagement
*   **Interactive Learning**: Access subject-wise materials and interactive AI tools from a personalized dashboard.
*   **Assessments**: Take online tests and track scores in real-time.
*   **Progress Tracking**: Visualize learning growth across different subjects.

### 🛡️ Admin Control
*   **Comprehensive Management**: Full control over users (Students/Teachers) and subjects.
*   **System Monitoring**: Real-time logs and activity tracking.
*   **Data Portability**: Export user and class data to CSV for external reporting.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/), [React 19](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Mongoose ODM) |
| **AI Engine** | [Google Gemini AI SDK](https://ai.google.dev/) |
| **Auth** | JWT (JSON Web Tokens), HttpOnly Cookies, Bcrypt |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |

---

## 📂 Project Structure

```text
sahayak/
├── frontend/             # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/          # App Router (Pages & API)
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and data fetching
│   └── public/           # Static assets
└── backend/              # Express + TypeScript Backend
    ├── src/
    │   ├── controllers/  # Request handlers
    │   ├── models/       # Mongoose schemas
    │   ├── routes/       # API endpoints
    │   ├── middleware/   # Auth & Validation
    │   └── server.ts     # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v20+)
*   pnpm (recommended) or npm
*   MongoDB Atlas account or local instance
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sahayak.git
cd sahayak
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Fill in your environment variables:
   * `MONGODB_URI`
   * `GEMINI_API_KEY`
   * `JWT_SECRET`

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

### 4. Running the Project
You can run both servers simultaneously using the root command (if configured) or in separate terminals:

**Backend:**
```bash
cd backend
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm dev
```
The application will be available at `http://localhost:9002`.

---

## 🔑 Environment Variables

The backend requires the following variables in `.env`:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini AI API Key |
| `MONGODB_URI` | Connection string for MongoDB |
| `JWT_SECRET` | Secret key for JWT signing |
| `FRONTEND_URL` | URL of the frontend (default: `http://localhost:9002`) |

---

## 👤 User Roles & Credentials

For testing purposes, you can use the seeding script or register new accounts.

| Role | Capabilities |
| :--- | :--- |
| **Admin** | Manage users, subjects, logs, and exports. |
| **Teacher** | Create classes, generate AI content, manage students. |
| **Student** | Join classes, view materials, use AI tools, take tests. |

---



<div align="center">
  Developed with ❤️ by Raj Singhaniya<br/>
  <strong>Empowering Teachers, Transforming Education 🚀</strong>
</div>
