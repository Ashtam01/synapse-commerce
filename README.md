# 🧠 Synapse Commerce

> AI-Powered Semantic Product Search Engine with Conversational AI

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.126-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-purple?logo=openai)](https://openai.com)

## ✨ Features

- **🔍 Semantic Search** - Search by meaning, not keywords. Uses CLIP embeddings to understand the *vibe* of your query.
- **📷 Image Search** - Upload a photo and find visually similar products.
- **💬 Conversational AI** - Refine searches naturally: *"show me something cheaper"*, *"in blue color"*, *"more casual style"*
- **🎯 Hybrid Filtering** - Combine AI relevance with traditional filters (price, category)
- **🔄 Visual Match** - Find products similar to any item with one click

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│  AI Service     │
│   (Vite + TW)   │     │   (Port 5000)   │     │  (FastAPI 8000) │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                      │
                                 ▼                      ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    MongoDB      │     │  CLIP Model     │
                        │  (Products +    │     │ (Text + Image   │
                        │   Embeddings)   │     │  → 512D Vector) │
                        └─────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB (running locally or Atlas)
- OpenAI API Key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/synapse-commerce.git
cd synapse-commerce

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install

# Setup Python environment
cd ../ai-service
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Start Services

**Terminal 1 - AI Service:**
```bash
cd ai-service
source env/bin/activate
python main.py
```

**Terminal 2 - Backend:**
```bash
cd server
node index.js
```

**Terminal 3 - Frontend:**
```bash
cd client
npm run dev
```

### 4. Seed Database (First Run)

```bash
cd server
node seed.js
```

## 📁 Project Structure

```
synapse-commerce/
├── ai-service/           # Python FastAPI - CLIP model service
│   ├── main.py           # Vectorization endpoints
│   └── requirements.txt
├── server/               # Node.js Express - API server
│   ├── index.js          # Main routes
│   ├── seed.js           # Database seeder
│   └── services/
│       └── conversationService.js  # OpenAI conversation handler
├── client/               # React Vite - Frontend
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx      # Search homepage
│       │   └── Results.jsx   # Results + Chat UI
│       └── components/
│           └── ProductCard.jsx
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search/text` | Text-based semantic search |
| `POST` | `/api/search/image` | Image-based visual search |
| `POST` | `/api/search/converse` | Conversational AI search |
| `GET` | `/api/products/similar/:id` | Find similar products |
| `GET` | `/api/products` | List all products |

## 🧠 How Conversational AI Works

1. **User says:** "Show me something cheaper in blue"
2. **GPT-4o-mini extracts:**
   ```json
   {
     "searchQuery": "blue winter jacket casual",
     "filters": { "maxPrice": 70 },
     "intent": "refine"
   }
   ```
3. **CLIP generates** 512D vector from search query
4. **Cosine similarity** ranks products against query vector
5. **Results filtered** by extracted price/category constraints

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, shadcn/ui |
| Backend | Node.js, Express, Mongoose |
| AI Service | Python, FastAPI, Sentence-Transformers, CLIP |
| AI/LLM | OpenAI GPT-4o-mini |
| Database | MongoDB |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your portfolio!

---

Built with ❤️ using AI-powered semantic search
