"""Minimal Byte Pair Encoding helpers for the Chapter 1 exercise."""

from collections import Counter


def get_stats(ids: list[int]) -> dict[tuple[int, int], int]:
    """Count consecutive pair frequencies."""
    return dict(Counter(zip(ids, ids[1:])))


def merge(ids: list[int], pair: tuple[int, int], idx: int) -> list[int]:
    """Replace each occurrence of pair with idx."""
    out: list[int] = []
    i = 0
    while i < len(ids):
        if i < len(ids) - 1 and (ids[i], ids[i + 1]) == pair:
            out.append(idx)
            i += 2
        else:
            out.append(ids[i])
            i += 1
    return out


class BasicBPETokenizer:
    """Tiny BPE tokenizer scaffold. Fill in train/encode/decode."""

    def __init__(self) -> None:
        self.merges: dict[tuple[int, int], int] = {}
        self.vocab: dict[int, bytes] = {idx: bytes([idx]) for idx in range(256)}

    def train(self, text: str, vocab_size: int) -> None:
        raise NotImplementedError

    def encode(self, text: str) -> list[int]:
        raise NotImplementedError

    def decode(self, ids: list[int]) -> str:
        raise NotImplementedError
