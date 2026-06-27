import { describe, expect, it } from "vitest";
import { createLanguageProfile } from "../src/language-profile";
import { generateReceptionistTasks } from "../src/task-generator";

describe("generateReceptionistTasks", () => {
  it("generates a task from an intent", () => {
    const tasks = generateReceptionistTasks({
      intent: "schedule_meeting",
      priority: "medium"
    });

    expect(tasks).toEqual([
      expect.objectContaining({
        priority: "medium",
        status: "simulated",
        taskType: "schedule_meeting"
      })
    ]);
  });

  it("handles language profile metadata", () => {
    const profile = createLanguageProfile({
      dialect: "Gulf Arabic",
      language: "Arabic"
    });

    expect(profile.direction).toBe("rtl");
    expect(profile.script).toBe("Arabic");
    expect(profile.notes).toContain("Simulated");
  });
});
