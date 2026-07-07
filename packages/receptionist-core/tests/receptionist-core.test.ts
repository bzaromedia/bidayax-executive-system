import { describe, expect, it } from "vitest";
import {
  createFrontOfficeWorkflowRun,
  createReceptionistInteraction,
  extractConversationMemory,
  frontOfficeWorkflowNodeIds,
  mapModeToWorkflowSource
} from "../src/index";
import type { ReceptionistRequest } from "@bidayax/types";

const request: ReceptionistRequest = {
  company: "BidayaX LLC",
  consent: true,
  email: "visitor@example.com",
  executiveSlug: "ad-garner",
  message: "Please schedule a callback with the executive team tomorrow.",
  name: "Visitor One",
  phone: "+1 302 330 5547",
  preferredLanguage: "English",
  preferredTime: "Tomorrow morning",
  requestType: "request_callback"
};

describe("receptionist core", () => {
  it("maps all interaction modes into shared workflow sources", () => {
    expect(mapModeToWorkflowSource("phone")).toBe("inbound_call");
    expect(mapModeToWorkflowSource("chat")).toBe("chat_message");
    expect(mapModeToWorkflowSource("voice_chat")).toBe("voice_chat");
    expect(mapModeToWorkflowSource("form")).toBe("web_form");
  });

  it("creates receptionist interactions and conversation memory", () => {
    const interaction = createReceptionistInteraction({
      mode: "chat",
      now: new Date("2026-07-04T00:00:00.000Z"),
      request
    });
    const memory = extractConversationMemory(request);

    expect(interaction.mode).toBe("chat");
    expect(interaction.status).toBe("callback_queued");
    expect(memory.followUpRequired).toBe(true);
    expect(memory.actionItems).toContain("request_callback");
  });

  it("runs the n8n-style front-office workflow nodes", async () => {
    const run = await createFrontOfficeWorkflowRun({
      mode: "voice_chat",
      now: new Date("2026-07-04T00:00:00.000Z"),
      request
    });

    expect(run.triggerType).toBe("voice_chat");
    expect(run.nodes.map((node) => node.nodeId)).toEqual(frontOfficeWorkflowNodeIds);
    expect(run.nodes.map((node) => node.nodeId)).toContain("EventLedgerWrite");
    expect(run.nodes.map((node) => node.nodeId)).toContain("ContactGraphUpdate");
    expect(run.nodes.map((node) => node.nodeId)).toContain("NotificationSend");
    expect(run.task?.taskType).toBe("callback");
  });
});
