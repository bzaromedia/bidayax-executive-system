import type { Meta, StoryObj } from "@storybook/react";
import { typographyTokens } from "@bidayax/tokens";

const meta = {
  title: "Foundation/Typography"
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const TypeRoles: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-display text-4xl font-semibold leading-tight">
          Executive intelligence should feel quiet, precise, and premium.
        </p>
        <p className="mt-3 text-content-secondary">
          External font loading is intentionally deferred. The roles are defined now so future UI can adopt approved pairings without drift.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(typographyTokens.families).map(([role, stack]) => (
          <div key={role} className="rounded-bxLg border border-border-subtle bg-surface-raised p-4">
            <h2 className="font-heading text-base font-semibold">{role}</h2>
            <p className="mt-2 font-mono text-xs text-content-secondary">{stack.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  )
};
