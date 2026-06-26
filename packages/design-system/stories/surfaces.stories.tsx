import type { Meta, StoryObj } from "@storybook/react";
import { Surface, Stack } from "@bidayax/ui";

const meta = {
  title: "Primitives/Surfaces",
  component: Surface
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof Surface>;

export const SurfaceTones: Story = {
  render: () => (
    <Stack gap={4}>
      {(["canvas", "base", "raised", "panel", "inset"] as const).map((tone) => (
        <Surface key={tone} tone={tone} className="min-h-20 p-5">
          <h2 className="font-heading text-base font-semibold">{tone}</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Token-backed surface for future interface composition.
          </p>
        </Surface>
      ))}
    </Stack>
  )
};
