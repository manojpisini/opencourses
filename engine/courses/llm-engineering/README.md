# LLM Engineering — Assets Guide

This directory contains all course assets. Below is a complete guide for maintainers
on what to create for each subdirectory.

---

## `assets/images/`

### Course-Level Brand Assets
| File | Dimensions | Description |
|---|---|---|
| `thumbnail.png` | 1600x900 (16:9) | Course card image — OpenCourses-branded transformer diagram with course title |
| `banner.png` | 1800x600 (3:1) | Hero banner — token to embedding to attention to output flow |
| `badge.png` | 512x512 | Certificate badge — "LLM Engineer" badge in the OpenCourses brand system |

`course.yaml` uses these for the public course card, banner/OG image, and certificate badge.
The `ch-*` images below are only used as lesson-level diagrams.

### Chapter Diagrams (produce as SVG, export PNG)
| File | Content |
|---|---|
| `ch-01-attention-diagram.png` | Scaled dot-product attention — Q, K, V matrices, softmax, output. Colour-coded by operation type. |
| `ch-01-transformer-block.png` | GPT-style block: input → LayerNorm → MHA → residual → LayerNorm → MLP → residual |
| `ch-01-kv-cache.png` | Side-by-side: without KV cache (full recompute) vs with KV cache (incremental) |
| `ch-01-gqa.png` | Standard MHA (32 Q, 32 K, 32 V) vs GQA (32 Q, 8 K, 8 V) side by side |
| `ch-02-pretraining-loop.png` | nanoGPT training loop flowchart: data → tokenize → forward → loss → backward → step |
| `ch-02-scaling-laws.png` | Chinchilla scaling law curve: optimal tokens vs parameter count |
| `ch-03-alignment-pipeline.png` | Base model → SFT → Reward Model → RLHF/DPO. 3-phase diagram. |
| `ch-03-dpo-objective.png` | DPO loss diagram: preferred vs rejected response log-ratio under reference policy |
| `ch-04-lora-diagram.png` | LoRA weight decomposition: W₀ (frozen) + B·A (trainable). Parameter count comparison. |
| `ch-04-qlora-memory.png` | Memory breakdown: BF16 vs INT8 vs NF4 for 8B model. Bar chart. |
| `ch-05-rag-pipeline.png` | Full RAG pipeline: documents → chunk → embed → index → query → retrieve → rerank → generate |
| `ch-05-chunking-strategies.png` | Side-by-side: fixed-size vs sentence vs semantic vs hierarchical chunking on sample text |
| `ch-06-continuous-batching.png` | Static batching (requests padded to max) vs continuous batching (sliding window) |
| `ch-06-pagedattention.png` | PagedAttention memory layout: logical blocks mapped to non-contiguous physical pages |
| `ch-07-react-loop.png` | ReAct thought → action → observation loop. With tool schema sidebar. |
| `ch-07-langgraph.png` | LangGraph state machine: agent node → conditional edge → tools node → back to agent |
| `ch-08-otel-spans.png` | OpenTelemetry trace: root span with child spans for retrieval, reranking, LLM call |
| `ch-08-attack-vectors.png` | Direct vs indirect prompt injection: attacker flow diagram |

**Design guidelines:**
- Background: `#0A0A0A` (true black, consistent with OpenCourses dark theme)
- Primary accent: `#7C3AED` (violet-600)
- Secondary accent: `#06B6D4` (cyan-500)
- Text: `#F8FAFC` (slate-50)
- Code blocks in diagrams: `#1E1E2E` background, `#CDD6F4` text (Catppuccin Mocha)
- Font: Inter for labels, JetBrains Mono for code annotations
- Export at 2× resolution (retina)

---

## `assets/slides/`

One PDF slide deck per chapter. Each deck follows this template:

### Deck Structure
1. **Title slide** — chapter number, title, estimated time
2. **Learning objectives** — bullet list, max 4 items
3. **Mental model** — one visual metaphor that anchors the chapter
4. **Core concepts** — 3–6 slides, one concept each with diagram + 3-bullet explanation
5. **Code walkthrough** — annotated code screenshots from the actual open-source repo
6. **Common mistakes** — red-bordered slides, "Don't do this / Do this instead" pattern
7. **Summary** — one slide, all key concepts in a table
8. **Interview / exam tips** — 3–5 bullet points of things commonly tested
9. **Further reading** — QR codes linking to papers/repos

