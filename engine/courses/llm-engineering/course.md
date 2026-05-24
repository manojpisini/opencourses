---
id: llm-engineering
title: "LLM Engineering & Generative AI Systems"
slug: llm-engineering
version: "1.0.0"
status: draft
level: advanced
category: data
estimated_hours: 88
language: en
tags: [llm, generative-ai, transformers, rag, fine-tuning, ai-agents, inference-optimization, open-source-ai]
---

# LLM Engineering & Generative AI Systems

> Build, fine-tune, evaluate, and ship production LLM systems —
> from transformer internals to agentic pipelines at scale.
> Every concept is grounded in open-source code you can run, read, and contribute to.

---

## Course Overview

Large Language Models are reshaping every layer of software. This course exists so
engineers understand them deeply — not as black-box APIs, but as mathematical systems
they can modify, evaluate, optimize, and build on.

Starting from the transformer architecture and working up through pre-training,
alignment (RLHF, DPO), prompt engineering, retrieval-augmented generation,
fine-tuning, and production serving, every chapter is built around open-source
repositories — **Llama, Mistral, vLLM, HuggingFace Transformers, LangChain,
LlamaIndex, OpenTelemetry**, and more.

### What Makes This Course Different

- Every theory lesson is paired with a runnable code walkthrough in a real open-source
  codebase — you read source, not toy examples.
- Evaluation is first-class: every system you build is measured, not guessed at.
- The capstone is a production-grade RAG + agent system submitted as a public
  GitHub repository — a real open-source contribution.
- Covers 2024–2025 frontier techniques: speculative decoding, FlashAttention-2,
  continuous batching, LoRA/QLoRA, DPO, multi-agent orchestration, and more.

### Who This Is For

- Software engineers who want to build serious LLM-powered products
- ML engineers moving from classical ML into the LLM stack
- Researchers who want production engineering skills alongside theory
- Technical founders building AI-native applications

---

## Learning Objectives

By the end of this course, you will be able to:

1. Explain the transformer architecture from first principles — attention,
   positional encoding, KV cache, and the full forward pass
2. Trace the pre-training pipeline of an open-source LLM from raw text to trained weights
3. Design and implement prompt engineering strategies and measure their effect quantitatively
4. Align a language model using SFT, RLHF, and DPO using open-source tools
5. Fine-tune an open-source LLM with LoRA/QLoRA on domain-specific data
6. Build and evaluate a production-grade RAG pipeline with chunking, retrieval,
   reranking, and generation
7. Deploy an LLM inference server using vLLM with continuous batching
8. Design and implement a multi-tool AI agent using the ReAct pattern and LangGraph
9. Evaluate LLM systems using LM Evaluation Harness, deterministic custom evals, rubric checks, and regression suites
10. Instrument an LLM application with OpenTelemetry and identify regressions
11. Identify and mitigate prompt injection and jailbreak risks
12. Ship a public open-source LLM project as a capstone contribution

---

## Prerequisites

### Knowledge
- Python: comfortable with classes, decorators, generators, async/await
- NumPy: array broadcasting, matrix math
- Linear algebra: matrix multiplication, eigenvectors (intuition level)
- Basic probability and calculus (gradient, chain rule — intuition, not proofs)
- Git and GitHub: branching, pull requests, forks

### Tools Required
- Python 3.10+ — https://www.python.org/downloads/
- Git 2.40+ — https://git-scm.com/
- A HuggingFace account — https://huggingface.co/join (free)
- A GitHub account — https://github.com/join (free)

### GPU Access (for fine-tuning chapters)
You do **not** need a local GPU for most of the course. For Chapters 4 and 6
(fine-tuning and serving), use one of:
- **Google Colab** (free T4, sufficient for 360M–1.7B models)
- **Kaggle Notebooks** (free P100, sufficient for 7B models with QLoRA)
- **Lambda Labs / RunPod / Vast.ai** (paid, ~$0.50/hr for A100 if needed)

---

## Course Structure

| Chapter | Title | Hours | Key Skill |
|---|---|---|---|
| 1 | Transformer Architecture: From Tokens to Attention | 9h | Architecture understanding |
| 2 | Pre-training: How LLMs Learn from Raw Text | 8h | Pre-training mechanics |
| 3 | Alignment: Making LLMs Follow Instructions | 7h | RLHF / DPO / SFT |
| 4 | Fine-Tuning: LoRA, QLoRA, and Domain Adaptation | 8h | Parameter-efficient fine-tuning |
| 5 | RAG: Retrieval-Augmented Generation | 9h | RAG pipeline engineering |
| 6 | LLM Inference: Speed, Scale, and Efficiency | 7h | Serving optimization |
| 7 | AI Agents: From ReAct to Multi-Agent Systems | 8h | Agent development |
| 8 | Observability, Security, and Production Hardening | 6h | Production deployment |
| Capstone | Open-Source Production LLM System | 26h | Full-stack LLM engineering |

---

## Open Source Resources

### Repositories (read these alongside the course)

