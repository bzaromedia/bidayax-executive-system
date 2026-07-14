import { processVoiceRuntimeTurn } from "./turn-manager";
import type { VoiceRuntimeInput, VoiceRuntimeTurn } from "./types";

export type VoiceRuntimeRun = {
  readonly runId: string;
  readonly turns: readonly VoiceRuntimeTurn[];
  readonly finalState: VoiceRuntimeTurn["session"]["state"];
  readonly providerStatus: VoiceRuntimeTurn["session"]["providerStatus"];
};

export async function runVoiceRuntime(input: VoiceRuntimeInput): Promise<VoiceRuntimeRun> {
  const turn = await processVoiceRuntimeTurn(input);

  return {
    finalState: turn.session.state,
    providerStatus: turn.session.providerStatus,
    runId: `voice-runtime-run:${input.sessionId}`,
    turns: [turn]
  };
}