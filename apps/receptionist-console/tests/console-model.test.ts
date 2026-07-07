import { describe, expect, it } from "vitest";
import { summarizeReceptionistConsole } from "../src/index";

describe("receptionist console model", () => {
  it("summarizes workflow visibility for the console", () => {
    expect(
      summarizeReceptionistConsole({
        approvalQueueCount: 1,
        interactions: [
          {
            action: "request_callback",
            cardId: "ad-garner",
            createdAt: "2026-07-04T00:00:00.000Z",
            executiveId: "ad-garner",
            id: "interaction-1",
            intent: "request_callback",
            language: "English",
            mode: "chat",
            status: "callback_queued",
            trustScore: 60,
            urgencyScore: 58
          }
        ],
        tasks: [
          {
            dueAt: null,
            interactionId: "interaction-1",
            status: "queued",
            summary: "Call back visitor.",
            taskId: "task-1",
            taskType: "callback"
          }
        ]
      })
    ).toEqual({
      activeInteractions: 1,
      approvalQueueCount: 1,
      completedInteractions: 0,
      queuedTasks: 1
    });
  });
});
