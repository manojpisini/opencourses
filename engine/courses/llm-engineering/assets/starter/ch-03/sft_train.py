"""SFT training scaffold using open-source HuggingFace tooling."""

from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer

MODEL_ID = "HuggingFaceTB/SmolLM2-135M"


def build_toy_dataset() -> Dataset:
    return Dataset.from_list(
        [
            {"text": "### Instruction\nExplain attention.\n\n### Response\nAttention weights context tokens by relevance."},
            {"text": "### Instruction\nDefine RAG.\n\n### Response\nRAG retrieves external context before generation."},
        ]
    )


def main() -> None:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID)
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=build_toy_dataset(),
        args=SFTConfig(output_dir="out/sft-smollm", max_steps=3, per_device_train_batch_size=1),
    )
    trainer.train()


if __name__ == "__main__":
    main()
