# AI Interview Engine

The Adaptive Cognitive Interview Engine provides AI-powered mock interview practice for students. It evaluates answers using semantic similarity, concept detection, and communication analysis.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  InterviewLobby → InterviewSession → InterviewResults           │
│                                      InterviewHistory           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                     Node.js Backend                             │
│  routes.js → controller.js → service.js                         │
│  Models: InterviewSession, QuestionBank, ConceptGraph            │
│  Integration: aiInterviewService.js                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (localhost:8000)
┌──────────────────────────▼──────────────────────────────────────┐
│                  Python AI Microservice                          │
│  FastAPI + faster-whisper + spaCy + sentence-transformers        │
│  /api/transcribe (STT) + /api/evaluate (scoring)                │
└─────────────────────────────────────────────────────────────────┘
```

## Interview Flow

1. **Student opens lobby** → selects topic (React, Node.js, DSA) and difficulty (easy/medium/hard)
2. **Starts session** → `POST /api/interviews/start` creates a session with 5 random questions
3. **Answers questions** → types answer → `POST /api/interviews/:id/answer`
4. **AI evaluates** → Node backend sends transcript to Python service for scoring
5. **Scores flash** → student sees Technical/Communication/Relevance scores for 3 seconds
6. **Next question** → auto-advances until all questions answered
7. **Completes interview** → `POST /api/interviews/:id/complete` calculates overall scores
8. **Views results** → score ring, category breakdown, weak concepts, per-question details

## Scoring

Each answer is scored on 3 dimensions:

| Dimension         | How it's calculated                                                                  | Range  |
| ----------------- | ------------------------------------------------------------------------------------ | ------ |
| **Technical**     | Cosine similarity between student answer and expected answer (sentence-transformers) | 0–100% |
| **Communication** | Filler word count, sentence structure, vocabulary diversity (spaCy NLP)              | 0–100% |
| **Relevance**     | Percentage of expected concepts detected in the answer                               | 0–100% |

**Overall score** = weighted average of all answers across all dimensions.

## Database Models

### InterviewSession

Stores each interview a student takes — topic, difficulty, answers array with per-question scores and concepts, overall score, weak concepts, and duration.

### QuestionBank

Pre-stored interview questions organized by topic, subtopic, and difficulty. Each question has expected answer text and expected concepts for evaluation.

### ConceptGraph

Topic-level concept trees (e.g., React → Hooks → useEffect) used for adaptive questioning and weak concept detection.

## API Endpoints

| Method | Endpoint                       | Description                                       |
| ------ | ------------------------------ | ------------------------------------------------- |
| `GET`  | `/api/interviews/topics`       | List available topics with question counts        |
| `GET`  | `/api/interviews/ai-status`    | Check Python AI service health                    |
| `POST` | `/api/interviews/start`        | Start new session (body: `{ topic, difficulty }`) |
| `GET`  | `/api/interviews/:id`          | Get session details                               |
| `POST` | `/api/interviews/:id/answer`   | Submit answer (body: `{ transcript }`)            |
| `POST` | `/api/interviews/:id/complete` | End interview, calculate final scores             |
| `GET`  | `/api/interviews/:id/results`  | Get detailed results                              |
| `GET`  | `/api/interviews/history`      | Get paginated interview history                   |

## Frontend Routes

| Route                         | Page             | Description                                                 |
| ----------------------------- | ---------------- | ----------------------------------------------------------- |
| `/mock-interview`             | InterviewLobby   | Topic selection, difficulty, persona picker, camera preview |
| `/mock-interview/history`     | InterviewHistory | Paginated list of past interviews                           |
| `/mock-interview/:id`         | InterviewSession | Q&A flow with timer, progress bar, score feedback           |
| `/mock-interview/:id/results` | InterviewResults | Score dashboard with ring chart and per-question breakdown  |

## Question Bank

Questions are stored in `server/src/modules/interviews/seed/questions.json` and seeded into MongoDB.

**Current coverage:**

| Topic     | Easy | Medium | Hard | Total  |
| --------- | ---- | ------ | ---- | ------ |
| React     | 5    | 6      | 5    | 16     |
| Node.js   | 5    | 5      | 5    | 15     |
| DSA       | 5    | 5      | 5    | 15     |
| **Total** | 15   | 16     | 15   | **46** |

### Adding New Topics

To add a new topic (e.g., Python):

1. Add questions to `server/src/modules/interviews/seed/questions.json`:

   ```json
   {
     "topic": "python",
     "subtopic": "basics",
     "difficulty": "easy",
     "questionText": "What are Python decorators?",
     "expectedAnswer": "Decorators are functions that modify...",
     "expectedConcepts": ["decorators", "functions", "wrapping"]
   }
   ```

2. Run the seed script:

   ````bash

      ```bash
      cd server
      node src/modules/interviews/seed/seedInterviewData.js
   ````

## Fail-Soft Mode

When the Python AI microservice is unreachable:

- The Node backend automatically falls back to **mock evaluation**
- Mock scores are generated based on answer length and keyword matching
- Students can still practice interviews without the AI service running
- A warning is logged server-side for monitoring

## Environment Variables

| Variable                          | Default                 | Description                         |
| --------------------------------- | ----------------------- | ----------------------------------- |
| `INTERVIEW_AI_URL`                | `http://localhost:8000` | Python AI service URL               |
| `INTERVIEW_AI_TIMEOUT`            | `10000`                 | Evaluation request timeout (ms)     |
| `INTERVIEW_AI_TRANSCRIBE_TIMEOUT` | `30000`                 | Audio transcription timeout (ms)    |
| `WHISPER_MODEL_SIZE`              | `base`                  | Whisper model size (Python service) |

## Related PRs

| PR   | Description                                                   |
| ---- | ------------------------------------------------------------- |
| #333 | MongoDB models (InterviewSession, QuestionBank, ConceptGraph) |
| #335 | Interview session API with question bank seed data            |
| #338 | Python AI microservice — FastAPI + speech-to-text             |
| #339 | Python AI microservice — answer evaluation service            |
| #342 | Node.js ↔ Python integration hardening                        |
| #346 | Frontend UI — Q&A flow, results dashboard, history            |
