"""
OpenCourses — LLM Engineering & Generative AI Systems
Chapter 1 Exercise: BPE Tokenizer from Scratch

Task:
  Implement BasicBPETokenizer with train(), encode(), and decode() methods.

Rules:
  - Do NOT import tiktoken, tokenizers, or sentencepiece.
  - Standard library + NumPy only.
  - All 5 test cases in tests/test_bpe.py must pass.

Starter code is provided below. Fill in the TODOs.
"""


class BasicBPETokenizer:
    """
    A minimal Byte Pair Encoding (BPE) tokenizer.

    Vocabulary always starts with 256 byte tokens (IDs 0–255).
    New tokens are added as merges are discovered during training.
    """

    def __init__(self):
        self.merges: dict[tuple[int, int], int] = {}
        # vocab maps token_id → bytes (used for decoding)
        self.vocab: dict[int, bytes] = {}

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE HELPERS  (feel free to add more)
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _get_stats(ids: list[int]) -> dict[tuple[int, int], int]:
        """Count frequency of every consecutive pair in ids."""
        counts: dict[tuple[int, int], int] = {}
        for pair in zip(ids, ids[1:]):
            counts[pair] = counts.get(pair, 0) + 1
        return counts

    @staticmethod
    def _merge(ids: list[int], pair: tuple[int, int], new_id: int) -> list[int]:
        """Replace every occurrence of *pair* in ids with new_id."""
        out: list[int] = []
        i = 0
        while i < len(ids):
            if i < len(ids) - 1 and (ids[i], ids[i + 1]) == pair:
                out.append(new_id)
                i += 2
            else:
                out.append(ids[i])
                i += 1
        return out

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    def train(self, text: str, vocab_size: int) -> None:
        """
        Train the BPE tokenizer on *text* until the vocabulary reaches *vocab_size*.

        Steps:
          1. Encode text as UTF-8 bytes → list of ints (0–255). This is the initial sequence.
          2. Initialise the vocab with all 256 byte tokens.
          3. Repeatedly:
               a. Count pair frequencies with _get_stats().
               b. Find the most frequent pair.
               c. Assign it the next available token ID.
               d. Record the merge in self.merges.
               e. Update self.vocab so decode() can invert it.
               f. Apply the merge to the running token sequence with _merge().
          4. Stop when vocab size reaches vocab_size.

        Args:
            text:       Training corpus (any UTF-8 string).
            vocab_size: Target vocabulary size (must be > 256).
        """
        assert vocab_size > 256, "vocab_size must be > 256"

        # TODO: Step 1 — encode text to bytes
        ids: list[int] = TODO  # list(text.encode("utf-8"))

        # TODO: Step 2 — initialise vocab with byte tokens
        self.vocab = TODO  # {i: bytes([i]) for i in range(256)}

        # TODO: Step 3 — merge loop
        while len(self.vocab) < vocab_size:
            stats = self._get_stats(ids)
            if not stats:
                break
            # TODO: find the most frequent pair
            best_pair = TODO
            new_id = len(self.vocab)

            # TODO: record the merge and update vocab
            self.merges[best_pair] = new_id
            self.vocab[new_id] = TODO  # self.vocab[best_pair[0]] + self.vocab[best_pair[1]]

            # TODO: apply merge to running sequence
            ids = self._merge(ids, best_pair, new_id)

    def encode(self, text: str) -> list[int]:
        """
        Encode *text* using the trained merge table.

        Steps:
          1. Convert text to bytes → initial id list (0–255).
          2. Apply each merge rule IN TRAINING ORDER (iterate over self.merges).
          3. Return the final list of token IDs.

        IMPORTANT: Apply merges in training order, not by current frequency.
        """
        ids = list(text.encode("utf-8"))

        # TODO: apply merges in order
        for pair, new_id in self.merges.items():
            ids = self._merge(ids, pair, new_id)

        return ids

    def decode(self, ids: list[int]) -> str:
        """
        Decode a list of token IDs back to a string.

        Steps:
          1. Look up each id in self.vocab to get its bytes.
          2. Concatenate all byte sequences.
          3. Decode as UTF-8 (errors='replace' for safety).
        """
        # TODO: implement decode
        raw_bytes = TODO  # b"".join(self.vocab[i] for i in ids)
        return raw_bytes.decode("utf-8", errors="replace")


# ─────────────────────────────────────────────────────────────────────────────
# Quick manual test (delete before submission)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tok = BasicBPETokenizer()
    corpus = "aaabdaaabac" * 100  # repeat to get meaningful frequencies
    tok.train(corpus, vocab_size=260)
    print(f"Merges learned: {len(tok.merges)}")

    text = "aaab"
    ids  = tok.encode(text)
    back = tok.decode(ids)
    print(f"Encode: {text!r} → {ids}")
    print(f"Decode: {ids} → {back!r}")
    print(f"Round-trip OK: {text == back}")