### Slides to Create
| File | Chapter |
|---|---|
| `ch-01-transformer-architecture.pdf` | Transformer internals: tokenization → attention → positional encoding |
| `ch-02-pretraining.pdf` | Pre-training: objective, data pipeline, scaling laws, nanoGPT walkthrough |
| `ch-03-alignment.pdf` | Alignment: SFT, RLHF, DPO, evaluation |
| `ch-04-finetuning.pdf` | Fine-tuning: LoRA math, QLoRA setup, dataset design |
| `ch-05-rag.pdf` | RAG: chunking, retrieval strategies, reranking, RAGAS |
| `ch-06-inference.pdf` | Inference: continuous batching, PagedAttention, quantisation, FlashAttention |
| `ch-07-agents.pdf` | Agents: ReAct, tool schemas, LangGraph, multi-agent, safety |
| `ch-08-production.pdf` | Production: OpenTelemetry, evaluation pipelines, security, guardrails |

**Tools:** Use Figma (free) or Google Slides. Export as PDF. Keep slides to 20–30 per deck.

---

## `assets/data/`

### Test Datasets

**`ch-05-questions.json`** — 20-question RAG evaluation set for the Llama-3 technical report
```json
[
  {
    "id": "q-001",
    "question": "What vocabulary size does the Llama-3 tokenizer use?",
    "ground_truth": "128,256 tokens",
    "source_page": 3
  },
  {
    "id": "q-002",
    "question": "How many tokens was Llama-3 8B trained on?",
    "ground_truth": "15 trillion tokens",
    "source_page": 4
  }
  // ... 18 more questions
]
```

**`ch-07-benchmark.json`** — 20-task agent benchmark
```json
[
  {
    "id": "task-001",
    "task_type": "arithmetic_with_search",
    "question": "What is the square root of the current number of UN member states?",
    "requires_tools": ["web_search", "calculator"],
    "gold_answer_pattern": "~13.2 (accepts 13.1–13.3)",
    "max_steps": 5
  }
  // ... 19 more tasks
]
```

**`final-test-rubric.json`** — machine-readable rubric for automated grading hooks
```json
{
  "final_test": {
    "passing_score": 75,
    "sections": [
      {"id": "ft-s-01", "weight": 40, "questions": ["ft-s-01-q-01", "ft-s-01-q-02", "ft-s-01-q-03", "ft-s-01-q-04"]},
      {"id": "ft-s-02", "weight": 35, "questions": ["ft-s-02-q-01", "ft-s-02-q-02", "ft-s-02-q-03"]},
      {"id": "ft-s-03", "weight": 25, "questions": ["ft-s-03-q-01", "ft-s-03-q-02"]}
    ]
  }
}
```

---

## `assets/starter/`

### Per-chapter starter code

Each `ch-XX/` subdirectory must contain:
- `starter.py` — exercise skeleton with TODOs and docstrings
- `requirements.txt` — exact pinned dependencies for reproducibility
- `README.md` — setup instructions (3 commands max to get running)

### `ch-01/` (already exists: `starter.py`)
Additional files needed:
- `tokenizer_inspect.py` — runnable tokenizer inspection script (provided in course.yaml code blocks)
- `bpe_scratch.py` — BPE scratch implementation demo
- `attention_scratch.py` — single-head attention
- `mha_scratch.py` — multi-head attention
- `kv_cache_demo.py` — KV cache demonstration
- `requirements.txt`:
  ```
  transformers==4.41.0
  torch==2.3.0
  ```

### `ch-02/`
- `training_loop_annotated.py` — annotated nanoGPT loop
- `requirements.txt`:
  ```
  torch==2.3.0
  numpy==1.26.4
  transformers==4.41.0
  datasets==2.20.0
  tiktoken==0.7.0
  wandb==0.17.0
  tqdm==4.66.4
  ```

### `ch-03/`
- `sft_train.py` — SFT training script
- `dpo_train.py` — DPO training script
- `requirements.txt`:
  ```
  transformers==4.41.0
  trl==0.9.4
  peft==0.11.1
  datasets==2.20.0
  torch==2.3.0
  bitsandbytes==0.43.1
  wandb==0.17.0
  ```

### `ch-04/`
- `train.py` — QLoRA training script (configurable via `config.yaml`)
- `config.yaml` — default training config (student edits this)
- `eval.py` — HumanEval evaluation script
- `requirements.txt`:
  ```
  transformers==4.41.0
  trl==0.9.4
  peft==0.11.1
  bitsandbytes==0.43.1
  datasets==2.20.0
  torch==2.3.0
  wandb==0.17.0
  evalplus==0.3.1
  ```

