"""Benchmark naive local generation against a local vLLM HTTP endpoint."""

import json
import time
import urllib.request

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
PROMPTS = ["Explain retrieval-augmented generation in two sentences."] * 8


def call_vllm(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": MODEL_ID,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 128,
            "temperature": 0,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:8000/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        body = json.loads(res.read().decode("utf-8"))
    return body["choices"][0]["message"]["content"]


def benchmark_naive() -> float:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16, device_map="auto")
    model.eval()
    start = time.perf_counter()
    for prompt in PROMPTS:
        ids = tokenizer(prompt, return_tensors="pt").input_ids.to(model.device)
        with torch.no_grad():
            model.generate(ids, max_new_tokens=128, do_sample=False)
    return time.perf_counter() - start


def benchmark_vllm() -> float:
    start = time.perf_counter()
    for prompt in PROMPTS:
        call_vllm(prompt)
    return time.perf_counter() - start


if __name__ == "__main__":
    naive = benchmark_naive()
    served = benchmark_vllm()
    print(f"naive_seconds={naive:.2f}")
    print(f"vllm_seconds={served:.2f}")
    print(f"speedup={naive / served:.2f}x")
