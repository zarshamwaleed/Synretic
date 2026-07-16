@"
# Synretic - Multi-Agent Retail Orchestrator

## 🎯 Overview
Synretic is an AI-powered retail orchestrator using multiple specialized agents coordinated by a Supervisor Agent.

## 🏗️ Architecture
- **Supervisor Agent** - Manages and routes tasks
- **Recommendation Agent** - Product recommendations using ChromaDB
- **Inventory Agent** - Stock management with PostgreSQL
- **Payment Agent** - Payment processing with retry logic
- **Support Agent** - Customer service and returns

## 🛠️ Tech Stack
- LangGraph - Agent orchestration
- FastAPI - Backend API
- React - Frontend UI
- PostgreSQL - Persistent storage
- ChromaDB - Vector search

## 🚀 Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (Neon free tier)

### Installation

1. Clone repository
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate