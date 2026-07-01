import { Mail, MapPin, Phone, Sparkles, Globe2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@bidayax/ui";
import type { ExecutiveProfile } from "../data/executives";

type ContactDetailsProps = {
  readonly executive: ExecutiveProfile;
};

export function ContactDetails({ executive }: ContactDetailsProps) {
  const details = [
    {
      label: "Phone",
      value: executive.phone,
      icon: Phone
    },
    {
      label: "Email",
      value: executive.email,
      icon: Mail
    },
    {
      label: "Website",
      value: executive.website,
      icon: Globe2
    },
    {
      label: "Address",
      value: executive.address,
      icon: MapPin
    }
  ] as const;

  return (
    <Card className="card-panel">
      <CardHeader>
        <div className="flex items-center gap-2 text-content-accent">
          <Sparkles aria-hidden="true" size={16} />
          <CardTitle className="text-base">Executive contact</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          {details.map((detail) => {
            const Icon = detail.icon;

            return (
              <div key={detail.label} className="flex gap-3">
                <Icon aria-hidden="true" className="mt-0.5 text-content-accent" size={18} />
                <div>
                  <dt className="font-heading text-xs font-semibold uppercase tracking-wider text-content-muted">
                    {detail.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-content-primary">{detail.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
