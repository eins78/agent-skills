import { defineConfig } from "evalite/config";

export default defineConfig({
  // Serial execution: Ollama processes one request at a time.
  // Concurrent tests queue up and hit the default 30s timeout.
  maxConcurrency: 1,
  // 90s per test: single Gemma4/Qwen3 call takes ~15-30s with thinking.
  testTimeout: 90_000,
});
