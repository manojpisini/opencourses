"""DPO training scaffold. Replace the toy data with a real preference sample."""

from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOConfig, DPOTrainer

MODEL_ID = "HuggingFaceTB/SmolLM2-135M"


def build_toy_preferences() -> Dataset:
    return Dataset.from_list(
        [
            {
                "prompt": "Explain why causal masking is needed.",
                "chosen": "Causal masking prevents a token from attending to future tokens during autoregressive training.",
                "rejected": "It makes training faster because the model skips random tokens.",
            }
        ]
    )


def main() -> None:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID)
    trainer = DPOTrainer(
        model=model,
        ref_model=None,
        tokenizer=tokenizer,
        train_dataset=build_toy_preferences(),
        args=DPOConfig(output_dir="out/dpo-smollm", max_steps=3, per_device_train_batch_size=1),
    )
    trainer.train()


if __name__ == "__main__":
    main()
