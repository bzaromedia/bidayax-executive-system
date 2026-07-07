export type WorkflowNodeStatus =
  | "queued"
  | "running"
  | "completed"
  | "blocked"
  | "requires_human_review";

export type WorkflowNodeDefinition<TContext> = {
  readonly id: string;
  readonly label: string;
  readonly run: (context: TContext) => TContext | Promise<TContext>;
  readonly requiresHumanApproval?: boolean;
};

export type WorkflowEdgeDefinition = {
  readonly from: string;
  readonly to: string;
};

export type WorkflowNodeExecution = {
  readonly nodeId: string;
  readonly status: WorkflowNodeStatus;
  readonly startedAt: string;
  readonly completedAt: string;
};

export type WorkflowExecutionResult<TContext> = {
  readonly context: TContext;
  readonly steps: readonly WorkflowNodeExecution[];
};

export async function executeWorkflow<TContext>(input: {
  readonly context: TContext;
  readonly nodes: readonly WorkflowNodeDefinition<TContext>[];
  readonly now?: () => Date;
}): Promise<WorkflowExecutionResult<TContext>> {
  const now = input.now ?? (() => new Date());
  const steps: WorkflowNodeExecution[] = [];
  let context = input.context;

  for (const node of input.nodes) {
    const startedAt = now().toISOString();
    context = await node.run(context);
    steps.push({
      completedAt: now().toISOString(),
      nodeId: node.id,
      startedAt,
      status: node.requiresHumanApproval ? "requires_human_review" : "completed"
    });
  }

  return {
    context,
    steps
  };
}
