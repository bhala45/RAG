# CampusWise AI — Enterprise College RAG Knowledge Assistant

CampusWise AI is a full-stack, enterprise-grade Retrieval-Augmented Generation (RAG) platform designed specifically for college campuses. It allows students, faculty, and staff to ask complex academic and administrative queries and receive verified, hallucination-free answers derived strictly from official university documents (curricula, examination guidelines, hostel policies, placement criteria, and fee structures).

---

## 🏛️ Architecture & RAG Pipeline

```
[Official College PDFs]
        │
        ▼ (Multer Ingestion)
[pdf-parse Extraction & Cleaning]
        │
        ▼ (LangChain Text Splitters: ~500 tokens / 50 overlap)
[Semantic Text Chunks]
        │
        ▼ (Google Gemini: text-embedding-004)
[768-dim Vector Embeddings] ──► [MongoDB Atlas Database & Vector Search Index]
                                                     │
[Student Question] ──────────────────────────────────┤
        │                                            │
        ▼ (Gemini text-embedding-004)                │
[768-dim Query Vector]                               │
        │                                            │
        ▼                                            ▼
[Dense Vector Search ($vectorSearch)]   +   [Sparse Keyword Text Search ($text)]
        │                                            │
        └───────────────────┬────────────────────────┘
                            │
                            ▼
              [Reciprocal Rank Fusion (RRF)]
                            │
                            ▼ (Top-K Filtered Chunks)
        [Gemini 1.5 Flash System Prompt & Context Guard]
                            │
                            ▼
        [Real-Time Token Streaming via Server-Sent Events (SSE)]
                            │
                            ▼
          [Interactive Citations & Source Drawer UI]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Next.js (Pages Router), Tailwind CSS, Zustand, Axios, Lucide React Icons |
| **Backend** | Node.js, Express.js, Mongoose, Multer, `pdf-parse`, JSON Web Tokens (JWT), `bcryptjs`, `express-validator` |
| **AI & Embeddings** | Google Generative AI SDK (`@google/generative-ai`), LangChain Core Text Splitters (`@langchain/textsplitters`), `text-embedding-004` (768-dim), `gemini-1.5-flash` |
| **Database & Search** | MongoDB Atlas (M0 Free Tier supported) with Vector Search (`vector_index`), Text Indexing |
| **Streaming** | Server-Sent Events (SSE) for low-latency token streaming |

---

## 📋 Prerequisites

Before setting up the project locally, ensure you have:
1. **Node.js**: v18.0.0 or higher (v20+ recommended)
2. **MongoDB Atlas Account**: A free MongoDB Atlas cluster (M0 or higher) with Atlas Search & Vector Search support, or local MongoDB.
3. **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

---

## ⚙️ Local Setup Guide

### 1. Clone & Project Structure
```bash
git clone <repository-url>
cd campus-ai
```

### 2. Backend Setup (`server/`)

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env` parameters:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campuswise_db?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key_campuswise_ai_2026_change_in_production
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
   CLIENT_URL=http://localhost:3000
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

---

### 3. Frontend Setup (`client/`)

1. In a separate terminal, navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Verify `.env.local` content:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
5. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:3000`.*

---

## 🔍 MongoDB Atlas Vector Search Configuration

To enable vector similarity search on MongoDB Atlas:

1. In the MongoDB Atlas web dashboard, open your cluster and select **Atlas Search & Vector Search**.
2. Click **Create Search Index** ➔ Select **Atlas Vector Search** (JSON Editor).
3. Target the `documentchunks` collection in the `campuswise_db` database.
4. Set the index name to `vector_index` and use the following JSON definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.department"
    }
  ]
}
```

> **Note:** The backend contains an automatic in-memory fallback so the system remains fully functional in local development even before the Atlas vector index finishes building.

---

## 📡 API Endpoint Reference

### 🔐 Authentication (`/api/auth`)

