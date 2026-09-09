# Customer Support Email Agent 🤖

An AI-powered email agent built with **LangGraph**, **Google Gemini**, and **MongoDB Atlas**.

It reads customer emails → classifies them → searches your company knowledge base → drafts professional replies.

---

## Architecture

```
Customer Email
      │
      ▼
POST /process-email
      │
      ▼
LangGraph Agent
  read_email → classify_intent
       ├── question/feature ──→ search_documentation (MongoDB Atlas vector search)
       ├── bug              ──→ bug_tracking (creates ticket)
       └── billing/critical ──→ human_review (pauses, waits for approval)
                                      ↓
                               draft_response → send_reply
```

---

## Prerequisites

| Requirement | Where to get it |
|-------------|----------------|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Google Gemini API key | https://aistudio.google.com/app/apikey |
| MongoDB Atlas account | https://cloud.mongodb.com (free M0 cluster works) |

---

## Step 1 — MongoDB Atlas Setup (one-time)

1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free **M0 cluster** (if you don't have one)
3. Go to **Database → Browse Collections** and create:
   - Database: `email_agent_db`
   - Collection: `company_knowledge`
4. Go to **Atlas Search → Create Search Index**:
   - Index name: `vector_index`
   - Select collection: `email_agent_db.company_knowledge`
   - Use this JSON definition:
     ```json
     {
       "mappings": {
         "dynamic": true,
         "fields": {
           "embedding": {
             "dimensions": 768,
             "similarity": "cosine",
             "type": "knnVector"
           }
         }
       }
     }
     ```
5. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all, for Docker)
6. Go to **Database Access** → Create a user with read/write access
7. Go to **Clusters → Connect** → Copy your connection string (looks like `mongodb+srv://...`)

---

## Step 2 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in:
```
GOOGLE_API_KEY=AIza...your_key...
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 3 — Run with Docker

```bash
docker-compose up --build
```

The API will be live at **http://localhost:8000**

Interactive docs (Swagger UI): **http://localhost:8000/docs**

---

## Step 4 — Load Your Company Knowledge Base

### Option A: Upload local files (PDF or TXT)
```bash
curl -X POST http://localhost:8000/ingest/files \
  -F "files=@/path/to/your/company_faq.pdf" \
  -F "files=@/path/to/product_manual.txt"
```

### Option B: Ingest web pages (company URLs)
```bash
curl -X POST http://localhost:8000/ingest/urls \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://your-company.com/faq",
      "https://your-company.com/pricing",
      "https://your-company.com/docs/getting-started"
    ]
  }'
```

You can mix both. Run ingestion as many times as you want with new documents.

---

## Step 5 — Process a Customer Email

```bash
curl -X POST http://localhost:8000/process-email \
  -H "Content-Type: application/json" \
  -d '{
    "email_content": "Hi, I cannot figure out how to reset my password. The reset email never arrives.",
    "sender_email": "customer@example.com",
    "email_id": "EMAIL-001"
  }'
```

**Example response:**
```json
{
  "email_id": "EMAIL-001",
  "thread_id": "abc-123-...",
  "draft_response": "Dear Customer, Thank you for reaching out...",
  "classification": {
    "intent": "question",
    "urgency": "medium",
    "topic": "password reset",
    "summary": "Customer cannot receive password reset email"
  },
  "requires_human_review": false
}
```

---

## Step 6 — Human Review (for high-urgency / billing emails)

If `requires_human_review: true`, the agent has paused. Review and resume:

```bash
# Approve and optionally edit the response
curl -X POST http://localhost:8000/resume-email \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "abc-123-...",
    "approved": true,
    "edited_response": "We sincerely apologize and have initiated an immediate refund..."
  }'

# Reject — human agent handles it directly
curl -X POST http://localhost:8000/resume-email \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "abc-123-...",
    "approved": false
  }'
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| POST | `/process-email` | Run agent on a customer email |
| POST | `/resume-email` | Resume after human review |
| POST | `/ingest/urls` | Ingest company web pages |
| POST | `/ingest/files` | Upload PDF/TXT files |

---

## Stopping the Service

```bash
docker-compose down
```

Uploaded files are stored in `./uploads/` on your machine and persist between restarts.

---

## Production Notes

- **Email sending**: Replace the `print()` in `state.py → send_reply()` with your email provider (SendGrid, AWS SES, etc.)
- **Bug tracking**: Replace the stub in `state.py → bug_tracking()` with your issue tracker (Jira, GitHub Issues, etc.)
- **Customer history**: Add a CRM lookup in `state.py → classify_intent()` to populate `customer_history`
