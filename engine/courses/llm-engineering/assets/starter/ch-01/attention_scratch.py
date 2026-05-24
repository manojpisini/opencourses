"""Single-head scaled dot-product attention scaffold."""

import math

import torch


def scaled_dot_product_attention(
    q: torch.Tensor,
    k: torch.Tensor,
    v: torch.Tensor,
    causal: bool = True,
) -> torch.Tensor:
    """Return attention(q, k, v). Shapes: [batch, time, dim]."""
    scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))
    if causal:
        time = q.size(-2)
        mask = torch.triu(torch.ones(time, time, device=q.device, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(mask, float("-inf"))
    weights = torch.softmax(scores, dim=-1)
    return weights @ v
