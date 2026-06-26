import type { Meta, StoryObj } from "@storybook/react";
import { spacingTokens } from "@bidayax/tokens";

const meta = {
  title: "Foundation/Spacing"
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const SpacingScale: Story = {
  render: () => (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Spacing scale</h1>
      <div className="space-y-3">
        {Object.entries(spacingTokens).map(([name, value]) => (
          <div key={name} className="grid grid-cols-[5rem_1fr] items-center gap-4">
            <span className="font-mono text-xs text-content-secondary">{name}</span>
            <div className="h-8 rounded-bxSm bg-surface-raised">
              <div className="h-full rounded-bxSm bg-action-primary" style={{ width: value }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};
