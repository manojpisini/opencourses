"""Demonstrate the shape and growth of a KV cache."""

import torch


def append_kv_cache(
    cache: tuple[torch.Tensor, torch.Tensor] | None,
    new_k: torch.Tensor,
    new_v: torch.Tensor,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Append a single-step K/V pair to an existing cache."""
    if cache is None:
        return new_k, new_v
    past_k, past_v = cache
    return torch.cat([past_k, new_k], dim=-2), torch.cat([past_v, new_v], dim=-2)


def main() -> None:
    batch, heads, d_head = 1, 8, 128
    cache = None
    for step in range(4):
        new_k = torch.randn(batch, heads, 1, d_head)
        new_v = torch.randn(batch, heads, 1, d_head)
        cache = append_kv_cache(cache, new_k, new_v)
        print(f"step={step + 1} k_shape={tuple(cache[0].shape)} v_shape={tuple(cache[1].shape)}")


if __name__ == "__main__":
    main()
