import type {
  AdapterHealthSnapshot,
  CommunicationChannel,
  CommunicationChannelAdapterContract,
  CommunicationCommand,
  NormalizedAdapterEvent,
  NormalizedCommunicationStatus
} from "@bidayax/communications-domain";

export const forbiddenCommunicationsImports = [
  "@bidayax/telephony",
  "services/telephony",
  "twilio",
  "telnyx",
  "vonage"
] as const;

export const channelAdapterRuntimeOperationNames = [
  "submitCommand",
  "cancelCommand",
  "getHealthSnapshot",
  "normalizeStatus",
  "normalizeEvent",
  "shutdown"
] as const;

export const channelAdapterRegistryOperationNames = [
  "register",
  "listByChannel",
  "listAll"
] as const;

export interface ChannelAdapterRuntime {
  readonly contract: CommunicationChannelAdapterContract;
  submitCommand(command: CommunicationCommand): Promise<NormalizedAdapterEvent>;
  cancelCommand(input: {
    readonly tenantId: string;
    readonly cardId: string | null;
    readonly communicationId: string;
    readonly reason: string;
  }): Promise<NormalizedAdapterEvent>;
  getHealthSnapshot(): Promise<AdapterHealthSnapshot>;
  normalizeStatus(input: unknown): Promise<NormalizedCommunicationStatus>;
  normalizeEvent(input: unknown): Promise<NormalizedAdapterEvent>;
  shutdown(): Promise<void>;
}

export interface ChannelAdapterRegistry {
  register(runtime: ChannelAdapterRuntime): void;
  listByChannel(channel: CommunicationChannel): readonly ChannelAdapterRuntime[];
  listAll(): readonly ChannelAdapterRuntime[];
}