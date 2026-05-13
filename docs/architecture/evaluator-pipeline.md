# Evaluator Pipeline Architecture

## Overview

The resume-to-job-description matching system uses a **hybrid evaluation pipeline** that combines multiple evaluators to produce a comprehensive matching score. Each evaluator focuses on a different dimension of candidate-job fit.

## Pipeline Flow

```
Input Texts (Resume + Job Description)
    ↓
┌─────────────────┐
│  Parser Layer   │  ← PDF/text extraction, skill extraction
│  (parseResume)  │
└────────┬────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│                    Evaluator Pipeline                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │Skill Match  │  │Keyword Match│  │ Experience Match│ │
│  │  (50%)      │  │  (10%)      │  │    (20%)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Semantic Match (20%)                       │  │
│  │  Embedding-based semantic similarity using        │  │
│  │  OpenAI text-embedding-3-small + cosine sim      │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                    Aggregator                             │
│  weightedScore = Σ(evaluatorScore × evaluatorWeight)   │
│  finalScore = clamp(weightedScore, 0, 100)               │
└──────────────────────────┬───────────────────────────────┘
                           ↓
                    Final Score (0-100)
                           ↓
              Response + Persistence
```

## Evaluator Details

### 1. Skill Match Evaluator
- **Purpose:** Exact skill overlap between resume and job requirements
- **Weight:** 0.50 (50%)
- **Input:** `resumeSkills[]`, `jobSkills[]`
- **Output:** Score, matched/missing/extra skills, feedback
- **File:** `ai-ml/evaluators/skillEvaluator.js`

### 2. Keyword Match Evaluator
- **Purpose:** Keyword presence analysis from job description text
- **Weight:** 0.10 (10%)
- **Input:** `resumeText`, `jobDescription`
- **Output:** Score, matched/missing keywords, feedback
- **File:** `ai-ml/evaluators/keywordEvaluator.js`

### 3. Experience Match Evaluator
- **Purpose:** Years of experience comparison
- **Weight:** 0.20 (20%)
- **Input:** `candidateExperienceText`, `jobDescription`
- **Output:** Score, candidate/required/gap years, feedback
- **File:** `ai-ml/evaluators/experienceEvaluator.js`

### 4. Semantic Match Evaluator
- **Purpose:** Semantic similarity using embedding vectors
- **Weight:** 0.20 (20%)
- **Input:** `resumeText`, `jobDescription`
- **Output:** Score (0-100), similarity score, contextual feedback
- **File:** `ai-ml/evaluators/semanticEvaluator.js`
- **Model:** OpenAI `text-embedding-3-small`
- **Algorithm:** Cosine similarity between vector embeddings

## Weight Configuration

All evaluator weights are centralized in `ai-ml/config/weights.config.js`:

```javascript
skill: 0.50      // 50%
keyword: 0.10   // 10%
experience: 0.20 // 20%
semantic: 0.20   // 20%
// Total: 1.0 (100%)
```

Weights are designed to prioritize skill matching while ensuring semantic alignment contributes meaningfully to the final score.

## Error Handling & Pipeline Safety

The pipeline (`ai-ml/pipeline/runPipeline.js`) provides:

1. **Input Validation:** Zod schema validation for all evaluator outputs
2. **Graceful Degradation:** Individual evaluator failures don't crash the pipeline
3. **Error Propagation:** API/embedding errors bubble up for safe handling by caller
4. **Missing Input Handling:** Evaluators return safe default scores for missing inputs

## Integration Points

### Server Adapter Layer
**File:** `server/src/modules/resumes/evaluatorAdapters.js`

Wraps raw evaluators to conform to pipeline contract:
- Adds `key`, `label`, `weightedScore`, `summary`, `details`, `meta`
- Transforms raw evaluator output to `evaluatorResultSchema` format
- Exports `resumeEvaluatorAdapters` array for pipeline consumption

### Controller Integration
**File:** `server/src/modules/resumes/controller.js`

```javascript
const evaluators = [];
if (parsedData.skills?.length && jobSkills.length) {
  evaluators.push(skillMatchEvaluator);
}
if (trimmedJobDescription && parsedData.resumeText) {
  evaluators.push(keywordMatchEvaluator);
  evaluators.push(semanticMatchEvaluator); // Semantic added here
}
evaluators.push(experienceMatchEvaluator);

const pipelineResult = await runPipeline({ evaluators, context });
```

## Semantic Evaluator Deep Dive

### Why Semantic Matching?
Traditional keyword matching fails when:
- Synonyms are used ("workflow orchestration" vs "pipeline automation")
- Conceptual alignment exists without exact word overlap
- Context matters more than keyword density

### How It Works
1. **Text Embedding:** Resume and job description texts are converted to 1536-dimensional vectors using OpenAI embeddings
2. **Cosine Similarity:** Vector angle similarity calculated (range: -1 to 1, typically 0 to 1 for semantic embeddings)
3. **Normalization:** Similarity clamped to [0, 1] and scaled to [0, 100]
4. **Feedback Generation:** Tiered messages based on score thresholds:
   - 85+: "Strong semantic alignment..."
   - 65+: "Moderate semantic alignment..."
   - 40+: "Some semantic overlap..."
   - <40: "Low semantic alignment..."

### API Error Handling
- Missing `HF_API_TOKEN` → Throws error for pipeline handling
- API rate limits/timeouts → Throws error for pipeline handling
- Invalid text inputs → Returns safe 0 score with explanatory feedback

## Testing

Unit tests for each evaluator are located in `ai-ml/evaluators/__tests__/`:

- `skillEvaluator.test.js`
- `keywordEvaluator.test.js`
- `experienceEvaluator.test.js`
- `semanticEvaluator.test.js` (mocked OpenAI embeddings for deterministic CI)

Pipeline tests in `ai-ml/pipeline/__tests__/`:
- `runPipeline.test.js`
- `evaluatorContract.test.js`
- `aggregator.test.js`

## Future Enhancements

Potential additions to the pipeline:
- Education match evaluator
- Domain-specific semantic models
- Multi-language embedding support
- Fine-tuned embedding models for recruitment
