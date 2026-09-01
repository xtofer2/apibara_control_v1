import "server-only";

import { randomUUID } from "node:crypto";

export function createSuccessFeedback(message: string) {
  return {
    feedbackAt: Date.now(),
    feedbackId: randomUUID(),
    message,
    status: "success" as const,
  };
}
