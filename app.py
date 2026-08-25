from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from pathlib import Path
import os

# ==========================================
# LOAD ENVIRONMENT FIRST
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("OpenAI key loaded:", bool(OPENAI_API_KEY))
print("Pinecone key loaded:", bool(PINECONE_API_KEY))


# ==========================================
# IMPORTS AFTER ENV LOAD
# ==========================================

from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate


# ==========================================
# FLASK APP
# ==========================================

app = Flask(__name__)


# ==========================================
# CHECK API KEYS
# ==========================================

if not PINECONE_API_KEY:
    raise ValueError(
        "PINECONE_API_KEY is missing. Check your .env file."
    )

if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY is missing. Check your .env file."
    )


# ==========================================
# EMBEDDINGS
# ==========================================

embeddings = download_hugging_face_embeddings()


# ==========================================
# PINECONE VECTOR STORE
# ==========================================

# ==========================================
# PINECONE VECTOR STORE
# ==========================================

print("Connecting to Pinecone index...")

index_name = "medical-chatbot"

docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)

print("Connected to Pinecone successfully.")

# ==========================================
# RETRIEVER
# ==========================================

retriever = docsearch.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": 4
    }
)


# ==========================================
# PROMPT
# ==========================================

prompt_template = """
You are MediVault AI, a medical knowledge assistant.

Use the provided medical context to answer the user's question.

Rules:

1. Answer using the provided context whenever possible.
2. If the context does not contain enough information, clearly say that.
3. Do not invent medical facts.
4. Give concise, understandable explanations.
5. Do not claim to diagnose the user.
6. Do not recommend emergency treatment as a substitute for a doctor.
7. For potentially serious symptoms, recommend professional medical evaluation.

Context:

{context}

Question:

{question}

Answer:
"""


PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)


# ==========================================
# LLM
# ==========================================

llm = ChatOpenAI(
    model="gpt-4.1-mini",
    temperature=0.2,
    api_key=OPENAI_API_KEY
)

# ==========================================
# RAG CHAIN
# ==========================================

rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=True,
    chain_type_kwargs={
        "prompt": PROMPT
    }
)


# ==========================================
# HOME
# ==========================================

@app.route("/")
def index():

    return render_template("chat.html")


# ==========================================
# CHAT API
# ==========================================

@app.route("/get", methods=["POST"])
def chat():

    try:

        user_message = request.form.get(
            "msg",
            ""
        ).strip()

        if not user_message:

            return jsonify({
                "success": False,
                "error": "Please enter a message."
            }), 400


        print("\n===================================")
        print("USER:", user_message)
        print("===================================")


        # RUN RAG

        result = rag_chain.invoke({
            "query": user_message
        })


        answer = result.get(
            "result",
            "I couldn't generate an answer."
        )


        # SOURCES

        source_documents = result.get(
            "source_documents",
            []
        )

        source_count = len(source_documents)


        print("ANSWER:", answer)
        print("SOURCES:", source_count)


        return jsonify({

            "success": True,

            "answer": answer,

            "source_count": source_count,

            "sources": [

                {
                    "source": doc.metadata.get(
                        "source",
                        "Medical Knowledge Base"
                    )
                }

                for doc in source_documents
            ]

        })


    except Exception as e:

        print("\n========== BACKEND ERROR ==========")
        print(type(e).__name__)
        print(str(e))
        print("===================================\n")


        error_message = str(e).lower()


        if "insufficient_quota" in error_message:

            user_error = (
                "The AI service has reached its current API quota."
            )

        elif "rate_limit" in error_message:

            user_error = (
                "The AI service is temporarily rate limited. "
                "Please try again shortly."
            )

        elif "authentication" in error_message:

            user_error = (
                "There is a problem with the AI service API key."
            )

        else:

            user_error = (
                "MediVault AI could not process this request. "
                "Please try again."
            )


        return jsonify({

            "success": False,

            "error": user_error

        }), 500


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )