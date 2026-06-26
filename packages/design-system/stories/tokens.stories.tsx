import type { Meta, StoryObj } from "@storybook/react";
import { bidayaxTokens } from "@bidayax/tokens";

const meta = {
  title: "Foundation/Tokens",
  parameters: {
    docs: {
      description: {
        component:
          "Token review surface for the BidayaX design-system supply chain. Raw values live in @bidayax/tokens only."
      }
    }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const TokenGroups: Story = {
  render: () => (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Token groups</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(bidayaxTokens).map((group) => (
          <div key={group} className="rounded-bxLg border border-border-subtle bg-surface-raised p-4">
            <h2 className="font-heading text-base font-semibold">{group}</h2>
            <p className="mt-2 text-sm text-content-secondary">
              Governed source of truth for future cards, dashboards, and receptionist interfaces.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
};