| Repository | License | Used In |
|---|---|---|
| [HuggingFace Transformers](https://github.com/huggingface/transformers) | Apache 2.0 | All chapters |
| [nanoGPT](https://github.com/karpathy/nanoGPT) | MIT | Ch-01, Ch-02 |
| [LitGPT](https://github.com/Lightning-AI/litgpt) | Apache 2.0 | Ch-02, Ch-04 |
| [TRL](https://github.com/huggingface/trl) | Apache 2.0 | Ch-03, Ch-04 |
| [PEFT](https://github.com/huggingface/peft) | Apache 2.0 | Ch-04 |
| [LangChain](https://github.com/langchain-ai/langchain) | MIT | Ch-05, Ch-07 |
| [LlamaIndex](https://github.com/run-llama/llama_index) | MIT | Ch-05 |
| [ChromaDB](https://github.com/chroma-core/chroma) | Apache 2.0 | Ch-05 |
| [vLLM](https://github.com/vllm-project/vllm) | Apache 2.0 | Ch-06 |
| [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) | MIT | Ch-03, Ch-04 |
| [OpenTelemetry Python](https://github.com/open-telemetry/opentelemetry-python) | Apache 2.0 | Ch-08 |
| [AutoGen](https://github.com/microsoft/autogen) | MIT | Ch-07 |
| [Outlines](https://github.com/dottxt-ai/outlines) | Apache 2.0 | Ch-06 |

### Papers (read these in the order listed)

| Paper | Read In |
|---|---|
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — Vaswani et al. | Ch-01 |
| [BERT](https://arxiv.org/abs/1810.04805) — Devlin et al. | Ch-02 supplemental |
| [GPT-3 / Few-Shot Learners](https://arxiv.org/abs/2005.14165) — Brown et al. | Ch-02, Ch-03 |
| [Chinchilla](https://arxiv.org/abs/2203.15556) — Hoffmann et al. | Ch-02 |
| [InstructGPT / RLHF](https://arxiv.org/abs/2203.02155) — Ouyang et al. | Ch-03 |
| [DPO](https://arxiv.org/abs/2305.18290) — Rafailov et al. | Ch-03 |
| [LoRA](https://arxiv.org/abs/2106.09685) — Hu et al. | Ch-04 |
| [QLoRA](https://arxiv.org/abs/2305.14314) — Dettmers et al. | Ch-04 |
| [RAG](https://arxiv.org/abs/2005.11401) — Lewis et al. | Ch-05 |
| [FlashAttention-2](https://arxiv.org/abs/2307.08691) — Dao | Ch-06 |
| [Speculative Decoding](https://arxiv.org/abs/2211.17192) — Leviathan et al. | Ch-06 |
| [ReAct](https://arxiv.org/abs/2210.03629) — Yao et al. | Ch-07 |
| [RoPE](https://arxiv.org/abs/2104.09864) — Su et al. | Ch-01 supplemental |

### Free Books

| Book | Used In |
|---|---|
| [Dive into Deep Learning](https://d2l.ai) — Zhang et al. (CC BY-SA 4.0) | Ch-01, Ch-02 |
| [Build an LLM from Scratch](https://github.com/rasbt/LLMs-from-scratch) — Raschka (MIT code) | Ch-01, Ch-02 |
| [Designing ML Systems](https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/) — Huyen | Ch-06, Ch-08 |

### Video Series

| Video | Used In |
|---|---|
| [Let's build GPT from scratch](https://www.youtube.com/watch?v=kCc8FmEb1nY) — Karpathy | Ch-01, Ch-02 |
| [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE) — Karpathy | Ch-01 |
| [Stanford CS224N](https://web.stanford.edu/class/cs224n/) — Stanford (Lectures 9–11) | Ch-01 supplemental |

---

# Chapter 1 — Transformer Architecture: From Tokens to Attention

## Learning Objectives

- Implement BPE tokenization from scratch and match HuggingFace's output
- Derive scaled dot-product attention from first principles and implement it in NumPy/PyTorch
- Read and annotate the attention implementation inside HuggingFace Transformers
- Explain KV cache, causal masking, and positional encoding (absolute, RoPE, ALiBi)
- Implement a complete GPT-style TransformerBlock

## Mental Model

> **The transformer is a document-wide search engine running in parallel.**
>
> At every position, every token asks: "Which other tokens are most relevant to me?"
> (Query × Keys → attention weights). It then collects information from those tokens
> (weighted sum of Values). This happens for all positions simultaneously — that's
> why transformers are fast on GPUs.

---

## 1.1 Tokenization: How Text Becomes Numbers

Before any neural network can process text, the text must become numbers.
Tokenization is this conversion — and it is more nuanced than it appears.

### 1.1.1 Why Tokenization is a Design Decision

The tokenizer determines:
- **Vocabulary size**: larger → each token is more specific, context window covers less text
- **Token fertility**: how many tokens per word — higher means shorter effective context
- **Out-of-vocabulary handling**: modern BPE handles all Unicode via byte fallback
- **Subword granularity**: compound words, morphological variants, code identifiers

**Common tokenization failure modes:**
- Arithmetic: "9.11" → ["9", ".", "1", "1"] — model sees 4 tokens, not one number
- Counting: "strawberry" may tokenize as ["st", "raw", "berry"] — 3 tokens, not 10 chars
- Non-English: character-rich scripts (CJK, Arabic) have higher fertility → shorter effective context

### 1.1.2 Byte Pair Encoding (BPE) Algorithm

BPE builds a vocabulary iteratively:

```
Step 0: Encode text as bytes → initial sequence of 0–255 integers
Step 1: Count all consecutive pair frequencies
Step 2: Find the most frequent pair (a, b)
Step 3: Add a new token (a+b) to vocabulary with ID = next available int
Step 4: Replace all (a, b) occurrences in the sequence with the new token
Step 5: Repeat from Step 1 until vocabulary reaches target size
```

**Key insight**: the merge table learned during training is **fixed**. When encoding
new text, you apply merges in the exact order they were learned — not by re-ranking
frequency on the new text.

#### Code Example: BPE Core Functions

```python
def get_stats(ids: list[int]) -> dict[tuple, int]:
    """Count frequency of every consecutive pair."""
    counts = {}
    for pair in zip(ids, ids[1:]):
        counts[pair] = counts.get(pair, 0) + 1
    return counts

def merge(ids: list[int], pair: tuple, idx: int) -> list[int]:
    """Replace every occurrence of pair with new token idx."""
    out, i = [], 0
    while i < len(ids):
        if i < len(ids) - 1 and (ids[i], ids[i+1]) == pair:
            out.append(idx); i += 2
        else:
            out.append(ids[i]); i += 1
    return out
```

**Open source study**: Read [minbpe](https://github.com/karpathy/minbpe) — Karpathy's
minimal BPE implementation (~200 lines). Then read the Rust implementation in
[tokenizers](https://github.com/huggingface/tokenizers/blob/main/tokenizers/src/models/bpe/model.rs)
to see the same algorithm in production.

### 1.1.3 HuggingFace Tokenizer API

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")

# Encoding
text = "The transformer architecture changed everything."
ids  = tok.encode(text)
tokens = [tok.decode([i]) for i in ids]

print(f"Tokens: {tokens}")
# ['The', ' transformer', ' architecture', ' changed', ' everything', '.']

# Special tokens
print(f"BOS ID: {tok.bos_token_id}")   # 128000
print(f"EOS ID: {tok.eos_token_id}")   # 128001
print(f"Vocab:  {tok.vocab_size:,}")   # 128,256

# Chat template — ALWAYS use this for instruction models
messages = [
    {"role": "system",    "content": "You are a helpful assistant."},
    {"role": "user",      "content": "What is attention?"},
]
formatted = tok.apply_chat_template(messages, tokenize=False)
```

> **Production tip**: Always use `apply_chat_template()` for instruction-tuned models.
> Every model family has a different format (ChatML, Llama-3, Vicuna, Alpaca).
> Getting the format wrong silently degrades performance by 10–30%.

### 1.1.4 Common Mistakes

❌ **Assuming tokenization is reversible character-by-character**
The BPE vocabulary maps subword sequences to integers — there is no character-level
correspondence. `"hello"` might tokenize as `["hel", "lo"]` or `["hello"]` depending
on the vocabulary.

❌ **Using `encode()` without special tokens for generation**
Instruction-tuned models expect `<|begin_of_text|>` and chat header tokens. Missing
these causes the model to behave as if it is a raw completion model.

❌ **Comparing token counts across different tokenizers**
Different model families have different vocabularies. A "128k context window" means 128k
tokens under that model's tokenizer — not the same number of words.

---

## 1.2 Embeddings and Positional Encoding

### 1.2.1 Token Embeddings

The embedding layer is a lookup table: a matrix `E` of shape `[vocab_size, d_model]`.
Token ID `i` retrieves row `i`. During training, gradient descent adjusts these rows
so semantically similar tokens cluster together in the high-dimensional space.

```python
import torch.nn as nn

# Llama-3 8B dimensions
vocab_size = 128_256
d_model    = 4_096

embedding = nn.Embedding(vocab_size, d_model)
# The entire embedding matrix: 128,256 × 4,096 = 525M parameters
# This is ~25% of Llama-3 8B's total parameters!
```

> **Production tip**: Large vocabulary models (Llama-3: 128k, Qwen: 150k+) have
> enormous embedding matrices. These are often **tied** to the output projection
> (the matrix that predicts the next token) — halving the memory requirement.

### 1.2.2 Positional Encoding

Transformers have no inherent notion of order — attention is a set operation.
Positional encoding injects position information.

#### Three Major Families

**Sinusoidal (Original Transformer, Vaswani 2017)**
```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```
Deterministic, generalises somewhat beyond training length, but not used in modern LLMs.

**Learned Absolute Positional Embeddings (BERT, GPT-2)**
A trainable embedding matrix of shape `[max_seq_len, d_model]`. Simple and effective
within training length; fails to generalise beyond it.

**Rotary Position Embeddings — RoPE (Llama, Mistral, Qwen)**
Rather than adding position information to embeddings, RoPE **rotates** the query
and key vectors in complex space. The rotation angle is a function of position.

The key property: `dot(RoPE(q, m), RoPE(k, n)) = f(q, k, m-n)` — the attention
score depends only on the **relative** position (m-n), not absolute positions.

This gives RoPE excellent length generalisation when combined with techniques like
YaRN (Yet another RoPE extensioN) or RoPE scaling.

```python
# How RoPE is applied in HuggingFace LlamaAttention (simplified):
cos, sin = self.rotary_emb(value_states, position_ids)
query_states, key_states = apply_rotary_pos_emb(query_states, key_states, cos, sin)
# Source: transformers/models/llama/modeling_llama.py
```

**Read the source**: [LlamaRotaryEmbedding in transformers](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py)

---

## 1.3 Scaled Dot-Product Attention

### 1.3.1 The Attention Formula

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right) V$$

**Breaking it down:**

| Component | Shape | Meaning |
|---|---|---|
| Q (Query) | [B, T, d_k] | "What is token i looking for?" |
| K (Key) | [B, T, d_k] | "What does token j advertise?" |
| V (Value) | [B, T, d_v] | "What does token j actually contribute?" |
| QK^T | [B, T, T] | Compatibility of every (i,j) pair |
| / √d_k | scalar | Variance stabilisation |
| softmax | [B, T, T] | Normalise: each row sums to 1 |
| × V | [B, T, d_v] | Weighted sum of values |

**Why √d_k?** If Q and K have components from N(0,1), then Q·K has variance d_k.
Without scaling, large d_k pushes softmax into saturation (gradient → 0).
Dividing by √d_k restores variance to ~1.

### 1.3.2 Causal Masking

GPT-style (decoder-only) models use a **causal mask**: token i can attend only to
positions j ≤ i. This prevents the model from "cheating" by looking at future tokens
during training, and enables autoregressive generation.

```python
# Causal mask: upper triangle (future positions) is -inf
mask = torch.triu(torch.ones(T, T), diagonal=1).bool()
scores = scores.masked_fill(mask, float('-inf'))
# After softmax: future positions get weight 0
```

> **Common mistake**: `torch.tril(...)` gives the LOWER triangle (past + current).
> For masked_fill to zero out future tokens, you need the UPPER triangle: `torch.triu(..., diagonal=1)`.
> Getting this backwards is one of the most common bugs in attention implementations.

### 1.3.3 Multi-Head Attention

Instead of one attention operation with full d_model dimensions, MHA runs H parallel
attention operations with d_model/H dimensions each:

```
Input x: [B, T, d_model]
   ↓ W_Q, W_K, W_V (split into H heads)
Q, K, V: [B, H, T, d_head]   where d_head = d_model / H
   ↓ Attention per head
Out: [B, H, T, d_head]
   ↓ Concatenate heads
Out: [B, T, d_model]
   ↓ W_O output projection
Output: [B, T, d_model]
```

**Why multiple heads?** Different heads specialise empirically:
- Some heads track syntactic dependencies (subject → verb)
- Some heads track coreference (pronoun → noun it refers to)
- Some heads track positional patterns (attending to adjacent tokens)

MHA does NOT add parameters compared to single-head attention —
it reorganises the same number of parameters into parallel subspaces.

### 1.3.4 KV Cache

During autoregressive generation, we produce one token per step. Without the KV cache,
we would recompute K and V for all previous tokens at every step — O(T²) total work.

**With KV cache:**
- On step t, compute K_t and V_t for the new token only
- Append to the cached K and V tensors from previous steps
- Attention over full K and V, but only one new Q
- O(T) work per step, O(T) total

```python
# HuggingFace uses_cache=True (default) enables this automatically
output = model.generate(input_ids, use_cache=True, max_new_tokens=100)
# Each new token only computes K,V for itself, retrieves cache for past
```

**Memory cost for Llama-3 8B (GQA):**
- 32 layers × 8 KV heads × 128 d_head × 2 (K+V) × 2 bytes (fp16) = 128 KB per token
- 4096-token context: 4096 × 128 KB = **512 MB** just for KV cache

**Grouped Query Attention (GQA):**
Llama-3 uses 32 query heads but only 8 KV heads (4 queries share each KV pair).
This reduces KV cache by 4× with minimal quality loss — essential for serving
long-context requests efficiently.

---

## 1.4 The Full GPT-Style Transformer Block

```
Input x  [B, T, d_model]
    │
    ├─ LayerNorm(x)  ← Pre-norm: normalise BEFORE attention
    │       │
    │   MultiHeadAttention(...)
    │       │
    └─ x + attention_out  ← Residual connection
    │
    ├─ LayerNorm(x)  ← Pre-norm before MLP
    │       │
    │   MLP: Linear → GELU → Linear
    │       │
    └─ x + mlp_out  ← Residual connection
    │
Output x  [B, T, d_model]
```

**Pre-norm vs Post-norm:**
- Post-norm (original 2017 transformer): `x = LayerNorm(x + sublayer(x))`
- Pre-norm (GPT-2, Llama, Mistral): `x = x + sublayer(LayerNorm(x))`

Pre-norm is more stable during training — gradients flow through the residual
path without passing through LayerNorm, preventing gradient vanishing in deep networks.

**GELU activation:**
GELU (Gaussian Error Linear Unit) is used instead of ReLU in modern transformers.
It is smoother — no hard zero threshold — and empirically performs better on NLP tasks.

```python
import torch.nn.functional as F
# GELU: x * Φ(x) where Φ is the CDF of the standard normal
F.gelu(x)       # PyTorch built-in, used in all modern LLMs
```

### Reading the Source: nanoGPT Block

```python
# From: https://github.com/karpathy/nanoGPT/blob/master/model.py
class Block(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.ln_1 = LayerNorm(config.n_embd, bias=config.bias)  # pre-norm 1
        self.attn  = CausalSelfAttention(config)
        self.ln_2  = LayerNorm(config.n_embd, bias=config.bias)  # pre-norm 2
        self.mlp   = MLP(config)

    def forward(self, x):
        x = x + self.attn(self.ln_1(x))   # residual + pre-norm attention
        x = x + self.mlp(self.ln_2(x))    # residual + pre-norm MLP
        return x
```

This is 6 lines and constitutes the entire transformer block. Everything else
in a large LLM is repetition of this pattern (typically 32–80 times) plus
embedding, output projection, and positional encoding.

### Performance Notes

- **Memory**: Each TransformerBlock stores activations during forward pass for
  backprop. Gradient checkpointing trades recomputation for memory: recompute
  activations during backward pass instead of storing them.
- **Compute**: Attention is O(T²) in sequence length. For T=4096, this is 16M
  operations per head per layer — the bottleneck for long-context models.
- **FlashAttention**: Rewrites attention to be memory-I/O optimal, enabling 3×+
  speedup by fusing operations and keeping data in fast on-chip SRAM.

### Security Notes

- Transformer attention is fully differentiable — adversarial inputs can be
  crafted to cause specific attention patterns
- KV cache can be a side-channel for inferring other users' content in shared
  serving (prefix caching)

---

## 1.5 Exercises

### Exercise 1: BPE Tokenizer from Scratch
**File**: `assets/starter/ch-01/starter.py`
**Tests**: `assets/tests/test_bpe.py` (5 tests)
**Time**: 60 minutes

Implement `BasicBPETokenizer` with `train()`, `encode()`, and `decode()`.
No external tokenizer libraries allowed — standard library + NumPy only.

**What you'll learn**: The merge table, why encode() must apply merges in training
order, and how decode() inverts the vocabulary.

### Exercise 2: Full Transformer Block
**File**: `assets/starter/ch-01/starter_block.py`
**Tests**: `assets/tests/test_block.py` (3 tests)
**Time**: 90 minutes

Implement `TransformerBlock` matching nanoGPT's Block — pre-norm, MHA with causal
masking, GELU MLP, and residual connections. Verify against nanoGPT weights.

**What you'll learn**: How all the components combine; why causal masking direction
matters; the exact pre-norm vs post-norm pattern.

---

## 1.6 Quiz

**Q1.** A BPE tokenizer with a 128k vocabulary tokenizes "transformer" into 1 token.
A tokenizer with a 32k vocabulary tokenizes it into 3 tokens.
Which model pays attention over fewer positions for a 1000-word document?
*(Answer: 128k vocabulary produces shorter sequences — fewer positions in attention)*

**Q2.** True or False: RoPE encodes absolute token positions by adding a sinusoidal
signal to each embedding.
*(Answer: False — RoPE rotates Q and K vectors; it encodes relative positions)*

**Q3.** What happens if you use `torch.tril` instead of `torch.triu` for the causal
mask in `masked_fill`?
*(Answer: Future tokens are NOT masked — the model can attend to future positions,
breaking the autoregressive property)*

---

## 1.7 References

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — Vaswani et al., 2017
- [nanoGPT](https://github.com/karpathy/nanoGPT) — Karpathy, MIT
- [minbpe](https://github.com/karpathy/minbpe) — Karpathy, MIT
- [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- [Build an LLM from Scratch](https://github.com/rasbt/LLMs-from-scratch) — Raschka
- [d2l.ai — Transformers Chapter](https://d2l.ai/chapter_attention-mechanisms-and-transformers/)

## 1.8 Further Reading

- [FlashAttention-2](https://arxiv.org/abs/2307.08691) — Understand the memory-efficient attention that makes large context windows practical
- [ALiBi: Train Short, Test Long](https://arxiv.org/abs/2108.12409) — An alternative positional encoding with strong length generalisation
- [Transformer Circuits Thread](https://transformer-circuits.pub/) — open mechanistic interpretability research on what transformers actually compute
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) — Visual introduction (good companion to the formal treatment here)

---

# Chapter 2 — Pre-training: How LLMs Learn from Raw Text

## Learning Objectives

- Explain the causal language modelling objective and why cross-entropy is correct
- Trace every component of nanoGPT's training loop
- Explain Chinchilla scaling laws and their implications
- Describe the data pipeline: deduplication, quality filtering, tokenization at scale

## Mental Model

> **Pre-training is compression.**
>
> The model learns to compress the statistical regularities of trillions of tokens
> into ~7B floating-point numbers (weights). A good compression = high likelihood
> on held-out text = low perplexity. The model learns syntax, facts, reasoning
> patterns, and world knowledge as side effects of compression.

---

## 2.1 The Language Modelling Objective

### 2.1.1 Next-Token Prediction

$$\mathcal{L} = -\frac{1}{N}\sum_{i=1}^{N} \log P_\theta(x_i \mid x_1, \ldots, x_{i-1})$$

This is **negative log-likelihood** (equivalently, cross-entropy loss between the
model's predicted distribution and the one-hot true token).

**Why this works**: To predict the next token well, the model must:
- Understand grammar (predicting verb after subject)
- Know world facts (predicting "Paris" after "capital of France is")
- Track long-range dependencies (predicting pronoun referents)
- Understand code structure (predicting closing brackets, return types)

None of this is labelled — the targets are the data itself. This is
**self-supervised learning** at massive scale.

### 2.1.2 Perplexity

$$\text{Perplexity} = e^{\mathcal{L}} = e^{\text{average CE loss}}$$

Lower perplexity = model is less "surprised" by validation text = better model.

| Model | Dataset | Perplexity |
|---|---|---|
| Random (50k vocab) | Any | ~50,000 |
| GPT-2 1.5B | WikiText-103 | ~18.3 |
| Llama-3 8B | WebText-like | ~8.1 |
| Human | Penn Treebank | ~70–80 |

> **Important**: Perplexity is dataset-dependent. Never compare perplexity
> numbers across different evaluation sets.

---

## 2.2 The Training Loop in Detail

### 2.2.1 nanoGPT Training Loop Walkthrough

Clone and study: `https://github.com/karpathy/nanoGPT/blob/master/train.py`

**Four critical components:**

**1. Learning Rate Schedule (cosine with warmup)**
```python
def get_lr(it):
    if it < warmup_iters:          # linear warmup
        return learning_rate * it / warmup_iters
    if it > lr_decay_iters:        # floor
        return min_lr
    # cosine decay from max_lr to min_lr
    t = (it - warmup_iters) / (lr_decay_iters - warmup_iters)
    coeff = 0.5 * (1.0 + math.cos(math.pi * t))
    return min_lr + coeff * (learning_rate - min_lr)
```
Warmup prevents large gradient updates at initialisation (weights are random).
Cosine decay empirically outperforms linear decay and step decay.

**2. Gradient Accumulation**
```python
for micro_step in range(gradient_accumulation_steps):
    logits, loss = model(X, Y)
    loss = loss / gradient_accumulation_steps   # scale by 1/K
    scaler.scale(loss).backward()
# One optimizer step covers K micro-batches = one large effective batch
```
Simulates batch_size × gradient_accumulation_steps without the memory.

**3. Gradient Clipping**
```python
torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)  # grad_clip = 1.0
```
Caps the global gradient norm. Prevents a single bad batch from "exploding" the
weights. Essential for stable LLM training.

**4. Mixed Precision + GradScaler**
```python
with torch.autocast(device_type='cuda', dtype=torch.bfloat16):
    logits, loss = model(X, Y)
scaler.scale(loss).backward()
scaler.unscale_(optimizer)
scaler.step(optimizer)
scaler.update()
```
BF16 uses half the memory of FP32 with minimal precision loss for training.
GradScaler prevents underflow in FP16 gradients.

### 2.2.2 AdamW Optimiser

All modern LLMs use AdamW (Adam with Weight Decay):

$$m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$$
$$\theta_t = \theta_{t-1} - \alpha \frac{m_t}{\sqrt{v_t} + \epsilon} - \lambda \theta_{t-1}$$

Standard hyperparameters for LLM pre-training:
- β₁ = 0.9, β₂ = 0.95 (not 0.999 as in the original Adam paper)
- ε = 1e-8
- Weight decay λ = 0.1 (applied to linear weights only, not biases or LayerNorm)

---

## 2.3 Scaling Laws and Chinchilla

### 2.3.1 The Chinchilla Insight

Hoffmann et al. (2022) showed that for a given compute budget C:

$$N_{\text{optimal}} \approx \sqrt{\frac{C}{6}}, \quad D_{\text{optimal}} \approx 20 \times N_{\text{optimal}}$$

**Translation**: For every parameter, you need approximately 20 training tokens.

| Model | Params | Trained on | Chinchilla-optimal? |
|---|---|---|---|
| GPT-3 | 175B | 300B tokens | ❌ 35× undertrained |
| Llama-2 7B | 7B | 2T tokens | ✅ ~14× over-trained |
| Llama-3 8B | 8B | 15T tokens | ✅ ~94× over-trained |
| Gemma-2 2B | 2B | 2T tokens | ✅ ~50× over-trained |

**Why over-train small models?** Training cost is one-time. Inference cost
is per-query, paid forever. A smaller model that was over-trained produces
the same quality as a larger Chinchilla-optimal model — at lower inference
cost per token.

### 2.3.2 Neural Scaling Laws

Empirical finding (Kaplan et al., 2020; Hoffmann et al., 2022):

$$\mathcal{L}(N, D) \approx A \cdot N^{-\alpha} + B \cdot D^{-\beta} + C_{\text{irred}}$$

Where:
- N = model parameters
- D = training tokens
- C_irred = irreducible loss (fundamental limit of predicting truly random content)
- α ≈ β ≈ 0.5

**Implication**: Every doubling of compute (either via more parameters or more
data) reduces loss by a predictable, smooth amount. This makes pre-training
costs estimable before training begins.

---

## 2.4 Data Pipeline for Pre-training

### 2.4.1 The Modern Pre-training Corpus

| Source | Proportion (typical) | Notes |
|---|---|---|
| Web crawls (CommonCrawl, FineWeb) | 60–80% | Requires heavy filtering |
| Code (GitHub, The Stack) | 10–20% | Boosts reasoning |
| Books | 5–15% | High quality, long-range structure |
| Academic (ArXiv, PubMed) | 2–5% | Domain knowledge |
| Curated (Wikipedia, StackOverflow) | 5–10% | High signal-to-noise |

### 2.4.2 Critical Pre-processing Steps

**1. Deduplication**
Near-identical documents hurt generalisation (model memorises instead of learns).
MinHash LSH (locality-sensitive hashing on n-gram shingles) finds near-duplicates
efficiently at trillion-token scale.

```python
# Conceptual: MinHash deduplication
from datasketch import MinHash, MinHashLSH

def compute_minhash(text: str, num_perm: int = 128) -> MinHash:
    m = MinHash(num_perm=num_perm)
    for ngram in get_ngrams(text, n=5):
        m.update(ngram.encode('utf8'))
    return m
```

**2. Quality Filtering**
Heuristic filters remove low-quality web text:
- Too short (< 100 words) or too long (> 100k words)
- High fraction of special characters or non-alphanumeric content
- Not primarily in the target language (fastText language ID)
- High perplexity under a small reference model (indicates spam/random text)
- Filtered word lists (hate speech, adult content)

**3. Domain Mixing**
The ratio of code:web:books:academic affects downstream capabilities.
Llama-3 used ~17% code — producing strong coding and reasoning performance.

**Open source datasets:**
- [FineWeb](https://huggingface.co/datasets/HuggingFaceFW/fineweb): 15T tokens, publicly available
- [The Stack v2](https://huggingface.co/datasets/bigcode/the-stack-v2): 67B code files
- [Dolma](https://github.com/allenai/dolma): 3T tokens with deduplication pipeline

---

## 2.5 Exercise: Train nanoGPT on Shakespeare

**Time**: 90 minutes (3 minutes of GPU time on Colab T4)
**Goal**: Run structured experiments and interpret training dynamics.

### Setup
```bash
git clone https://github.com/karpathy/nanoGPT
cd nanoGPT
pip install torch numpy transformers datasets tiktoken wandb tqdm
python data/shakespeare_char/prepare.py
python train.py config/train_shakespeare_char.py \
    --wandb_log=True --wandb_project=opencourses-llm
```

### Analysis Questions
1. Plot training and validation loss curves. At what iteration does val_loss begin diverging from train_loss (overfitting onset)?
2. Sample at iterations 500, 2000, 5000. Describe how output quality changes.
3. Reduce n_layer from 6 to 3. How does final val_loss change? What does this imply?
4. Calculate perplexity at your best checkpoint. Formula: `exp(val_loss)`.

---

## 2.6 Quiz

**Q1.** Llama-3 8B was trained on 15T tokens. Chinchilla-optimal for 8B parameters
would be ~160B tokens. How does this affect inference cost vs a Chinchilla-optimal model?
*(Answer: Llama-3 8B produces similar quality to a larger Chinchilla-optimal model — at lower inference cost per token)*

**Q2.** In nanoGPT's training loop, why is `loss = loss / gradient_accumulation_steps` necessary?
*(Answer: Without division, accumulated gradients over K micro-batches are K× too large — effectively applying K× the learning rate)*

**Q3.** True or False: Near-duplicate removal (deduplication) is important primarily to
reduce storage costs.
*(Answer: False — the primary purpose is preventing memorisation and improving generalisation)*

---

## 2.7 References

- [Training Compute-Optimal LLMs (Chinchilla)](https://arxiv.org/abs/2203.15556)
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) — Kaplan et al.
- [nanoGPT](https://github.com/karpathy/nanoGPT) — Karpathy
- [FineWeb: Decanting the Web for the Finest Text Data](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1)
- [The RefinedWeb Dataset for Falcon LLM](https://arxiv.org/abs/2306.01116)

---

# Chapter 3 — Alignment: Making LLMs Follow Instructions

## Learning Objectives

- Explain the three-phase alignment pipeline (SFT → RM → RLHF) mechanistically
- Understand DPO as a closed-form simplification of RLHF
- Run SFT fine-tuning with TRL's SFTTrainer
- Run DPO training and evaluate alignment improvement
- Use LM Evaluation Harness to benchmark models

## Mental Model

> **Alignment is preference calibration.**
>
> A pre-trained LLM can predict any plausible continuation — including harmful,
> unhelpful, or incoherent ones. Alignment trains the model to prefer the continuations
> that humans would rate as good. SFT shows it the format; RLHF/DPO teaches it to
> prefer quality responses.

---

## 3.1 Supervised Fine-Tuning (SFT)

### 3.1.1 What SFT Does

SFT trains the pre-trained model on a dataset of (instruction, ideal response) pairs.
The loss is identical to pre-training cross-entropy — but applied only to the response
tokens (not the instruction tokens, which are masked in the loss).

```python
# Chat template: <instruction><response>
# Loss is computed ONLY on response tokens
# Instruction tokens are masked (label = -100, ignored in cross_entropy)

from trl import SFTTrainer, SFTConfig
trainer = SFTTrainer(
    model=model,
    args=SFTConfig(
        output_dir="sft-output",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
    ),
    train_dataset=dataset,   # must have "messages" column in chat format
    tokenizer=tokenizer,
)
trainer.train()
```

### 3.1.2 Open Instruction Datasets

| Dataset | Size | Notes |
|---|---|---|
| [UltraChat 200k](https://huggingface.co/datasets/HuggingFaceH4/ultrachat_200k) | 200k | High-quality multi-turn |
| [OpenHermes 2.5](https://huggingface.co/datasets/teknium/OpenHermes-2.5) | 1M | Diverse instruction types |
| [Alpaca](https://huggingface.co/datasets/tatsu-lab/alpaca) | 52k | Historical instruction-following dataset |
| [CodeAlpaca](https://huggingface.co/datasets/sahil2801/CodeAlpaca-20k) | 20k | Code-focused |
| [Dolly 15k](https://huggingface.co/datasets/databricks/databricks-dolly-15k) | 15k | Human-written, Databricks |

**Tip**: Data quality > data quantity. 1000 high-quality demonstrations often
outperform 100k low-quality ones. Use deterministic filters, open-weight review models, or human review.

---

## 3.2 RLHF: Reinforcement Learning from Human Feedback

### 3.2.1 The Three Phases

**Phase 1: SFT** (as above)
Train on demonstrations to get the chat format right.

**Phase 2: Reward Model Training**
Show human labellers pairs of responses and have them rank which is better.
Train a classifier to predict human preference:
```
RM(x, y) → scalar score
```
The reward model learns to assign high scores to responses humans prefer.

**Phase 3: PPO Fine-tuning**
Use the reward model as a training signal. Generate responses, score them with RM,
update the policy (LLM) to produce higher-scoring responses — with a KL constraint
to prevent straying too far from the SFT reference model.

$$\text{reward}(x, y) = r_\phi(x, y) - \beta \cdot \text{KL}[\pi_\theta(y|x) \| \pi_\text{SFT}(y|x)]$$

### 3.2.2 RLHF Challenges

- **Reward hacking**: model learns to game the reward model (verbose responses score higher)
- **Training instability**: PPO requires careful tuning of clip ratio, rollout batches, KL coefficient
- **Sample efficiency**: requires generating thousands of completions per update
- **Reward model errors**: RM is a proxy for human preference — it can be wrong

---

## 3.3 DPO: Direct Preference Optimisation

### 3.3.1 The DPO Objective

DPO (Rafailov et al., 2023) eliminates the reward model entirely.
Given a preferred response y_w and rejected response y_l for prompt x:

$$\mathcal{L}_\text{DPO} = -\mathbb{E}\left[\log \sigma\left(\beta \log\frac{\pi_\theta(y_w|x)}{\pi_\text{ref}(y_w|x)} - \beta \log\frac{\pi_\theta(y_l|x)}{\pi_\text{ref}(y_l|x)}\right)\right]$$

**Interpretation**: DPO increases the probability of preferred responses relative to
rejected responses, measured against a frozen reference (SFT) policy. The β parameter
controls how far from the reference the policy is allowed to deviate.

### 3.3.2 DPO vs RLHF Trade-offs

| Aspect | RLHF (PPO) | DPO |
|---|---|---|
| Reward model | Required | Not needed |
| Training stability | Sensitive to hyperparameters | More stable |
| Data format | Online (generate-then-score) | Offline (preference pairs) |
| Performance ceiling | Higher when tuned well | Competitive, easier to reach |
| Memory | 3 models in memory (policy, ref, RM) | 2 models (policy, ref) |

### 3.3.3 Running DPO with TRL

```python
from trl import DPOTrainer, DPOConfig

trainer = DPOTrainer(
    model=model,          # policy being trained
    ref_model=ref_model,  # frozen SFT reference
    args=DPOConfig(
        beta=0.1,          # KL constraint — higher = stays closer to ref
        learning_rate=5e-5,
        num_train_epochs=1,
    ),
    train_dataset=dataset, # columns: prompt, chosen, rejected
    tokenizer=tokenizer,
    peft_config=lora_cfg,  # optional LoRA for memory efficiency
)
trainer.train()
```

**Open preference datasets:**
- [UltraFeedback Binarized](https://huggingface.co/datasets/trl-lib/ultrafeedback_binarized) — 60k pairs
- [UltraFeedback Binarized](https://huggingface.co/datasets/HuggingFaceH4/ultrafeedback_binarized) — preference pairs for DPO practice
- [OpenAssistant Conversations](https://huggingface.co/datasets/OpenAssistant/oasst1) — open assistant conversations for alignment study

---

## 3.4 LLM Evaluation

### 3.4.1 Evaluation Taxonomy

| Type | What It Measures | Tools |
|---|---|---|
| Multiple choice | Knowledge, reasoning | LM Eval Harness |
| Code generation | Coding ability | EvalPlus (HumanEval+) |
| Math reasoning | Step-by-step math | MATH, GSM8K |
| Instruction following | Format, instruction adherence | MT-Bench, AlpacaEval |
| Safety | Harmful content, honesty | TruthfulQA, BBQ |
| Factuality | Factual accuracy | TriviaQA, NaturalQuestions |

### 3.4.2 LM Evaluation Harness

```bash
pip install lm-eval

# Evaluate on MMLU (57-subject knowledge benchmark)
lm_eval --model hf \
    --model_args pretrained=meta-llama/Meta-Llama-3-8B-Instruct \
    --tasks mmlu,hellaswag,winogrande,arc_easy,arc_challenge \
    --device cuda:0 \
    --batch_size auto \
    --output_path results/

# Results include per-task accuracy and aggregate score
```

### 3.4.3 LLM-as-Judge

```python
FAITHFULNESS_JUDGE = """
You are evaluating whether the following answer is faithful to the provided context.
Score from 0.0 (completely hallucinated) to 1.0 (fully supported).

Context: {context}
Answer: {answer}

Respond ONLY with a JSON object:
{{"score": <0.0-1.0>, "reason": "<one sentence>"}}
"""
```

**Limitations of model-assisted review:**
- Positional bias (prefers first option in pairwise comparison)
- Verbosity bias (longer responses rated higher regardless of quality)
- Self-preference (a model judges its own outputs as better)

Always combine with automated metrics for reliability.

---

## 3.5 Debugging Tips

- **DPO reward margin is negative**: The model gives higher probability to rejected than preferred responses. Reduce β, increase learning rate, or check data quality.
- **SFT val loss doesn't decrease**: Check that instruction tokens are masked (label = -100). If loss includes instruction tokens, the model learns to reproduce the instruction format instead of the response.
- **MMLU score drops after alignment**: Normal if you aligned on a narrow task. Always run MMLU on both base and aligned model to check for catastrophic forgetting.

---

# Chapter 4 — Fine-Tuning: LoRA, QLoRA, and Domain Adaptation

## Learning Objectives

- Explain LoRA's low-rank decomposition mathematically
- Fine-tune Llama-3 8B with QLoRA on a custom task using a free T4 GPU
- Design a training dataset for domain-specific fine-tuning
- Evaluate fine-tuned vs base model on task-specific metrics
- Upload a LoRA adapter to the HuggingFace Hub

## Mental Model

> **LoRA is a surgical edit.**
>
> Full fine-tuning rewrites all 7 billion weights. LoRA instead adds a tiny
> bypass circuit (two small matrices) around each weight matrix. Only the bypass
> is trained — the original weights are frozen and shared. After training, the
> bypass can be merged back into the original weights with zero runtime overhead.

---

## 4.1 LoRA: Low-Rank Adaptation

### 4.1.1 The Mathematics

For a pre-trained weight matrix W₀ ∈ ℝ^(d×k), LoRA parameterises the update as:

$$W_\text{new} = W_0 + \Delta W = W_0 + \frac{\alpha}{r} B A$$

Where:
- B ∈ ℝ^(d×r) — initialised to zero (so ΔW = 0 at start of training)
- A ∈ ℝ^(r×k) — initialised with Gaussian noise
- r — rank hyperparameter (typically 4–128)
- α — scaling factor (commonly set to r, or 2r)

**Parameter count comparison for a 4096×4096 linear layer:**

| Method | Parameters | % of Original |
|---|---|---|
| Full fine-tuning | 16,777,216 | 100% |
| LoRA r=8 | 2 × 4096 × 8 = 65,536 | 0.39% |
| LoRA r=16 | 2 × 4096 × 16 = 131,072 | 0.78% |
| LoRA r=64 | 2 × 4096 × 64 = 524,288 | 3.13% |

**During training**: only A and B are updated; W₀ is frozen.
**During inference**: merge `W = W₀ + (α/r)·B·A` — zero overhead vs the base model.

### 4.1.2 QLoRA: 4-bit Quantisation + LoRA

QLoRA (Dettmers et al., 2023) extends LoRA with:

**NF4 Quantisation (NormalFloat4)**
- Quantises frozen W₀ to 4-bit using a data type optimised for normally distributed weights
- 4× memory reduction vs FP32, 2× vs FP16/BF16
- Dequantises on-the-fly during forward pass (to BF16 for computation)

**Double Quantisation**
- Quantises the quantisation constants themselves
- Saves an additional ~0.5 bits per parameter

**Paged Optimisers**
- Moves optimiser states to CPU RAM when GPU is tight
- Prevents OOM errors at long sequence lengths

**Practical GPU requirements:**

| Model | FP16 | INT8 | NF4 (QLoRA) |
|---|---|---|---|
| 7B | ~14 GB | ~7 GB | ~4 GB |
| 13B | ~26 GB | ~13 GB | ~7 GB |
| 70B | ~140 GB | ~70 GB | ~35 GB |

```python
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,     # double quantisation
)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
)
# IMPORTANT: must call this after loading with quantisation
from peft import prepare_model_for_kbit_training
model = prepare_model_for_kbit_training(model)
```

### 4.1.3 Which Layers to Adapt

| Target modules | Effect |
|---|---|
| `q_proj, v_proj` (attention Q and V only) | Original LoRA paper recommendation |
| `q_proj, k_proj, v_proj, o_proj` (all attention) | Better for attention-heavy tasks |
| `"all-linear"` (all linear layers including MLP) | Best empirically in recent work |

PEFT's `target_modules="all-linear"` applies LoRA to all linear layers automatically —
the recommended default in 2024.

### 4.1.4 Rank Selection Heuristics

| Task complexity | Recommended r | Trainable params (7B model) |
|---|---|---|
| Style / format adaptation | 4–8 | ~40M (0.5%) |
| Domain adaptation | 16–32 | ~160M (2%) |
| New skill (code, math) | 64–128 | ~640M (8%) |

---

## 4.2 Dataset Design for Fine-Tuning

### 4.2.1 The Data Quality Principle

> 1,000 high-quality examples often outperform 100,000 low-quality ones.

**Quality signals to check:**
- Response length: appropriate for the task (not padded, not truncated)
- Response correctness: verify a sample manually
- Format consistency: all examples use the same chat template
- Task diversity: avoid repetitive instruction patterns
- No contamination: test set must not appear in training data

### 4.2.2 Dataset Formats

```python
# Chat format (recommended for instruction models)
{
    "messages": [
        {"role": "system", "content": "You are a legal document analyst."},
        {"role": "user", "content": "Summarise this contract clause: ..."},
        {"role": "assistant", "content": "This clause specifies..."}
    ]
}

# Prompt-completion format (simpler, for completion models)
{
    "prompt": "Summarise this contract clause:\n{clause}\n\nSummary:",
    "completion": "This clause specifies..."
}
```

### 4.2.3 Synthetic Data Generation

For domain-specific fine-tuning with limited human-annotated data:
```python
# Use a local open-weight model to draft training examples
generator_prompt = """
Generate 5 diverse examples for fine-tuning a legal QA model.
Each example should have:
- A specific legal question about {domain}
- A precise, accurate answer citing relevant law

Output as JSON array: [{"question": "...", "answer": "..."}]
"""
```

**Caution**: Synthetic data must be reviewed, deduplicated, and license-compatible.
Use [Llama 3](https://llama.meta.com/), [Mistral](https://mistral.ai/),
Qwen, Gemma, or other open/permissive models for generation where the license
matches your downstream use.

---

## 4.3 The Complete Fine-Tuning Pipeline

```python
# 1. Load model in 4-bit
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
)
model = prepare_model_for_kbit_training(model)

# 2. Add LoRA adapters
lora_config = LoraConfig(
    r=16, lora_alpha=32,
    target_modules="all-linear",
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 41,943,040 || all params: 8,072,159,232 || trainable%: 0.5196

# 3. Train with SFTTrainer
trainer = SFTTrainer(
    model=model,
    args=SFTConfig(
        output_dir="llama3-8b-lora",
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        bf16=True,
        max_seq_length=2048,
        warmup_ratio=0.05,
        lr_scheduler_type="cosine",
        logging_steps=10,
        save_steps=500,
        report_to="wandb",
    ),
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
)
trainer.train()

# 4. Save and push to Hub
trainer.save_model("llama3-8b-lora/final")
model.push_to_hub("your-username/llama3-8b-domain-lora")
tokenizer.push_to_hub("your-username/llama3-8b-domain-lora")
```

---

## 4.4 Evaluation After Fine-Tuning

### 4.4.1 Task-Specific Metrics

| Task | Metric |
|---|---|
| Code generation | pass@k (HumanEval, MBPP) |
| Text summarisation | ROUGE-L, BERTScore |
| Question answering | Exact match, F1 |
| Classification | Accuracy, F1 |
| SQL generation | Execution accuracy |
| Math | pass@1 on GSM8K/MATH |

### 4.4.2 Checking for Catastrophic Forgetting

Always run MMLU on both base and fine-tuned model. Catastrophic forgetting
(significant MMLU drop) suggests learning rate too high, or too many epochs.

```bash
lm_eval --model hf \
    --model_args pretrained=your-username/llama3-8b-domain-lora \
    --tasks mmlu \
    --device cuda:0
```

A well-trained LoRA adapter should show:
- +10–30% improvement on the target task
- <2% degradation on MMLU (forgetting is minimal with LoRA)

---

# Chapter 5 — RAG: Retrieval-Augmented Generation

## Learning Objectives

- Explain when RAG beats fine-tuning (and vice versa)
- Choose appropriate chunking strategies for different document types
- Build a full RAG pipeline with LlamaIndex/LangChain and ChromaDB
- Evaluate RAG quality using RAGAS (faithfulness, answer relevancy, context recall)
- Implement reranking and measure its effect

## Mental Model

> **RAG is long-term memory for LLMs.**
>
> An LLM's parametric memory (weights) is fixed at training time. RAG gives it
> access to a dynamic, queryable external memory. The retriever finds the relevant
> pages; the LLM reads them and answers. This is how humans use reference books.

---

## 5.1 RAG Architecture

```
INDEXING (offline)
Documents → [Chunking] → [Embedding Model] → [Vector Database]

RETRIEVAL (online, per query)
Query → [Embed query] → [ANN Search] → [Top-K chunks]
                            ↓ (optional)
                    [Cross-encoder Reranking]
                            ↓
GENERATION
[Retrieved chunks + Query] → [LLM] → [Grounded Answer]
```

### 5.1.1 RAG vs Fine-Tuning Decision Matrix

| Use RAG when... | Use Fine-tuning when... |
|---|---|
| Knowledge changes frequently | Knowledge is static and stable |
| You need source attribution | Style/format adaptation is the goal |
| Knowledge base is large (>1M tokens) | Task requires new skills (SQL, structured output) |
| Privacy requires keeping data separate | You need low-latency, no retrieval overhead |
| You want to update knowledge without retraining | Budget is limited (no retrieval infra) |

---

## 5.2 Chunking Strategies

### 5.2.1 The Chunking Problem

Chunks must be:
- **Small enough** that the relevant chunk can be retrieved (not diluted by irrelevant content)
- **Large enough** to contain a complete, self-contained unit of information
- **Structured** to respect document organisation (headings, paragraphs, code blocks)

### 5.2.2 Strategy Comparison

**Fixed-Size (512 tokens, 50 overlap)**
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
```
Fast, simple, ignores content. Good for: clean prose documents.

**Sentence-Level**
```python
from llama_index.core.node_parser import SentenceSplitter
parser = SentenceSplitter(chunk_size=512)
```
Respects sentence boundaries. Good for: articles, reports.

**Semantic Chunking**
Embed each sentence; split where cosine similarity drops below threshold.
Best quality; 5× slower. Good for: heterogeneous long documents.

**Hierarchical (Small-to-Big)**
Index small chunks (128 tokens) for retrieval precision; return their parent
chunk (512 tokens) for generation context.
Best of both worlds. Good for: technical documentation, books.

### 5.2.3 Metadata Enrichment

Always attach metadata to chunks:
```python
chunk = {
    "text": "...",
    "metadata": {
        "source": "llama3_report.pdf",
        "page": 12,
        "section": "Architecture",
        "created_at": "2024-04-18",
    }
}
```

Use metadata for **filtered retrieval**:
```python
# Only search within a specific document section
results = collection.query(
    query_texts=[question],
    where={"section": "Architecture"},
    n_results=5,
)
```

---

## 5.3 Embedding Models

### 5.3.1 Open-Source Embedding Models

| Model | Dimensions | Context | MTEB Score | License |
|---|---|---|---|---|
| BAAI/bge-small-en-v1.5 | 384 | 512 | 62.2 | MIT |
| BAAI/bge-large-en-v1.5 | 1024 | 512 | 64.2 | MIT |
| Nomic-embed-text-v1 | 768 | 8192 | 62.4 | Apache 2.0 |
| mxbai-embed-large-v1 | 1024 | 512 | 64.7 | Apache 2.0 |
| snowflake-arctic-embed-m | 768 | 512 | strong | Apache 2.0 |

**Recommendation for this course**: `BAAI/bge-small-en-v1.5` — runs on CPU,
384 dimensions (small index), MIT license, excellent for learning.

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")
# BGE models work best with a query prefix:
query = "Represent this sentence for searching: " + question
embedding = model.encode(query)
```

---

## 5.4 Vector Databases

### 5.4.1 Open-Source Options

| Database | Type | Best For |
|---|---|---|
| [ChromaDB](https://github.com/chroma-core/chroma) | Embedded / server | Development, learning, small scale |
| [Weaviate](https://github.com/weaviate/weaviate) | Distributed server | Production, multi-tenancy |
| [Qdrant](https://github.com/qdrant/qdrant) | Distributed server | High-performance production |
| [pgvector](https://github.com/pgvector/pgvector) | PostgreSQL extension | Existing Postgres users |
| [FAISS](https://github.com/facebookresearch/faiss) | Library (no server) | Research, custom solutions |

**For this course**: ChromaDB — no server needed, installs in seconds:
```python
import chromadb
client = chromadb.Client()               # in-memory
# or: chromadb.PersistentClient("./db")  # on disk
collection = client.create_collection("my-rag-docs")
```

---

## 5.5 Retrieval and Reranking

### 5.5.1 Dense vs Sparse vs Hybrid

**Dense retrieval**: embed query → ANN search in vector space. Semantic.
Fails for: exact product codes, rare proper nouns, acronyms.

**Sparse retrieval (BM25)**: exact keyword matching with TF-IDF weighting.
Fast, no embedding model needed. Fails for: synonyms, paraphrases.

**Hybrid (Reciprocal Rank Fusion)**:
```python
# RRF: combine dense and sparse rankings
def rrf(dense_results, sparse_results, k=60):
    scores = {}
    for rank, doc_id in enumerate(dense_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (rank + k)
    for rank, doc_id in enumerate(sparse_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (rank + k)
    return sorted(scores.items(), key=lambda x: -x[1])
```

### 5.5.2 Reranking with Cross-Encoders

Cross-encoders jointly encode (query, chunk) and output a relevance score.
Much more accurate than bi-encoder similarity — but too slow for first-stage retrieval.

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# Retrieve top-20, rerank, keep top-5
candidates = collection.query(query_texts=[question], n_results=20)["documents"][0]
pairs = [(question, doc) for doc in candidates]
scores = reranker.predict(pairs)

# Sort by reranker score, keep top 5
top5_indices = sorted(range(len(scores)), key=lambda i: -scores[i])[:5]
top5_chunks = [candidates[i] for i in top5_indices]
```

---

## 5.6 Generation with Grounded Context

```python
RAG_PROMPT = """
You are a precise assistant that answers questions based only on the provided context.
If the context does not contain enough information to answer, say "I don't have
enough information in the provided context."

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""

def query_rag(question: str) -> dict:
    # 1. Retrieve
    results = collection.query(query_texts=[question], n_results=10)
    chunks  = results["documents"][0]  # note: [0] for first query

    # 2. Rerank
    pairs  = [(question, c) for c in chunks]
    scores = reranker.predict(pairs)
    top5   = [chunks[i] for i in sorted(range(len(scores)), key=lambda i: -scores[i])[:5]]

    # 3. Generate
    context = "\n\n---\n\n".join(top5)
    prompt  = RAG_PROMPT.format(context=context, question=question)
    answer  = llm.invoke(prompt)

    return {"answer": answer, "sources": top5, "context": context}
```

---

## 5.7 RAGAS Evaluation

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_recall

# Dataset format
dataset = Dataset.from_list([
    {
        "question": q,
        "answer": your_system_answer(q),
        "contexts": your_system_retrieve(q),
        "ground_truth": gold_answers[i],
    }
    for i, q in enumerate(test_questions)
])

results = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_recall])
print(results)
# {'faithfulness': 0.83, 'answer_relevancy': 0.76, 'context_recall': 0.91}
```

| Metric | What it measures | Ideal |
|---|---|---|
| faithfulness | Are claims in the answer grounded in retrieved context? | > 0.80 |
| answer_relevancy | Does the answer address the question? | > 0.75 |
| context_recall | Does the retrieved context contain the needed information? | > 0.85 |
| answer_correctness | How close is the answer to the gold answer? | > 0.70 |

**Diagnosing failures:**
- Low faithfulness + high context_recall → LLM is hallucinating despite good retrieval → fix the generation prompt
- Low context_recall + high faithfulness → retrieval is failing → fix chunking or embedding
- Low answer_relevancy + others high → LLM is answering a different question → check the generation prompt

---

# Chapter 6 — LLM Inference: Speed, Scale, and Efficiency

## Mental Model

> **LLM inference is a memory bandwidth problem, not a compute problem.**
>
> GPUs are compute-rich but memory-bandwidth-limited. Every token generation
> requires loading all model weights from GPU DRAM into SRAM registers.
> Optimisation means: load weights once, use them for as many tokens as possible
> (batching), and reduce how much you load (quantisation).

## Key Concepts Summary

| Technique | Problem Solved | Speedup |
|---|---|---|
| Continuous batching | Static batching wastes GPU between requests | 2–4× throughput |
| PagedAttention (vLLM) | KV cache fragmentation wastes GPU memory | 4× memory efficiency |
| FlashAttention-2 | Standard attention is memory-I/O inefficient | 2–3× attention speed |
| Speculative decoding | Sequential decode is slow for latency | 2–3× TTFT reduction |
| INT8 quantisation | Model weights consume too much DRAM bandwidth | 1.5–2× throughput |
| INT4 quantisation | INT8 not small enough for very large models | 2–3× throughput vs FP16 |
| Tensor parallelism | Single GPU can't fit large models | Enables 70B+ on 2 GPUs |

---

# Chapter 7 — AI Agents: From ReAct to Multi-Agent Systems

## Mental Model

> **An agent is an LLM with a decision loop and tools.**
>
> A base LLM produces text. An agent produces a plan, acts on it via tools,
> observes the result, and updates its plan — in a loop until the goal is reached.
> The LLM is the "brain"; tools are its "hands". The hard part is not the tools —
> it's managing the loop reliably, safely, and efficiently.

## Key Patterns

### ReAct Loop
```
Thought → Action → Observation → Thought → Action → ...
```
Each iteration is one LLM call. Tools are Python functions with JSON schemas.

### Memory Systems
| Type | Implementation | Lifetime |
|---|---|---|
| Working memory | Current context window | Single conversation |
| Episodic memory | Vector database of past conversations | Persistent |
| Semantic memory | RAG over a knowledge base | Persistent |
| Procedural memory | Fine-tuned skills | Model weights |

### Multi-Agent Patterns
| Pattern | Use case |
|---|---|
| Orchestrator + workers | Complex tasks with independent subtasks |
| Critic + generator | Output quality improvement via self-critique |
| Planner + executor | Long-horizon tasks with replanning |
| Debate | Controversial questions requiring multiple perspectives |

---

# Chapter 8 — Observability, Security, and Production Hardening

## Mental Model

> **Production LLM systems fail in ways you cannot unit test.**
>
> Standard metrics (uptime, latency, error rate) are necessary but not sufficient.
> You also need to measure quality (is the model still giving good answers?),
> safety (is it refusing what it should and allowing what it should?), and
> cost (how many tokens are we burning?). Build the measurement infrastructure
> before you need it.

## LLM-Specific Observability Checklist

```
Infrastructure layer:
  ☐ GPU utilisation and memory
  ☐ Request queue depth
  ☐ Token throughput (tokens/s)

Serving layer:
  ☐ TTFT (Time to First Token) — P50, P95, P99
  ☐ TBT (Time Between Tokens) — streaming smoothness
  ☐ Total generation time
  ☐ Context length distribution

Application layer:
  ☐ Retrieval latency (for RAG)
  ☐ Retrieval recall (sampled)
  ☐ Token usage per request (cost)
  ☐ Guardrail trigger rate

Quality layer:
  ☐ Faithfulness (sampled hourly)
  ☐ Task success rate (sampled on canary set)
  ☐ Refusal rate (should be stable)
```

## OWASP LLM Top 10 (2025)

| Rank | Risk | Mitigation |
|---|---|---|
| LLM01 | Prompt Injection | Input sanitisation, privilege separation |
| LLM02 | Sensitive Information Disclosure | Output filtering, data minimisation |
| LLM03 | Supply Chain | Model provenance verification |
| LLM04 | Data and Model Poisoning | Training data auditing |
| LLM05 | Improper Output Handling | Output validation, sandboxing |
| LLM06 | Excessive Agency | Minimal tool permissions, human-in-the-loop |
| LLM07 | System Prompt Leakage | System prompt isolation |
| LLM08 | Vector and Embedding Weaknesses | Embedding model auditing |
| LLM09 | Misinformation | Grounding, source citation |
| LLM10 | Unbounded Consumption | Rate limiting, cost caps |

---

# Capstone: Open-Source Production LLM System

## Overview

Build and ship a complete, production-quality LLM system as a public open-source
GitHub project. This is a real contribution to the open-source AI ecosystem.

## Requirements

- **LLM**: Open-source only (Llama-3, Mistral, Qwen, Phi-3, Gemma-2)
- **RAG**: Vector store + cross-encoder reranking
- **Agent**: 3+ tools, LangGraph state machine, safety guardrails
- **Evaluation**: RAGAS + 25+ custom test cases
- **Observability**: OpenTelemetry traces on all critical paths
- **Security**: Input guardrails, max_steps limit, tool call validation
- **Open source**: MIT or Apache 2.0, README, CI, CONTRIBUTING.md

## Timeline

| Day | Milestone |
|---|---|
| 5 | Repository structure + RAG pipeline working |
| 10 | Agent integrated + initial benchmark |
| 14 | Observability + security hardening complete |
| 18 | Full evaluation + README |
| 21 | v1.0.0 GitHub release |

## Evaluation Criteria

| Criterion | Points |
|---|---|
| RAG pipeline (chunking, embedding, retrieval, reranking) | 20 |
| Agent (3+ tools, LangGraph, guardrails) | 20 |
| Evaluation (RAGAS + custom benchmark ≥ 25 cases) | 20 |
| Observability (OpenTelemetry traces) | 10 |
| Open source quality (README, CI, license, contributing guide) | 15 |
| Code quality (clean, tested, documented) | 15 |
| **Total** | **100** |

---

## Contributing to This Course

This course is itself open source. Contributions welcome:

- Fix errors in explanations or code
- Add exercises for new techniques (e.g., Mixture of Experts, multimodal LLMs)
- Translate to other languages
- Add case studies from production deployments
- Improve test coverage for exercises

See `CONTRIBUTING.md` for the contribution workflow.

**Contributor code of conduct**: We follow the
[Contributor Covenant](https://www.contributor-covenant.org/).

---

*OpenCourses — Open source education for everyone.*
*This course is released under CC BY 4.0. Code examples are MIT licensed.*
