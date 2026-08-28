# SPEC.md — RAG-Based College Chatbot (CampusWise AI)

## Project Overview & Tech Stack

### Project Overview
CampusWise AI is a full-stack, enterprise-grade Retrieval-Augmented Generation (RAG) knowledge assistant for college campuses. The platform allows students to ask complex queries about admissions, exams, syllabi, fee structures, hostel policies, and campus events while retrieving verified context from uploaded official college documents. The system performs hybrid retrieval (vector similarity search + keyword matching), re-ranks candidate chunks, streams AI responses directly to the client with source attribution, handles unknown questions gracefully, and provides administrators with document management and query analytics.

### Tech Stack
* **Frontend:** React 19, Next.js (Pages Router), Tailwind CSS, Zustand, Axios, Socket.IO Client / EventSource, Lucide React Icons.
* **Backend:** Node.js, Express, Mongoose, MongoDB Atlas (M0 Free Tier with Vector Search Indexing), JSON Web Tokens (JWT), express-validator, bcryptjs, multer, pdf-parse.
* **AI & RAG Engine:** Google Generative AI SDK (`@google/generative-ai`), LangChain Core / Text Splitters (`@langchain/textsplitters`), Google Gemini API (`text-embedding-004` for 768-dim embeddings, `gemini-1.5-flash` for response generation).
* **Real-Time & Streaming:** Server-Sent Events (SSE) for streaming LLM tokens, WebSockets (Socket.IO) for admin live query feeds.

---

## Architecture, RAG Pipeline & Advanced Features

### Authentication & Authorization
* **Authentication:** JWT-based stateless authentication stored securely.
* **Role-Based Access Control (RBAC):**
  * **Student:** Can query the chatbot, view conversation history, select specific departments/categories, give feedback (thumbs up/down), and export chat logs.
  * **Admin:** Access to the document management portal, chunk inspector, analytics dashboard, system health checks, and unhandled query logs.

### Required RAG Ingestion & Query Pipeline
1. **Document Upload:** Admin uploads college PDF/DOCX files tagged with metadata (department, academic year, access level).
2. **Text Extraction & Cleaning:** Node.js `pdf-parse` extracts raw text, removes header/footer noise, and normalizes whitespaces.
3. **Recursive Chunking:** Text split via `@langchain/textsplitters` into chunks of ~500 tokens with a 50-token overlap to maintain context across boundaries.
4. **Vector Embedding:** Each chunk is passed to Gemini `text-embedding-004` to produce a 768-dimensional vector embedding.
5. **MongoDB Atlas Storage:** Document chunks, metadata, and vectors stored in MongoDB Atlas with a dedicated Vector Search Index (`cosine` distance).
6. **Hybrid Query Engine:** When a student asks a question:
   * **Dense Search:** Vector search on MongoDB Atlas using query vector.
   * **Sparse Search:** Text/Keyword search using MongoDB Text Index.
   * **Fusion & Re-Ranking:** Results combined via Reciprocal Rank Fusion (RRF) to score exact term matches (e.g., course codes, dates) alongside semantic concepts.
7. **Context Assembly & Prompting:** Top-k ranked chunks passed into a system prompt configured with anti-hallucination guardrails.
8. **Streaming Generation:** Response streamed back via Server-Sent Events with cited source references (Document Name, Page Number, Chunk ID).

### Implemented Advanced Bonus Features
* **Hybrid Search (Dense + Sparse):** Dual retrieval to guarantee accurate lookups for specific codes (`CS8501`) and vague conceptual questions.
* **Re-Ranking Pipeline:** Hybrid search outputs scored and filtered before passing to the Gemini LLM context window.
* **Source Highlighting & Snippet Attribution:** Every answer includes interactive badge references showing exact text excerpts and source pages.
* **Streaming AI Responses:** Real-time token streaming using SSE for minimal end-to-end latency perception.
* **Department-Wise Filtering:** Metadata filtering (`$eq` / `$in` queries) limits context retrieval to relevant domains (e.g., "Computer Science", "Hostel Rules").
* **Admin Analytics & Unknown Query Logging:** Logs low-confidence vector matches (<0.6 similarity score) so admins know which FAQs or documents need to be uploaded.

---

## Database Collections & Schemas

### Database Collections (MongoDB Atlas)

#### Users
* `_id`: ObjectId
* `name`: String (required)
* `email`: String (unique, required)
* `password`: String (select: false, hashed with bcrypt cost factor 12)
* `role`: String (enum: `['student', 'admin']`, default: `'student'`)
* `department`: String
* `createdAt`: Timestamp