### `ch-05/`
- `pipeline.py` — RAG pipeline skeleton (student fills in)
- `eval.py` — RAGAS evaluation runner
- `questions.json` — 20-question test set (copy from `assets/data/`)
- `requirements.txt`:
  ```
  llama-index==0.10.52
  chromadb==0.5.3
  sentence-transformers==3.0.1
  ragas==0.1.14
  langchain==0.2.7
  pypdf==4.2.0
  transformers==4.41.0
  torch==2.3.0
  ```

### `ch-06/`
- `benchmark_serving.py` — throughput/latency benchmarking script
- `requirements.txt`:
  ```
  vllm==0.5.0
  transformers==4.41.0
  torch==2.3.0
  autoawq==0.2.5
  ```

### `ch-07/`
- `react_agent.py` — LangGraph ReAct agent skeleton
- `benchmark.json` — 20-task benchmark (copy from `assets/data/`)
- `eval_agent.py` — agent evaluation script
- `requirements.txt`:
  ```
  langgraph==0.2.0
  langchain==0.2.7
  langchain-community==0.2.7
  langchain-ollama==0.1.0
  ```

---

## `assets/solutions/`

> ⚠️ PRIVATE BRANCH ONLY. Never commit to the public branch.

One file per exercise:

| File | Contents |
|---|---|
| `ch-01-bpe-solution.py` | Complete `BasicBPETokenizer` — all methods implemented |
| `ch-01-block-solution.py` | Complete `TransformerBlock` — pre-norm, MHA, GELU MLP |
| `ch-02-nanogpt-analysis.md` | Model answers for the 4 analysis questions |
| `ch-03-alignment-solution.py` | Complete SFT + DPO pipeline |
| `ch-04-qlora-solution.py` | Complete QLoRA training + evaluation script |
| `ch-05-rag-solution.py` | Complete RAG pipeline with reranking |
| `ch-06-benchmark-solution.py` | Complete benchmarking script with all configurations |
| `ch-07-agent-solution.py` | Complete LangGraph agent with 4 tools |
| `ch-08-instrumented-solution.py` | Fully instrumented RAG pipeline |

---

## `assets/tests/`

### Already created
- `test_bpe.py` — Chapter 1 BPE tokenizer tests (5 tests)
- `test_block.py` — Chapter 1 TransformerBlock tests (3 tests)

### To create
| File | Chapter | Tests |
|---|---|---|
| `test_rag_pipeline.py` | Ch-05 | Pipeline runs, RAGAS faithfulness ≥ 0.70, round-trip check |
| `test_agent.py` | Ch-07 | Agent runs, tools are called, max_steps respected |
| `test_otel.py` | Ch-08 | Spans created, gen_ai attributes present, parent-child correct |

### Test file conventions
```python
# All test files must:
# 1. Run in < 60 seconds (mock expensive calls with fixtures)
# 2. Use pytest fixtures for model/tokenizer loading (cached with @pytest.fixture(scope="module"))
# 3. Include a docstring explaining what each test validates and WHY
# 4. Use descriptive assert messages (student should know exactly what failed)
```

---

## Generator Scripts

Dynamic test generators for the testing system:

| File | What it generates |
|---|---|
| `tests/q1-gen.py` | Random BPE training corpora + expected encode/decode pairs |
| `tests/q2-gen.py` | Random attention input tensors + expected output shapes |
| `tests/fuzz-gen.py` | Random Unicode strings for BPE round-trip fuzzing |
| `tests/property-gen.py` | Hypothesis-based property tests for attention invariants |

```python
# tests/fuzz-gen.py — example structure
import random
import string
import unicodedata

def generate_fuzz_corpus(n: int = 100) -> list[str]:
    """Generate n random strings for BPE round-trip fuzzing."""
    cases = []
    for _ in range(n):
        length = random.randint(1, 200)
        # Mix ASCII, emoji, CJK, Arabic
        chars = [random.choice([
            random.choice(string.ascii_letters + string.digits),
            random.choice("αβγδεζηθ"),
            random.choice("你好世界"),
            random.choice("🎉🔥💡🌊"),
        ]) for _ in range(length)]
        cases.append("".join(chars))
    return cases
```
