# Medical Chatbot (RAG + LLM)

A production-ready medical chatbot using Retrieval-Augmented Generation, built on **LangChain**, **Pinecone**, and **Flask**. It ingests clinical reference material, retrieves relevant context semantically, and generates grounded, citation-backed answers via a hosted LLM.

## Highlights

- Semantic retrieval with Pinecone embeddings
- LangChain pipelines for ingestion, retrieval, and generation
- Flask web UI and API
- Docker + AWS ECR/EC2 deployment with GitHub Actions CI/CD
- Safety-first design: provenance tracking, conservative generation, human-in-the-loop review

## Prerequisites

- Python 3.10+
- Conda or virtualenv
- Pinecone account + API key
- OpenAI API key (or other configured LLM provider)
- Docker and AWS account (for deployment)

## Quickstart

```bash
git clone https://github.com/humayun-mhk/Medical-Chatbot-RAG-LLM.git
cd Medical-Chatbot-RAG-LLM

conda create -n medibot python=3.10 -y
conda activate medibot
pip install -r requirements.txt
```

Create a `.env` file:

```
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_ENV="us-east1-gcp"
OPENAI_API_KEY="your_openai_api_key"
```

Build the index and run the app:

```bash
python store_index.py
python app.py
```

## How It Works

1. **Ingestion** – Clinical texts are chunked (with source/page metadata) and embedded.
2. **Retrieval** – Pinecone performs nearest-neighbor search over the vector index.
3. **Re-ranking** – Top candidates are re-scored for relevance; low-confidence results trigger abstention.
4. **Generation** – The LLM answers using retrieved context, citing sources for verification.

## Data Sources

All ingested material is vetted clinical/textbook content, stripped of PHI. Any custom clinical or EHR data must be de-identified and compliant with applicable regulations before ingestion.

## Tuning Guide

| Parameter | Recommendation |
|---|---|
| Chunk size | 500–1000 chars, 100–200 overlap |
| Embedding model | OpenAI `text-embedding-3-small/large`, or clinical SBERT |
| Similarity | Cosine or inner product |
| Retrieval | Fetch k=50, re-rank to top 10 |
| Threshold | Cosine ≥ 0.7–0.8 (tune on labeled data) |

## Safety & Evaluation

- Responses include citations and source snippets
- Retrieval/generation traces are logged for monitoring
- Evaluated via precision@k, recall@k, MRR, NDCG
- High-stakes outputs require clinician review

## Deployment

- Dockerfile builds the Flask app image
- GitHub Actions builds, tags, and pushes to AWS ECR
- EC2 pulls and runs the container (IAM roles required for ECR/EC2 access)

**Required GitHub Secrets:**
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `ECR_REPO`, `PINECONE_API_KEY`, `OPENAI_API_KEY`

## License

Provided as-is. Ensure proper rights/compliance if including third-party medical content or patient data.
