import type { Meta, StoryObj } from "@storybook/react";
import { semanticColors } from "@bidayax/tokens";

const meta = {
  title: "Foundation/Color System"
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Semantic color system</h1>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          The material direction is dark luxury, brushed metal, high contrast, and enterprise-grade.
        </p>
      </div>
      {Object.entries(semanticColors).map(([group, values]) => (
        <section key={group} className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(values).map(([name, value]) => (
              <div key={name} className="rounded-bxLg border border-border-subtle bg-surface-raised p-3">
                <div
                  className="h-16 rounded-bxMd border border-border-muted"
                  style={{ background: value }}
                />
                <div className="mt-3 font-mono text-xs text-content-secondary">{name}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
};
