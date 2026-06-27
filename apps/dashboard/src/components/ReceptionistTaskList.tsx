import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardReceptionistTask } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  receptionistPriorityLabels,
  receptionistTaskTypeLabels
} from "../lib/receptionist-formatters";

type ReceptionistTaskListProps = {
  readonly tasks: readonly DashboardReceptionistTask[];
};

export function ReceptionistTaskList({ tasks }: ReceptionistTaskListProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Tasks</Badge>
        <CardTitle>Receptionist task list</CardTitle>
        <CardDescription>
          Simulated tasks generated from deterministic intent classification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {receptionistTaskTypeLabels[task.taskType]}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {task.status} / {receptionistPriorityLabels[task.priority]}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {formatDateTime(task.createdAt)}
                </p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-content-secondary">
                {task.description}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
