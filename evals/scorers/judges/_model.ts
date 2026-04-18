import Anthropic from "@anthropic-ai/sdk";

const PROVIDER = process.env.EVAL_PROVIDER ?? "anthropic";
const ANTHROPIC_MODEL =
  process.env.EVAL_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const OLLAMA_BASE_URL =
  process.env.EVAL_OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.EVAL_OLLAMA_MODEL ?? "gemma4:26b";

export async function judge(prompt: string): Promise<number> {
  const raw =
    PROVIDER === "anthropic"
      ? await callAnthropic(prompt)
      : await callOllama(prompt);
  return parseScore(raw);
}

async function callAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 128,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content[0]?.type === "text"
    ? response.content[0].text
    : "0";
}

async function callOllama(prompt: string): Promise<string> {
  const r = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      // 4096 needed: thinking models (Gemma4, Qwen3) fill reasoning first, then output to content
      max_tokens: 4096,
      options: { think: false },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { choices: Array<{ message: { content: string } }> };
  return j.choices[0].message.content;
}

function parseScore(raw: string): number {
  const stripped = raw.trim();
  // Strict: entire trimmed string is a decimal
  const direct = parseFloat(stripped);
  if (!isNaN(direct) && direct >= 0 && direct <= 1) return direct;
  // Tolerant: first word-boundary decimal in response (handles "The score is 0.7.")
  const match = stripped.match(/(?:^|\s)(0?\.\d+|1\.0+|0|1)(?:\s|$)/);
  if (match) {
    const n = parseFloat(match[1]);
    if (n >= 0 && n <= 1) return n;
  }
  throw new Error(`could not parse score from: ${stripped.slice(0, 200)}`);
}
