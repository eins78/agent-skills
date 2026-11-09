// @ts-check
/**
 * chatCompletionStream (the streamed completion ai-review uses) against a
 * mock SSE server. The canonical copy lives in this skill's lib; ai-review
 * ships a byte-equal copy.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { chatCompletionStream, CompletionError } from "../scripts/lib/openrouter.mjs";

process.env.COUNCIL_RETRY_BACKOFF_MS = "5";
const KEY = "sk-or-stream-SECRET";

/** @type {ReturnType<typeof createServer>} */
let server;
let baseUrl = "";
let hits = 0;
/** @type {(hit: number) => {status?: number, lines?: string[]}} */
let plan = () => ({});

before(async () => {
  server = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      hits++;
      const p = plan(hits);
      if (p.status) {
        res.writeHead(p.status).end(`{"error":"mock ${p.status} ${KEY}"}`);
        return;
      }
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.end((p.lines ?? []).join("\n") + "\n");
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", () => r(undefined)));
  baseUrl = `http://127.0.0.1:${/** @type {import("node:net").AddressInfo} */ (server.address()).port}`;
});
after(() => server.close());

const delta = (/** @type {string} */ t) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n`;
const base = { get baseUrl() { return baseUrl; }, apiKey: KEY, model: "m/x", messages: [{ role: "user", content: "hi" }], timeoutMs: 5000 };

test("joins deltas, skips comments and bad chunks, reads usage and finish_reason", async () => {
  hits = 0;
  plan = () => ({
    lines: [
      ": OPENROUTER PROCESSING", "", delta("Hel"), "data: {not json", delta("lo"),
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}`,
      `data: ${JSON.stringify({ choices: [], usage: { cost: 0.5 } })}`, "data: [DONE]",
    ],
  });
  /** @type {string[]} */
  const seen = [];
  const r = await chatCompletionStream({ ...base, baseUrl, onText: (d) => seen.push(d) });
  assert.equal(r.content, "Hello");
  assert.deepEqual(seen, ["Hel", "lo"]);
  assert.equal(r.finishReason, "stop");
  assert.equal(r.usage.cost, 0.5);
});

test("429 then ok retries once; 401 is not retried and the key is redacted", async () => {
  hits = 0;
  plan = (n) => (n === 1 ? { status: 429 } : { lines: [delta("ok"), "data: [DONE]"] });
  const ok = await chatCompletionStream({ ...base, baseUrl, onText: () => {} });
  assert.equal(ok.content, "ok");
  assert.equal(hits, 2);

  hits = 0;
  plan = () => ({ status: 401 });
  await assert.rejects(chatCompletionStream({ ...base, baseUrl, onText: () => {} }), (/** @type {unknown} */ e) => {
    assert.ok(e instanceof CompletionError);
    assert.match(e.message, /HTTP 401/);
    assert.ok(!e.message.includes(KEY));
    return true;
  });
  assert.equal(hits, 1);
});

test("an error chunk before any text retries; after text it fails with the partial text", async () => {
  hits = 0;
  const err = `data: ${JSON.stringify({ error: { code: 502, message: "up" } })}`;
  plan = (n) => (n === 1 ? { lines: [err] } : { lines: [delta("fine"), "data: [DONE]"] });
  const ok = await chatCompletionStream({ ...base, baseUrl, onText: () => {} });
  assert.equal(ok.content, "fine");
  assert.equal(hits, 2);

  hits = 0;
  plan = () => ({ lines: [delta("part"), err] });
  await assert.rejects(chatCompletionStream({ ...base, baseUrl, onText: () => {} }), (/** @type {unknown} */ e) => {
    assert.ok(e instanceof CompletionError);
    assert.equal(e.partial, "part");
    return true;
  });
  assert.equal(hits, 1);
});

test("an empty stream retries once, then fails as an empty completion", async () => {
  hits = 0;
  plan = () => ({ lines: ["data: [DONE]"] });
  await assert.rejects(chatCompletionStream({ ...base, baseUrl, onText: () => {} }), /Empty completion/);
  assert.equal(hits, 2);
});
