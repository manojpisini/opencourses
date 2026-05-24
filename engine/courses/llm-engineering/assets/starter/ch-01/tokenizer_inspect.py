"""Inspect an open-source tokenizer without downloading model weights."""

from transformers import AutoTokenizer

MODEL_ID = "HuggingFaceTB/SmolLM2-135M"


def main() -> None:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    text = "The transformer architecture changed everything."
    ids = tokenizer.encode(text)
    tokens = [tokenizer.decode([token_id]) for token_id in ids]

    print(f"Model : {MODEL_ID}")
    print(f"Text  : {text}")
    print(f"Tokens: {tokens}")
    print(f"IDs   : {ids}")
    print(f"Vocab : {tokenizer.vocab_size:,}")
    print(f"Back  : {tokenizer.decode(ids)}")


if __name__ == "__main__":
    main()
