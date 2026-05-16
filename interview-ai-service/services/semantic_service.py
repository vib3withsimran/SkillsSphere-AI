import os

# Prevent Transformers from importing TensorFlow / Keras (not needed here).
# This avoids crashes on environments that have Keras 3 installed without tf-keras.
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TRANSFORMERS_NO_FLAX", "1")

from sentence_transformers import SentenceTransformer, util

# Load model once at startup
print("[semantic] Loading sentence-transformers model: all-MiniLM-L6-v2")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("[semantic] Model loaded successfully")


def compute_similarity(transcript: str, expected_answer: str) -> float:
    """
    Compute semantic similarity between the student's answer and the expected answer.

    Uses cosine similarity on sentence embeddings from all-MiniLM-L6-v2.

    Args:
        transcript: The student's answer text.
        expected_answer: The ideal/expected answer text.

    Returns:
        Similarity score between 0.0 and 1.0.
    """
    if not transcript.strip() or not expected_answer.strip():
        return 0.0

    embeddings = model.encode([transcript, expected_answer], convert_to_tensor=True)
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    # Clamp between 0 and 1
    return max(0.0, min(1.0, similarity))


def compute_technical_score(transcript: str, expected_answer: str) -> int:
    """
    Convert semantic similarity to a 0-100 technical score.

    The raw cosine similarity is scaled to a more intuitive range:
    - 0.0-0.3 similarity → 0-30 score (poor match)
    - 0.3-0.6 similarity → 30-60 score (partial match)
    - 0.6-0.8 similarity → 60-85 score (good match)
    - 0.8-1.0 similarity → 85-100 score (excellent match)
    """
    similarity = compute_similarity(transcript, expected_answer)

    # Scale the similarity to a more meaningful score range
    if similarity >= 0.8:
        score = 85 + (similarity - 0.8) * 75  # 85-100
    elif similarity >= 0.6:
        score = 60 + (similarity - 0.6) * 125  # 60-85
    elif similarity >= 0.3:
        score = 30 + (similarity - 0.3) * 100  # 30-60
    else:
        score = similarity * 100  # 0-30

    return min(100, max(0, round(score)))
