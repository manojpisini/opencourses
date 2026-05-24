"""Annotated nanoGPT-style training loop scaffold."""

import torch
from torch import nn


def train_step(model: nn.Module, optimizer: torch.optim.Optimizer, x: torch.Tensor, y: torch.Tensor) -> float:
    """Run one language-model training step and return scalar loss."""
    model.train()
    logits = model(x)
    loss = nn.functional.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    optimizer.step()
    return float(loss.detach().cpu())


def estimate_perplexity(loss: float) -> float:
    """Convert cross-entropy loss to perplexity."""
    return float(torch.exp(torch.tensor(loss)))
