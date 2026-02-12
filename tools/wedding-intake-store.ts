import crypto from "node:crypto";

// Lightweight in-memory intake session registry.
// This prevents the LLM from calling `wedding-pitch-deck` directly without first
// opening the intake UI via `wedding-planner`.

const TTL_MS = 1000 * 60 * 60 * 24; // 24h
const sessions = new Map<string, number>(); // id -> expiresAt

function cleanupExpired() {
  const now = Date.now();
  for (const [id, expiresAt] of sessions.entries()) {
    if (expiresAt <= now) sessions.delete(id);
  }
}

export function issueWeddingIntakeSessionId(): string {
  cleanupExpired();
  const id = `wi_${crypto.randomBytes(12).toString("base64url")}`;
  sessions.set(id, Date.now() + TTL_MS);
  return id;
}

export function assertValidWeddingIntakeSessionId(id: string) {
  cleanupExpired();
  const expiresAt = sessions.get(id);
  if (!expiresAt) {
    throw new Error(
      "Missing/invalid intake session. Start with the `wedding-planner` tool (intake) before generating the pitch deck.",
    );
  }
}

