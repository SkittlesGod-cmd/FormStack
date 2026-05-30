import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
      defaultHeaders: {
        "HTTP-Referer": "https://formlayer.co",
        "X-Title": "FormLayer",
      },
    });
  }
  return _client;
}

// DeepSeek V4 Flash — best free model on OpenRouter (GPQA Diamond 88.1%, 1M context)
export const MODEL = "deepseek/deepseek-v4-flash:free";

// Same model for compliance — strong enough, avoids extra API calls
export const MODEL_COMPLIANCE = "deepseek/deepseek-v4-flash:free";

export const MAX_TOKENS = 8000;
export const MAX_TOKENS_FORMULATE = 16000;
