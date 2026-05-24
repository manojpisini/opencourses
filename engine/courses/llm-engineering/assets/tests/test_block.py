"""
OpenCourses — LLM Engineering
Chapter 1: TransformerBlock Tests

Run with:  pytest tests/test_block.py -v
All 3 tests must pass.
"""

import math
import pytest
import torch
import torch.nn as nn

# Import the student's implementation
from starter import TransformerBlock  # noqa: F401 — student must define this


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: Output shape is correct
# ─────────────────────────────────────────────────────────────────────────────

def test_output_shape():
    """TransformerBlock must return [B, T, d_model] — same shape as input."""
    configs = [
        dict(d_model=64,  n_heads=4,  d_ff=256),
        dict(d_model=128, n_heads=8,  d_ff=512),
        dict(d_model=256, n_heads=8,  d_ff=1024),
    ]
    for cfg in configs:
        block = TransformerBlock(**cfg)
        B, T = 2, 16
        x   = torch.randn(B, T, cfg["d_model"])
        out = block(x)
        assert out.shape == (B, T, cfg["d_model"]), (
            f"Config {cfg}: expected output shape {(B, T, cfg['d_model'])}, "
            f"got {tuple(out.shape)}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: Causal masking — future tokens must not influence past
# ─────────────────────────────────────────────────────────────────────────────

def test_causal_masking():
    """
    The output at position i must not change when tokens at positions > i change.
    If this test fails, the causal mask is wrong (or missing).
    """
    block = TransformerBlock(d_model=64, n_heads=4, d_ff=256)
    block.eval()

    B, T, D = 1, 8, 64
    x = torch.randn(B, T, D)

    with torch.no_grad():
        out_original = block(x).clone()

    # Modify only the LAST token's input
    x_modified = x.clone()
    x_modified[:, -1, :] = torch.randn(D)

    with torch.no_grad():
        out_modified = block(x_modified)

    # Positions 0..T-2 must not change (they cannot see position T-1)
    for t in range(T - 1):
        diff = (out_original[0, t] - out_modified[0, t]).abs().max().item()
        assert diff < 1e-5, (
            f"Position {t} output changed when only position {T-1} input changed.\n"
            f"  Max absolute diff: {diff:.2e}\n"
            "  This means your causal mask is NOT preventing attention to future tokens."
        )


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: Pre-norm architecture — LayerNorm is applied before (not after)
# ─────────────────────────────────────────────────────────────────────────────

def test_pre_norm_architecture():
    """
    Verify pre-norm: the LayerNorm must be applied BEFORE the attention and MLP,
    not after (post-norm). We verify this by checking the forward pass ordering.

    Strategy: hook into LayerNorm modules and attention/MLP to verify which fires first.
    """
    block = TransformerBlock(d_model=64, n_heads=4, d_ff=256)

    # Collect the order in which named modules activate
    activation_order: list[str] = []

    def make_hook(name: str):
        def hook(module, input, output):
            activation_order.append(name)
        return hook

    hooks = []
    for name, module in block.named_modules():
        if isinstance(module, (nn.LayerNorm, nn.Linear)):
            hooks.append(module.register_forward_hook(make_hook(name)))

    x = torch.randn(1, 4, 64)
    block(x)
    for h in hooks:
        h.remove()

    # Find first LayerNorm and first Linear in the order
    ln_positions    = [i for i, n in enumerate(activation_order) if "norm" in n.lower() or "ln" in n.lower()]
    linear_positions = [i for i, n in enumerate(activation_order) if "linear" in n.lower() or "proj" in n.lower() or "fc" in n.lower() or "mlp" in n.lower() or "attn" in n.lower()]

    # In pre-norm, LayerNorm fires BEFORE the first linear projection
    if ln_positions and linear_positions:
        assert ln_positions[0] < linear_positions[0], (
            "LayerNorm should activate BEFORE the first linear layer (pre-norm).\n"
            f"Activation order: {activation_order}\n"
            "Check that your forward() does:\n"
            "  x = x + attention(self.ln1(x))\n"
            "  x = x + mlp(self.ln2(x))\n"
            "NOT:\n"
            "  x = self.ln1(x + attention(x))"
        )