#### Documents
* `_id`: ObjectId
* `title`: String (required)
* `fileName`: String
* `fileUrl`: String
* `department`: String (enum: `['General', 'CSE', 'ECE', 'Mechanical', 'Admissions', 'Hostel', 'Placements']`)
* `fileType`: String (`pdf`, `docx`, `txt`)
* `totalChunks`: Number
* `uploadedBy`: ObjectId (ref: `Users`)
* `status`: String (enum: `['processing', 'indexed', 'failed']`)
* `createdAt`: Timestamp

#### DocumentChunks
* `_id`: ObjectId
* `documentId`: ObjectId (ref: `Documents`, indexed)
* `chunkIndex`: Number
* `content`: String (raw chunk text)
* `pageNumber`: Number
* `metadata`: Object (`{ department, documentTitle, category }`)
* `embedding`: Array of Numbers (768 dimensions, indexed with MongoDB Atlas Vector Search index `vector_index`)
* `createdAt`: Timestamp

#### Conversations
* `_id`: ObjectId
* `userId`: ObjectId (ref: `Users`)
* `title`: String
* `departmentFilter`: String
* `messages`: Array of Objects:
  * `sender`: String (enum: `['user', 'assistant']`)
  * `text`: String
  * `sources`: Array of Objects (`{ documentId, title, pageNumber, snippet }`)
  * `confidenceScore`: Number
  * `feedback`: String (enum: `['like', 'dislike', 'none']`)
  * `timestamp`: Timestamp
* `createdAt`: Timestamp

#### UnhandledQueries (Analytics)
* `_id`: ObjectId
* `queryText`: String
* `userId`: ObjectId (ref: `Users`)
* `highestSimilarityScore`: Number
* `status`: String (enum: `['pending_review', 'resolved', 'ignored']`)
* `createdAt`: Timestamp

---

## API Endpoints

### Auth & User Profile
* `POST /api/auth/register` — Register new user account.
* `POST /api/auth/login` — Authenticate user and issue JWT.
* `GET /api/auth/me` — Fetch active session profile.

### Document Management (Admin Only)
* `POST /api/documents/upload` — Upload PDF, extract text, chunk, embed via Gemini, and store in MongoDB.
* `GET /api/documents` — List all uploaded knowledge base files with status filters.
* `GET /api/documents/:id/chunks` — Inspect extracted chunks and embeddings for debugging.
* `DELETE /api/documents/:id` — Delete document and associated vector chunks from MongoDB.

### Chat & Retrieval Engine
* `POST /api/chat/message` — Send query, run hybrid search + re-ranking, stream Gemini response via SSE.
* `GET /api/chat/conversations` — Fetch user conversation history.
* `GET /api/chat/conversations/:id` — Load specific chat transcript with citations.
* `POST /api/chat/feedback` — Submit thumbs up/down rating for an AI message.

### Admin Analytics & System Health
* `GET /api/admin/analytics` — Return query stats, document breakdown, and feedback metrics.
* `GET /api/admin/unhandled-queries` — Fetch queries that yielded low vector match confidence.
* `GET /api/health` — Vector DB connection check and Gemini API operational check.

---

## Frontend Pages & Components

### Application Pages (Next.js Pages Router)
* `/` — Landing page highlighting campus AI features, instant query capabilities, and login CTA.
* `/login` — User authentication form with JWT management and Zustand persistence.
* `/register` — Account creation page.
* `/chat` — Main student interface featuring interactive chat timeline, source citation side panel, streaming response reader, department filter dropdown, and conversation history sidebar.
* `/admin/documents` — Admin file upload zone, ingestion progress bar, chunk inspector modal, and document deletion table.
* `/admin/analytics` — Admin telemetry console showing query hit rates, unhandled questions log, system response times, and feedback trends.

### Key Components Structure
```text
client/src/
├── components/
│   ├── AppShell/ (Layout, Navigation, Role-based Sidebar)
│   ├── Chat/
│   │   ├── ChatWindow.js (Message timeline)
│   │   ├── MessageItem.js (Markdown parser + source badges)
│   │   ├── SourceDrawer.js (Displays original document snippet & page number)
│   │   ├── DepartmentFilter.js (Metadata selector)
│   │   └── FeedbackButtons.js (Thumbs up/down controller)
│   ├── Admin/
│   │   ├── FileUploader.js (Drag-and-drop PDF dropzone)
│   │   ├── ChunkViewerModal.js (Inspect chunks & vectors)
│   │   ├── UnhandledQueriesTable.js (Missing knowledge logger)
│   │   └── MetricsGrid.js (Analytics summary stats)
│   └── Common/
│       ├── ProtectedRoute.js
│       └── LoadingSkeleton.js