"""
OpenCourses — LLM Engineering
Chapter 1: BPE Tokenizer Tests

Run with:  pytest tests/test_bpe.py -v
All 5 tests must pass for the exercise to be accepted.
"""

import pytest
from starter import BasicBPETokenizer


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: Vocabulary size grows correctly
# ─────────────────────────────────────────────────────────────────────────────

def test_vocab_size():
    """Vocabulary must grow to exactly vocab_size after training."""
    tok = BasicBPETokenizer()
    tok.train("aaabdaaabac" * 200, vocab_size=260)
    assert len(tok.vocab) == 260, (
        f"Expected vocab size 260, got {len(tok.vocab)}. "
        "Check that each merge adds exactly one new token to self.vocab."
    )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Round-trip for ASCII text
# ─────────────────────────────────────────────────────────────────────────────

def test_round_trip_ascii():
    """decode(encode(text)) must equal text for ASCII input."""
    tok = BasicBPETokenizer()
    corpus = (
        "the quick brown fox jumps over the lazy dog. " * 50
        + "the the the fox fox fox quick quick " * 50
    )
    tok.train(corpus, vocab_size=280)

    for text in [
        "the quick brown fox",
        "fox jumps",
        "the",
        "abcdefgh",
        "the quick brown fox jumps over the lazy dog.",
    ]:
        ids  = tok.encode(text)
        back = tok.decode(ids)
        assert back == text, (
            f"Round-trip failed for {text!r}.\n"
            f"  encode → {ids}\n"
            f"  decode → {back!r}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Merges are applied in training order (not re-ranked)
# ─────────────────────────────────────────────────────────────────────────────

def test_merge_order():
    """
    encode() must apply merges in the order they were learned during train(),
    not sorted by current frequency on the new text.
    """
    tok = BasicBPETokenizer()
    # 'aa' should be merged first (most frequent), then 'ab' etc.
    tok.train("aaab" * 500 + "abab" * 100, vocab_size=262)

    ids_1 = tok.encode("aaab")
    ids_2 = tok.encode("aaab")
    assert ids_1 == ids_2, "encode() must be deterministic for the same input."

    # The encoded form should be shorter than the raw byte form
    raw_len = len("aaab".encode("utf-8"))  # 4
    assert len(ids_1) < raw_len, (
        f"encode('aaab') produced {len(ids_1)} tokens — expected fewer than {raw_len} "
        f"because 'aa' should have been merged. ids={ids_1}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: Round-trip for Unicode text
# ─────────────────────────────────────────────────────────────────────────────

def test_round_trip_unicode():
    """Round-trip must work for multi-byte UTF-8 characters."""
    tok = BasicBPETokenizer()
    corpus = ("नमस्ते दुनिया " * 100 + "hello world " * 100)
    tok.train(corpus, vocab_size=300)

    for text in ["नमस्ते", "hello", "दुनिया world"]:
        ids  = tok.encode(text)
        back = tok.decode(ids)
        assert back == text, (
            f"Unicode round-trip failed for {text!r} → {back!r}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: Merges genuinely compress — token count decreases on seen corpus
# ─────────────────────────────────────────────────────────────────────────────

def test_compression():
    """
    After training, the encoded token count must be strictly less than
    the byte count of the training text for repeated substrings.
    """
    repeated = "hello world " * 300
    tok = BasicBPETokenizer()
    tok.train(repeated, vocab_size=290)

    sample = "hello world hello world"
    raw_bytes = len(sample.encode("utf-8"))   # 23
    token_ids = tok.encode(sample)

    assert len(token_ids) < raw_bytes, (
        f"Expected fewer tokens than bytes after training on a repetitive corpus.\n"
        f"  Raw bytes: {raw_bytes}\n"
        f"  Token IDs: {len(token_ids)}\n"
        f"  IDs: {token_ids}"
    )
