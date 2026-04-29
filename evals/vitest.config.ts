import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["evals/**/*.eval.ts"],
    exclude: ["**/node_modules/**"],
    // Needed when EVAL_PROVIDER=ollama: Ollama queues requests sequentially.
    // Concurrent eval files saturate the queue and hit the 30s default timeout.
    // poolOptions.threads.maxThreads:1 ensures one file runs at a time.
    poolOptions: {
      threads: { maxThreads: 1 },
      forks: { maxForks: 1 },
    },
  },
});