#### `POST /api/auth/register`
Create a new student or administrator account.
- **Request Body:**
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@campus.edu",
    "password": "SecurePassword123!",
    "role": "student",
    "department": "CSE"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "665f1234abcd",
        "name": "Sarah Connor",
        "email": "sarah@campus.edu",
        "role": "student",
        "department": "CSE"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `POST /api/auth/login`
Authenticate credentials and obtain a signed JWT.
- **Request Body:**
  ```json
  {
    "email": "sarah@campus.edu",
    "password": "SecurePassword123!"
  }
  ```

#### `GET /api/auth/me`
Retrieve active user session profile. Requires `Authorization: Bearer <token>`.

---

### 📄 Document Ingestion & Management (`/api/documents`)

#### `POST /api/documents/upload`
Upload and vectorize an official PDF file (*Admin only*).
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: PDF document
  - `title`: `2026 Academic Regulations`
  - `department`: `General` (or `CSE`, `ECE`, `Mechanical`, `Admissions`, `Hostel`, `Placements`)
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Document uploaded, chunked, and vector-indexed successfully.",
    "data": {
      "document": {
        "_id": "665f5678efgh",
        "title": "2026 Academic Regulations",
        "fileName": "academic_regulations_2026.pdf",
        "department": "General",
        "totalChunks": 14,
        "status": "indexed"
      },
      "totalChunks": 14
    }
  }
  ```

#### `GET /api/documents`
List indexed documents with optional query filters: `?department=CSE&status=indexed`.

#### `GET /api/documents/:id/chunks`
Inspect semantic chunk text segments, page numbers, and 768-dim embedding previews (*Admin only*).

#### `DELETE /api/documents/:id`
Delete document and cascade-delete all associated vector chunks (*Admin only*).

---

### 💬 Chat & Retrieval-Augmented Generation (`/api/chat`)

#### `POST /api/chat/message`
Stream AI response to student query with live citations via Server-Sent Events (SSE).
- **Request Body:**
  ```json
  {
    "query": "What is the minimum attendance required to appear for semester end exams?",
    "departmentFilter": "General",
    "conversationId": "665f9012ijkl"
  }
  ```
- **SSE Stream Data Events:**
  - `data: {"type": "start", "message": "Retrieving context from campus documents..."}`
  - `data: {"type": "token", "token": "According"}`
  - `data: {"type": "token", "token": " to"}`
  - `data: {"type": "token", "token": " section 4.2..."}`
  - `data: {"type": "done", "sources": [{"documentId": "...", "title": "2026 Academic Regulations", "pageNumber": 12, "snippet": "A student must maintain a minimum attendance of 75%..."}], "confidenceScore": 0.89}`

#### `GET /api/chat/conversations`
Get conversation history for authenticated user.

#### `POST /api/chat/feedback`
Submit student satisfaction rating (`like` / `dislike`) for AI answers.

---

### 📊 Administrative Telemetry (`/api/admin`)

#### `GET /api/admin/analytics`
Fetch system overview, total queries answered, satisfaction rate, and department knowledge coverage.

#### `GET /api/admin/unhandled-queries`
Retrieve log of student queries that scored below the 0.6 similarity confidence threshold.

#### `PATCH /api/admin/unhandled-queries/:id`
Update status of unhandled query (`resolved` / `ignored`).

#### `GET /api/health`
System operational status and Gemini AI model check.

---

## 🛡️ Anti-Hallucination Guardrails

CampusWise AI incorporates strict prompting constraints:
1. **Context-Only Grounding**: The LLM is instructed to answer strictly based on retrieved document chunks.
2. **Missing Knowledge Catching**: If requested information is absent from university documents, the model responds:
   > *"I am sorry, but this information is not available in the college documents."*
3. **Low-Confidence Auditing**: Inquiries scoring `<0.6` vector similarity are automatically captured in the admin telemetry table for administrators to identify missing handbooks.

---

## 📄 License
This project is licensed under the ISC License.
