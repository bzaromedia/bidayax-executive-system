import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ExecutiveInfoCardProps = {
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly icon: LucideIcon;
  readonly title: string;
};

export function ExecutiveInfoCard({
  action,
  children,
  icon: Icon,
  title
}: ExecutiveInfoCardProps) {
  return (
    <article className="executive-info-card">
      <div className="executive-info-card-copy">
        <h2>{title}</h2>
        <div>{children}</div>
        {action ? <div className="executive-info-card-action">{action}</div> : null}
      </div>
      <div className="executive-info-card-icon" aria-hidden="true">
        <Icon size={24} strokeWidth={1.75} />
      </div>
    </article>
  );
}
