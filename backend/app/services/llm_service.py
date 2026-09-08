import json
import urllib.request
import urllib.error

OLLAMA_URL = "http://localhost:11434/api/generate"

MODEL_NAME = "llama3.2"


def generate_answer(
    question: str,
    context: str,
) -> str:
    """
    Generate an AI answer using the retrieved document context.
    """

    prompt = f"""
You are DocuMind, an AI document assistant.

Answer the user's question using ONLY the information provided
in the document context below.

If the answer cannot be found in the context, clearly say:

"I could not find this information in the uploaded documents."

Do not make up information.
Do not use outside knowledge.

DOCUMENT CONTEXT:
-----------------
{context}
-----------------

USER QUESTION:
{question}

ANSWER:
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
    }

    try:
        request = urllib.request.Request(
            OLLAMA_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(
            request,
            timeout=120,
        ) as response:

            result = json.loads(response.read().decode("utf-8"))

            return result.get(
                "response",
                "Unable to generate an answer.",
            ).strip()

    except urllib.error.URLError as error:
        raise RuntimeError(
            "Could not connect to Ollama. " "Make sure Ollama is running."
        ) from error
