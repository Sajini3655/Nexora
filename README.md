Nexora

Nexora is an AI-powered project and issue management system designed to improve team collaboration, streamline task management, and detect workflow blockers. It features AI-assisted chat, task summarization, and optional ticket creation for detected blockers.

Features

Project & task lifecycle management

AI-assisted task assignment and prioritization

Role-based dashboards: Admin, Manager, Developer, Client

Task-level chat with AI summarization and blocker detection

Natural language search for tasks and projects

Optional ticket creation for blockers

Tech Stack

Frontend: React + Material-UI

Backend: Spring Boot (main), Python + FastAPI (AI/chat)

Databases: PostgreSQL + MongoDB

AI Services: Groq API

Deployment: Docker / AWS / Firebase

Getting Started

Clone the repository

git clone https://github.com/yourusername/nexora.git
cd nexora


Frontend

cd frontend
npm install
npm start


Python AI backend

cd backend/ai
pip install -r requirements.txt
uvicorn main:app --reload


Spring Boot backend

cd backend/springboot
./mvnw spring-boot:run

Usage

Open the frontend in your browser

Start a chat with AI for task discussion and blocker detection

Decide whether to create tickets for blockers

