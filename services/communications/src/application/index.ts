import type {
  CommunicationCommand,
  CommunicationEventEnvelope
} from "@bidayax/communications-domain";

export interface CommunicationCommandHandler {
  supports(commandType: CommunicationCommand["type"]): boolean;
  handle(command: CommunicationCommand): Promise<CommunicationEventEnvelope>;
}

export interface CommunicationQueryService {
  queryStatus(input: {
    readonly tenantId: string;
    readonly cardId: string | null;
    readonly communicationId: string;
  }): Promise<Readonly<Record<string, unknown>>>;
}
