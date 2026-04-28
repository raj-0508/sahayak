# Sahayak Backend (Express + TypeScript)

This directory contains the API server for **Sahayak**, providing AI integration, user management, and classroom functionality.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB (Running locally or Atlas)
- Google Gemini API Key

### Installation
```bash
pnpm install
```

### Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Fill in the following:
- `MONGODB_URI`: Your MongoDB connection string.
- `GEMINI_API_KEY`: Your Google Gemini AI key.
- `JWT_SECRET`: A secure string for auth tokens.

### Development
```bash
pnpm dev
```
The server will run on [http://localhost:5000](http://localhost:5000).

## 🛠️ Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **Database**: MongoDB with Mongoose
- **Auth**: JWT, Bcrypt, Cookie-parser
- **File Handling**: Multer

## 🔗 Related
For the full project overview and frontend setup, please refer to the [Root README](../README.md).
