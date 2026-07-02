import type { ReceptionistRequestType } from "@bidayax/types";

export const receptionistRequestTypeOptions = [
  {
    label: "Schedule meeting",
    value: "schedule_meeting"
  },
  {
    label: "Route message",
    value: "route_message"
  },
  {
    label: "Request callback",
    value: "request_callback"
  },
  {
    label: "Qualify lead",
    value: "qualify_lead"
  },
  {
    label: "General inquiry",
    value: "general_inquiry"
  },
  {
    label: "Partnership request",
    value: "partnership_request"
  },
  {
    label: "Support request",
    value: "support_request"
  }
] as const satisfies readonly {
  readonly label: string;
  readonly value: ReceptionistRequestType;
}[];

